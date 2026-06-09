import { escapeHtml } from "../escapeHtml"

export function getCreativeSubmissionReceivedTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  creativeSubmissionUrl: string
}) {
  const subject = `Ad details received for ${params.businessName}!`

  const businessName = escapeHtml(params.businessName)
  const campaignName = escapeHtml(params.campaignName)
  const categoryName = escapeHtml(params.categoryName)
  const creativeSubmissionUrl = escapeHtml(params.creativeSubmissionUrl)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Creative Submission Received</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #1e3a5f; color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .details-box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
        .details-row:last-child { margin-bottom: 0; }
        .cta-button { display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-align: center; margin: 24px 0; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>LocalSpot Mailers</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>Thank you! We have successfully received your creative details and business assets for the <strong>${categoryName}</strong> spot on <strong>${campaignName}</strong>.</p>
          
          <div class="details-box">
            <div class="details-row"><span>Business Name:</span><span>${businessName}</span></div>
            <div class="details-row"><span>Campaign:</span><span>${campaignName}</span></div>
            <div class="details-row"><span>Category:</span><span>${categoryName}</span></div>
          </div>

          <p>Our design team is reviewing your details to assemble the card layout. If we need any modifications or higher-resolution files, we will reach out directly. Otherwise, you can check the status or edit your details using the button below:</p>
          
          <div style="text-align: center;">
            <a href="${creativeSubmissionUrl}" class="cta-button">View/Edit Submission</a>
          </div>
        </div>
        <div class="footer">
          <p>If you have any questions, reply directly to this email.</p>
          <p>&copy; ${new Date().getFullYear()} LocalSpot Mailers. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}
