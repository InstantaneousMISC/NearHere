import { getAdminPurchaseNotificationTemplate } from "./templates/adminPurchaseNotification"
import { getApprovedForPrintTemplate } from "./templates/approvedForPrint"
import { getClaimBusinessProfileTemplate } from "./templates/claimBusinessProfile"
import { getClaimResetNotificationTemplate } from "./templates/claimResetNotification"
import { getCreativeSubmissionReceivedTemplate } from "./templates/creativeSubmissionReceived"
import { getNeedsChangesTemplate } from "./templates/needsChanges"
import { getPaymentConfirmationTemplate } from "./templates/paymentConfirmation"
import { getPrintedMailedNotificationTemplate } from "./templates/printedMailedNotification"
import { getSubmitPostcardCreativeTemplate } from "./templates/submitPostcardCreative"
import { getBookingCancelledTemplate } from "./templates/bookingCancelled"
import { getOnboardingWelcomeTemplate } from "./templates/onboardingWelcome"
import { getClaimSuccessTemplate } from "./templates/claimSuccess"
import { getCreativeReminderTemplate } from "./templates/creativeReminder"

export const emailPreviewKeys = [
  "payment",
  "admin-purchase",
  "claim-business",
  "claim-reset",
  "submit-creative",
  "creative-received",
  "needs-changes",
  "approved",
  "printed",
  "mailed",
  "booking-cancelled",
  "onboarding-welcome",
  "claim-success",
  "creative-reminder",
] as const

export type EmailPreviewKey = (typeof emailPreviewKeys)[number]

export function getEmailPreview(
  template: EmailPreviewKey,
  appUrl = process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
) {
  const baseUrl = appUrl.replace(/\/$/, "")
  const businessName = "River City Plumbing & Heating"
  const campaignName = "Converse, TX Summer 2026"
  const categoryName = "Plumbing"
  const creativeSubmissionUrl = `${baseUrl}/submit-creative/preview-token`
  const claimLink = `${baseUrl}/business/claim/preview-token`
  const merchantDashboardUrl = `${baseUrl}/business/dashboard`

  switch (template) {
    case "payment":
      return getPaymentConfirmationTemplate({
        businessName,
        campaignName,
        categoryName,
        amount: 49900,
      })
    case "admin-purchase":
      return getAdminPurchaseNotificationTemplate({
        businessName,
        contactName: "Jordan Rivera",
        email: "jordan@example.com",
        phone: "(210) 555-0199",
        campaignName,
        categoryName,
        amount: 49900,
        adminOrderUrl: `${baseUrl}/admin/orders/preview-order`,
      })
    case "claim-business":
      return getClaimBusinessProfileTemplate({ businessName, claimLink })
    case "claim-reset":
      return getClaimResetNotificationTemplate({
        businessName,
        reason: "The original account was registered with the wrong email address.",
        claimLink,
      })
    case "submit-creative":
      return getSubmitPostcardCreativeTemplate({
        businessName,
        campaignName,
        categoryName,
        creativeSubmissionUrl,
      })
    case "creative-received":
      return getCreativeSubmissionReceivedTemplate({
        businessName,
        campaignName,
        categoryName,
        creativeSubmissionUrl,
      })
    case "needs-changes":
      return getNeedsChangesTemplate({
        businessName,
        campaignName,
        categoryName,
        notes: "Please upload a higher-resolution logo and confirm the offer expiration date.",
        creativeSubmissionUrl,
      })
    case "approved":
      return getApprovedForPrintTemplate({
        businessName,
        campaignName,
        categoryName,
        merchantDashboardUrl,
      })
    case "printed":
    case "mailed":
      return getPrintedMailedNotificationTemplate({
        businessName,
        campaignName,
        categoryName,
        status: template === "printed" ? "PRINTED" : "MAILED",
        merchantDashboardUrl,
      })
    case "booking-cancelled":
      return getBookingCancelledTemplate({
        businessName,
        campaignName,
        categoryName,
        amount: 49900,
        reason: "Requested by advertiser due to schedule conflict.",
      })
    case "onboarding-welcome":
      return getOnboardingWelcomeTemplate({
        businessName,
        merchantDashboardUrl,
      })
    case "claim-success":
      return getClaimSuccessTemplate({
        businessName,
        merchantDashboardUrl,
      })
    case "creative-reminder":
      return getCreativeReminderTemplate({
        businessName,
        campaignName,
        categoryName,
        creativeSubmissionUrl,
      })
  }
}

export function isEmailPreviewKey(value: string): value is EmailPreviewKey {
  return emailPreviewKeys.includes(value as EmailPreviewKey)
}
