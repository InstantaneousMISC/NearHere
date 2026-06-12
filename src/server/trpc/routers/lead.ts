import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../init"

export const leadRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        businessName: z.string().optional(),
        email: z.string().email().transform(val => val.trim().toLowerCase()),
        zipCode: z.string().min(5).max(10),
        campaignId: z.string().optional(),
        categoryId: z.string().optional(),
        requestedCategory: z.string().trim().max(120).optional(),
        businessDescription: z.string().trim().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent duplicate waitlist submissions
      const existing = await ctx.db.lead.findFirst({
        where: {
          email: input.email,
          zipCode: input.zipCode,
          campaignId: input.campaignId || null,
          categoryId: input.categoryId || null,
        },
      })

      if (existing) {
        return existing
      }

      const lead = await ctx.db.lead.create({
        data: {
          businessName: input.businessName || null,
          email: input.email,
          zipCode: input.zipCode,
          campaignId: input.campaignId || null,
          categoryId: input.categoryId || null,
          requestedCategory: input.requestedCategory || null,
          businessDescription: input.businessDescription || null,
        },
      })
      return lead
    }),
})
