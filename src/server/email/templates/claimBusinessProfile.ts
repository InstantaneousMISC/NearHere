import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getClaimBusinessProfileTemplate(params: {
  businessName: string
  claimLink: string
}) {
  const subject = `Claim your NearHere digital business profile for ${params.businessName}`
  const businessName = escapeHtml(params.businessName)
  const claimLink = escapeHtml(params.claimLink)

  const contentHtml = `
    <h2>Claim Your Digital Profile Page</h2>
    <p>Hi there,</p>
    <p>As part of your NearHere postcard campaign purchase, we have set up a digital business profile and a print-ready tracking QR code for <strong>${businessName}</strong>.</p>
    <p>When local residents scan your spot on the printed postcard, they will be redirected to your profile page. Before the cards are mailed, you need to claim your profile and set up your page details.</p>
    
    <p>Please click the button below to securely claim your account and start the guided business setup wizard:</p>
    
    <div class="cta-container">
      <a href="${claimLink}" class="btn">Claim Your Profile</a>
    </div>

    <p><strong>Inside your NearHere dashboard, you will be able to:</strong></p>
    <ul style="color: #4A4542; padding-left: 20px; margin-bottom: 24px;">
      <li style="margin-bottom: 8px;">Write your business tagline and profile description.</li>
      <li style="margin-bottom: 8px;">Upload high-res branding logos and showcase cover photos.</li>
      <li style="margin-bottom: 8px;">Add quick-action buttons (direct phone calls, business address directions).</li>
      <li style="margin-bottom: 8px;">Link your online booking forms, menus, website, and social pages.</li>
      <li>Monitor real-time scan analytics and outbound clicks once postcards mail.</li>
    </ul>

    <p><em>Security Notice: This claim link is secure and valid for 14 days. Please register using the same email address associated with your purchase.</em></p>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${claimLink}">${claimLink}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Claim Your NearHere Account",
    preheader: `Activate your digital dashboard and set up links for ${params.businessName}.`,
    contentHtml,
  })

  return { subject, html }
}
