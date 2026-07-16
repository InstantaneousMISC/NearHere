import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { CampaignStatus, ApprovalStatus } from "@prisma/client"
import { initializeCampaignSpots } from "../../helpers/templateSpots"

export const campaignRouter = createTRPCRouter({
  // Public procedures
  getByLocation: publicProcedure
    .input(
      z.object({
        state: z.string(),
        city: z.string(),
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: {
          state_city_slug: {
            state: input.state.toLowerCase(),
            city: input.city.toLowerCase(),
            slug: input.slug.toLowerCase(),
          },
        },
        include: {
          spots: {
            orderBy: { sortOrder: "asc" },
            include: {
              category: true,
              orders: {
                where: { status: "PAID" },
                include: {
                  creativeSubmission: true,
                  qrCodes: true,
                }
              }
            },
          },
        },
      })

      if (!campaign) return null

      // Sanitize campaign spots and orders to prevent token leakage in the public API response DTO
      const sanitizedSpots = campaign.spots.map(spot => ({
        ...spot,
        orders: spot.orders.map(order => ({
          id: order.id,
          campaignId: order.campaignId,
          campaignSpotId: order.campaignSpotId,
          advertiserId: order.advertiserId,
          status: order.status,
          amount: order.amount,
          paidAt: order.paidAt,
          createdAt: order.createdAt,
          creativeSubmission: order.creativeSubmission ? {
            id: order.creativeSubmission.id,
            orderId: order.creativeSubmission.orderId,
            businessName: order.creativeSubmission.businessName,
            logoUrl: order.creativeSubmission.logoUrl,
            headline: order.creativeSubmission.headline,
            offerDeal: order.creativeSubmission.offerDeal,
            description: order.creativeSubmission.description,
            cta: order.creativeSubmission.cta,
            approvalStatus: order.creativeSubmission.approvalStatus,
          } : null,
          qrCodes: order.qrCodes.map(qr => ({
            id: qr.id,
            slug: qr.slug,
            type: qr.type,
            status: qr.status,
            destinationPath: qr.destinationPath,
          })),
        }))
      }))

      return {
        ...campaign,
        spots: sanitizedSpots,
      }
    }),

  searchByZip: publicProcedure
    .input(z.object({ zipCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findFirst({
        where: {
          zipCode: input.zipCode,
          status: { in: [CampaignStatus.ACTIVE, CampaignStatus.SOLD_OUT] },
        },
      })
      return campaign
    }),

  // Admin procedures
  list: adminProcedure.query(async ({ ctx }) => {
    const campaigns = await ctx.db.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { spots: true, orders: true },
        },
      },
    })
    return campaigns
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: {
          spots: {
            orderBy: { sortOrder: "asc" },
            include: {
              category: true,
              qrCodes: {
                include: {
                  _count: {
                    select: { scans: true }
                  },
                  scans: {
                    orderBy: { scannedAt: "desc" },
                    take: 1,
                    select: { scannedAt: true }
                  }
                }
              }
            },
          },
          orders: {
            orderBy: { createdAt: "desc" },
            include: {
              advertiser: true,
              campaignSpot: true,
              creativeSubmission: true,
            },
          },
        },
      })

      if (!campaign) return null

      // Get list of QR code IDs in this campaign
      const qrCodeIds = campaign.spots.flatMap(s => s.qrCodes.map(q => q.id))

      // Group views and clicks by qrCodeId
      const viewsGroup = await ctx.db.businessPageView.groupBy({
        by: ["qrCodeId"],
        where: { qrCodeId: { in: qrCodeIds } },
        _count: { id: true },
      })

      const clicksGroup = await ctx.db.businessClickEvent.groupBy({
        by: ["qrCodeId", "linkType"],
        where: { qrCodeId: { in: qrCodeIds } },
        _count: { id: true },
      })

      // Create maps for quick lookup
      const viewsMap = new Map(viewsGroup.filter(g => g.qrCodeId !== null).map(g => [g.qrCodeId as string, g._count.id]))
      
      const clicksMap = new Map<string, number>()
      const callClicksMap = new Map<string, number>()

      for (const cg of clicksGroup) {
        if (!cg.qrCodeId) continue
        const count = cg._count.id
        if (cg.linkType === "PHONE") {
          callClicksMap.set(cg.qrCodeId, (callClicksMap.get(cg.qrCodeId) || 0) + count)
        } else {
          clicksMap.set(cg.qrCodeId, (clicksMap.get(cg.qrCodeId) || 0) + count)
        }
      }

      // Enrich campaign.spots with calculated analytics
      const spotsWithAnalytics = campaign.spots.map(spot => {
        const enrichedQrCodes = spot.qrCodes.map(qr => {
          const scansCount = qr._count.scans
          const viewsCount = viewsMap.get(qr.id) || 0
          const clicksCount = clicksMap.get(qr.id) || 0
          const callClicksCount = callClicksMap.get(qr.id) || 0
          const lastScanDate = qr.scans[0]?.scannedAt || null

          return {
            ...qr,
            scansCount,
            viewsCount,
            clicksCount,
            callClicksCount,
            lastScanDate,
          }
        })

        return {
          ...spot,
          qrCodes: enrichedQrCodes,
        }
      })

      return {
        ...campaign,
        spots: spotsWithAnalytics,
      }
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        county: z.string().optional(),
        zipCode: z.string().optional(),
        mailingQuantity: z.number().int().positive(),
        description: z.string().optional(),
        estimatedMailDate: z.date().optional(),
        frontBackgroundUrl: z.string().url().optional().or(z.literal("")),
        backBackgroundUrl: z.string().url().optional().or(z.literal("")),
        cardSize: z.enum(["9x12", "6x11", "9x12-16-regular"]).default("9x12"),
        cardSkin: z.string().default("cream"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.create({
        data: {
          name: input.name,
          slug: input.slug.toLowerCase(),
          city: input.city.toLowerCase(),
          state: input.state.toLowerCase(),
          county: input.county,
          zipCode: input.zipCode,
          mailingQuantity: input.mailingQuantity,
          description: input.description,
          estimatedMailDate: input.estimatedMailDate,
          frontBackgroundUrl: input.frontBackgroundUrl || null,
          backBackgroundUrl: input.backBackgroundUrl || null,
          cardSize: input.cardSize,
          cardSkin: input.cardSkin,
          status: CampaignStatus.DRAFT,
        },
      })

      // Auto-generate template spots
      try {
        await initializeCampaignSpots(campaign.id, campaign.cardSize, ctx.db)
      } catch (err) {
        console.error("Failed to initialize template spots on campaign creation:", err)
      }

      return campaign
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        slug: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        county: z.string().optional(),
        zipCode: z.string().optional(),
        mailingQuantity: z.number().int().positive(),
        description: z.string().optional(),
        estimatedMailDate: z.date().optional(),
        frontBackgroundUrl: z.string().url().optional().or(z.literal("")),
        backBackgroundUrl: z.string().url().optional().or(z.literal("")),
        cardSize: z.enum(["9x12", "6x11", "9x12-16-regular"]).optional(),
        cardSkin: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If cardSize is changing, check if there are any sold spots first
      if (input.cardSize) {
        const existing = await ctx.db.campaign.findUnique({
          where: { id: input.id },
          select: {
            cardSize: true,
            spots: {
              where: { status: "SOLD" },
              select: { id: true }
            }
          }
        })

        if (existing && existing.cardSize !== input.cardSize) {
          if (existing.spots.length > 0) {
            throw new Error("Cannot change postcard size format for campaigns that have sold spots.")
          }

          // Safe to swap: recreate spots
          await ctx.db.campaignSpot.deleteMany({
            where: { campaignId: input.id }
          })
          await initializeCampaignSpots(input.id, input.cardSize, ctx.db)
        }
      }

      const campaign = await ctx.db.campaign.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug: input.slug.toLowerCase(),
          city: input.city.toLowerCase(),
          state: input.state.toLowerCase(),
          county: input.county,
          zipCode: input.zipCode,
          mailingQuantity: input.mailingQuantity,
          description: input.description,
          estimatedMailDate: input.estimatedMailDate,
          frontBackgroundUrl: input.frontBackgroundUrl || null,
          backBackgroundUrl: input.backBackgroundUrl || null,
          cardSize: input.cardSize,
          cardSkin: input.cardSkin,
        },
      })
      return campaign
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(CampaignStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.update({
        where: { id: input.id },
        data: { status: input.status },
      })

      // Handle status-based creative updates and email notifications
      if (input.status === CampaignStatus.PRINTED || input.status === CampaignStatus.MAILED) {
        const targetApprovalStatus =
          input.status === CampaignStatus.PRINTED
            ? ApprovalStatus.PRINTED
            : ApprovalStatus.MAILED

        // Find all paid orders for this campaign
        const orders = await ctx.db.order.findMany({
          where: { campaignId: campaign.id, status: "PAID" },
          include: {
            advertiser: true,
            campaign: true,
            campaignSpot: true,
            creativeSubmission: true,
          },
        })

        const { sendLifecycleEmailOnce } = await import("@/server/email/sendLifecycleEmailOnce")
        const { getPrintedMailedNotificationTemplate } = await import("@/server/email/templates/printedMailedNotification")
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const merchantDashboardUrl = `${appUrl}/business/dashboard`

        for (const order of orders) {
          if (order.creativeSubmission) {
            // Update the creative submission's approval status
            const updatedSubmission = await ctx.db.creativeSubmission.update({
              where: { id: order.creativeSubmission.id },
              data: { approvalStatus: targetApprovalStatus },
            })

            const businessName = updatedSubmission.businessName || order.advertiser.businessName

            const mail = getPrintedMailedNotificationTemplate({
              businessName,
              campaignName: order.campaign.name,
              categoryName: order.campaignSpot.label,
              status: input.status === CampaignStatus.PRINTED ? "PRINTED" : "MAILED",
              merchantDashboardUrl,
            })

            await sendLifecycleEmailOnce({
              toEmail: order.advertiser.email,
              templateKey: input.status === CampaignStatus.PRINTED ? "printed_notification" : "mailed_notification",
              entityType: "creative_submission",
              entityId: updatedSubmission.id,
              subject: mail.subject,
              html: mail.html,
            })
          }
        }
      }

      return campaign
    }),
})
