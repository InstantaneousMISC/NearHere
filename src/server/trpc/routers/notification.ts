import { z } from "zod"
import { createTRPCRouter, adminProcedure } from "../init"

export const notificationRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.adminNotification.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    })
  }),

  getUnreadCount: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.adminNotification.count({
      where: { read: false },
    })
  }),

  markAsRead: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.adminNotification.update({
        where: { id: input.id },
        data: { read: true },
      })
    }),

  markAllAsRead: adminProcedure.mutation(async ({ ctx }) => {
    return await ctx.db.adminNotification.updateMany({
      where: { read: false },
      data: { read: true },
    })
  }),
})
