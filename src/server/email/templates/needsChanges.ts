import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getNeedsChangesTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  notes: string
  creativeSubmissionUrl: string
}) {
  const subject = `Revisions needed for ${params.businessName}'s NearHere placement`
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const notes = escapeHtml(params.notes)
  const creativeSubmissionUrl = escapeHtml(params.creativeSubmissionUrl)

  const contentHtml = `
    <h2>Creative Revisions Requested</h2>
    <p>Hi there,</p>
    <p>The NearHere team reviewed the creative details for <strong>${businessName}</strong> in the <strong>${campaignName}</strong> campaign. A few updates are needed before the placement can be approved for print.</p>

    <div class="notes-box">
      <div class="notes-title">Review Notes</div>
      <div class="notes-content">${notes}</div>
    </div>

    <div class="cta-container">
      <a href="${creativeSubmissionUrl}" class="btn" style="background-color: #D13F1F; box-shadow: 4px 4px 0px #211D1C;">Update Creative Details</a>
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

    <p>After you resubmit, the updated creative details will return to the review queue.</p>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${creativeSubmissionUrl}">${creativeSubmissionUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Creative Revisions Requested",
    preheader: `Review notes are available for ${params.businessName} in ${params.campaignName}.`,
    contentHtml,
  })

  return { subject, html }
}
