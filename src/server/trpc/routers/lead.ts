import { z } from "zod"
import { createTRPCRouter, publicProcedure } from "../init"

export const leadRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        businessName: z.string().optional(),
        email: z.string().email(),
        zipCode: z.string().min(5).max(10),
        campaignId: z.string().optional(),
        categoryId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const lead = await ctx.db.lead.create({
        data: {
          businessName: input.businessName || null,
          email: input.email.toLowerCase(),
          zipCode: input.zipCode,
          campaignId: input.campaignId || null,
          categoryId: input.categoryId || null,
        },
      })
      return lead
    }),
})
