import { z } from "zod"
import { createTRPCRouter, adminProcedure } from "../init"

export const emailLogRouter = createTRPCRouter({
  list: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.string().optional(),
        templateKey: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}

      if (input.search) {
        where.OR = [
          { toEmail: { contains: input.search, mode: "insensitive" } },
          { entityId: { contains: input.search, mode: "insensitive" } },
          { entityType: { contains: input.search, mode: "insensitive" } },
        ]
      }

      if (input.status) {
        where.status = input.status
      }

      if (input.templateKey) {
        where.templateKey = input.templateKey
      }

      return await ctx.db.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
      })
    }),

  getUniqueTemplateKeys: adminProcedure.query(async ({ ctx }) => {
    const logs = await ctx.db.emailLog.findMany({
      select: { templateKey: true },
      distinct: ["templateKey"],
    })
    return logs.map((l) => l.templateKey)
  }),
})
