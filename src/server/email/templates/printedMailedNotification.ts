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
    ? `📬 Your postcards for ${params.businessName} have been MAILED!` 
    : `🖨️ Your postcards for ${params.businessName} have been PRINTED!`

  const headline = isMailed 
    ? "Postcards Mailed to Residents!" 
    : "Postcards Successfully Printed!"

  const introText = isMailed
    ? `Great news! The postcard campaign featuring your business, <strong>${businessName}</strong>, has been mailed out. Postcards are landing directly in local mailboxes across the area right now.`
    : `Great news! The postcard campaign featuring your business, <strong>${businessName}</strong>, has been successfully printed. We are sorting them for shipment, and they will be mailed out to local residents shortly.`

  const whatHappensNext = isMailed
    ? `Since the postcards are now in mailboxes, you should expect to see scan activity shortly. When residents scan your ad, they will land on your custom digital profile page. You can track all live views, phone clicks, and scans in real time.`
    : `Once the postcards are delivered to local mailboxes, scan tracking will go live. Your custom digital landing page is fully active and ready to greet visitors as soon as they scan their postcard.`

  const contentHtml = `
    <h2>${headline}</h2>
    <p>Hi there,</p>
    <p>${introText}</p>

    <div class="details-card">
      <div class="details-title">Postcard Status Details</div>
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
        <span class="details-label">Current Status:</span>
        <span class="details-value" style="color: ${isMailed ? "#8b5cf6" : "#6366f1"};">${isMailed ? "Mailed to Residents" : "Printed (In Transit)"}</span>
      </div>
    </div>

    <p><strong>Tracking Scan Analytics:</strong></p>
    <p>${whatHappensNext}</p>
    <p>Log in to your merchant dashboard to see real-time graphs and outbound clicks:</p>

    <div class="cta-container">
      <a href="${merchantDashboardUrl}" class="btn" style="background-color: #D13F1F;">Track Live Scans</a>
    </div>

    <div class="link-alt">
      If the button above does not work, copy and paste this URL into your browser:<br/>
      <a href="${merchantDashboardUrl}">${merchantDashboardUrl}</a>
    </div>
  `

  const html = getNearHereEmailWrapper({
    title: isMailed ? "Postcards Mailed!" : "Postcards Printed!",
    preheader: isMailed 
      ? `Your ad spot on ${params.campaignName} has been mailed to local homes.` 
      : `Your ad spot on ${params.campaignName} is printed and preparing for mailing.`,
    contentHtml,
  })

  return { subject, html }
}
