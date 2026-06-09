import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { ApprovalStatus } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { sendEmail } from "@/server/email/sendEmail"
import { getCreativeSubmissionReceivedTemplate } from "@/server/email/templates/creativeSubmissionReceived"
import { getCreativeApprovalStatusTemplate } from "@/server/email/templates/creativeApprovalStatus"

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
          notes: input.notes,
          wantsAiHelp: input.wantsAiHelp,
          aiPrompt: input.aiPrompt,
          submittedAt: now,
          // Reset approval status to pending on update
          approvalStatus: ApprovalStatus.PENDING,
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
          notes: input.notes,
          wantsAiHelp: input.wantsAiHelp,
          aiPrompt: input.aiPrompt,
          submittedAt: now,
          approvalStatus: ApprovalStatus.PENDING,
        },
      })

      // Send creative submission confirmation email to buyer
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const creativeUrl = `${appUrl}/submit-creative/${order.creativeSubmissionToken}`
        const mail = getCreativeSubmissionReceivedTemplate({
          businessName: submission.businessName || order.advertiser.businessName,
          campaignName: order.campaign.name,
          categoryName: order.campaignSpot.label,
          creativeSubmissionUrl: creativeUrl,
        })

        await sendEmail({
          to: order.advertiser.email,
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
      const submission = await ctx.db.creativeSubmission.update({
        where: { id: input.submissionId },
        data: {
          approvalStatus: input.approvalStatus,
          approvalNotes: input.approvalNotes,
        },
      })

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
          const mail = getCreativeApprovalStatusTemplate({
            businessName: submission.businessName || order.advertiser.businessName,
            campaignName: order.campaign.name,
            categoryName: order.campaignSpot.label,
            status: submission.approvalStatus,
            notes: submission.approvalNotes || undefined,
            creativeSubmissionUrl: creativeUrl,
          })

          await sendEmail({
            to: order.advertiser.email,
            subject: mail.subject,
            html: mail.html,
          })
        } catch (err) {
          console.error("[EMAIL ERROR] Failed to send creative approval status email:", err)
        }
      }

      return submission
    }),
})
