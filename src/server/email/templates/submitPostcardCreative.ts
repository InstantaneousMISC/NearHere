import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getSubmitPostcardCreativeTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  creativeSubmissionUrl: string
}) {
  const subject = `Submit your postcard ad details for ${params.businessName}`
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const creativeSubmissionUrl = escapeHtml(params.creativeSubmissionUrl)

  const contentHtml = `
    <h2>Submit Postcard Ad Layout Details</h2>
    <p>Hi there,</p>
    <p>It's time to build your printed postcard advertisement! We need your copy, logo, and promotion deal so our design team can prepare your ad block layout on the upcoming <strong>${campaignName}</strong> mailer.</p>
    <p>Please click the button below to submit your ad details, headline, promotional offer, and contact details:</p>
    
    <div class="cta-container">
      <a href="${creativeSubmissionUrl}" class="btn">Submit Ad Details</a>
    </div>

    <div class="details-card">
      <div class="details-title">Postcard Placement Info</div>
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

    <p><strong>Design Guidelines & Tips:</strong></p>
    <ul style="color: #4A4542; padding-left: 20px; margin-bottom: 24px;">
      <li style="margin-bottom: 8px;"><strong>Use a clear, compelling offer:</strong> Coupon offers (e.g. "$50 OFF your first visit" or "15% off standard plumbing services") get the highest local scan rates.</li>
      <li style="margin-bottom: 8px;"><strong>Logo format:</strong> Upload a clear, high-resolution logo (transparent PNG is preferred).</li>
      <li><strong>AI Assistant:</strong> If you need copywriting help, check the AI copywriting assistant option on the submission form!</li>
    </ul>

    <p>Please complete this step as soon as possible so we can meet our graphic design review and local printing deadlines.</p>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${creativeSubmissionUrl}">${creativeSubmissionUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: "Postcard Design Assets Awaiting",
    preheader: `Provide headline, logo, and offer details for your ad spot on ${params.campaignName}.`,
    contentHtml,
  })

  return { subject, html }
}
