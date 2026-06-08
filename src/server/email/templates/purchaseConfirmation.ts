export function getPurchaseConfirmationTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  amount: number // in cents
  creativeSubmissionUrl: string
}) {
  const priceDisplay = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(params.amount / 100)

  const subject = `Your category "${params.categoryName}" is locked for ${params.campaignName}!`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Purchase Confirmation</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #1e3a5f; color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .details-box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
        .details-row:last-child { margin-bottom: 0; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-weight: bold; }
        .cta-button { display: inline-block; background-color: #f59e0b; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-align: center; margin: 24px 0; transition: background-color 0.2s; }
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
          <p>Congratulations! You have successfully locked the exclusive <strong>${params.categoryName}</strong> spot on the upcoming <strong>${params.campaignName}</strong> campaign. No other business in your industry will be allowed on this postcard.</p>
          
          <div class="details-box">
            <div class="details-row"><span>Business:</span><span>${params.businessName}</span></div>
            <div class="details-row"><span>Campaign:</span><span>${params.campaignName}</span></div>
            <div class="details-row"><span>Category:</span><span>${params.categoryName}</span></div>
            <div class="details-row"><span>Amount Paid:</span><span>${priceDisplay}</span></div>
          </div>

          <h3>Next Step: Submit your ad creative</h3>
          <p>To prepare your spot for the postcard, please click the button below to submit your business details, logo, headline, offer, and contact information. Our design team will compile the layout and verify the design before printing.</p>
          
          <div style="text-align: center;">
            <a href="${params.creativeSubmissionUrl}" class="cta-button">Submit Ad Details</a>
          </div>
          
          <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this link into your browser:<br>
          <a href="${params.creativeSubmissionUrl}" style="color: #2563eb;">${params.creativeSubmissionUrl}</a></p>
        </div>
        <div class="footer">
          <p>Thank you for choosing LocalSpot Mailers. If you have any questions, reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} LocalSpot Mailers. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}
