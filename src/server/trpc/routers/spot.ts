import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { SpotStatus, SpotType, PostcardSide } from "@prisma/client"
import { releaseExpiredHolds } from "@/server/helpers/releaseExpiredHolds"
import { SPOT_HOLD_DURATION_MINUTES } from "@/lib/constants"
import { TRPCError } from "@trpc/server"

export const spotRouter = createTRPCRouter({
  // Public procedures
  listByCampaign: publicProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      // First release any expired holds on this campaign
      await releaseExpiredHolds(input.campaignId)

      const spots = await ctx.db.campaignSpot.findMany({
        where: { campaignId: input.campaignId },
        orderBy: { sortOrder: "asc" },
        include: {
          category: true,
        },
      })
      return spots
    }),

  holdForCheckout: publicProcedure
    .input(
      z.object({
        spotId: z.string(),
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const spot = await ctx.db.campaignSpot.findUnique({
        where: { id: input.spotId },
        include: { category: true },
      })

      if (!spot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign spot not found",
        })
      }

      if (spot.status !== SpotStatus.OPEN && spot.status !== SpotStatus.HELD) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Spot is no longer available",
        })
      }

      // Check category exclusivity if multiple advertisers are not allowed
      if (!spot.category.allowsMultipleAdvertisers) {
        const conflictingSpot = await ctx.db.campaignSpot.findFirst({
          where: {
            campaignId: spot.campaignId,
            categoryId: spot.categoryId,
            id: { not: spot.id },
            status: SpotStatus.SOLD,
          },
        })

        if (conflictingSpot) {
          throw new TRPCError({
            code: "CONFLICT",
            message: `The ${spot.category.name} category is already reserved for this campaign.`,
          })
        }
      }

      return spot
    }),

  // Admin procedures
  create: adminProcedure
    .input(
      z.object({
        campaignId: z.string(),
        categoryId: z.string(),
        label: z.string().min(1),
        side: z.nativeEnum(PostcardSide),
        spotType: z.nativeEnum(SpotType),
        price: z.number().int().positive(),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        width: z.number().min(0).max(100),
        height: z.number().min(0).max(100),
        sortOrder: z.number().int().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const spot = await ctx.db.campaignSpot.create({
        data: {
          campaignId: input.campaignId,
          categoryId: input.categoryId,
          label: input.label,
          side: input.side,
          spotType: input.spotType,
          price: input.price,
          x: input.x,
          y: input.y,
          width: input.width,
          height: input.height,
          sortOrder: input.sortOrder,
          status: SpotStatus.OPEN,
        },
      })
      return spot
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        categoryId: z.string(),
        label: z.string().min(1),
        side: z.nativeEnum(PostcardSide),
        spotType: z.nativeEnum(SpotType),
        price: z.number().int().positive(),
        x: z.number().min(0).max(100),
        y: z.number().min(0).max(100),
        width: z.number().min(0).max(100),
        height: z.number().min(0).max(100),
        sortOrder: z.number().int().default(0),
        status: z.nativeEnum(SpotStatus).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const spot = await ctx.db.campaignSpot.update({
        where: { id: input.id },
        data: {
          categoryId: input.categoryId,
          label: input.label,
          side: input.side,
          spotType: input.spotType,
          price: input.price,
          x: input.x,
          y: input.y,
          width: input.width,
          height: input.height,
          sortOrder: input.sortOrder,
          status: input.status,
        },
      })
      return spot
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const spot = await ctx.db.campaignSpot.findUnique({
        where: { id: input.id },
      })

      if (!spot) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Spot not found",
        })
      }

      if (spot.status !== SpotStatus.OPEN) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only delete open spots",
        })
      }

      await ctx.db.campaignSpot.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})
