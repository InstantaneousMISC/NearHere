import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { SpotType } from "@prisma/client"

export const categoryRouter = createTRPCRouter({
  // Public procedures
  list: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db.businessCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    })
    return categories
  }),

  // Admin procedures
  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        allowsMultipleAdvertisers: z.boolean().default(false),
        defaultSpotType: z.nativeEnum(SpotType).default(SpotType.STANDARD),
        defaultPrice: z.number().int().nonnegative().default(0),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.businessCategory.create({
        data: {
          name: input.name,
          slug: input.slug.toLowerCase(),
          description: input.description,
          allowsMultipleAdvertisers: input.allowsMultipleAdvertisers,
          defaultSpotType: input.defaultSpotType,
          defaultPrice: input.defaultPrice,
          isActive: true,
        },
      })
      return category
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        slug: z.string().min(1),
        description: z.string().optional(),
        allowsMultipleAdvertisers: z.boolean(),
        defaultSpotType: z.nativeEnum(SpotType),
        defaultPrice: z.number().int().nonnegative(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.db.businessCategory.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug: input.slug.toLowerCase(),
          description: input.description,
          allowsMultipleAdvertisers: input.allowsMultipleAdvertisers,
          defaultSpotType: input.defaultSpotType,
          defaultPrice: input.defaultPrice,
          isActive: input.isActive,
        },
      })
      return category
    }),
})
