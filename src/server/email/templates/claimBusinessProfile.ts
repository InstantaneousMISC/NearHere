import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getClaimBusinessProfileTemplate(params: {
  businessName: string
  claimLink: string
}) {
  const subject = `Verify and claim your NearHere business account for ${params.businessName}`
  const businessName = escapeHtml(params.businessName)
  const claimLink = escapeHtml(params.claimLink)

  const contentHtml = `
    <h2>Verify Your NearHere Business Account</h2>
    <p>Hi there,</p>
    <p>Your campaign reservation includes a dedicated business page and unique QR destination for <strong>${businessName}</strong>.</p>
    <p>Use this secure link to verify your account and claim the profile. After verification, we&apos;ll take you to your business dashboard for guided onboarding and business information updates.</p>

    <div class="cta-container">
      <a href="${claimLink}" class="btn">Verify &amp; Claim Account</a>
    </div>

    <p><strong>Inside your NearHere dashboard, you can:</strong></p>
    <ul style="color: #4A4542; padding-left: 20px; margin-bottom: 24px;">
      <li style="margin-bottom: 8px;">Add your business description, logo, and cover image.</li>
      <li style="margin-bottom: 8px;">Add phone, website, booking, map, and social links.</li>
      <li style="margin-bottom: 8px;">Review campaign setup and creative status.</li>
      <li>View recorded QR scans, page activity, and tracked outbound links after mailing.</li>
    </ul>

    <p><em>Security notice: This claim link is intended for the purchaser associated with this campaign reservation.</em></p>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${claimLink}">${claimLink}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Verify Your NearHere Account",
    preheader: `Verify your account to set up ${params.businessName}.`,
    contentHtml,
  })

  return { subject, html }
}
