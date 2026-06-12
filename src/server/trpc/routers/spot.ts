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

  getOrCreateSpotForPlan: publicProcedure
    .input(
      z.object({
        campaignId: z.string(),
        planKey: z.string(),
        categoryId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let side: PostcardSide = "FRONT"
      let spotType: SpotType = "STANDARD"
      let label = ""
      let price = 0

      if (input.planKey === "front-standard") {
        side = "FRONT"
        spotType = "STANDARD"
        label = "Front Standard"
        price = 49000
      } else if (input.planKey === "back-standard") {
        side = "BACK"
        spotType = "STANDARD"
        label = "Back Standard"
        price = 59000
      } else if (input.planKey === "premium-center") {
        side = "BACK"
        spotType = "PREMIUM"
        label = "Premium Center Back"
        price = 149000
      } else if (input.planKey === "front-double") {
        side = "FRONT"
        spotType = "LARGE"
        label = "Front Double"
        price = 89000
      } else if (input.planKey === "back-double") {
        side = "BACK"
        spotType = "LARGE"
        label = "Back Double"
        price = 99000
      } else if (input.planKey === "standard") {
        side = "FRONT"
        spotType = "STANDARD"
        label = "Standard Feature"
        price = 45000
      } else if (input.planKey === "premium") {
        side = "FRONT"
        spotType = "PREMIUM"
        label = "Premium Feature"
        price = 100000
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Invalid plan key: ${input.planKey}`,
        })
      }

      // Check category existence
      const category = await ctx.db.businessCategory.findUnique({
        where: { id: input.categoryId },
      })
      if (!category) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Category not found",
        })
      }

      const hasCategoryConflict = !category.allowsMultipleAdvertisers && await ctx.db.campaignSpot.findFirst({
        where: {
          campaignId: input.campaignId,
          categoryId: input.categoryId,
          status: SpotStatus.SOLD,
        },
      })

      // If not double spot and no category conflict, look for an existing OPEN spot
      if (input.planKey !== "front-double" && input.planKey !== "back-double" && !hasCategoryConflict) {
        const openSpot = await ctx.db.campaignSpot.findFirst({
          where: {
            campaignId: input.campaignId,
            side,
            spotType,
            status: SpotStatus.OPEN,
          },
        })
        if (openSpot) {
          return { spotId: openSpot.id }
        }
      }

      // Otherwise, create a virtual/overbooked spot
      const virtualSpot = await ctx.db.campaignSpot.create({
        data: {
          campaignId: input.campaignId,
          categoryId: input.categoryId,
          label: `${label} (Virtual)`,
          side,
          spotType,
          price,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          status: SpotStatus.OPEN,
        },
      })

      return { spotId: virtualSpot.id }
    }),
})
