import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getInvoiceSentTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  amount: number // in cents
  paymentLink: string
}) {
  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const amountFormatted = (params.amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })

  const subject = `Invoice for your ad space reservation in ${params.campaignName}`

  const contentHtml = `
    <h2>Ad Space Invoice & Reservation</h2>
    <p>Hi there,</p>
    <p>An invoice has been generated for your exclusive ad placement <strong>${categoryName}</strong> in the upcoming <strong>${campaignName}</strong> postcard campaign. Your spot is currently being held for you for <strong>24 hours</strong>. After 24 hours, the hold will expire and we cannot guarantee your placement.</p>

    <div class="details-card">
      <div class="details-title">Invoice Details</div>
      <div class="details-row">
        <span class="details-label">Business:</span>
        <span class="details-value">${businessName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Campaign:</span>
        <span class="details-value">${campaignName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Placement Category:</span>
        <span class="details-value">${categoryName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Amount Due:</span>
        <span class="details-value">${amountFormatted}</span>
      </div>
    </div>

    <p>To finalize your booking and secure this category, please pay the invoice within 24 hours by clicking the button below:</p>

    <div class="cta-container">
      <a href="${params.paymentLink}" class="btn" style="color: #ffffff !important;">Pay Invoice Now</a>
    </div>

    <div class="link-alt">
      Or copy and paste this link in your browser:<br>
      <a href="${params.paymentLink}">${params.paymentLink}</a>
    </div>

    <p>Once paid, you will receive instructions on how to submit your creative design copy, logo, and preferred outbound link.</p>

    <p>Thank you for advertising with NearHere!</p>
  `

  const html = getNearHereEmailWrapper({
    title: "Invoice & Reservation",
    preheader: `Invoice for your ad space reservation in ${params.campaignName}.`,
    contentHtml,
  })

  return { subject, html }
}
