import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { stripe } from "@/lib/stripe"
import { generateCreativeToken } from "@/server/helpers/generateToken"
import { TRPCError } from "@trpc/server"
import { OrderStatus, SpotStatus } from "@prisma/client"
import { SPOT_HOLD_DURATION_MINUTES } from "@/lib/constants"

export const orderRouter = createTRPCRouter({
  // Public procedures
  create: publicProcedure
    .input(
      z.object({
        spotId: z.string(),
        categoryId: z.string(),
        sessionId: z.string(),
        contactName: z.string().min(1),
        businessName: z.string().min(1),
        email: z.string().email().transform(val => val.trim().toLowerCase()),
        phone: z.string().min(1),
        website: z.string().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const spot = await ctx.db.campaignSpot.findUnique({
        where: { id: input.spotId },
        include: { campaign: true },
      })

      if (!spot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign spot not found",
        })
      }

      const creativeSubmissionToken = generateCreativeToken()
      const { order, advertiser, category } = await ctx.db.$transaction(
        async (tx) => {
          const lockedSpot = await tx.campaignSpot.findUnique({
            where: { id: input.spotId },
          })
          if (!lockedSpot) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Spot not found",
            })
          }

          const category = await tx.businessCategory.findFirst({
            where: {
              id: input.categoryId,
              isActive: true,
            },
          })
          if (!category) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Business category is not available",
            })
          }

          const advertiser = await tx.advertiser.upsert({
            where: { email: input.email },
            update: {
              contactName: input.contactName,
              businessName: input.businessName,
              phone: input.phone,
              website: input.website || null,
              businessAddress: null,
              heardAboutUs: null,
            },
            create: {
              email: input.email,
              contactName: input.contactName,
              businessName: input.businessName,
              phone: input.phone,
              website: input.website || null,
              businessAddress: null,
              heardAboutUs: null,
            },
          })

          const shouldUpdateStatus =
            lockedSpot.status === SpotStatus.OPEN ||
            lockedSpot.status === SpotStatus.HELD

          await tx.campaignSpot.update({
            where: { id: lockedSpot.id },
            data: {
              categoryId: category.id,
              ...(shouldUpdateStatus
                ? {
                    status: SpotStatus.HELD,
                    heldBySessionId: input.sessionId,
                    heldUntil: new Date(
                      Date.now() + SPOT_HOLD_DURATION_MINUTES * 60 * 1000
                    ),
                  }
                : {}),
            },
          })

          const order = await tx.order.create({
            data: {
              campaignId: lockedSpot.campaignId,
              campaignSpotId: lockedSpot.id,
              advertiserId: advertiser.id,
              amount: lockedSpot.price,
              status: OrderStatus.PENDING,
              creativeSubmissionToken,
              creativeSubmission: {
                create: {
                  businessName: input.businessName,
                },
              },
            },
          })

          return { order, advertiser, category }
        },
        { isolationLevel: "Serializable" }
      )

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
                  name: `${category.name} Ad Space`,
                  description: `Exclusive advertisement space for the "${category.name}" industry category on the "${spot.campaign.name}" postcard campaign.`,
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
        await ctx.db.$transaction([
          ctx.db.order.deleteMany({
            where: {
              id: order.id,
              status: OrderStatus.PENDING,
              stripeCheckoutSessionId: null,
            },
          }),
          ctx.db.campaignSpot.updateMany({
            where: {
              id: spot.id,
              status: SpotStatus.HELD,
              heldBySessionId: input.sessionId,
            },
            data: {
              categoryId: spot.categoryId,
              status: SpotStatus.OPEN,
              heldBySessionId: null,
              heldUntil: null,
            },
          }),
        ])
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

      const business = await ctx.db.business.findFirst({
        where: { advertiserId: order.advertiserId },
      })

      return {
        ...order,
        business,
      }
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
