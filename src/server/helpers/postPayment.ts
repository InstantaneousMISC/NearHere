import crypto from "crypto"
import { db } from "@/server/db"
import { generateQrSlug } from "@/server/helpers/generateQrSlug"
import { sendLifecycleEmailOnce } from "@/server/email/sendLifecycleEmailOnce"
import { getAdminPurchaseNotificationTemplate } from "@/server/email/templates/adminPurchaseNotification"
import { getClaimBusinessProfileTemplate } from "@/server/email/templates/claimBusinessProfile"
import { getPaymentConfirmationTemplate } from "@/server/email/templates/paymentConfirmation"
import { getSubmitPostcardCreativeTemplate } from "@/server/email/templates/submitPostcardCreative"

const getAppUrl = () =>
  (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "")

export async function ensureBusinessForOrder(orderId: string) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { advertiser: true },
  })

  return db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${order.advertiserId}))`

    const existing = await tx.business.findFirst({
      where: { advertiserId: order.advertiserId },
    })
    if (existing) {
      if (!existing.ownerUserId && !existing.claimToken) {
        const claimToken = crypto.randomBytes(16).toString("hex")
        const claimTokenExpiresAt = new Date()
        claimTokenExpiresAt.setDate(claimTokenExpiresAt.getDate() + 14)

        return tx.business.update({
          where: { id: existing.id },
          data: { claimToken, claimTokenExpiresAt },
        })
      }
      return existing
    }

    const baseSlug =
      order.advertiser.businessName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "business"
    let slug = baseSlug
    let suffix = 0
    while (await tx.business.findUnique({ where: { slug }, select: { id: true } })) {
      suffix += 1
      slug = `${baseSlug}-${suffix}`
    }

    const claimToken = crypto.randomBytes(16).toString("hex")
    const claimTokenExpiresAt = new Date()
    claimTokenExpiresAt.setDate(claimTokenExpiresAt.getDate() + 14)

    return tx.business.create({
      data: {
        advertiserId: order.advertiserId,
        name: order.advertiser.businessName,
        slug,
        phone: order.advertiser.phone,
        email: order.advertiser.email,
        website: order.advertiser.website,
        address: order.advertiser.businessAddress,
        status: "ACTIVE",
        claimToken,
        claimTokenExpiresAt,
      },
    })
  })
}

export async function ensureQrForOrder(orderId: string) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { campaign: true },
  })
  const business = await ensureBusinessForOrder(orderId)
  const existing = await db.qrCode.findUnique({ where: { orderId } })
  if (existing) return existing

  const slug = await generateQrSlug(db)
  const expiresAt = order.campaign.estimatedMailDate
    ? new Date(order.campaign.estimatedMailDate)
    : null
  expiresAt?.setDate(expiresAt.getDate() + 90)

  return db.qrCode.upsert({
    where: { orderId },
    update: {},
    create: {
      businessId: business.id,
      campaignId: order.campaignId,
      campaignSpotId: order.campaignSpotId,
      orderId,
      slug,
      type: "CAMPAIGN_SLOT",
      status: "ACTIVE",
      destinationPath: `/b/${business.slug}`,
      expiresAt,
    },
  })
}

export async function ensureCreativeSubmissionForOrder(orderId: string) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: { advertiser: true },
  })

  return db.creativeSubmission.upsert({
    where: { orderId },
    update: {},
    create: {
      orderId,
      businessName: order.advertiser.businessName,
    },
  })
}

export async function ensurePostPaymentEmailsForOrder(orderId: string) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    include: {
      advertiser: true,
      campaign: true,
      campaignSpot: true,
    },
  })
  const business = await ensureBusinessForOrder(orderId)
  const appUrl = getAppUrl()
  const creativeSubmissionUrl = `${appUrl}/submit-creative/${order.creativeSubmissionToken}`
  const claimLink = business.claimToken
    ? `${appUrl}/business/claim/${business.claimToken}`
    : null
  const adminOrderUrl = `${appUrl}/admin/orders/${order.id}`

  const payment = getPaymentConfirmationTemplate({
    businessName: order.advertiser.businessName,
    campaignName: order.campaign.name,
    categoryName: order.campaignSpot.label,
    amount: order.amount,
  })
  await sendLifecycleEmailOnce({
    toEmail: order.advertiser.email,
    templateKey: "payment_confirmation",
    entityType: "order",
    entityId: order.id,
    subject: payment.subject,
    html: payment.html,
  })

  const admin = getAdminPurchaseNotificationTemplate({
    businessName: order.advertiser.businessName,
    contactName: order.advertiser.contactName,
    email: order.advertiser.email,
    phone: order.advertiser.phone,
    campaignName: order.campaign.name,
    categoryName: order.campaignSpot.label,
    amount: order.amount,
    adminOrderUrl,
  })
  await sendLifecycleEmailOnce({
    toEmail: process.env.ADMIN_EMAIL || "admin@localspotmailers.com",
    templateKey: "admin_purchase_notification",
    entityType: "order",
    entityId: order.id,
    subject: admin.subject,
    html: admin.html,
  })

  if (claimLink) {
    const claim = getClaimBusinessProfileTemplate({
      businessName: business.name,
      claimLink,
    })
    await sendLifecycleEmailOnce({
      toEmail: order.advertiser.email,
      templateKey: "claim_business_profile",
      entityType: "business",
      entityId: business.id,
      subject: claim.subject,
      html: claim.html,
    })
  }

  const creative = getSubmitPostcardCreativeTemplate({
    businessName: order.advertiser.businessName,
    campaignName: order.campaign.name,
    categoryName: order.campaignSpot.label,
    creativeSubmissionUrl,
  })
  await sendLifecycleEmailOnce({
    toEmail: order.advertiser.email,
    templateKey: "submit_postcard_creative",
    entityType: "order",
    entityId: order.id,
    subject: creative.subject,
    html: creative.html,
  })
}
