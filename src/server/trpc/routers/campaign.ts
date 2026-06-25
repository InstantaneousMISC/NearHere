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
      return campaign
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
      return campaign
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
        cardSize: z.enum(["9x12", "6x11"]).default("9x12"),
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
        cardSize: z.enum(["9x12", "6x11"]).optional(),
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
