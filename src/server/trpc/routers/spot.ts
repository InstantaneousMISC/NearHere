import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { SpotStatus, SpotType, PostcardSide } from "@prisma/client"
import { releaseExpiredHolds } from "@/server/helpers/releaseExpiredHolds"
import { SPOT_HOLD_DURATION_MINUTES } from "@/lib/constants"
import { TRPCError } from "@trpc/server"

function getPairedSpotKey(label: string): string | null {
  const match = label.match(/^(FRONT|BACK)_([1-8])$/)
  if (!match) return null
  const side = match[1]
  const num = parseInt(match[2], 10)
  let pairedNum: number
  if (num === 1) pairedNum = 2
  else if (num === 2) pairedNum = 1
  else if (num === 3) pairedNum = 4
  else if (num === 4) pairedNum = 3
  else if (num === 5) pairedNum = 6
  else if (num === 6) pairedNum = 5
  else if (num === 7) pairedNum = 8
  else if (num === 8) pairedNum = 7
  else return null

  return `${side}_${pairedNum}`
}

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
      if (input.planKey.startsWith("spot-")) {
        const spotId = input.planKey.slice(5)
        const spot = await ctx.db.campaignSpot.findUnique({
          where: { id: spotId },
        })
        if (!spot) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign spot not found",
          })
        }
        return { spotId: spot.id }
      }

      if (input.planKey.startsWith("9x12-16-regular-double-")) {
        const clickedLabel = input.planKey.slice("9x12-16-regular-double-".length)
        const pairedLabel = getPairedSpotKey(clickedLabel)
        if (!pairedLabel) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid spot label for double placement pairing",
          })
        }

        const doubleSpot = await ctx.db.$transaction(async (tx: any) => {
          const spots = await tx.campaignSpot.findMany({
            where: {
              campaignId: input.campaignId,
              label: { in: [clickedLabel, pairedLabel] },
            },
          })

          if (spots.length !== 2) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Underlying spots not found",
            })
          }

          const [spotA, spotB] = spots
          const now = new Date()
          const isAActiveHold = spotA.status === SpotStatus.HELD && spotA.heldUntil && spotA.heldUntil > now
          const isBActiveHold = spotB.status === SpotStatus.HELD && spotB.heldUntil && spotB.heldUntil > now

          if (spotA.status === SpotStatus.SOLD || spotB.status === SpotStatus.SOLD || isAActiveHold || isBActiveHold) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "One or both underlying spots are already sold or held",
            })
          }

          const side = spotA.side
          const num1 = parseInt(clickedLabel.match(/\d+$/)?.[0] || "1", 10)
          const num2 = parseInt(pairedLabel.match(/\d+$/)?.[0] || "2", 10)
          const low = Math.min(num1, num2)
          const high = Math.max(num1, num2)
          const doubleLabel = `${side}_DOUBLE_${low}_${high}`

          let existingDouble = await tx.campaignSpot.findFirst({
            where: {
              campaignId: input.campaignId,
              label: doubleLabel,
            },
          })

          if (existingDouble) {
            if (existingDouble.status === SpotStatus.SOLD) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "This double placement is already sold",
              })
            }
            existingDouble = await tx.campaignSpot.update({
              where: { id: existingDouble.id },
              data: {
                categoryId: input.categoryId,
                status: SpotStatus.OPEN,
                price: side === "FRONT" ? 109000 : 99000,
              },
            })

            await tx.campaignSpot.updateMany({
              where: {
                id: { in: [spotA.id, spotB.id] },
              },
              data: {
                status: SpotStatus.UNAVAILABLE,
              },
            })

            return existingDouble
          }

          const x = Math.min(spotA.x, spotB.x)
          const y = spotA.y
          const width = spotA.width + spotB.width + 1.6667
          const height = spotA.height

          const newDouble = await tx.campaignSpot.create({
            data: {
              campaignId: input.campaignId,
              categoryId: input.categoryId,
              label: doubleLabel,
              side,
              spotType: SpotType.LARGE,
              price: side === "FRONT" ? 109000 : 99000,
              x,
              y,
              width,
              height,
              status: SpotStatus.OPEN,
              sortOrder: Math.min(spotA.sortOrder, spotB.sortOrder),
            },
          })

          await tx.campaignSpot.updateMany({
            where: {
              id: { in: [spotA.id, spotB.id] },
            },
            data: {
              status: SpotStatus.UNAVAILABLE,
            },
          })

          return newDouble
        }, { isolationLevel: "Serializable" })

        return { spotId: doubleSpot.id }
      }

      if (input.planKey === "front-regular" || input.planKey === "back-regular" || input.planKey === "regular") {
        const targetSide = input.planKey.startsWith("front-") ? "FRONT" : (input.planKey.startsWith("back-") ? "BACK" : undefined)
        const availableSpot = await ctx.db.campaignSpot.findFirst({
          where: {
            campaignId: input.campaignId,
            spotType: SpotType.STANDARD,
            status: SpotStatus.OPEN,
            ...(targetSide ? { side: targetSide } : {}),
          },
          orderBy: { sortOrder: "asc" },
        })
        if (!availableSpot) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `No available ${targetSide || "regular"} spots remaining on this campaign`,
          })
        }
        const updated = await ctx.db.campaignSpot.update({
          where: { id: availableSpot.id },
          data: { categoryId: input.categoryId },
        })
        return { spotId: updated.id }
      }

      if (input.planKey === "front-double" || input.planKey === "back-double" || input.planKey === "double") {
        // Only run 16-regular auto-allocator if the campaign format is indeed 16-regular
        const campaign = await ctx.db.campaign.findUnique({
          where: { id: input.campaignId },
          select: { cardSize: true },
        })
        if (campaign?.cardSize === "9x12-16-regular") {
          const targetSide = input.planKey.startsWith("front-") ? "FRONT" : (input.planKey.startsWith("back-") ? "BACK" : undefined)
          const doubleSpot = await ctx.db.$transaction(async (tx: any) => {
            const allSpots = await tx.campaignSpot.findMany({
              where: {
                campaignId: input.campaignId,
                status: SpotStatus.OPEN,
                spotType: SpotType.STANDARD,
                ...(targetSide ? { side: targetSide } : {}),
              },
            })
            const openLabels = new Set(allSpots.map((s: any) => s.label))

            const sides: PostcardSide[] = targetSide ? [targetSide] : ["FRONT", "BACK"]
            const pairings = [[1, 2], [3, 4], [5, 6], [7, 8]]
            
            let selectedPair: [string, string] | null = null
            for (const side of sides) {
              for (const [a, b] of pairings) {
                const labelA = `${side}_${a}`
                const labelB = `${side}_${b}`
                if (openLabels.has(labelA) && openLabels.has(labelB)) {
                  selectedPair = [labelA, labelB]
                  break
                }
              }
              if (selectedPair) break
            }

            if (!selectedPair) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `No available adjacent double spots remaining on the ${targetSide || "postcard"}`,
              })
            }

            const [labelA, labelB] = selectedPair
            const spotA = allSpots.find((s: any) => s.label === labelA)
            const spotB = allSpots.find((s: any) => s.label === labelB)

            const side = spotA.side
            const num1 = parseInt(labelA.match(/\d+$/)?.[0] || "1", 10)
            const num2 = parseInt(labelB.match(/\d+$/)?.[0] || "2", 10)
            const low = Math.min(num1, num2)
            const high = Math.max(num1, num2)
            const doubleLabel = `${side}_DOUBLE_${low}_${high}`

            let existingDouble = await tx.campaignSpot.findFirst({
              where: {
                campaignId: input.campaignId,
                label: doubleLabel,
              },
            })

            if (existingDouble) {
              existingDouble = await tx.campaignSpot.update({
                where: { id: existingDouble.id },
                data: {
                  categoryId: input.categoryId,
                  status: SpotStatus.OPEN,
                  price: side === "FRONT" ? 109000 : 99000,
                },
              })

              await tx.campaignSpot.updateMany({
                where: { id: { in: [spotA.id, spotB.id] } },
                data: { status: SpotStatus.UNAVAILABLE },
              })

              return existingDouble
            }

            const x = Math.min(spotA.x, spotB.x)
            const y = spotA.y
            const width = spotA.width + spotB.width + 1.6667
            const height = spotA.height

            const newDouble = await tx.campaignSpot.create({
              data: {
                campaignId: input.campaignId,
                categoryId: input.categoryId,
                label: doubleLabel,
                side,
                spotType: SpotType.LARGE,
                price: side === "FRONT" ? 109000 : 99000,
                x,
                y,
                width,
                height,
                status: SpotStatus.OPEN,
                sortOrder: Math.min(spotA.sortOrder, spotB.sortOrder),
              },
            })

            await tx.campaignSpot.updateMany({
              where: { id: { in: [spotA.id, spotB.id] } },
              data: { status: SpotStatus.UNAVAILABLE },
            })

            return newDouble
          }, { isolationLevel: "Serializable" })

          return { spotId: doubleSpot.id }
        }
      }

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
