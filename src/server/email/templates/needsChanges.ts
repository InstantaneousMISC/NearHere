import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getNeedsChangesTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  notes: string
  creativeSubmissionUrl: string
}) {
  const subject = `Action Required: Revisions needed for ${params.businessName}'s ad creative`
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const notes = escapeHtml(params.notes)
  const creativeSubmissionUrl = escapeHtml(params.creativeSubmissionUrl)

  const contentHtml = `
    <h2>Revisions Requested for Your Ad</h2>
    <p>Hi there,</p>
    <p>Our design team has reviewed your submitted ad layout details and assets for the <strong>${categoryName}</strong> spot on the <strong>${campaignName}</strong> campaign.</p>
    <p>We need a few quick changes before we can finalize your ad layout and lock it for print production.</p>

    <div class="notes-box">
      <div class="notes-title">Feedback from Design Team:</div>
      <div class="notes-content">${notes}</div>
    </div>

    <p>Please click the button below to update your submission and upload any requested assets or correct copy errors:</p>

    <div class="cta-container">
      <a href="${creativeSubmissionUrl}" class="btn" style="background-color: #D13F1F; box-shadow: 4px 4px 0px #211D1C;">Update Ad Creative</a>
    </div>

    <div class="details-card">
      <div class="details-title">Postcard Placement Details</div>
      <div class="details-row">
        <span class="details-label">Business Name:</span>
        <span class="details-value">${businessName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Postcard Campaign:</span>
        <span class="details-value">${campaignName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Industry Spot:</span>
        <span class="details-value">${categoryName}</span>
      </div>
    </div>

    <p>Once you save and submit the updated details, our design team will rebuild your ad layout and notify you of the status.</p>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${creativeSubmissionUrl}">${creativeSubmissionUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Ad Revisions Requested",
    preheader: `Our design team requested changes for your ad spot on ${params.campaignName}: ${params.notes.substring(0, 50)}...`,
    contentHtml,
  })

  return { subject, html }
}
