import { escapeHtml } from "../escapeHtml"

export function getAdminInquiryNotificationTemplate(params: {
  name?: string | null
  businessName: string
  email?: string | null
  phone?: string | null
  campaignName: string
  businessCategory?: string | null
  websiteOrFacebook?: string | null
  interestType?: string | null
  preferredContactMethod?: string | null
  message?: string | null
  source?: string | null
  adminInquiriesUrl: string
}) {
  const subject = `🚨 NEW INQUIRY: ${params.businessName} for ${params.campaignName}`

  const name = params.name ? escapeHtml(params.name) : "—"
  const businessName = escapeHtml(params.businessName)
  const email = params.email ? escapeHtml(params.email) : "—"
  const phone = params.phone ? escapeHtml(params.phone) : "—"
  const campaignName = escapeHtml(params.campaignName)
  const businessCategory = params.businessCategory ? escapeHtml(params.businessCategory) : "—"
  const websiteOrFacebook = params.websiteOrFacebook ? escapeHtml(params.websiteOrFacebook) : "—"
  const interestType = params.interestType ? escapeHtml(params.interestType) : "—"
  const preferredContactMethod = params.preferredContactMethod ? escapeHtml(params.preferredContactMethod) : "—"
  const message = params.message ? escapeHtml(params.message) : "—"
  const source = params.source ? escapeHtml(params.source) : "WEBSITE"
  const adminInquiriesUrl = escapeHtml(params.adminInquiriesUrl)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Inquiry Notification</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #fbbf24; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .details-box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
        .details-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
        .details-label { font-weight: 600; color: #475569; }
        .details-value { text-align: right; color: #0f172a; max-width: 300px; word-break: break-all; }
        .message-box { background-color: #fafaf9; border-left: 4px solid #e2e8f0; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #44403c; white-space: pre-wrap; }
        .cta-button { display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-align: center; margin: 24px auto; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Lead / Inquiry Alert</h1>
        </div>
        <div class="content">
          <p>An advertiser has submitted a contact inquiry for a campaign!</p>
          
          <div class="details-box">
            <div class="details-row"><span class="details-label">Campaign:</span><span class="details-value">${campaignName}</span></div>
            <div class="details-row"><span class="details-label">Business Name:</span><span class="details-value">${businessName}</span></div>
            <div class="details-row"><span class="details-label">Contact Name:</span><span class="details-value">${name}</span></div>
            <div class="details-row"><span class="details-label">Email:</span><span class="details-value">${email}</span></div>
            <div class="details-row"><span class="details-label">Phone:</span><span class="details-value">${phone}</span></div>
            <div class="details-row"><span class="details-label">Category Interest:</span><span class="details-value">${businessCategory}</span></div>
            <div class="details-row"><span class="details-label">Website / FB:</span><span class="details-value">${websiteOrFacebook}</span></div>
            <div class="details-row"><span class="details-label">Interest Type:</span><span class="details-value">${interestType}</span></div>
            <div class="details-row"><span class="details-label">Preferred Contact:</span><span class="details-value">${preferredContactMethod}</span></div>
            <div class="details-row"><span class="details-label">Lead Source:</span><span class="details-value">${source}</span></div>
          </div>

          <h3 style="font-size: 14px; margin-top: 24px; margin-bottom: 8px;">Prospect Message:</h3>
          <div class="message-box">${message}</div>

          <div style="text-align: center;">
            <a href="${adminInquiriesUrl}" class="cta-button">View Inquiries in Admin Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} NearHere. System Generated.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}
