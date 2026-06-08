import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { stripe } from "@/lib/stripe"
import { generateCreativeToken } from "@/server/helpers/generateToken"
import { TRPCError } from "@trpc/server"
import { OrderStatus, SpotStatus } from "@prisma/client"

export const orderRouter = createTRPCRouter({
  // Public procedures
  create: publicProcedure
    .input(
      z.object({
        spotId: z.string(),
        contactName: z.string().min(1),
        businessName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().min(1),
        website: z.string().url().optional().or(z.literal("")),
        businessAddress: z.string().optional(),
        heardAboutUs: z.string().optional(),
        logoUrl: z.string().url().optional().or(z.literal("")),
        adNotes: z.string().optional(),
        adOffer: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the campaign spot
      const spot = await ctx.db.campaignSpot.findUnique({
        where: { id: input.spotId },
        include: { campaign: true, category: true },
      })

      if (!spot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign spot not found",
        })
      }

      // Check if spot is available for this purchase
      if (spot.status !== SpotStatus.HELD && spot.status !== SpotStatus.OPEN) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Spot is no longer available",
        })
      }

      // Upsert advertiser by email
      const advertiser = await ctx.db.advertiser.upsert({
        where: { email: input.email.toLowerCase() },
        update: {
          contactName: input.contactName,
          businessName: input.businessName,
          phone: input.phone,
          website: input.website || null,
          businessAddress: input.businessAddress || null,
          heardAboutUs: input.heardAboutUs || null,
        },
        create: {
          email: input.email.toLowerCase(),
          contactName: input.contactName,
          businessName: input.businessName,
          phone: input.phone,
          website: input.website || null,
          businessAddress: input.businessAddress || null,
          heardAboutUs: input.heardAboutUs || null,
        },
      })

      const creativeSubmissionToken = generateCreativeToken()

      // Create pending order
      const order = await ctx.db.order.create({
        data: {
          campaignId: spot.campaignId,
          campaignSpotId: spot.id,
          advertiserId: advertiser.id,
          amount: spot.price,
          status: OrderStatus.PENDING,
          creativeSubmissionToken,
          creativeSubmission: {
            create: {
              businessName: input.businessName,
              logoUrl: input.logoUrl || null,
              notes: input.adNotes || null,
              offerDeal: input.adOffer || null,
            },
          },
        },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

      try {
        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: spot.price,
                product_data: {
                  name: `${spot.category.name} Ad Space`,
                  description: `Exclusive advertisement space for the "${spot.category.name}" industry category on the "${spot.campaign.name}" postcard campaign.`,
                },
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          customer_email: advertiser.email,
          client_reference_id: order.id,
          success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${appUrl}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
        })

        // Save Stripe session ID to the order
        await ctx.db.order.update({
          where: { id: order.id },
          data: {
            stripeCheckoutSessionId: session.id,
          },
        })

        return {
          checkoutUrl: session.url,
          orderId: order.id,
        }
      } catch (error) {
        console.error("[STRIPE ERROR] Failed to create checkout session:", error)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not initialize payment flow with Stripe. Please try again later.",
        })
      }
    }),

  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { creativeSubmissionToken: input.token },
        include: {
          campaign: true,
          campaignSpot: {
            include: { category: true },
          },
          advertiser: true,
          creativeSubmission: true,
        },
      })

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order or submission token not found",
        })
      }

      return order
    }),

  getByStripeSessionId: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { stripeCheckoutSessionId: input.sessionId },
        include: {
          campaign: true,
          campaignSpot: {
            include: { category: true },
          },
          advertiser: true,
        },
      })

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found for Stripe session ID",
        })
      }

      return order
    }),

  // Admin procedures
  list: adminProcedure
    .input(
      z.object({
        status: z.nativeEnum(OrderStatus).optional(),
        campaignId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const orders = await ctx.db.order.findMany({
        where: {
          status: input.status,
          campaignId: input.campaignId,
        },
        orderBy: { createdAt: "desc" },
        include: {
          campaign: true,
          campaignSpot: true,
          advertiser: true,
        },
      })
      return orders
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.id },
        include: {
          campaign: true,
          campaignSpot: {
            include: { category: true },
          },
          advertiser: true,
          creativeSubmission: true,
        },
      })

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        })
      }

      return order
    }),
})
