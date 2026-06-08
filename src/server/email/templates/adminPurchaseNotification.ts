export function getAdminPurchaseNotificationTemplate(params: {
  businessName: string
  contactName: string
  email: string
  phone: string
  campaignName: string
  categoryName: string
  amount: number // in cents
  adminOrderUrl: string
}) {
  const priceDisplay = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(params.amount / 100)

  const subject = `🚨 NEW SALE: ${params.businessName} - ${params.categoryName} for ${params.campaignName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Purchase Notification</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ef4444; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .details-box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
        .details-row:last-child { margin-bottom: 0; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-weight: bold; }
        .cta-button { display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-align: center; margin: 24px 0; }
        .footer { background-color: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Order Alert</h1>
        </div>
        <div class="content">
          <p>An advertiser has purchased a spot on a campaign!</p>
          
          <div class="details-box">
            <div class="details-row"><span>Campaign:</span><span>${params.campaignName}</span></div>
            <div class="details-row"><span>Category:</span><span>${params.categoryName}</span></div>
            <div class="details-row"><span>Business Name:</span><span>${params.businessName}</span></div>
            <div class="details-row"><span>Contact Name:</span><span>${params.contactName}</span></div>
            <div class="details-row"><span>Email:</span><span>${params.email}</span></div>
            <div class="details-row"><span>Phone:</span><span>${params.phone}</span></div>
            <div class="details-row"><span>Amount Paid:</span><span>${priceDisplay}</span></div>
          </div>

          <div style="text-align: center;">
            <a href="${params.adminOrderUrl}" class="cta-button">View Order in Admin Dashboard</a>
          </div>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} LocalSpot Mailers. System Generated.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return { subject, html }
}
