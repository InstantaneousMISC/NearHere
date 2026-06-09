import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { TRPCError } from "@trpc/server"
import { BusinessLinkType, BusinessStatus } from "@prisma/client"

// Helper to resolve and authenticate the business profile for the current user session
async function getAuthedBusiness(ctx: any) {
  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated.",
    })
  }

  const userEmail = ctx.user.email?.trim().toLowerCase()

  let business = await ctx.db.business.findFirst({
    where: {
      OR: [
        { ownerUserId: ctx.user.id },
        ...(userEmail ? [{ advertiser: { email: { equals: userEmail, mode: "insensitive" as const } } }] : []),
      ],
    },
  })

  // Self-heal: If an advertiser logs in but has no business record, create a default one
  if (!business) {
    const advertiser = userEmail ? await ctx.db.advertiser.findFirst({
      where: { email: { equals: userEmail, mode: "insensitive" as const } },
    }) : null

    const { generateSlug } = await import("@/server/helpers/generateSlug")
    const businessName = advertiser?.businessName || ctx.user.email.split("@")[0] || "My Business"
    const slug = await generateSlug(businessName, ctx.db)

    business = await ctx.db.business.create({
      data: {
        ownerUserId: ctx.user.id,
        advertiserId: advertiser?.id || null,
        name: businessName,
        slug,
        email: ctx.user.email ? ctx.user.email.trim().toLowerCase() : null,
        phone: advertiser?.phone || "",
        website: advertiser?.website || null,
        address: advertiser?.businessAddress || null,
        status: "ACTIVE",
      },
    })
  } else if (!business.ownerUserId) {
    // Associate current Supabase user ID if not already locked
    business = await ctx.db.business.update({
      where: { id: business.id },
      data: { ownerUserId: ctx.user.id },
    })
  }

  return business
}

export const businessRouter = createTRPCRouter({
  getMyBusiness: publicProcedure.query(async ({ ctx }) => {
    const business = await getAuthedBusiness(ctx)
    const result = await ctx.db.business.findUnique({
      where: { id: business.id },
      include: {
        links: {
          orderBy: { sortOrder: "asc" },
        },
      },
    })
    if (result) {
      result.claimToken = null
    }
    return result
  }),

  updateProfile: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        website: z.string().url().or(z.literal("")).optional().nullable(),
        logoUrl: z.string().url().or(z.literal("")).optional().nullable(),
        coverImageUrl: z.string().url().or(z.literal("")).optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        zipCode: z.string().optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const business = await getAuthedBusiness(ctx)

      // Check if any campaign/order/creative is PRINTING, PRINTED, or MAILED
      const orders = await ctx.db.order.findMany({
        where: {
          OR: [
            { advertiserId: business.advertiserId || undefined },
            { qrCodes: { some: { businessId: business.id } } },
          ],
        },
        include: {
          campaign: true,
          creativeSubmission: true,
        },
      })

      const hasPrintedOrMailed = orders.some((order) => {
        const campaignStatus = order.campaign.status
        const creativeStatus = order.creativeSubmission?.approvalStatus
        return (
          campaignStatus === "PRINTING" ||
          campaignStatus === "MAILED" ||
          campaignStatus === "READY_FOR_PRINT" ||
          creativeStatus === "PRINTED" ||
          creativeStatus === "MAILED" ||
          creativeStatus === "APPROVED"
        )
      })

      if (hasPrintedOrMailed) {
        const nameChanged = input.name !== undefined && input.name !== business.name
        const logoChanged = input.logoUrl !== undefined && input.logoUrl !== (business.logoUrl || "")
        const phoneChanged = input.phone !== undefined && input.phone !== (business.phone || "")
        const websiteChanged = input.website !== undefined && input.website !== (business.website || "")

        if (nameChanged || logoChanged || phoneChanged || websiteChanged) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "One or more postcard campaigns associated with this profile have already been approved, printed, or mailed. Changes to print-sensitive fields (Business Name, Logo, Phone, Website) are blocked.",
          })
        }
      }

      // If business name changes, we do NOT regenerate slug to prevent breaking printed QRs.
      // But we can check if it is valid.
      return await ctx.db.business.update({
        where: { id: business.id },
        data: {
          name: input.name,
          description: input.description,
          phone: input.phone,
          email: input.email,
          website: input.website || null,
          logoUrl: input.logoUrl || null,
          coverImageUrl: input.coverImageUrl || null,
          address: input.address,
          city: input.city,
          state: input.state,
          zipCode: input.zipCode,
        },
      })
    }),

  listLinks: publicProcedure.query(async ({ ctx }) => {
    const business = await getAuthedBusiness(ctx)
    return await ctx.db.businessLink.findMany({
      where: { businessId: business.id },
      orderBy: { sortOrder: "asc" },
    })
  }),

  upsertLink: publicProcedure
    .input(
      z.object({
        id: z.string().optional(),
        type: z.nativeEnum(BusinessLinkType),
        label: z.string().min(1).max(100),
        url: z.string().min(1), // Can be URL or tel:/mailto:
        sortOrder: z.number().int().default(0),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const business = await getAuthedBusiness(ctx)

      if (input.id) {
        // Edit existing link - verify ownership
        const existing = await ctx.db.businessLink.findFirst({
          where: { id: input.id, businessId: business.id },
        })

        if (!existing) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Link not found or not owned by you.",
          })
        }

        return await ctx.db.businessLink.update({
          where: { id: input.id },
          data: {
            type: input.type,
            label: input.label,
            url: input.url,
            sortOrder: input.sortOrder,
            isActive: input.isActive,
          },
        })
      } else {
        // Create new link
        return await ctx.db.businessLink.create({
          data: {
            businessId: business.id,
            type: input.type,
            label: input.label,
            url: input.url,
            sortOrder: input.sortOrder,
            isActive: input.isActive,
          },
        })
      }
    }),

  deleteLink: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const business = await getAuthedBusiness(ctx)

      const existing = await ctx.db.businessLink.findFirst({
        where: { id: input.id, businessId: business.id },
      })

      if (!existing) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Link not found or not owned by you.",
        })
      }

      return await ctx.db.businessLink.delete({
        where: { id: input.id },
      })
    }),

  getQrCodes: publicProcedure.query(async ({ ctx }) => {
    const business = await getAuthedBusiness(ctx)

    return await ctx.db.qrCode.findMany({
      where: { businessId: business.id },
      include: {
        campaign: true,
        campaignSpot: {
          include: {
            category: true,
          },
        },
        _count: {
          select: { scans: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  }),

  getAnalyticsSummary: publicProcedure.query(async ({ ctx }) => {
    const business = await getAuthedBusiness(ctx)

    // 1. Total Scans Count
    const totalScans = await ctx.db.qrScan.count({
      where: { businessId: business.id },
    })

    // 2. Total Page Views Count
    const totalPageViews = await ctx.db.businessPageView.count({
      where: { businessId: business.id },
    })

    // 3. Outbound clicks count by type
    const clicks = await ctx.db.businessClickEvent.groupBy({
      by: ["linkType"],
      where: { businessId: business.id },
      _count: {
        id: true,
      },
    })

    const clicksByType = clicks.reduce((acc: Record<string, number>, curr) => {
      acc[curr.linkType] = curr._count.id
      return acc
    }, {})

    // 4. Scans broken down by campaign spot
    const scansByQr = await ctx.db.qrCode.findMany({
      where: { businessId: business.id },
      select: {
        slug: true,
        type: true,
        campaign: {
          select: {
            name: true,
          },
        },
        campaignSpot: {
          select: {
            label: true,
          },
        },
        _count: {
          select: {
            scans: true,
          },
        },
      },
    })

    const scansByCampaign = scansByQr.map((qr) => ({
      slug: qr.slug,
      type: qr.type,
      campaignName: qr.campaign?.name || "Direct Profile Link",
      spotLabel: qr.campaignSpot?.label || "General QR",
      scansCount: qr._count.scans,
    }))

    // 5. Recent Scan logs (latest 10)
    const recentScans = await ctx.db.qrScan.findMany({
      where: { businessId: business.id },
      orderBy: { scannedAt: "desc" },
      take: 10,
      select: {
        scannedAt: true,
        deviceType: true,
        city: true,
        region: true,
        country: true,
        isExpiredScan: true,
      },
    })

    return {
      totalScans,
      totalPageViews,
      clicksByType,
      scansByCampaign,
      recentScans,
    }
  }),

  getBusinessDetailsByClaimToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const business = await ctx.db.business.findUnique({
        where: { claimToken: input.token },
        include: { advertiser: true },
      })

      if (!business) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid claim token.",
        })
      }

      if (business.claimTokenExpiresAt && business.claimTokenExpiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Claim token has expired.",
        })
      }

      if (business.ownerUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This business has already been claimed.",
        })
      }

      // Mask email for privacy (e.g. jo**@domain.com)
      const email = business.email || business.advertiser?.email || ""
      let maskedEmail = ""
      if (email) {
        const [local, domain] = email.split("@")
        if (local && domain) {
          maskedEmail = local.length <= 2 
            ? `${local[0]}*@${domain}` 
            : `${local.slice(0, 2)}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`
        } else {
          maskedEmail = email
        }
      }

      return {
        id: business.id,
        name: business.name,
        maskedEmail,
      }
    }),

  claimBusiness: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be authenticated to claim a business.",
        })
      }

      const business = await ctx.db.business.findUnique({
        where: { claimToken: input.token },
        include: { advertiser: true },
      })

      if (!business) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid claim token.",
        })
      }

      if (business.claimTokenExpiresAt && business.claimTokenExpiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Claim token has expired.",
        })
      }

      if (business.ownerUserId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This business has already been claimed.",
        })
      }

      // Check if user is an admin
      const adminUser = await ctx.db.adminUser.findUnique({
        where: { supabaseUserId: ctx.user.id },
      })

      const isAdmin = !!adminUser

      // Normalise and compare emails
      const userEmail = ctx.user.email?.trim().toLowerCase() || ""
      const businessEmail = business.email?.trim().toLowerCase() || ""
      const advertiserEmail = business.advertiser?.email?.trim().toLowerCase() || ""

      const isEmailMatch = userEmail && (userEmail === businessEmail || userEmail === advertiserEmail)

      if (!isAdmin && !isEmailMatch) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only claim this business using the email address associated with the purchase.",
        })
      }

      // Claim the business
      return await ctx.db.business.update({
        where: { id: business.id },
        data: {
          ownerUserId: ctx.user.id,
          claimedAt: new Date(),
          claimToken: null,
          claimTokenExpiresAt: null,
        },
      })
    }),

  getMyOrders: publicProcedure.query(async ({ ctx }) => {
    const business = await getAuthedBusiness(ctx)
    return await ctx.db.order.findMany({
      where: {
        OR: [
          { advertiserId: business.advertiserId || undefined },
          { qrCodes: { some: { businessId: business.id } } },
        ],
      },
      include: {
        campaign: true,
        campaignSpot: {
          include: { category: true },
        },
        creativeSubmission: true,
      },
      orderBy: { createdAt: "desc" },
    })
  }),

  regenerateClaimToken: adminProcedure
    .input(
      z.object({
        businessId: z.string(),
        reason: z.string().min(1),
        sendEmailNotification: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const business = await ctx.db.business.findUnique({
        where: { id: input.businessId },
        include: { advertiser: true },
      })

      if (!business) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business profile not found.",
        })
      }

      const crypto = require("crypto")
      const claimToken = crypto.randomBytes(16).toString("hex")
      const claimTokenExpiresAt = new Date()
      claimTokenExpiresAt.setDate(claimTokenExpiresAt.getDate() + 14) // 14 days expiration

      await ctx.db.business.update({
        where: { id: input.businessId },
        data: {
          claimToken,
          claimTokenExpiresAt,
          ownerUserId: null,
          claimedAt: null,
        },
      })

      // Audit Log Entry
      const auditLog = await ctx.db.adminAuditLog.create({
        data: {
          adminEmail: ctx.adminUser.email,
          action: "REGENERATE_CLAIM_TOKEN",
          businessId: input.businessId,
          notes: input.reason,
          metadata: {
            businessName: business.name,
            previousOwnerUserId: business.ownerUserId,
            previousClaimedAt: business.claimedAt,
            sendEmailNotification: input.sendEmailNotification,
          },
        },
      })

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const claimLink = `${appUrl}/business/claim/${claimToken}`

      // Optional Email Notification
      const emailAddress = business.email || business.advertiser?.email
      if (input.sendEmailNotification && emailAddress) {
        try {
          const { sendLifecycleEmailOnce } = await import(
            "@/server/email/sendLifecycleEmailOnce"
          )
          const { getClaimResetNotificationTemplate } = await import(
            "@/server/email/templates/claimResetNotification"
          )
          const mail = getClaimResetNotificationTemplate({
            businessName: business.name,
            reason: input.reason,
            claimLink,
          })
          await sendLifecycleEmailOnce({
            toEmail: emailAddress,
            templateKey: "claim_reset_notification",
            entityType: "admin_audit_log",
            entityId: auditLog.id,
            subject: mail.subject,
            html: mail.html,
          })
        } catch (err) {
          console.error("[EMAIL ERROR] Failed to send claim reset notification:", err)
        }
      }

      return {
        claimToken,
        claimLink,
      }
    }),
})
