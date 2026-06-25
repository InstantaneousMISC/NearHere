import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getCreativeReminderTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  creativeSubmissionUrl: string
}) {
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const creativeSubmissionUrl = escapeHtml(params.creativeSubmissionUrl)

  const subject = `Action Required: Submit postcard creative for ${params.businessName}`

  const contentHtml = `
    <h2>Postcard Creative Details Needed</h2>
    <p>Hi there,</p>
    <p>This is a friendly reminder that we are missing the printed advertisement details for <strong>${businessName}</strong> in the upcoming <strong>${campaignName}</strong> mailer campaign.</p>
    <p>To avoid delays in postcard compilation and printing, please submit your deal offer, headline, contact number, and logo as soon as possible.</p>

    <div class="cta-container">
      <a href="${creativeSubmissionUrl}" class="btn" style="background-color: #D13F1F; box-shadow: 4px 4px 0px #211D1C;">Submit Ad Details Now</a>
    </div>

    <div class="details-card">
      <div class="details-title">Campaign Spot Details</div>
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

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${creativeSubmissionUrl}">${creativeSubmissionUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Ad Details Needed",
    preheader: `Submit postcard creative details for ${params.businessName}'s placement.`,
    contentHtml,
  })

  return { subject, html }
}
