import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getPrintedMailedNotificationTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  status: "PRINTED" | "MAILED"
  merchantDashboardUrl: string
}) {
  const isMailed = params.status === "MAILED"
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const merchantDashboardUrl = escapeHtml(params.merchantDashboardUrl)

  const subject = isMailed
    ? `The NearHere campaign featuring ${params.businessName} has been mailed`
    : `The NearHere campaign featuring ${params.businessName} has been printed`

  const contentHtml = `
    <h2>${isMailed ? "Campaign Mailed" : "Campaign Printed"}</h2>
    <p>Hi there,</p>
    <p>The <strong>${campaignName}</strong> postcard featuring <strong>${businessName}</strong> has been ${isMailed ? "mailed to the campaign area" : "printed and is being prepared for mailing"}.</p>

    <div class="details-card">
      <div class="details-title">Campaign Status</div>
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
        <span class="details-label">Current Status:</span>
        <span class="details-value">${isMailed ? "Mailed" : "Printed"}</span>
      </div>
    </div>

    <p>${isMailed ? "Recorded QR scans and page activity may begin appearing as residents receive and respond to the postcard." : "Your business page and QR destination are ready for the mailing stage."}</p>
    <p>The dashboard reports recorded digital activity. Phone calls, direct website visits, postcard mentions, and offline redemptions may not be fully attributable.</p>

    <div class="cta-container">
      <a href="${merchantDashboardUrl}" class="btn" style="background-color: #D13F1F;">View Campaign Dashboard</a>
    </div>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${merchantDashboardUrl}">${merchantDashboardUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: isMailed ? "Campaign Mailed" : "Campaign Printed",
    preheader: `Status update for ${params.businessName} in ${params.campaignName}.`,
    contentHtml,
  })

  return { subject, html }
}
