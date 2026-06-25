import { z } from "zod"
import { createTRPCRouter, publicProcedure, adminProcedure } from "../init"
import { CampaignOfferStatus, CampaignOfferDiscountType, CampaignOfferEventType } from "@prisma/client"
import { isCampaignOfferRedeemable } from "../../helpers/campaignOffers"
import { TRPCError } from "@trpc/server"
import crypto from "crypto"

export const campaignOfferRouter = createTRPCRouter({
  // Admin-only procedures
  create: adminProcedure
    .input(
      z.object({
        campaignId: z.string(),
        name: z.string().min(1),
        discountType: z.nativeEnum(CampaignOfferDiscountType),
        discountAmount: z.number().int().positive().nullable().optional(),
        discountPercent: z.number().int().min(1).max(100).nullable().optional(),
        maxRedemptions: z.number().int().positive().nullable().optional(),
        expiresAt: z.date().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate discount fields based on type
      if (input.discountType === CampaignOfferDiscountType.AMOUNT_OFF && !input.discountAmount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Discount amount is required for AMOUNT_OFF discount type.",
        })
      }
      if (input.discountType === CampaignOfferDiscountType.PERCENT_OFF && !input.discountPercent) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Discount percent is required for PERCENT_OFF discount type.",
        })
      }

      // Generate opaque secure random 32-char hex token (16 bytes)
      const token = crypto.randomBytes(16).toString("hex")

      const campaignOffer = await ctx.db.campaignOffer.create({
        data: {
          campaignId: input.campaignId,
          adminUserId: ctx.adminUser.id,
          name: input.name,
          token,
          discountType: input.discountType,
          discountAmount: input.discountType === CampaignOfferDiscountType.AMOUNT_OFF ? input.discountAmount : null,
          discountPercent: input.discountType === CampaignOfferDiscountType.PERCENT_OFF ? input.discountPercent : null,
          maxRedemptions: input.maxRedemptions || null,
          expiresAt: input.expiresAt || null,
          notes: input.notes || null,
          status: CampaignOfferStatus.ACTIVE,
        },
      })

      return campaignOffer
    }),

  listByCampaign: adminProcedure
    .input(z.object({ campaignId: z.string() }))
    .query(async ({ ctx, input }) => {
      const offers = await ctx.db.campaignOffer.findMany({
        where: { campaignId: input.campaignId },
        include: {
          adminUser: {
            select: {
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      })
      return offers
    }),

  getById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const offer = await ctx.db.campaignOffer.findUnique({
        where: { id: input.id },
        include: {
          adminUser: {
            select: {
              email: true,
              name: true,
            },
          },
          events: {
            orderBy: { createdAt: "desc" },
          },
        },
      })

      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign offer not found",
        })
      }

      return offer
    }),

  disable: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.db.campaignOffer.update({
        where: { id: input.id },
        data: { status: CampaignOfferStatus.DISABLED },
      })
      return offer
    }),

  // Public procedures
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const offer = await ctx.db.campaignOffer.findUnique({
        where: { token: input.token },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
              slug: true,
              city: true,
              state: true,
            },
          },
          adminUser: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign offer not found",
        })
      }

      // Check if it is redeemable dynamically
      const redeemable = isCampaignOfferRedeemable(offer)

      // Mask admin email unless name is unavailable, but better yet return public safe name
      const displayRep = `${offer.name} / ${offer.adminUser.name || "NearHere Representative"}`

      return {
        id: offer.id,
        name: offer.name,
        token: offer.token,
        discountType: offer.discountType,
        discountAmount: offer.discountAmount,
        discountPercent: offer.discountPercent,
        expiresAt: offer.expiresAt,
        status: offer.status,
        redeemable,
        campaign: offer.campaign,
        promotedBy: displayRep,
      }
    }),

  // Public scan event logger (separate procedure if needed, or we increment on landing page load)
  recordScan: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.db.campaignOffer.findUnique({
        where: { token: input.token },
      })

      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign offer not found",
        })
      }

      const userAgent = ctx.headers ? ctx.headers.get("user-agent") : null
      const ip = ctx.headers ? (ctx.headers.get("x-forwarded-for") || "").split(",")[0].trim() : null
      const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16) : null

      await ctx.db.$transaction([
        ctx.db.campaignOffer.update({
          where: { id: offer.id },
          data: { scanCount: { increment: 1 } },
        }),
        ctx.db.campaignOfferEvent.create({
          data: {
            campaignOfferId: offer.id,
            eventType: CampaignOfferEventType.SCAN,
            userAgent,
            ipHash,
          },
        }),
      ])

      return { success: true }
    }),

  // Public checkout started logger
  recordCheckoutStart: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const offer = await ctx.db.campaignOffer.findUnique({
        where: { token: input.token },
      })

      if (!offer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Campaign offer not found",
        })
      }

      const userAgent = ctx.headers ? ctx.headers.get("user-agent") : null
      const ip = ctx.headers ? (ctx.headers.get("x-forwarded-for") || "").split(",")[0].trim() : null
      const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16) : null

      await ctx.db.$transaction([
        ctx.db.campaignOffer.update({
          where: { id: offer.id },
          data: { checkoutStartCount: { increment: 1 } },
        }),
        ctx.db.campaignOfferEvent.create({
          data: {
            campaignOfferId: offer.id,
            eventType: CampaignOfferEventType.CHECKOUT_STARTED,
            userAgent,
            ipHash,
          },
        }),
      ])

      return { success: true }
    }),
})
