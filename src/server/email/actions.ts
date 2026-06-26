import { db } from "@/server/db"
import { sendLifecycleEmailOnce } from "./sendLifecycleEmailOnce"
import { getBookingCancelledTemplate } from "./templates/bookingCancelled"
import { getOnboardingWelcomeTemplate } from "./templates/onboardingWelcome"
import { getClaimSuccessTemplate } from "./templates/claimSuccess"
import { getCreativeReminderTemplate } from "./templates/creativeReminder"
import { getProspectInquiryConfirmationTemplate } from "./templates/prospectInquiryConfirmation"
import { getAdminInquiryNotificationTemplate } from "./templates/adminInquiryNotification"

const getAppUrl = () =>
  (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "")

/**
 * Dispatch booking cancellation / refund notification.
 */
export async function sendBookingCancelledEmail(orderId: string, reason?: string | null) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        advertiser: true,
        campaign: true,
        campaignSpot: true,
      },
    })

    if (!order) {
      console.warn(`[EMAIL ACTIONS] Order not found for cancellation email: ${orderId}`)
      return
    }

    const mail = getBookingCancelledTemplate({
      businessName: order.advertiser.businessName,
      campaignName: order.campaign.name,
      categoryName: order.campaignSpot.label,
      amount: order.amount,
      reason,
    })

    await sendLifecycleEmailOnce({
      toEmail: order.advertiser.email,
      templateKey: "booking_cancelled",
      entityType: "order",
      entityId: order.id,
      subject: mail.subject,
      html: mail.html,
    })
  } catch (error) {
    console.error(`[EMAIL ACTIONS] Failed to send booking cancellation email for order ${orderId}:`, error)
  }
}

/**
 * Dispatch welcome email upon completing setup onboarding.
 */
export async function sendOnboardingWelcomeEmail(businessId: string) {
  try {
    const business = await db.business.findUnique({
      where: { id: businessId },
    })

    if (!business || !business.email) {
      console.warn(`[EMAIL ACTIONS] Business or email not found for onboarding welcome: ${businessId}`)
      return
    }

    const appUrl = getAppUrl()
    const merchantDashboardUrl = `${appUrl}/business/dashboard`

    const mail = getOnboardingWelcomeTemplate({
      businessName: business.name,
      merchantDashboardUrl,
    })

    await sendLifecycleEmailOnce({
      toEmail: business.email,
      templateKey: "onboarding_welcome",
      entityType: "business",
      entityId: business.id,
      subject: mail.subject,
      html: mail.html,
    })
  } catch (error) {
    console.error(`[EMAIL ACTIONS] Failed to send onboarding welcome email for business ${businessId}:`, error)
  }
}

/**
 * Dispatch claim success email upon claiming a business profile.
 */
export async function sendClaimSuccessEmail(businessId: string) {
  try {
    const business = await db.business.findUnique({
      where: { id: businessId },
    })

    if (!business || !business.email) {
      console.warn(`[EMAIL ACTIONS] Business or email not found for claim success: ${businessId}`)
      return
    }

    const appUrl = getAppUrl()
    const merchantDashboardUrl = `${appUrl}/business/dashboard`

    const mail = getClaimSuccessTemplate({
      businessName: business.name,
      merchantDashboardUrl,
    })

    await sendLifecycleEmailOnce({
      toEmail: business.email,
      templateKey: "claim_success",
      entityType: "business",
      entityId: business.id,
      subject: mail.subject,
      html: mail.html,
    })
  } catch (error) {
    console.error(`[EMAIL ACTIONS] Failed to send claim success email for business ${businessId}:`, error)
  }
}

/**
 * Query and send creative submission reminders for PAID orders older than 72 hours without submitted creative.
 * This is designed as a batch/reminder trigger helper that supports pagination/limit inputs
 * so additional reminders (e.g. staggered 3-day, 5-day, 7-day checks) can be layered in.
 */
export async function triggerCreativeSubmissionReminders(params?: {
  olderThanHours?: number
  limit?: number
}) {
  const hours = params?.olderThanHours ?? 72
  const limit = params?.limit ?? 50
  const thresholdDate = new Date()
  thresholdDate.setHours(thresholdDate.getHours() - hours)

  try {
    // Find paid orders placed older than threshold hours ago
    // where creative submission exists but submittedAt is null (or it doesn't exist yet)
    const pendingOrders = await db.order.findMany({
      where: {
        status: "PAID",
        paidAt: { lt: thresholdDate },
        OR: [
          { creativeSubmission: { is: null } },
          { creativeSubmission: { submittedAt: null } },
        ],
      },
      include: {
        advertiser: true,
        campaign: true,
        campaignSpot: true,
      },
      take: limit,
    })

    console.log(`[EMAIL ACTIONS] Found ${pendingOrders.length} orders overdue for creative submission after ${hours}h.`)

    const appUrl = getAppUrl()
    let sentCount = 0

    for (const order of pendingOrders) {
      const creativeSubmissionUrl = `${appUrl}/submit-creative/${order.creativeSubmissionToken}`
      const mail = getCreativeReminderTemplate({
        businessName: order.advertiser.businessName,
        campaignName: order.campaign.name,
        categoryName: order.campaignSpot.label,
        creativeSubmissionUrl,
      })

      // We use order.id as the idempotency entity so we only send one reminder per order for this template key.
      // If we want staggered reminders later, we can change templateKey (e.g. creative_submission_reminder_2)
      const res = await sendLifecycleEmailOnce({
        toEmail: order.advertiser.email,
        templateKey: "creative_submission_reminder",
        entityType: "order_reminder",
        entityId: order.id,
        subject: mail.subject,
        html: mail.html,
      })

      if (res.success && !res.alreadySent) {
        sentCount++
      }
    }

    return { totalChecked: pendingOrders.length, totalSent: sentCount }
  } catch (error) {
    console.error("[EMAIL ACTIONS] Error running creative submission reminders trigger:", error)
    throw error
  }
}

/**
 * Dispatch prospect confirmation email when an inquiry is received.
 */
export async function sendProspectInquiryConfirmationEmail(inquiryId: string) {
  try {
    const inquiry = await db.campaignInquiry.findUnique({
      where: { id: inquiryId },
      include: { campaign: true },
    })

    if (!inquiry || !inquiry.email) {
      console.warn(`[EMAIL ACTIONS] CampaignInquiry or email not found for confirmation email: ${inquiryId}`)
      return
    }

    const mail = getProspectInquiryConfirmationTemplate({
      name: inquiry.name,
      businessName: inquiry.businessName,
      campaignName: inquiry.campaign.name,
    })

    await sendLifecycleEmailOnce({
      toEmail: inquiry.email,
      templateKey: "campaign_inquiry_prospect_confirmation",
      entityType: "campaign_inquiry",
      entityId: inquiry.id,
      subject: mail.subject,
      html: mail.html,
    })
  } catch (error) {
    console.error(`[EMAIL ACTIONS] Failed to send prospect confirmation email for inquiry ${inquiryId}:`, error)
  }
}

/**
 * Dispatch admin notification email when a new inquiry is created.
 */
export async function sendAdminInquiryNotificationEmail(inquiryId: string) {
  try {
    const inquiry = await db.campaignInquiry.findUnique({
      where: { id: inquiryId },
      include: { campaign: true },
    })

    if (!inquiry) {
      console.warn(`[EMAIL ACTIONS] CampaignInquiry not found for admin notification email: ${inquiryId}`)
      return
    }

    const appUrl = getAppUrl()
    const adminInquiriesUrl = `${appUrl}/admin/inquiries`
    const adminEmail = process.env.ADMIN_INQUIRY_EMAIL || process.env.ADMIN_EMAIL || "admin@localspotmailers.com"

    const mail = getAdminInquiryNotificationTemplate({
      name: inquiry.name,
      businessName: inquiry.businessName,
      email: inquiry.email,
      phone: inquiry.phone,
      campaignName: inquiry.campaign.name,
      businessCategory: inquiry.businessCategory,
      websiteOrFacebook: inquiry.websiteOrFacebook,
      interestType: inquiry.interestType,
      preferredContactMethod: inquiry.preferredContactMethod,
      message: inquiry.message,
      source: inquiry.source,
      adminInquiriesUrl,
    })

    await sendLifecycleEmailOnce({
      toEmail: adminEmail,
      templateKey: "campaign_inquiry_admin_alert",
      entityType: "campaign_inquiry",
      entityId: inquiry.id,
      subject: mail.subject,
      html: mail.html,
    })
  } catch (error) {
    console.error(`[EMAIL ACTIONS] Failed to send admin notification email for inquiry ${inquiryId}:`, error)
  }
}
