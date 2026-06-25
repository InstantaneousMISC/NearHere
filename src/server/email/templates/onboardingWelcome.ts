import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getOnboardingWelcomeTemplate(params: {
  businessName: string
  merchantDashboardUrl: string
}) {
  const businessName = escapeHtml(params.businessName)
  const merchantDashboardUrl = escapeHtml(params.merchantDashboardUrl)

  const subject = `Welcome to NearHere! Your business profile is ready`

  const contentHtml = `
    <h2>Welcome to NearHere!</h2>
    <p>Hi there,</p>
    <p>Congratulations! The setup wizard for <strong>${businessName}</strong> is complete, and your digital business profile landing page is configured.</p>

    <p>You can access your merchant dashboard at any time to manage links, configure socials, and monitor dynamic visitor traffic once mailing begins.</p>

    <div class="cta-container">
      <a href="${merchantDashboardUrl}" class="btn" style="background-color: #D13F1F; box-shadow: 4px 4px 0px #211D1C;">Go to Merchant Dashboard</a>
    </div>

    <p><em>Please note: This confirms your digital profile setup is complete. Postcard creative review and layout approval for the physical mailer are managed separately by the admin team. You can check the current creative review status directly on your dashboard checklist.</em></p>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${merchantDashboardUrl}">${merchantDashboardUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Welcome to NearHere",
    preheader: `Your digital profile and merchant portal dashboard are ready for ${params.businessName}.`,
    contentHtml,
  })

  return { subject, html }
}
