import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { ApprovalStatus, Prisma } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { sendLifecycleEmailOnce } from "@/server/email/sendLifecycleEmailOnce"
import { getCreativeSubmissionReceivedTemplate } from "@/server/email/templates/creativeSubmissionReceived"
import { getNeedsChangesTemplate } from "@/server/email/templates/needsChanges"
import { getApprovedForPrintTemplate } from "@/server/email/templates/approvedForPrint"
import { getPrintedMailedNotificationTemplate } from "@/server/email/templates/printedMailedNotification"

export const creativeRouter = createTRPCRouter({
  // Public procedures
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.order.findUnique({
        where: { creativeSubmissionToken: input.token },
        select: { id: true },
      })

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid creative submission link token",
        })
      }

      const submission = await ctx.db.creativeSubmission.findUnique({
        where: { orderId: order.id },
      })

      return submission
    }),

  upsert: publicProcedure
    .input(
      z.object({
        token: z.string(),
        businessName: z.string().min(1).max(200).optional(),
        logoUrl: z.string().url().optional().or(z.literal("")),
        additionalImages: z.array(z.string().url()).optional(),
        headline: z.string().max(80).optional(),
        offerDeal: z.string().max(160).optional(),
        description: z.string().max(300).optional(),
        cta: z.string().max(60).optional(),
        phone: z.string().optional(),
        website: z.string().url().optional().or(z.literal("")),
        address: z.string().optional(),
        serviceArea: z.string().optional(),
        hours: z.string().optional(),
        preferredCta: z.string().optional(),
        socialLinks: z.record(z.string(), z.string()).optional(),
        notes: z.string().max(1000).optional(),
        wantsAiHelp: z.boolean().default(false),
        aiPrompt: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the order by token
      const order = await ctx.db.order.findUnique({
        where: { creativeSubmissionToken: input.token },
        include: {
          creativeSubmission: true,
          advertiser: true,
          campaign: true,
          campaignSpot: true,
        },
      })

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid submission token",
        })
      }

      // Check if existing creative submission is locked
      const existingSubmission = order.creativeSubmission
      const campaign = order.campaign

      const isLocked = (existingSubmission && (
        existingSubmission.approvalStatus === ApprovalStatus.APPROVED ||
        existingSubmission.approvalStatus === ApprovalStatus.PRINTED ||
        existingSubmission.approvalStatus === ApprovalStatus.MAILED
      )) || (
        campaign.status === "READY_FOR_PRINT" ||
        campaign.status === "PRINTING" ||
        campaign.status === "MAILED"
      )

      if (isLocked) {
        if (existingSubmission) {
          const nameChanged = input.businessName !== undefined && input.businessName !== existingSubmission.businessName
          const logoChanged = input.logoUrl !== undefined && input.logoUrl !== (existingSubmission.logoUrl || "")
          const headlineChanged = input.headline !== undefined && input.headline !== (existingSubmission.headline || "")
          const offerChanged = input.offerDeal !== undefined && input.offerDeal !== (existingSubmission.offerDeal || "")
          const descChanged = input.description !== undefined && input.description !== (existingSubmission.description || "")
          const ctaChanged = input.cta !== undefined && input.cta !== (existingSubmission.cta || "")
          const phoneChanged = input.phone !== undefined && input.phone !== (existingSubmission.phone || "")
          const websiteChanged = input.website !== undefined && input.website !== (existingSubmission.website || "")
          const addressChanged = input.address !== undefined && input.address !== (existingSubmission.address || "")

          if (
            nameChanged || logoChanged || headlineChanged || offerChanged ||
            descChanged || ctaChanged || phoneChanged || websiteChanged || addressChanged
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Cannot modify print-sensitive fields once the postcard creative is approved, printed, or mailed.",
            })
          }
        } else {
          // If no existing submission exists, compare against advertiser defaults
          const nameChanged = input.businessName !== undefined && input.businessName !== order.advertiser.businessName
          const logoChanged = input.logoUrl !== undefined && input.logoUrl !== ""
          const headlineChanged = input.headline !== undefined && input.headline !== ""
          const offerChanged = input.offerDeal !== undefined && input.offerDeal !== ""
          const descChanged = input.description !== undefined && input.description !== ""
          const ctaChanged = input.cta !== undefined && input.cta !== ""
          const phoneChanged = input.phone !== undefined && input.phone !== order.advertiser.phone
          const websiteChanged = input.website !== undefined && input.website !== (order.advertiser.website || "")
          const addressChanged = input.address !== undefined && input.address !== (order.advertiser.businessAddress || "")

          if (
            nameChanged || logoChanged || headlineChanged || offerChanged ||
            descChanged || ctaChanged || phoneChanged || websiteChanged || addressChanged
          ) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "Cannot set print-sensitive fields once the postcard campaign is approved, printed, or mailed.",
            })
          }
        }
      }

      // Create or update the creative submission
      const now = new Date()
      const submission = await ctx.db.creativeSubmission.upsert({
        where: { orderId: order.id },
        update: {
          businessName: input.businessName,
          logoUrl: input.logoUrl || null,
          additionalImages: input.additionalImages ? JSON.stringify(input.additionalImages) : undefined,
          headline: input.headline,
          offerDeal: input.offerDeal,
          description: input.description,
          cta: input.cta,
          phone: input.phone,
          website: input.website || null,
          address: input.address,
          serviceArea: input.serviceArea,
          hours: input.hours,
          preferredCta: input.preferredCta,
          socialLinks: (input.socialLinks || Prisma.DbNull) as Prisma.InputJsonValue,
          notes: input.notes,
          wantsAiHelp: input.wantsAiHelp,
          aiPrompt: input.aiPrompt,
          submittedAt: now,
          // Reset approval status to pending on update unless it is locked
          approvalStatus: existingSubmission && (
            existingSubmission.approvalStatus === ApprovalStatus.APPROVED ||
            existingSubmission.approvalStatus === ApprovalStatus.PRINTED ||
            existingSubmission.approvalStatus === ApprovalStatus.MAILED
          ) ? existingSubmission.approvalStatus : ApprovalStatus.PENDING,
        },
        create: {
          orderId: order.id,
          businessName: input.businessName,
          logoUrl: input.logoUrl || null,
          additionalImages: input.additionalImages ? JSON.stringify(input.additionalImages) : undefined,
          headline: input.headline,
          offerDeal: input.offerDeal,
          description: input.description,
          cta: input.cta,
          phone: input.phone,
          website: input.website || null,
          address: input.address,
          serviceArea: input.serviceArea,
          hours: input.hours,
          preferredCta: input.preferredCta,
          socialLinks: (input.socialLinks || Prisma.DbNull) as Prisma.InputJsonValue,
          notes: input.notes,
          wantsAiHelp: input.wantsAiHelp,
          aiPrompt: input.aiPrompt,
          submittedAt: now,
          approvalStatus: ApprovalStatus.PENDING,
        },
      })

      // Update the Business profile associated with the advertiser / order
      try {
        let business = await ctx.db.business.findFirst({
          where: {
            OR: [
              { advertiserId: order.advertiserId },
              { qrCodes: { some: { orderId: order.id } } }
            ]
          }
        })

        if (business) {
          await ctx.db.business.update({
            where: { id: business.id },
            data: {
              name: input.businessName || business.name,
              logoUrl: input.logoUrl || business.logoUrl,
              description: input.description || business.description,
              phone: input.phone || business.phone,
              website: input.website || business.website,
              address: input.address || business.address,
              serviceArea: input.serviceArea !== undefined ? input.serviceArea : business.serviceArea,
              hours: input.hours !== undefined ? input.hours : business.hours,
              preferredCta: input.preferredCta !== undefined ? input.preferredCta : business.preferredCta,
              socialLinks: (input.socialLinks !== undefined ? input.socialLinks : (business.socialLinks ?? Prisma.DbNull)) as Prisma.InputJsonValue,
            }
          })
        } else {
          const { generateSlug } = await import("@/server/helpers/generateSlug")
          const businessSlug = await generateSlug(input.businessName || order.advertiser.businessName || "business", ctx.db)
          await ctx.db.business.create({
            data: {
              advertiserId: order.advertiserId,
              name: input.businessName || order.advertiser.businessName,
              slug: businessSlug,
              logoUrl: input.logoUrl || null,
              description: input.description || null,
              phone: input.phone || order.advertiser.phone,
              email: order.advertiser.email,
              website: input.website || order.advertiser.website,
              address: input.address || order.advertiser.businessAddress,
              serviceArea: input.serviceArea || null,
              hours: input.hours || null,
              preferredCta: input.preferredCta || null,
              socialLinks: (input.socialLinks || Prisma.DbNull) as Prisma.InputJsonValue,
              status: "ACTIVE"
            }
          })
        }
      } catch (err) {
        console.error("[CREATIVE SUBMISSION] Failed to update associated Business profile:", err)
      }

      // Send creative submission confirmation email to buyer (idempotent)
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const creativeUrl = `${appUrl}/submit-creative/${order.creativeSubmissionToken}`
        const mail = getCreativeSubmissionReceivedTemplate({
          businessName: submission.businessName || order.advertiser.businessName,
          campaignName: order.campaign.name,
          categoryName: order.campaignSpot.label,
          creativeSubmissionUrl: creativeUrl,
        })

        await sendLifecycleEmailOnce({
          toEmail: order.advertiser.email,
          templateKey: "creative_submission_received",
          entityType: "creative_submission",
          entityId: submission.id,
          subject: mail.subject,
          html: mail.html,
        })
      } catch (err) {
        console.error("[EMAIL ERROR] Failed to send creative submission email:", err)
      }

      return submission
    }),

  // Admin procedures
  updateApproval: adminProcedure
    .input(
      z.object({
        submissionId: z.string(),
        approvalStatus: z.nativeEnum(ApprovalStatus),
        approvalNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [submission, reviewEvent] = await ctx.db.$transaction([
        ctx.db.creativeSubmission.update({
          where: { id: input.submissionId },
          data: {
            approvalStatus: input.approvalStatus,
            approvalNotes: input.approvalNotes,
          },
        }),
        ctx.db.creativeReviewEvent.create({
          data: {
            creativeSubmissionId: input.submissionId,
            status: input.approvalStatus,
            notes: input.approvalNotes,
            adminEmail: ctx.adminUser.email,
          },
        }),
      ])

      // Fetch order and advertiser details to send email
      const order = await ctx.db.order.findUnique({
        where: { id: submission.orderId },
        include: {
          advertiser: true,
          campaign: true,
          campaignSpot: true,
        },
      })

      if (order) {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          const creativeUrl = `${appUrl}/submit-creative/${order.creativeSubmissionToken}`
          const businessName = submission.businessName || order.advertiser.businessName

          // Find the business for merchant dashboard URL
          const merchantDashboardUrl = `${appUrl}/business/dashboard`

          // Use status-specific templates for each lifecycle phase
          const status = input.approvalStatus

          if (
            status === ApprovalStatus.NEEDS_REVIEW ||
            status === ApprovalStatus.REJECTED
          ) {
            // "Needs Changes" — ask merchant to revise creative
            const mail = getNeedsChangesTemplate({
              businessName,
              campaignName: order.campaign.name,
              categoryName: order.campaignSpot.label,
              notes: input.approvalNotes || "Please review and update your submission.",
              creativeSubmissionUrl: creativeUrl,
            })

            await sendLifecycleEmailOnce({
              toEmail: order.advertiser.email,
              templateKey: "needs_changes",
              entityType: "creative_review_event",
              entityId: reviewEvent.id,
              subject: mail.subject,
              html: mail.html,
            })
          } else if (status === ApprovalStatus.APPROVED) {
            // "Approved for Print" — creative is locked
            const mail = getApprovedForPrintTemplate({
              businessName,
              campaignName: order.campaign.name,
              categoryName: order.campaignSpot.label,
              merchantDashboardUrl,
            })

            await sendLifecycleEmailOnce({
              toEmail: order.advertiser.email,
              templateKey: "approved_for_print",
              entityType: "creative_submission",
              entityId: submission.id,
              subject: mail.subject,
              html: mail.html,
            })
          } else if (status === ApprovalStatus.PRINTED || status === ApprovalStatus.MAILED) {
            // "Printed" or "Mailed" notifications
            const mail = getPrintedMailedNotificationTemplate({
              businessName,
              campaignName: order.campaign.name,
              categoryName: order.campaignSpot.label,
              status: status as "PRINTED" | "MAILED",
              merchantDashboardUrl,
            })

            await sendLifecycleEmailOnce({
              toEmail: order.advertiser.email,
              templateKey: status === ApprovalStatus.PRINTED ? "printed_notification" : "mailed_notification",
              entityType: "creative_submission",
              entityId: submission.id,
              subject: mail.subject,
              html: mail.html,
            })
          }
        } catch (err) {
          console.error("[EMAIL ERROR] Failed to send creative approval status email:", err)
        }
      }

      return submission
    }),

  getSoldSpotsForReview: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.order.findMany({
      where: { status: "PAID" },
      include: {
        campaign: true,
        campaignSpot: {
          include: { category: true },
        },
        advertiser: true,
        creativeSubmission: true,
        qrCodes: {
          include: {
            business: {
              include: {
                links: true,
              },
            },
            _count: {
              select: { scans: true },
            },
          },
        },
      },
      orderBy: { paidAt: "desc" },
    })
  }),
})
