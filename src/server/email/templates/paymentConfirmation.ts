import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getPaymentConfirmationTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  amount: number // in cents
}) {
  const priceDisplay = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(params.amount / 100)

  const subject = `Receipt for your NearHere Postcard campaign in ${params.campaignName}`
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)

  const contentHtml = `
    <h2>Payment Confirmed!</h2>
    <p>Hi there,</p>
    <p>Congratulations! You have successfully purchased and locked the exclusive <strong>${categoryName}</strong> spot on the upcoming <strong>${campaignName}</strong> postcard campaign.</p>
    <p>No other business in your industry will be featured on this mailing. You have total exclusivity for this campaign.</p>
    
    <div class="details-card">
      <div class="details-title">Order Summary</div>
      <div class="details-row">
        <span class="details-label">Business Name:</span>
        <span class="details-value">${businessName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Postcard Campaign:</span>
        <span class="details-value">${campaignName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Exclusive Category:</span>
        <span class="details-value">${categoryName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Amount Paid:</span>
        <span class="details-value">${priceDisplay}</span>
      </div>
    </div>

    <p><strong>What happens next?</strong></p>
    <p>We are setting up your digital business landing page and custom tracking QR codes. Shortly, you will receive two follow-up emails:</p>
    <ol style="color: #4A4542; padding-left: 20px; margin-bottom: 24px;">
      <li style="margin-bottom: 8px;"><strong>Claim your Profile:</strong> Create your merchant login and customize your landing page links (booking, socials, contact).</li>
      <li><strong>Submit Ad details:</strong> Provide your logo, headline copy, and exclusive promotion for the printed postcard.</li>
    </ol>
    
    <p>We are excited to help you grow your local customer base!</p>
  `

  const html = getNearHereEmailWrapper({
    title: "Order Paid & Confirmed",
    preheader: `Receipt for your NearHere Postcard campaign: ${params.categoryName} is locked.`,
    contentHtml,
  })

  return { subject, html }
}
