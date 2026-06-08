import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { CampaignStatus } from "@prisma/client"

export const campaignRouter = createTRPCRouter({
  // Public procedures
  getByLocation: publicProcedure
    .input(
      z.object({
        state: z.string(),
        city: z.string(),
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: {
          state_city_slug: {
            state: input.state.toLowerCase(),
            city: input.city.toLowerCase(),
            slug: input.slug.toLowerCase(),
          },
        },
        include: {
          spots: {
            orderBy: { sortOrder: "asc" },
            include: {
              category: true,
            },
          },
        },
      })
      return campaign
    }),

  // Admin procedures
  list: adminProcedure.query(async ({ ctx }) => {
    const campaigns = await ctx.db.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { spots: true, orders: true },
        },
      },
    })
    return campaigns
  }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.findUnique({
        where: { id: input.id },
        include: {
          spots: {
            orderBy: { sortOrder: "asc" },
            include: {
              category: true,
            },
          },
          orders: {
            orderBy: { createdAt: "desc" },
            include: {
              advertiser: true,
              campaignSpot: true,
              creativeSubmission: true,
            },
          },
        },
      })
      return campaign
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        county: z.string().optional(),
        zipCode: z.string().optional(),
        mailingQuantity: z.number().int().positive(),
        description: z.string().optional(),
        estimatedMailDate: z.date().optional(),
        frontBackgroundUrl: z.string().url().optional().or(z.literal("")),
        backBackgroundUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.create({
        data: {
          name: input.name,
          slug: input.slug.toLowerCase(),
          city: input.city.toLowerCase(),
          state: input.state.toLowerCase(),
          county: input.county,
          zipCode: input.zipCode,
          mailingQuantity: input.mailingQuantity,
          description: input.description,
          estimatedMailDate: input.estimatedMailDate,
          frontBackgroundUrl: input.frontBackgroundUrl || null,
          backBackgroundUrl: input.backBackgroundUrl || null,
          status: CampaignStatus.DRAFT,
        },
      })
      return campaign
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        slug: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(1),
        county: z.string().optional(),
        zipCode: z.string().optional(),
        mailingQuantity: z.number().int().positive(),
        description: z.string().optional(),
        estimatedMailDate: z.date().optional(),
        frontBackgroundUrl: z.string().url().optional().or(z.literal("")),
        backBackgroundUrl: z.string().url().optional().or(z.literal("")),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.update({
        where: { id: input.id },
        data: {
          name: input.name,
          slug: input.slug.toLowerCase(),
          city: input.city.toLowerCase(),
          state: input.state.toLowerCase(),
          county: input.county,
          zipCode: input.zipCode,
          mailingQuantity: input.mailingQuantity,
          description: input.description,
          estimatedMailDate: input.estimatedMailDate,
          frontBackgroundUrl: input.frontBackgroundUrl || null,
          backBackgroundUrl: input.backBackgroundUrl || null,
        },
      })
      return campaign
    }),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.nativeEnum(CampaignStatus),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const campaign = await ctx.db.campaign.update({
        where: { id: input.id },
        data: { status: input.status },
      })
      return campaign
    }),
})
