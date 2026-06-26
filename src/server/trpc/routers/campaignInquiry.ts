import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { CampaignInquiryStatus } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import {
  sendProspectInquiryConfirmationEmail,
  sendAdminInquiryNotificationEmail,
} from "../../email/actions"

const inquiryEmailOrPhonePlaceholder = (email?: string | null, phone?: string | null) => phone || "No phone provided"

export const campaignInquiryRouter = createTRPCRouter({
  // Public procedure to submit a new inquiry
  create: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        name: z.string().trim().min(1, "Contact name is required").max(100),
        businessName: z.string().trim().min(1, "Business name is required").max(100),
        email: z.string().trim().toLowerCase().email("Invalid email address"),
        phone: z.string().trim().min(1, "Phone number is required").max(30),
        businessCategory: z.string().trim().min(1, "Business type is required").max(100),
        websiteOrFacebook: z.string().trim().max(200).nullable().optional(),
        interestType: z.string().trim().max(100).nullable().optional(),
        preferredContactMethod: z.string().trim().min(1, "Preferred contact method is required").max(50),
        message: z.string().trim().max(2000, "Message must be 2000 characters or less").nullable().optional(),
        source: z.string().trim().max(100).default("WEBSITE"),
        honeypot: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Honeypot check (spam protection)
      if (input.honeypot) {
        console.warn("[SPAM DETECTED] Honeypot field was filled. Rejecting silently.");
        // Return a mock success response to trick the spam bot
        return {
          id: "spam-inquiry-prevented",
          campaignId: input.campaignId,
          name: input.name || null,
          businessName: input.businessName,
          email: input.email || null,
          phone: input.phone,
          businessCategory: input.businessCategory || null,
          websiteOrFacebook: input.websiteOrFacebook || null,
          interestType: input.interestType || null,
          preferredContactMethod: input.preferredContactMethod,
          message: input.message || null,
          source: input.source,
          status: CampaignInquiryStatus.SPAM,
          assignedToAdminId: null,
          internalNotes: null,
          convertedOrderId: null,
          convertedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }

      // 2. Server-side validation
      // Ensure campaign exists
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.campaignId },
      })
      if (!campaign) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign not found",
        })
      }

      // 3. Rate limiting (spam protection)
      // Check if an inquiry with the same email or phone was created in the last 60 seconds (only if provided)
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000)
      const rateLimitConditions = []
      if (input.email) rateLimitConditions.push({ email: input.email })
      if (input.phone) rateLimitConditions.push({ phone: input.phone })

      if (rateLimitConditions.length > 0) {
        const existingRecent = await ctx.db.campaignInquiry.findFirst({
          where: {
            campaignId: input.campaignId,
            OR: rateLimitConditions,
            createdAt: { gte: oneMinuteAgo },
          },
        })

        if (existingRecent) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "You have already submitted an inquiry recently. Please wait a moment.",
          })
        }
      }

      // 4. Save the inquiry to database
      const inquiry = await ctx.db.campaignInquiry.create({
        data: {
          campaignId: input.campaignId,
          name: input.name,
          businessName: input.businessName,
          email: input.email,
          phone: input.phone,
          businessCategory: input.businessCategory || null,
          websiteOrFacebook: input.websiteOrFacebook || null,
          interestType: input.interestType || null,
          preferredContactMethod: input.preferredContactMethod,
          message: input.message || null,
          source: input.source,
          status: CampaignInquiryStatus.NEW,
        },
      })

      // 5. Dispatch Emails (Prospect and Admin)
      if (inquiry.email) {
        try {
          await sendProspectInquiryConfirmationEmail(inquiry.id)
        } catch (err) {
          console.error(`[INQUIRY ROUTER] Failed to send prospect confirmation email:`, err)
        }
      }

      try {
        await sendAdminInquiryNotificationEmail(inquiry.id)
      } catch (err) {
        console.error(`[INQUIRY ROUTER] Failed to send admin notification email:`, err)
      }

      return inquiry
    }),

  // Admin procedures
  list: adminProcedure
    .input(
      z.object({
        campaignId: z.string().optional(),
        status: z.nativeEnum(CampaignInquiryStatus).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const whereClause: any = {}
      if (input?.campaignId) {
        whereClause.campaignId = input.campaignId
      }
      if (input?.status) {
        whereClause.status = input.status
      }

      const inquiries = await ctx.db.campaignInquiry.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: true,
          assignedToAdmin: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      return inquiries
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(CampaignInquiryStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.db.campaignInquiry.update({
        where: { id: input.id },
        data: { status: input.status },
      })
      return inquiry
    }),

  updateAssignedTo: adminProcedure
    .input(
      z.object({
        id: z.string(),
        assignedToAdminId: z.string().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.db.campaignInquiry.update({
        where: { id: input.id },
        data: { assignedToAdminId: input.assignedToAdminId },
      })
      return inquiry
    }),

  updateInternalNotes: adminProcedure
    .input(
      z.object({
        id: z.string(),
        internalNotes: z.string().trim().max(4000, "Notes must be 4000 characters or less"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const inquiry = await ctx.db.campaignInquiry.update({
        where: { id: input.id },
        data: { internalNotes: input.internalNotes || null },
      })
      return inquiry
    }),
})
