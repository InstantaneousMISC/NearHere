import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getApprovedForPrintTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  merchantDashboardUrl: string
}) {
  const subject = `Your ad creative for ${params.businessName} has been approved!`
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const merchantDashboardUrl = escapeHtml(params.merchantDashboardUrl)

  const contentHtml = `
    <h2>Your Postcard Ad is Approved!</h2>
    <p>Hi there,</p>
    <p>Great news! Our design team has finalized and approved your postcard ad layout for the <strong>${categoryName}</strong> spot on the <strong>${campaignName}</strong> campaign.</p>
    <p>Your ad design is now locked for print production. No further action is required from your side.</p>

    <div class="details-card">
      <div class="details-title">Approved Placement Details</div>
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

    <p><strong>What happens next?</strong></p>
    <p>We are aggregating all approved ads and compiling the high-resolution printing files. Your postcards will be printed and mailed to local residents shortly.</p>
    <p>In the meantime, your digital business profile page and tracking QR codes are fully active. You can log in to your merchant dashboard to customize your landing page and preview scan graphs:</p>

    <div class="cta-container">
      <a href="${merchantDashboardUrl}" class="btn">View Merchant Dashboard</a>
    </div>

    <p>We will notify you immediately once the postcards are printed and shipped out to local households.</p>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${merchantDashboardUrl}">${merchantDashboardUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Ad Approved for Printing",
    preheader: `Your ad layout for ${params.businessName} is approved and locked.`,
    contentHtml,
  })

  return { subject, html }
}
