import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getProspectInquiryConfirmationTemplate(params: {
  name?: string | null
  businessName: string
  campaignName: string
}) {
  const subject = `We received your inquiry for ${params.campaignName}`
  const contactName = params.name ? escapeHtml(params.name) : "there"
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)

  const contentHtml = `
    <h2>Inquiry Received</h2>
    <p>Hi ${contactName},</p>
    <p>Thanks for your interest in the <strong>${campaignName}</strong> campaign! We've received your request for more information.</p>
    <p>A NearHere representative will contact you shortly to answer any questions, help you select a spot, and guide you through the setup process manually.</p>

    <div class="details-card">
      <div class="details-title">Inquiry Details</div>
      <div class="details-row">
        <span class="details-label">Business:</span>
        <span class="details-value">${businessName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Campaign:</span>
        <span class="details-value">${campaignName}</span>
      </div>
    </div>

    <p>We look forward to helping you put your business in front of local homeowners.</p>
    <p>Best regards,<br/>The NearHere Team</p>
  `

  const html = getNearHereEmailWrapper({
    title: "Inquiry Received",
    preheader: `Thank you for contacting us regarding the ${params.campaignName} campaign.`,
    contentHtml,
  })

  return { subject, html }
}
