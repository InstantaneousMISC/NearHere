import { z } from "zod"
import crypto from "crypto"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { stripe } from "@/lib/stripe"
import { generateCreativeToken } from "@/server/helpers/generateToken"
import { TRPCError } from "@trpc/server"
import { OrderStatus, SpotStatus, CampaignOfferEventType, CampaignStatus } from "@prisma/client"
import { SPOT_HOLD_DURATION_MINUTES } from "@/lib/constants"
import { isCampaignOfferRedeemable, calculateOfferDiscount, calculateOfferPrice } from "../../helpers/campaignOffers"

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
        offerToken: z.string().optional(),
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

          // Fetch and validate CampaignOffer if offerToken is provided
          let campaignOffer = null
          let discountAmount = 0
          let finalPrice = lockedSpot.price

          if (input.offerToken) {
            campaignOffer = await tx.campaignOffer.findUnique({
              where: { token: input.offerToken },
            })

            if (!campaignOffer) {
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Campaign offer not found",
              })
            }

            if (campaignOffer.campaignId !== lockedSpot.campaignId) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This offer does not apply to this campaign.",
              })
            }

            if (!isCampaignOfferRedeemable(campaignOffer)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This campaign offer is no longer redeemable.",
              })
            }

            discountAmount = calculateOfferDiscount(lockedSpot.price, campaignOffer)
            finalPrice = calculateOfferPrice(lockedSpot.price, campaignOffer)
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

          // Create order with offer information if applicable
          const order = await tx.order.create({
            data: {
              campaignId: lockedSpot.campaignId,
              campaignSpotId: lockedSpot.id,
              advertiserId: advertiser.id,
              amount: finalPrice,
              status: OrderStatus.PENDING,
              creativeSubmissionToken,
              creativeSubmission: {
                create: {
                  businessName: input.businessName,
                },
              },
              ...(campaignOffer ? {
                campaignOfferId: campaignOffer.id,
                originalAmount: lockedSpot.price,
                discountAmount: discountAmount,
                finalAmount: finalPrice,
              } : {}),
            },
          })

          // Update campaignOffer reservation count and log event
          if (campaignOffer) {
            await tx.campaignOffer.update({
              where: { id: campaignOffer.id },
              data: {
                reservedCount: { increment: 1 },
              },
            })

            const userAgent = ctx.headers ? ctx.headers.get("user-agent") : null
            const ip = ctx.headers ? (ctx.headers.get("x-forwarded-for") || "").split(",")[0].trim() : null
            const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16) : null

            await tx.campaignOfferEvent.create({
              data: {
                campaignOfferId: campaignOffer.id,
                eventType: CampaignOfferEventType.ORDER_CREATED,
                userAgent,
                ipHash,
              },
            })
          }

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
                unit_amount: order.amount,
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
          metadata: order.campaignOfferId ? {
            campaignOfferId: order.campaignOfferId,
            discountAmount: order.discountAmount?.toString() || "0",
            originalAmount: order.originalAmount?.toString() || "0",
          } : undefined,
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
        
        const rollbackPromises: any[] = [
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
        ]

        if (order.campaignOfferId) {
          rollbackPromises.push(
            ctx.db.campaignOffer.update({
              where: { id: order.campaignOfferId },
              data: { reservedCount: { decrement: 1 } },
            }),
            ctx.db.campaignOfferEvent.create({
              data: {
                campaignOfferId: order.campaignOfferId,
                eventType: CampaignOfferEventType.EXPIRED,
              },
            })
          )
        }

        await ctx.db.$transaction(rollbackPromises)

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
      let order = await ctx.db.order.findUnique({
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

      // Auto-reconcile fallback if order is PENDING but Stripe session completed
      if (order.status === OrderStatus.PENDING && !input.sessionId.startsWith("mock_")) {
        try {
          const session = await stripe.checkout.sessions.retrieve(input.sessionId)
          if (session && (session.payment_status === "paid" || session.status === "complete")) {
            await ctx.db.order.update({
              where: { id: order.id },
              data: {
                status: OrderStatus.PAID,
                paidAt: new Date(),
                stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
              },
            })
            await ctx.db.campaignSpot.update({
              where: { id: order.campaignSpotId },
              data: {
                status: SpotStatus.SOLD,
                heldUntil: null,
                heldBySessionId: null,
              },
            })

            const {
              ensureBusinessForOrder,
              ensureQrForOrder,
              ensureCreativeSubmissionForOrder,
              ensurePostPaymentEmailsForOrder,
            } = await import("@/server/helpers/postPayment")

            await ensureBusinessForOrder(order.id)
            await ensureQrForOrder(order.id)
            await ensureCreativeSubmissionForOrder(order.id)
            await ensurePostPaymentEmailsForOrder(order.id)

            // Re-fetch updated order
            order = await ctx.db.order.findUniqueOrThrow({
              where: { id: order.id },
              include: {
                campaign: true,
                campaignSpot: {
                  include: { category: true },
                },
                advertiser: true,
              },
            })
          }
        } catch (err) {
          console.warn("[CHECKOUT RECONCILIATION] Fallback check failed:", err)
        }
      }

      const business = await ctx.db.business.findFirst({
        where: { advertiserId: order.advertiserId },
      })

      return {
        id: order.id,
        status: order.status,
        amount: order.amount,
        creativeSubmissionToken: order.creativeSubmissionToken,
        campaign: {
          id: order.campaign.id,
          name: order.campaign.name,
          slug: order.campaign.slug,
          city: order.campaign.city,
          state: order.campaign.state,
        },
        campaignSpot: {
          id: order.campaignSpot.id,
          label: order.campaignSpot.label,
          spotType: order.campaignSpot.spotType,
          category: {
            id: order.campaignSpot.category.id,
            name: order.campaignSpot.category.name,
            slug: order.campaignSpot.category.slug,
          },
        },
        advertiser: {
          id: order.advertiser.id,
          businessName: order.advertiser.businessName,
        },
        business: business ? {
          id: business.id,
          name: business.name,
          slug: business.slug,
          claimToken: business.claimToken,
        } : null,
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

  searchAdvertisers: adminProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const q = input.query.trim()
      if (!q) return []

      return ctx.db.advertiser.findMany({
        where: {
          OR: [
            { businessName: { contains: q, mode: "insensitive" } },
            { contactName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 10,
        select: {
          id: true,
          businessName: true,
          contactName: true,
          email: true,
          phone: true,
          website: true,
          businessAddress: true,
        },
      })
    }),

  bookManually: adminProcedure
    .input(
      z.object({
        spotId: z.string(),
        categoryId: z.string(),
        advertiserId: z.string().optional(),
        contactName: z.string().min(1),
        businessName: z.string().min(1),
        email: z.string().email().transform((val) => val.trim().toLowerCase()),
        phone: z.string().min(1),
        website: z.string().optional().or(z.literal("")),
        businessAddress: z.string().optional().or(z.literal("")),
        amount: z.number().int().nonnegative(), // in cents
        overrideExclusivity: z.boolean().default(false),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const spot = await ctx.db.campaignSpot.findUnique({
        where: { id: input.spotId },
        include: { category: true, campaign: true },
      })

      if (!spot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign spot not found",
        })
      }

      if (spot.status === SpotStatus.SOLD) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Spot is already sold.",
        })
      }

      // Check category exclusivity
      const targetCategory = await ctx.db.businessCategory.findUnique({
        where: { id: input.categoryId },
      })

      if (!targetCategory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Selected category not found",
        })
      }

      if (!targetCategory.allowsMultipleAdvertisers && !input.overrideExclusivity) {
        const conflictingSpot = await ctx.db.campaignSpot.findFirst({
          where: {
            campaignId: spot.campaignId,
            categoryId: targetCategory.id,
            id: { not: spot.id },
            status: SpotStatus.SOLD,
          },
          include: {
            orders: {
              where: { status: "PAID" },
              include: { advertiser: true },
              take: 1,
            },
          },
        })

        if (conflictingSpot) {
          const conflictingBusiness =
            conflictingSpot.orders[0]?.advertiser?.businessName || "another business"
          throw new TRPCError({
            code: "CONFLICT",
            message: `Exclusivity conflict: The "${targetCategory.name}" category is already taken by "${conflictingBusiness}" in this campaign.`,
          })
        }
      }

      const creativeSubmissionToken = generateCreativeToken()

      const { order } = await ctx.db.$transaction(
        async (tx) => {
          // Upsert advertiser
          const advertiser = input.advertiserId
            ? await tx.advertiser.update({
                where: { id: input.advertiserId },
                data: {
                  contactName: input.contactName,
                  businessName: input.businessName,
                  phone: input.phone,
                  website: input.website || null,
                  businessAddress: input.businessAddress || null,
                },
              })
            : await tx.advertiser.upsert({
                where: { email: input.email },
                update: {
                  contactName: input.contactName,
                  businessName: input.businessName,
                  phone: input.phone,
                  website: input.website || null,
                  businessAddress: input.businessAddress || null,
                },
                create: {
                  email: input.email,
                  contactName: input.contactName,
                  businessName: input.businessName,
                  phone: input.phone,
                  website: input.website || null,
                  businessAddress: input.businessAddress || null,
                },
              })

          // Secure the spot
          await tx.campaignSpot.update({
            where: { id: spot.id },
            data: {
              categoryId: targetCategory.id,
              status: SpotStatus.SOLD,
              heldUntil: null,
              heldBySessionId: null,
            },
          })

          // Create the order directly as PAID
          const order = await tx.order.create({
            data: {
              campaignId: spot.campaignId,
              campaignSpotId: spot.id,
              advertiserId: advertiser.id,
              amount: input.amount,
              status: OrderStatus.PAID,
              creativeSubmissionToken,
              paidAt: new Date(),
            },
          })

          return { order }
        },
        { isolationLevel: "Serializable" }
      )

      // Create business, QR code, and creative submission (outside transaction)
      let createdBusiness = null
      try {
        const {
          ensureBusinessForOrder,
          ensureQrForOrder,
          ensureCreativeSubmissionForOrder,
          ensurePostPaymentEmailsForOrder,
        } = await import("@/server/helpers/postPayment")
        createdBusiness = await ensureBusinessForOrder(order.id)
        await ensureQrForOrder(order.id)
        await ensureCreativeSubmissionForOrder(order.id)
        await ensurePostPaymentEmailsForOrder(order.id)
      } catch (err) {
        console.error("[MANUAL BOOKING ERROR] Post-payment setup failed:", err)
      }

      // Write Admin Audit Log
      try {
        await ctx.db.adminAuditLog.create({
          data: {
            adminEmail: ctx.adminUser.email,
            action: "MANUAL_PLACEMENT_CREATE",
            businessId: createdBusiness?.id || null,
            notes: input.notes || `Manual reservation of ${spot.label} for ${input.businessName}`,
            metadata: {
              campaignId: spot.campaignId,
              campaignSpotId: spot.id,
              advertiserId: order.advertiserId,
              amount: input.amount,
              overrideExclusivity: input.overrideExclusivity,
              notes: input.notes,
            },
          },
        })
      } catch (err) {
        console.error("[MANUAL BOOKING ERROR] Audit log creation failed:", err)
      }

      // Create Admin Notification
      try {
        const amountFormatted = (input.amount / 100).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
        const { createAdminNotification } = await import("@/server/helpers/notifications")
        await createAdminNotification({
          type: "INVOICE_PAID",
          title: "Manual Booking Created",
          message: `Manual booking of ${amountFormatted} created for ${input.businessName} (Campaign: ${spot.campaign.name})`,
          link: `/admin/orders/${order.id}`,
        })
      } catch (err) {
        console.error("[NOTIFICATION ERROR] Failed to trigger manual booking notification:", err)
      }

      return { orderId: order.id }
    }),

  cancelOrRefund: adminProcedure
    .input(
      z.object({
        orderId: z.string(),
        status: z.enum([OrderStatus.CANCELLED, OrderStatus.REFUNDED]),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updatedOrder = await ctx.db.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: input.orderId },
          include: { campaignSpot: true },
        })

        if (!order) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Order not found",
          })
        }

        if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Order is already cancelled or refunded.",
          })
        }

        // Update Order Status
        const updatedOrder = await tx.order.update({
          where: { id: order.id },
          data: {
            status: input.status,
            refundedAt: input.status === OrderStatus.REFUNDED ? new Date() : undefined,
            refundReason: input.reason || undefined,
          },
        })

        // Release the Campaign Spot
        if (order.campaignSpot.label.includes("_DOUBLE_")) {
          await tx.campaignSpot.update({
            where: { id: order.campaignSpotId },
            data: {
              status: SpotStatus.UNAVAILABLE,
              heldUntil: null,
              heldBySessionId: null,
            },
          })

          const match = order.campaignSpot.label.match(/^(FRONT|BACK)_DOUBLE_(\d+)_(\d+)$/)
          if (match) {
            const side = match[1]
            const u1 = match[2]
            const u2 = match[3]
            const label1 = `${side}_${u1}`
            const label2 = `${side}_${u2}`

            await tx.campaignSpot.updateMany({
              where: {
                campaignId: order.campaignId,
                label: { in: [label1, label2] },
              },
              data: {
                status: SpotStatus.OPEN,
                heldUntil: null,
                heldBySessionId: null,
              },
            })
          }
        } else {
          await tx.campaignSpot.update({
            where: { id: order.campaignSpotId },
            data: {
              status: SpotStatus.OPEN,
              heldUntil: null,
              heldBySessionId: null,
            },
          })
        }

        // Disable QR Code if it exists
        await tx.qrCode.updateMany({
          where: { orderId: order.id },
          data: {
            status: "DISABLED",
          },
        })

        // Revert Offer counts if applicable
        if (order.campaignOfferId) {
          if (order.status === OrderStatus.PAID) {
            await tx.campaignOffer.update({
              where: { id: order.campaignOfferId },
              data: {
                redeemedCount: { decrement: 1 },
              },
            })
          } else if (order.status === OrderStatus.PENDING) {
            await tx.campaignOffer.update({
              where: { id: order.campaignOfferId },
              data: {
                reservedCount: { decrement: 1 },
              },
            })
          }
        }

        // Revert Campaign SOLD_OUT status if needed
        const campaign = await tx.campaign.findUnique({
          where: { id: order.campaignId },
        })

        if (campaign && campaign.status === CampaignStatus.SOLD_OUT) {
          await tx.campaign.update({
            where: { id: campaign.id },
            data: { status: CampaignStatus.ACTIVE },
          })
        }

        // Audit Log Entry
        await tx.adminAuditLog.create({
          data: {
            adminEmail: ctx.adminUser.email,
            action: input.status === OrderStatus.REFUNDED ? "ORDER_REFUND" : "ORDER_CANCEL",
            businessId: null,
            notes: input.reason || `Order status updated to ${input.status}`,
            metadata: {
              orderId: order.id,
              campaignSpotId: order.campaignSpotId,
              campaignId: order.campaignId,
              refundReason: input.reason,
            },
          },
        })

        return updatedOrder
      })

      // Send cancellation/refund notification email
      try {
        const { sendBookingCancelledEmail } = await import("@/server/email/actions")
        await sendBookingCancelledEmail(updatedOrder.id, updatedOrder.refundReason)
      } catch (err) {
        console.error("[EMAIL ERROR] Failed to send cancellation email:", err)
      }

      return updatedOrder
    }),

  createInvoice: adminProcedure
    .input(
      z.object({
        spotId: z.string(),
        categoryId: z.string(),
        advertiserId: z.string().optional(),
        contactName: z.string().min(1),
        businessName: z.string().min(1),
        email: z.string().email().transform((val) => val.trim().toLowerCase()),
        phone: z.string().min(1),
        website: z.string().optional().or(z.literal("")),
        businessAddress: z.string().optional().or(z.literal("")),
        amount: z.number().int().nonnegative(), // in cents
        overrideExclusivity: z.boolean().default(false),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const spot = await ctx.db.campaignSpot.findUnique({
        where: { id: input.spotId },
        include: { category: true, campaign: true },
      })

      if (!spot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign spot not found",
        })
      }

      if (spot.status === SpotStatus.SOLD) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Spot is already sold.",
        })
      }

      // Check category exclusivity
      const targetCategory = await ctx.db.businessCategory.findUnique({
        where: { id: input.categoryId },
      })

      if (!targetCategory) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Selected category not found",
        })
      }

      if (!targetCategory.allowsMultipleAdvertisers && !input.overrideExclusivity) {
        const conflictingSpot = await ctx.db.campaignSpot.findFirst({
          where: {
            campaignId: spot.campaignId,
            categoryId: targetCategory.id,
            id: { not: spot.id },
            status: { in: [SpotStatus.SOLD, SpotStatus.HELD] },
          },
          include: {
            orders: {
              where: { status: "PAID" },
              include: { advertiser: true },
              take: 1,
            },
          },
        })

        if (conflictingSpot) {
          const conflictingBusiness =
            conflictingSpot.orders[0]?.advertiser?.businessName || "another business"
          throw new TRPCError({
            code: "CONFLICT",
            message: `Exclusivity conflict: The "${targetCategory.name}" category is already taken by "${conflictingBusiness}" in this campaign.`,
          })
        }
      }

      const creativeSubmissionToken = generateCreativeToken()

      const { order, advertiser } = await ctx.db.$transaction(
        async (tx) => {
          // Upsert advertiser
          const advertiser = input.advertiserId
            ? await tx.advertiser.update({
                where: { id: input.advertiserId },
                data: {
                  contactName: input.contactName,
                  businessName: input.businessName,
                  phone: input.phone,
                  website: input.website || null,
                  businessAddress: input.businessAddress || null,
                },
              })
            : await tx.advertiser.upsert({
                where: { email: input.email },
                update: {
                  contactName: input.contactName,
                  businessName: input.businessName,
                  phone: input.phone,
                  website: input.website || null,
                  businessAddress: input.businessAddress || null,
                },
                create: {
                  email: input.email,
                  contactName: input.contactName,
                  businessName: input.businessName,
                  phone: input.phone,
                  website: input.website || null,
                  businessAddress: input.businessAddress || null,
                },
              })

          // Secure the spot as HELD
          const heldUntil = new Date()
          heldUntil.setHours(heldUntil.getHours() + 24)


          await tx.campaignSpot.update({
            where: { id: spot.id },
            data: {
              categoryId: targetCategory.id,
              status: SpotStatus.HELD,
              heldUntil,
              heldBySessionId: `invoice-${creativeSubmissionToken.slice(0, 8)}`,
            },
          })

          // Create the order as PENDING
          const order = await tx.order.create({
            data: {
              campaignId: spot.campaignId,
              campaignSpotId: spot.id,
              advertiserId: advertiser.id,
              amount: input.amount,
              status: OrderStatus.PENDING,
              creativeSubmissionToken,
              creativeSubmission: {
                create: {
                  businessName: input.businessName,
                },
              },
            },
          })

          return { order, advertiser }
        },
        { isolationLevel: "Serializable" }
      )

      // Create a business profile record if it doesn't exist
      let business = null
      try {
        const { ensureBusinessForOrder } = await import("@/server/helpers/postPayment")
        business = await ensureBusinessForOrder(order.id)
      } catch (err) {
        console.error("[INVOICE ERROR] Failed to ensure business record:", err)
      }

      // Send Invoice Email to merchant
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const paymentLink = `${appUrl}/invoice/${order.id}`

      try {
        const { sendLifecycleEmailOnce } = await import("@/server/email/sendLifecycleEmailOnce")
        const { getInvoiceSentTemplate } = await import("@/server/email/templates/invoiceSent")

        const mail = getInvoiceSentTemplate({
          businessName: input.businessName,
          campaignName: spot.campaign.name,
          categoryName: targetCategory.name,
          amount: input.amount,
          paymentLink,
        })

        await sendLifecycleEmailOnce({
          toEmail: advertiser.email,
          templateKey: "invoice_sent",
          entityType: "order",
          entityId: order.id,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (err) {
        console.error("[INVOICE EMAIL ERROR] Failed to send invoice email:", err)
      }

      // Write Admin Audit Log
      try {
        await ctx.db.adminAuditLog.create({
          data: {
            adminEmail: ctx.adminUser.email,
            action: "CREATE_INVOICE",
            businessId: business?.id || null,
            notes: input.notes || `Invoice generated for ${input.businessName} (Amount: $${(input.amount / 100).toFixed(2)})`,
            metadata: {
              campaignId: spot.campaignId,
              campaignSpotId: spot.id,
              advertiserId: order.advertiserId,
              amount: input.amount,
              overrideExclusivity: input.overrideExclusivity,
              paymentLink,
            },
          },
        })
      } catch (err) {
        console.error("[INVOICE AUDIT ERROR] Failed to create audit log:", err)
      }

      // Create Admin Notification
      try {
        const amountFormatted = (input.amount / 100).toLocaleString("en-US", {
          style: "currency",
          currency: "USD",
        })
        const { createAdminNotification } = await import("@/server/helpers/notifications")
        await createAdminNotification({
          type: "PENDING_ORDER",
          title: "Invoice Generated",
          message: `Invoice of ${amountFormatted} generated for ${input.businessName} (Campaign: ${spot.campaign.name})`,
          link: `/admin/orders/${order.id}`,
        })
      } catch (err) {
        console.error("[NOTIFICATION ERROR] Failed to trigger invoice notification:", err)
      }

      return { orderId: order.id, paymentLink }
    }),

  getOrRenewStripeSession: publicProcedure
    .input(z.object({ orderId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { id: input.orderId },
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
          message: "Invoice / Order not found",
        })
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This invoice is no longer pending payment.",
        })
      }

      // Check if campaign is already closed or cancelled
      if (order.campaign.status === CampaignStatus.CLOSED || order.campaign.status === CampaignStatus.CANCELLED) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The associated campaign has been closed or cancelled.",
        })
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

      // Check if there is an existing checkout session and retrieve it from Stripe to check if it's still open
      let sessionUrl = null
      if (order.stripeCheckoutSessionId) {
        try {
          const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId)
          if (session.status === "complete" || session.payment_status === "paid") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "This invoice payment has already been completed and is being confirmed. Please refresh this page shortly.",
            })
          }
          if (session && session.status === "open" && session.url) {
            sessionUrl = session.url
          }
        } catch (err) {
          if (err instanceof TRPCError) throw err
          console.warn("Could not retrieve existing Stripe session, will create a new one:", err)
        }
      }

      // If no valid session exists or it expired, create a new one!
      if (!sessionUrl) {
        try {
          const session = await stripe.checkout.sessions.create({
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  unit_amount: order.amount,
                  product_data: {
                    name: `${order.campaignSpot.category.name} Ad Space`,
                    description: `Exclusive advertisement space for the "${order.campaignSpot.category.name}" industry category on the "${order.campaign.name}" postcard campaign.`,
                  },
                },
                quantity: 1,
              },
            ],
            mode: "payment",
            customer_email: order.advertiser.email,
            client_reference_id: order.id,
            success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/checkout/cancel?session_id={CHECKOUT_SESSION_ID}`,
          })

          // Save new Stripe session ID to the order
          await ctx.db.order.update({
            where: { id: order.id },
            data: {
              stripeCheckoutSessionId: session.id,
            },
          })

          sessionUrl = session.url
        } catch (error) {
          console.error("[STRIPE ERROR] Failed to renew checkout session:", error)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not initialize payment flow with Stripe. Please try again later.",
          })
        }
      }

      return { checkoutUrl: sessionUrl }
    }),

  getInvoice: publicProcedure
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
        },
      })

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        })
      }

      const business = order.status === OrderStatus.PAID ? await ctx.db.business.findFirst({
        where: { advertiserId: order.advertiserId },
        select: { id: true, ownerUserId: true, claimToken: true }
      }) : null

      return {
        id: order.id,
        status: order.status,
        amount: order.amount,
        originalAmount: order.originalAmount,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        campaign: {
          id: order.campaign.id,
          name: order.campaign.name,
          slug: order.campaign.slug,
          city: order.campaign.city,
          state: order.campaign.state,
          mailingQuantity: order.campaign.mailingQuantity,
          estimatedMailDate: order.campaign.estimatedMailDate,
        },
        campaignSpot: {
          id: order.campaignSpot.id,
          label: order.campaignSpot.label,
          spotType: order.campaignSpot.spotType,
          price: order.campaignSpot.price,
          status: order.campaignSpot.status,
          category: {
            id: order.campaignSpot.category.id,
            name: order.campaignSpot.category.name,
            slug: order.campaignSpot.category.slug,
          },
        },
        advertiser: {
          businessName: order.advertiser.businessName,
          contactName: order.advertiser.contactName,
          email: order.advertiser.email,
          phone: order.advertiser.phone,
        },
        business: business ? {
          id: business.id,
          isClaimed: !!business.ownerUserId,
          claimToken: business.claimToken,
        } : null,
      }
    }),
})

