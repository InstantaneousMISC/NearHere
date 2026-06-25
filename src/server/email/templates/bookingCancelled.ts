import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getBookingCancelledTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  amount: number // in cents
  reason?: string | null
}) {
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const reason = params.reason ? escapeHtml(params.reason) : null
  const amountFormatted = (params.amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })

  const subject = `Update: Your spot reservation for ${params.businessName} has been cancelled`

  const contentHtml = `
    <h2>Spot Reservation Cancelled</h2>
    <p>Hi there,</p>
    <p>This email is to notify you that your ad spot reservation for <strong>${businessName}</strong> in the <strong>${campaignName}</strong> campaign has been cancelled.</p>

    <div class="details-card">
      <div class="details-title">Cancellation Details</div>
      <div class="details-row">
        <span class="details-label">Business:</span>
        <span class="details-value">${businessName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Campaign:</span>
        <span class="details-value">${campaignName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Business Category:</span>
        <span class="details-value">${categoryName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Amount:</span>
        <span class="details-value">${amountFormatted}</span>
      </div>
      ${
        reason
          ? `
      <div class="details-row">
        <span class="details-label">Reason:</span>
        <span class="details-value">${reason}</span>
      </div>
      `
          : ""
      }
    </div>

    <p>Your reserved spot has been released, and the associated QR code redirection is no longer active for this campaign.</p>

    <p>If you have any questions regarding this cancellation or refund, please feel free to reach out to our support team.</p>
  `

  const html = getNearHereEmailWrapper({
    title: "Reservation Cancelled",
    preheader: `Update regarding your ad spot in ${params.campaignName}.`,
    contentHtml,
  })

  return { subject, html }
}
