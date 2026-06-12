import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getSubmitPostcardCreativeTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  creativeSubmissionUrl: string
}) {
  const subject = `Submit your NearHere creative details for ${params.businessName}`
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const creativeSubmissionUrl = escapeHtml(params.creativeSubmissionUrl)

  const contentHtml = `
    <h2>Submit Your Creative Details</h2>
    <p>Hi there,</p>
    <p>NearHere is ready to prepare the <strong>${businessName}</strong> placement for the <strong>${campaignName}</strong> campaign.</p>
    <p>Use the secure form to provide your logo, business description, offer, phone number, website, and preferred call to action.</p>

    <div class="cta-container">
      <a href="${creativeSubmissionUrl}" class="btn">Submit Creative Details</a>
    </div>

    <div class="details-card">
      <div class="details-title">Campaign Placement</div>
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
    </div>

    <p><strong>Submission guidance:</strong></p>
    <ul style="color: #4A4542; padding-left: 20px; margin-bottom: 24px;">
      <li style="margin-bottom: 8px;">Use a short, plain-language description of your services.</li>
      <li style="margin-bottom: 8px;">Provide a specific, accurate offer and include important restrictions.</li>
      <li>Upload a clear logo. NearHere creates the unique QR code for your placement.</li>
    </ul>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${creativeSubmissionUrl}">${creativeSubmissionUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Creative Details Needed",
    preheader: `Submit the placement details for ${params.businessName} in ${params.campaignName}.`,
    contentHtml,
  })

  return { subject, html }
}
