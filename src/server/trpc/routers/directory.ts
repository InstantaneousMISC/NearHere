import { z } from "zod"
import { createTRPCRouter, adminProcedure, publicProcedure } from "../init"
import { DirectoryStatus, IndexControl } from "@prisma/client"
import { TRPCError } from "@trpc/server"
import { validateAndNormalizeUrl } from "@/lib/validation"

export const directoryRouter = createTRPCRouter({
  // ─── STATE ENDPOINTS ──────────────────────────────────────────────────────
  listStates: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.state.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { cities: true },
        },
      },
    })
  }),

  upsertState: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50),
        status: z.nativeEnum(DirectoryStatus).default(DirectoryStatus.DRAFT),
        isIndexed: z.nativeEnum(IndexControl).default(IndexControl.INDEX),
        metaTitle: z.string().max(200).optional().nullable(),
        metaDescription: z.string().max(500).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slugNormalized = input.slug.toLowerCase().replace(/[^a-z0-9]/g, "-")

      // Check slug uniqueness
      const existing = await ctx.db.state.findFirst({
        where: {
          slug: slugNormalized,
          id: input.id ? { not: input.id } : undefined,
        },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "State slug already exists.",
        })
      }

      if (input.id) {
        return await ctx.db.state.update({
          where: { id: input.id },
          data: {
            name: input.name,
            slug: slugNormalized,
            status: input.status,
            isIndexed: input.isIndexed,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
          },
        })
      } else {
        return await ctx.db.state.create({
          data: {
            name: input.name,
            slug: slugNormalized,
            status: input.status,
            isIndexed: input.isIndexed,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
          },
        })
      }
    }),

  deleteState: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.state.delete({
        where: { id: input.id },
      })
    }),

  // ─── CITY ENDPOINTS ───────────────────────────────────────────────────────
  listCities: publicProcedure
    .input(z.object({ stateId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.city.findMany({
        where: input.stateId ? { stateId: input.stateId } : undefined,
        orderBy: { name: "asc" },
        include: {
          state: true,
          _count: {
            select: { locations: true },
          },
        },
      })
    }),

  upsertCity: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50),
        stateId: z.string().min(1),
        status: z.nativeEnum(DirectoryStatus).default(DirectoryStatus.DRAFT),
        isIndexed: z.nativeEnum(IndexControl).default(IndexControl.INDEX),
        metaTitle: z.string().max(200).optional().nullable(),
        metaDescription: z.string().max(500).optional().nullable(),
        introCopy: z.string().max(2000).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slugNormalized = input.slug.toLowerCase().replace(/[^a-z0-9]/g, "-")

      // Check uniqueness in same state
      const existing = await ctx.db.city.findFirst({
        where: {
          stateId: input.stateId,
          slug: slugNormalized,
          id: input.id ? { not: input.id } : undefined,
        },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "City slug already exists within this state.",
        })
      }

      if (input.id) {
        return await ctx.db.city.update({
          where: { id: input.id },
          data: {
            name: input.name,
            slug: slugNormalized,
            stateId: input.stateId,
            status: input.status,
            isIndexed: input.isIndexed,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            introCopy: input.introCopy,
          },
        })
      } else {
        return await ctx.db.city.create({
          data: {
            name: input.name,
            slug: slugNormalized,
            stateId: input.stateId,
            status: input.status,
            isIndexed: input.isIndexed,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
            introCopy: input.introCopy,
          },
        })
      }
    }),

  deleteCity: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.city.delete({
        where: { id: input.id },
      })
    }),

  // ─── CATEGORY ENDPOINTS ───────────────────────────────────────────────────
  listCategories: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.directoryCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { businesses: true },
        },
      },
    })
  }),

  upsertCategory: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(50),
        description: z.string().max(1000).optional().nullable(),
        status: z.nativeEnum(DirectoryStatus).default(DirectoryStatus.DRAFT),
        isIndexed: z.nativeEnum(IndexControl).default(IndexControl.INDEX),
        metaTitle: z.string().max(200).optional().nullable(),
        metaDescription: z.string().max(500).optional().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slugNormalized = input.slug.toLowerCase().replace(/[^a-z0-9]/g, "-")

      const existing = await ctx.db.directoryCategory.findFirst({
        where: {
          slug: slugNormalized,
          id: input.id ? { not: input.id } : undefined,
        },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Category slug already exists.",
        })
      }

      if (input.id) {
        return await ctx.db.directoryCategory.update({
          where: { id: input.id },
          data: {
            name: input.name,
            slug: slugNormalized,
            description: input.description,
            status: input.status,
            isIndexed: input.isIndexed,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
          },
        })
      } else {
        return await ctx.db.directoryCategory.create({
          data: {
            name: input.name,
            slug: slugNormalized,
            description: input.description,
            status: input.status,
            isIndexed: input.isIndexed,
            metaTitle: input.metaTitle,
            metaDescription: input.metaDescription,
          },
        })
      }
    }),

  deleteCategory: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.directoryCategory.delete({
        where: { id: input.id },
      })
    }),

  // ─── PROFILE ENDPOINTS ────────────────────────────────────────────────────
  listProfiles: adminProcedure.query(async ({ ctx }) => {
    return await ctx.db.directoryProfile.findMany({
      orderBy: { name: "asc" },
      include: {
        locations: {
          include: { city: true },
        },
        categories: {
          include: { directoryCategory: true },
        },
      },
    })
  }),

  getProfileDetails: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const profile = await ctx.db.directoryProfile.findUnique({
        where: { id: input.id },
        include: {
          locations: {
            include: { city: true },
          },
          categories: {
            include: { directoryCategory: true },
          },
          links: true,
        },
      })

      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Profile not found.",
        })
      }

      return profile
    }),

  upsertProfile: adminProcedure
    .input(
      z.object({
        id: z.string().optional(),
        businessId: z.string().optional().nullable(),
        name: z.string().min(1).max(200),
        slug: z.string().min(1).max(200),
        description: z.string().max(1000).optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().optional().nullable(),
        website: z.string().optional().nullable(),
        logoUrl: z.string().optional().nullable(),
        coverImageUrl: z.string().optional().nullable(),
        address: z.string().optional().nullable(),
        serviceArea: z.string().optional().nullable(),
        hours: z.string().optional().nullable(),
        preferredCta: z.string().optional().nullable(),
        status: z.nativeEnum(DirectoryStatus).default(DirectoryStatus.DRAFT),
        isIndexed: z.nativeEnum(IndexControl).default(IndexControl.INDEX),
        metaTitle: z.string().max(200).optional().nullable(),
        metaDescription: z.string().max(500).optional().nullable(),
        introCopy: z.string().max(2000).optional().nullable(),
        cityIds: z.array(z.string()), // assigned locations
        categoryIds: z.array(z.string()), // assigned categories
      })
    )
    .mutation(async ({ ctx, input }) => {
      const slugNormalized = input.slug.toLowerCase().replace(/[^a-z0-9]/g, "-")

      const existing = await ctx.db.directoryProfile.findFirst({
        where: {
          slug: slugNormalized,
          id: input.id ? { not: input.id } : undefined,
        },
      })
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Profile slug already exists.",
        })
      }

      const websiteSanitized = input.website ? validateAndNormalizeUrl(input.website) || input.website : null
      const logoSanitized = input.logoUrl ? validateAndNormalizeUrl(input.logoUrl) || input.logoUrl : null
      const coverSanitized = input.coverImageUrl ? validateAndNormalizeUrl(input.coverImageUrl) || input.coverImageUrl : null

      const profileData = {
        businessId: input.businessId || null,
        name: input.name,
        slug: slugNormalized,
        description: input.description,
        phone: input.phone,
        email: input.email,
        website: websiteSanitized,
        logoUrl: logoSanitized,
        coverImageUrl: coverSanitized,
        address: input.address,
        serviceArea: input.serviceArea,
        hours: input.hours,
        preferredCta: input.preferredCta,
        status: input.status,
        isIndexed: input.isIndexed,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        introCopy: input.introCopy,
      }

      let profileId = ""

      if (input.id) {
        profileId = input.id
        await ctx.db.directoryProfile.update({
          where: { id: input.id },
          data: profileData,
        })
      } else {
        const created = await ctx.db.directoryProfile.create({
          data: profileData,
        })
        profileId = created.id
      }

      // Sync locations: delete unassigned locations and insert new ones
      await ctx.db.businessLocation.deleteMany({
        where: {
          directoryProfileId: profileId,
          cityId: { notIn: input.cityIds },
        },
      })

      const existingLocations = await ctx.db.businessLocation.findMany({
        where: { directoryProfileId: profileId },
        select: { cityId: true },
      })
      const existingCityIds = existingLocations.map((l) => l.cityId)

      const cityIdsToInsert = input.cityIds.filter((cid) => !existingCityIds.includes(cid))
      if (cityIdsToInsert.length > 0) {
        await ctx.db.businessLocation.createMany({
          data: cityIdsToInsert.map((cid) => ({
            directoryProfileId: profileId,
            cityId: cid,
            status: input.status,
            isIndexed: input.isIndexed,
            address: input.address,
            phone: input.phone,
            hours: input.hours,
          })),
        })
      }

      // Sync categories: delete unassigned categories and insert new ones
      await ctx.db.businessDirectoryCategory.deleteMany({
        where: {
          directoryProfileId: profileId,
          directoryCategoryId: { notIn: input.categoryIds },
        },
      })

      const existingCatJoins = await ctx.db.businessDirectoryCategory.findMany({
        where: { directoryProfileId: profileId },
        select: { directoryCategoryId: true },
      })
      const existingCatIds = existingCatJoins.map((c) => c.directoryCategoryId)

      const catIdsToInsert = input.categoryIds.filter((cid) => !existingCatIds.includes(cid))
      if (catIdsToInsert.length > 0) {
        await ctx.db.businessDirectoryCategory.createMany({
          data: catIdsToInsert.map((cid) => ({
            directoryProfileId: profileId,
            directoryCategoryId: cid,
          })),
        })
      }

      // Return the complete updated profile
      return await ctx.db.directoryProfile.findUnique({
        where: { id: profileId },
        include: {
          locations: { include: { city: true } },
          categories: { include: { directoryCategory: true } },
        },
      })
    }),

  deleteProfile: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Cascade delete locations and categories
      await ctx.db.businessLocation.deleteMany({ where: { directoryProfileId: input.id } })
      await ctx.db.businessDirectoryCategory.deleteMany({ where: { directoryProfileId: input.id } })
      
      return await ctx.db.directoryProfile.delete({
        where: { id: input.id },
      })
    }),
})
