import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getClaimSuccessTemplate(params: {
  businessName: string
  merchantDashboardUrl: string
}) {
  const businessName = escapeHtml(params.businessName)
  const merchantDashboardUrl = escapeHtml(params.merchantDashboardUrl)

  const subject = `Confirmed: You have claimed the NearHere profile for ${params.businessName}`

  const contentHtml = `
    <h2>Business Profile Claimed</h2>
    <p>Hi there,</p>
    <p>This email confirms that you have successfully claimed the business profile for <strong>${businessName}</strong> on NearHere.</p>
    <p>Ownership is now associated with your registered email, and you have full access to edit profile fields, configure action links, and review postcard creative submissions.</p>

    <div class="cta-container">
      <a href="${merchantDashboardUrl}" class="btn" style="background-color: #D13F1F; box-shadow: 4px 4px 0px #211D1C;">Access Merchant Portal</a>
    </div>

    <div style="background-color: #FBEBE8; border: 1px solid #E85D44; padding: 16px; margin: 24px 0; font-family: monospace; font-size: 11px; color: #801B0B;">
      <strong>⚠️ SECURITY NOTICE:</strong> If you did not initiate this claim or believe this association was made in error, please contact NearHere support immediately at support@localspotmailers.com so we can secure your account.
    </div>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${merchantDashboardUrl}">${merchantDashboardUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Profile Claimed Successfully",
    preheader: `Ownership confirmation for ${params.businessName}'s business page.`,
    contentHtml,
  })

  return { subject, html }
}
