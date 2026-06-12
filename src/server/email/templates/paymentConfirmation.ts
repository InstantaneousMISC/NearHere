import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getPaymentConfirmationTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  amount: number
}) {
  const priceDisplay = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(params.amount / 100)

  const subject = `Your NearHere campaign placement is reserved for ${params.campaignName}`
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)

  const contentHtml = `
    <h2>Campaign Placement Reserved</h2>
    <p>Hi there,</p>
    <p>Payment is complete and the <strong>${categoryName}</strong> placement in the <strong>${campaignName}</strong> campaign is reserved for <strong>${businessName}</strong>.</p>

    <div class="details-card">
      <div class="details-title">Payment Summary</div>
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
        <span class="details-label">Amount Paid:</span>
        <span class="details-value">${priceDisplay}</span>
      </div>
    </div>

    <p><strong>What happens next?</strong></p>
    <ol style="color: #4A4542; padding-left: 20px; margin-bottom: 24px;">
      <li style="margin-bottom: 8px;"><strong>Claim your business profile:</strong> Add your description, contact links, and business page details.</li>
      <li><strong>Submit creative details:</strong> Provide your logo, offer, description, and preferred call to action.</li>
    </ol>
    <p>NearHere will coordinate the placement layout, print preparation, and mailing. Your unique QR destination will support basic scan and page activity reporting.</p>
    <p style="font-size: 12px; color: #77706A;">Direct mail results vary. NearHere does not guarantee leads, calls, sales, revenue, or return on investment.</p>
  `

  const html = getNearHereEmailWrapper({
    title: "Campaign Placement Reserved",
    preheader: `Payment received for ${params.businessName} in ${params.campaignName}.`,
    contentHtml,
  })

  return { subject, html }
}
