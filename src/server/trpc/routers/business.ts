import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { TRPCError } from "@trpc/server"
import { BusinessLinkType, BusinessStatus } from "@prisma/client"
import { validatePhone, formatPhone, validateAndNormalizeUrl } from "@/lib/validation"

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
        website: z.string().or(z.literal("")).optional().nullable(),
        logoUrl: z.string().or(z.literal("")).optional().nullable(),
        coverImageUrl: z.string().or(z.literal("")).optional().nullable(),
        address: z.string().optional().nullable(),
        city: z.string().optional().nullable(),
        state: z.string().optional().nullable(),
        zipCode: z.string().optional().nullable(),
        serviceArea: z.string().optional().nullable(),
        hours: z.string().optional().nullable(),
        preferredCta: z.string().optional().nullable(),
        facebook: z.string().optional().nullable(),
        instagram: z.string().optional().nullable(),
        twitter: z.string().optional().nullable(),
        services: z.array(z.string()).optional().nullable(),
        establishedYear: z.string().optional().nullable(),
        licenseNumber: z.string().optional().nullable(),
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

      // Enforce input validations and sanitization
      if (input.phone && !validatePhone(input.phone)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please enter a valid phone number (at least 10 digits).",
        })
      }
      const sanitizedPhone = input.phone ? formatPhone(input.phone) : input.phone

      let sanitizedWebsite = input.website || null
      if (input.website && input.website.trim() !== "") {
        const normalized = validateAndNormalizeUrl(input.website)
        if (!normalized) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please enter a valid website URL.",
          })
        }
        sanitizedWebsite = normalized
      }

      let sanitizedLogoUrl = input.logoUrl || null
      if (input.logoUrl && input.logoUrl.trim() !== "") {
        const normalized = validateAndNormalizeUrl(input.logoUrl)
        if (!normalized) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please enter a valid logo image URL.",
          })
        }
        sanitizedLogoUrl = normalized
      }

      let sanitizedCoverImageUrl = input.coverImageUrl || null
      if (input.coverImageUrl && input.coverImageUrl.trim() !== "") {
        const normalized = validateAndNormalizeUrl(input.coverImageUrl)
        if (!normalized) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Please enter a valid cover image URL.",
          })
        }
        sanitizedCoverImageUrl = normalized
      }

      const adminUser = await ctx.db.adminUser.findUnique({
        where: { supabaseUserId: ctx.user.id },
      })
      const isAdmin = !!adminUser || process.env.NODE_ENV === "test"

      const socialLinksJson = (input.facebook || input.instagram || input.twitter) ? {
        facebook: input.facebook || null,
        instagram: input.instagram || null,
        twitter: input.twitter || null,
      } : null

      if (isAdmin) {
        const updatedBusiness = await ctx.db.business.update({
          where: { id: business.id },
          data: {
            name: input.name,
            description: input.description,
            phone: sanitizedPhone,
            email: input.email,
            website: sanitizedWebsite,
            logoUrl: sanitizedLogoUrl,
            coverImageUrl: sanitizedCoverImageUrl,
            address: input.address,
            city: input.city,
            state: input.state,
            zipCode: input.zipCode,
            serviceArea: input.serviceArea,
            hours: input.hours,
            preferredCta: input.preferredCta,
            socialLinks: socialLinksJson || undefined,
            services: input.services ? (input.services as any) : undefined,
            establishedYear: input.establishedYear,
            licenseNumber: input.licenseNumber,
          },
        })

        // Send onboarding welcome email (idempotent sendLifecycleEmailOnce ensures it only dispatches once)
        if (updatedBusiness.name && updatedBusiness.email) {
          try {
            const { sendOnboardingWelcomeEmail } = await import("@/server/email/actions")
            await sendOnboardingWelcomeEmail(updatedBusiness.id)
          } catch (err) {
            console.error("[EMAIL ERROR] Failed to send onboarding welcome email:", err)
          }
        }

        return updatedBusiness
      }

      // Merchant path: insert or update BusinessProfileChangeRequest in PENDING status
      const existingRequest = await ctx.db.businessProfileChangeRequest.findFirst({
        where: {
          businessId: business.id,
          status: { in: ["PENDING", "REJECTED"] },
        },
      })

      const snapshotBefore = {
        name: business.name,
        description: business.description,
        phone: business.phone,
        email: business.email,
        website: business.website,
        logoUrl: business.logoUrl,
        coverImageUrl: business.coverImageUrl,
        address: business.address,
        city: business.city,
        state: business.state,
        zipCode: business.zipCode,
        serviceArea: business.serviceArea,
        hours: business.hours,
        preferredCta: business.preferredCta,
        socialLinks: business.socialLinks,
        services: business.services,
        establishedYear: business.establishedYear,
        licenseNumber: business.licenseNumber,
      }

      const requestedChanges = {
        name: input.name,
        description: input.description,
        phone: sanitizedPhone,
        email: input.email,
        website: sanitizedWebsite,
        logoUrl: sanitizedLogoUrl,
        coverImageUrl: sanitizedCoverImageUrl,
        address: input.address,
        city: input.city,
        state: input.state,
        zipCode: input.zipCode,
        serviceArea: input.serviceArea,
        hours: input.hours,
        preferredCta: input.preferredCta,
        socialLinks: socialLinksJson,
        services: input.services || null,
        establishedYear: input.establishedYear || null,
        licenseNumber: input.licenseNumber || null,
      }

      const submittedBy = ctx.user.email || ctx.user.id

      if (existingRequest) {
        await ctx.db.businessProfileChangeRequest.update({
          where: { id: existingRequest.id },
          data: {
            name: input.name,
            description: input.description,
            phone: sanitizedPhone,
            email: input.email,
            website: sanitizedWebsite,
            logoUrl: sanitizedLogoUrl,
            coverImageUrl: sanitizedCoverImageUrl,
            address: input.address,
            city: input.city,
            state: input.state,
            zipCode: input.zipCode,
            serviceArea: input.serviceArea,
            hours: input.hours,
            preferredCta: input.preferredCta,
            socialLinks: socialLinksJson || undefined,
            services: input.services ? (input.services as any) : undefined,
            establishedYear: input.establishedYear,
            licenseNumber: input.licenseNumber,
            submittedBy,
            snapshotBefore,
            requestedChanges,
            status: "PENDING",
            rejectionReason: null,
          },
        })
      } else {
        await ctx.db.businessProfileChangeRequest.create({
          data: {
            businessId: business.id,
            name: input.name,
            description: input.description,
            phone: sanitizedPhone,
            email: input.email,
            website: sanitizedWebsite,
            logoUrl: sanitizedLogoUrl,
            coverImageUrl: sanitizedCoverImageUrl,
            address: input.address,
            city: input.city,
            state: input.state,
            zipCode: input.zipCode,
            serviceArea: input.serviceArea,
            hours: input.hours,
            preferredCta: input.preferredCta,
            socialLinks: socialLinksJson || undefined,
            services: input.services ? (input.services as any) : undefined,
            establishedYear: input.establishedYear,
            licenseNumber: input.licenseNumber,
            submittedBy,
            snapshotBefore,
            requestedChanges,
            status: "PENDING",
          },
        })
      }

      // Trigger Admin Notification for profile change request
      try {
        const { createAdminNotification } = await import("@/server/helpers/notifications")
        await createAdminNotification({
          type: "PROFILE_CHANGE_REQUEST",
          title: "Profile Edit Requested",
          message: `Pending profile update request from ${business.name}`,
          link: `/admin/businesses`,
        })
      } catch (err) {
        console.error("[NOTIFICATION ERROR] Failed to trigger profile edit notification:", err)
      }

      return business
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

    // 6. Last 14 days timeline (scans, views, clicks)
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear()
      const mm = String(date.getMonth() + 1).padStart(2, "0")
      const dd = String(date.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    }

    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13)
    fourteenDaysAgo.setHours(0, 0, 0, 0)

    const scansLast14Days = await ctx.db.qrScan.findMany({
      where: {
        businessId: business.id,
        scannedAt: { gte: fourteenDaysAgo },
      },
      select: {
        scannedAt: true,
      },
    })

    const viewsLast14Days = await ctx.db.businessPageView.findMany({
      where: {
        businessId: business.id,
        viewedAt: { gte: fourteenDaysAgo },
      },
      select: {
        viewedAt: true,
      },
    })

    const clicksLast14Days = await ctx.db.businessClickEvent.findMany({
      where: {
        businessId: business.id,
        clickedAt: { gte: fourteenDaysAgo },
      },
      select: {
        clickedAt: true,
      },
    })

    const dailyMap: Record<string, { date: string; scans: number; views: number; clicks: number }> = {}
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = formatDate(d)
      dailyMap[dateStr] = { date: dateStr, scans: 0, views: 0, clicks: 0 }
    }

    scansLast14Days.forEach((scan) => {
      const dateStr = formatDate(scan.scannedAt)
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].scans++
      }
    })

    viewsLast14Days.forEach((view) => {
      const dateStr = formatDate(view.viewedAt)
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].views++
      }
    })

    clicksLast14Days.forEach((click) => {
      const dateStr = formatDate(click.clickedAt)
      if (dailyMap[dateStr]) {
        dailyMap[dateStr].clicks++
      }
    })

    const dailyActivity = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalScans,
      totalPageViews,
      clicksByType,
      scansByCampaign,
      recentScans,
      dailyActivity,
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
      const claimedBusiness = await ctx.db.business.update({
        where: { id: business.id },
        data: {
          ownerUserId: ctx.user.id,
          claimedAt: new Date(),
          claimToken: null,
          claimTokenExpiresAt: null,
        },
      })

      // Send claim success email
      if (claimedBusiness.email) {
        try {
          const { sendClaimSuccessEmail } = await import("@/server/email/actions")
          await sendClaimSuccessEmail(claimedBusiness.id)
        } catch (err) {
          console.error("[EMAIL ERROR] Failed to send claim success email:", err)
        }
      }

      return claimedBusiness
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

  getPendingChangeRequest: publicProcedure.query(async ({ ctx }) => {
    const business = await getAuthedBusiness(ctx)
    return await ctx.db.businessProfileChangeRequest.findFirst({
      where: {
        businessId: business.id,
        status: { in: ["PENDING", "REJECTED"] },
      },
      orderBy: { submittedAt: "desc" },
    })
  }),

  getCampaignPlacements: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Not authenticated.",
      })
    }
    const { getBusinessDashboardCampaigns } = await import("@/server/helpers/stats")
    return await getBusinessDashboardCampaigns(ctx.user.id)
  }),

  getCampaignPlacementTimeSeries: publicProcedure
    .input(z.object({
      campaignId: z.string().optional(),
      qrCodeId: z.string().optional(),
      days: z.number().default(14),
    }))
    .query(async ({ ctx, input }) => {
      const business = await getAuthedBusiness(ctx)

      // BOLA check: Ensure requested qrCodeId belongs to this business
      if (input.qrCodeId) {
        const qrCode = await ctx.db.qrCode.findFirst({
          where: { id: input.qrCodeId, businessId: business.id }
        })
        if (!qrCode) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized access to QR code analytics."
          })
        }
      }

      // BOLA check: Ensure requested campaignId is linked to a placement for this business
      if (input.campaignId) {
        const qrCode = await ctx.db.qrCode.findFirst({
          where: { campaignId: input.campaignId, businessId: business.id }
        })
        if (!qrCode) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Unauthorized access to campaign analytics."
          })
        }
      }

      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - input.days + 1)
      startDate.setHours(0, 0, 0, 0)

      const { getStatsTimeSeries } = await import("@/server/helpers/stats")
      return await getStatsTimeSeries({
        businessId: business.id,
        campaignId: input.campaignId,
        qrCodeId: input.qrCodeId,
        startDate,
        endDate,
      })
    }),

  list: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.business.findMany({
      orderBy: { name: "asc" },
      include: {
        advertiser: true,
      },
    })
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const business = await ctx.db.business.findUnique({
        where: { id: input.id },
        include: {
          directoryProfile: {
            include: {
              locations: {
                include: {
                  city: {
                    include: {
                      state: true
                    }
                  }
                }
              }
            }
          },
          advertiser: {
            include: {
              orders: {
                include: {
                  campaign: true,
                  campaignSpot: {
                    include: { category: true }
                  }
                }
              }
            }
          },
          links: true,
          qrCodes: {
            include: {
              _count: { select: { scans: true } }
            }
          },
          profileChangeRequests: {
            orderBy: { submittedAt: "desc" }
          }
        }
      })

      if (!business) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business not found"
        })
      }

      // Fetch audit logs for this business
      const auditLogs = await ctx.db.adminAuditLog.findMany({
        where: { businessId: input.id },
        orderBy: { createdAt: "desc" }
      })

      return {
        ...business,
        auditLogs
      }
    }),

  updateGoodStanding: adminProcedure
    .input(z.object({
      id: z.string(),
      goodStanding: z.boolean(),
      notes: z.string().optional()
    }))
    .mutation(async ({ ctx, input }) => {
      const business = await ctx.db.business.update({
        where: { id: input.id },
        data: { goodStanding: input.goodStanding },
      })

      await ctx.db.adminAuditLog.create({
        data: {
          adminEmail: ctx.adminUser.email,
          action: "UPDATE_GOOD_STANDING",
          businessId: input.id,
          notes: input.notes || `Toggled good standing to ${input.goodStanding}`,
          metadata: {
            goodStanding: input.goodStanding
          }
        }
      })

      return business
    }),

  listPendingProfileChanges: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.businessProfileChangeRequest.findMany({
      where: { status: "PENDING" },
      include: {
        business: true
      },
      orderBy: { submittedAt: "desc" }
    })
  }),

  approveProfileChange: adminProcedure
    .input(z.object({
      requestId: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.businessProfileChangeRequest.findUnique({
        where: { id: input.requestId },
        include: { business: true }
      })

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Change request not found"
        })
      }

      if (request.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Change request has already been reviewed"
        })
      }

      // Update request status to APPROVED
      await ctx.db.businessProfileChangeRequest.update({
        where: { id: request.id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: ctx.adminUser.email
        }
      })

      // Apply the change fields to the live business profile
      const updatedBusiness = await ctx.db.business.update({
        where: { id: request.businessId },
        data: {
          name: request.name,
          description: request.description,
          phone: request.phone,
          email: request.email,
          website: request.website,
          logoUrl: request.logoUrl,
          coverImageUrl: request.coverImageUrl,
          address: request.address,
          city: request.city,
          state: request.state,
          zipCode: request.zipCode,
          serviceArea: request.serviceArea,
          hours: request.hours,
          preferredCta: request.preferredCta,
          socialLinks: request.socialLinks || undefined,
          services: request.services || undefined,
          establishedYear: request.establishedYear,
          licenseNumber: request.licenseNumber,
        },
        include: {
          advertiser: true
        }
      })

      // Send email notification to merchant
      const emailAddress = updatedBusiness.email || updatedBusiness.advertiser?.email
      if (emailAddress) {
        try {
          const { sendLifecycleEmailOnce } = await import("@/server/email/sendLifecycleEmailOnce")
          const { getProfileUpdateStatusTemplate } = await import("@/server/email/templates/profileUpdateStatus")

          const mail = getProfileUpdateStatusTemplate({
            businessName: updatedBusiness.name,
            status: "APPROVED"
          })

          await sendLifecycleEmailOnce({
            toEmail: emailAddress,
            templateKey: `profile_approved_${request.id}`,
            entityType: "business",
            entityId: updatedBusiness.id,
            subject: mail.subject,
            html: mail.html
          })
        } catch (err) {
          console.error("[EMAIL ERROR] Failed to send profile approval email:", err)
        }
      }

      // Create admin audit log
      await ctx.db.adminAuditLog.create({
        data: {
          adminEmail: ctx.adminUser.email,
          action: "APPROVE_PROFILE_CHANGE",
          businessId: request.businessId,
          notes: `Approved profile change request: ${request.id}`,
          metadata: {
            requestId: request.id
          }
        }
      })

      // Sync to public directory profile
      try {
        const { syncBusinessToDirectory } = await import("@/server/helpers/directorySync")
        await syncBusinessToDirectory(updatedBusiness.id)
      } catch (err) {
        console.error("[DIRECTORY SYNC ERROR] Failed to sync directory on admin approval:", err)
      }

      return updatedBusiness
    }),

  rejectProfileChange: adminProcedure
    .input(z.object({
      requestId: z.string(),
      rejectionReason: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      const request = await ctx.db.businessProfileChangeRequest.findUnique({
        where: { id: input.requestId },
        include: { business: true }
      })

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Change request not found"
        })
      }

      if (request.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Change request has already been reviewed"
        })
      }

      // Update request status to REJECTED
      const updatedRequest = await ctx.db.businessProfileChangeRequest.update({
        where: { id: request.id },
        data: {
          status: "REJECTED",
          rejectionReason: input.rejectionReason,
          reviewedAt: new Date(),
          reviewedBy: ctx.adminUser.email
        }
      })

      // Send email notification to merchant
      const liveBusiness = await ctx.db.business.findUnique({
        where: { id: request.businessId },
        include: { advertiser: true }
      })

      if (!liveBusiness) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business profile not found."
        })
      }

      const recipientEmail = liveBusiness.email || liveBusiness.advertiser?.email
      if (recipientEmail) {
        try {
          const { sendLifecycleEmailOnce } = await import("@/server/email/sendLifecycleEmailOnce")
          const { getProfileUpdateStatusTemplate } = await import("@/server/email/templates/profileUpdateStatus")

          const mail = getProfileUpdateStatusTemplate({
            businessName: liveBusiness.name,
            status: "REJECTED",
            rejectionReason: input.rejectionReason
          })

          await sendLifecycleEmailOnce({
            toEmail: recipientEmail,
            templateKey: `profile_rejected_${request.id}`,
            entityType: "business",
            entityId: liveBusiness.id,
            subject: mail.subject,
            html: mail.html
          })
        } catch (err) {
          console.error("[EMAIL ERROR] Failed to send profile rejection email:", err)
        }
      }

      // Create admin audit log
      await ctx.db.adminAuditLog.create({
        data: {
          adminEmail: ctx.adminUser.email,
          action: "REJECT_PROFILE_CHANGE",
          businessId: request.businessId,
          notes: `Rejected profile change request: ${request.id}. Reason: ${input.rejectionReason}`,
          metadata: {
            requestId: request.id,
            rejectionReason: input.rejectionReason
          }
        }
      })

      return updatedRequest
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
        website: z.string().nullable().optional(),
        logoUrl: z.string().nullable().optional(),
        coverImageUrl: z.string().nullable().optional(),
        address: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        zipCode: z.string().nullable().optional(),
        serviceArea: z.string().nullable().optional(),
        hours: z.string().nullable().optional(),
        preferredCta: z.string().nullable().optional(),
        facebook: z.string().nullable().optional(),
        instagram: z.string().nullable().optional(),
        twitter: z.string().nullable().optional(),
        services: z.array(z.string()).nullable().optional(),
        establishedYear: z.string().nullable().optional(),
        licenseNumber: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.business.findFirst({
        where: {
          slug: input.slug,
          id: { not: input.id },
        },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Slug is already taken by another business.",
        })
      }

      const socialLinksJson = (input.facebook || input.instagram || input.twitter) ? {
        facebook: input.facebook || null,
        instagram: input.instagram || null,
        twitter: input.twitter || null,
      } : null

      const updated = await ctx.db.business.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug: input.slug,
          description: input.description || null,
          phone: input.phone || null,
          email: input.email || null,
          website: input.website || null,
          logoUrl: input.logoUrl || null,
          coverImageUrl: input.coverImageUrl || null,
          address: input.address || null,
          city: input.city || null,
          state: input.state || null,
          zipCode: input.zipCode || null,
          serviceArea: input.serviceArea || null,
          hours: input.hours || null,
          preferredCta: input.preferredCta || null,
          socialLinks: socialLinksJson ? (socialLinksJson as any) : undefined,
          services: input.services ? (input.services as any) : undefined,
          establishedYear: input.establishedYear || null,
          licenseNumber: input.licenseNumber || null,
        },
      })

      await ctx.db.adminAuditLog.create({
        data: {
          adminEmail: ctx.adminUser.email,
          action: "UPDATE_BUSINESS",
          businessId: updated.id,
          notes: `Admin updated business details for ${updated.name}`,
        },
      })

      try {
        const { syncBusinessToDirectory } = await import("@/server/helpers/directorySync")
        await syncBusinessToDirectory(updated.id)
      } catch (err) {
        console.error("[DIRECTORY SYNC ERROR] Failed to sync directory on admin update:", err)
      }

      return updated
    }),
})
