import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getApprovedForPrintTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  merchantDashboardUrl: string
}) {
  const subject = `Your NearHere placement for ${params.businessName} is approved for print`
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const merchantDashboardUrl = escapeHtml(params.merchantDashboardUrl)

  const contentHtml = `
    <h2>Your Placement Is Approved for Print</h2>
    <p>Hi there,</p>
    <p>The creative details for <strong>${businessName}</strong> have been approved for the <strong>${campaignName}</strong> campaign.</p>
    <p>The placement is now locked for print preparation. No further action is required unless the NearHere team contacts you.</p>

    <div class="details-card">
      <div class="details-title">Approved Placement</div>
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

    <p>NearHere will assemble the approved campaign artwork and coordinate the printing and mailing stages. Your business page is available for review in the dashboard.</p>

    <div class="cta-container">
      <a href="${merchantDashboardUrl}" class="btn">View Advertiser Dashboard</a>
    </div>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${merchantDashboardUrl}">${merchantDashboardUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Approved for Print",
    preheader: `The campaign placement for ${params.businessName} has been approved.`,
    contentHtml,
  })

  return { subject, html }
}
