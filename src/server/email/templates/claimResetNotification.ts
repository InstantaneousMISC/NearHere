import { escapeHtml } from "../escapeHtml"

export function getClaimResetNotificationTemplate(params: {
  businessName: string
  reason: string
  claimLink: string
}) {
  const subject = `Urgent: Your NearHere Account Claim Status Has Been Reset`
  const businessName = escapeHtml(params.businessName)
  const reason = escapeHtml(params.reason)
  const claimLink = escapeHtml(params.claimLink)
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Account Claim Status Reset</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #b91c1c; color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .alert-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; font-size: 14px; color: #991b1b; }
        .cta-button { display: inline-block; background-color: #ffffff; color: #b91c1c; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-align: center; margin: 24px 0; border: 2px solid #b91c1c; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>NearHere Onboarding</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>An administrator has reset the ownership state for your business profile, <strong>${businessName}</strong>.</p>
          
          <div class="alert-box">
            <strong>Reason for Reset:</strong><br/>
            ${reason}
          </div>

          <p><strong>What does this mean?</strong></p>
          <p>Your previous user association has been cleared. To regain access to your business profile, dashboard, and QR code tracking features, you must re-claim your account using the link below:</p>

          <div style="text-align: center;">
            <a href="${claimLink}" class="cta-button">Re-Claim Your Account</a>
          </div>

          <p>If you did not request this change, or believe this reset is an error, please reply immediately to this email to contact our support team.</p>
        </div>
        <div class="footer">
          <p>This is an automated administrative notification. Reply to this email if you need support.</p>
          <p>&copy; ${new Date().getFullYear()} NearHere. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `
  return { subject, html }
}
