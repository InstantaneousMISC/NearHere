import { ApprovalStatus } from "@prisma/client"

export function getCreativeApprovalStatusTemplate(params: {
  businessName: string
  campaignName: string
  categoryName: string
  status: ApprovalStatus
  notes?: string
  creativeSubmissionUrl: string
}) {
  const isApproved = params.status === "APPROVED"
  const subject = isApproved 
    ? `Your ad creative for ${params.businessName} has been APPROVED!`
    : `Changes needed for ${params.businessName}'s ad creative`

  const statusColor = isApproved ? "#10b981" : "#f59e0b"
  const statusLabel = isApproved ? "Approved" : "Needs Revision"

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Creative Status Update</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); border: 1px solid #e2e8f0; }
        .header { background-color: #1e3a5f; color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .content { padding: 32px 24px; line-height: 1.6; }
        .status-badge { display: inline-block; background-color: ${statusColor}; color: #ffffff; padding: 8px 16px; font-size: 14px; font-weight: 700; text-transform: uppercase; border-radius: 9999px; margin-bottom: 20px; }
        .details-box { background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; }
        .details-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
        .details-row:last-child { margin-bottom: 0; }
        .notes-box { background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; font-size: 14px; color: #78350f; }
        .cta-button { display: inline-block; background-color: #1e3a5f; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-align: center; margin: 24px 0; }
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
          <p>Our design team has reviewed your submitted ad creative assets for the <strong>${params.categoryName}</strong> spot on the <strong>${params.campaignName}</strong> campaign. Here is the status of your submission:</p>
          
          <div style="text-align: center;">
            <span class="status-badge">${statusLabel}</span>
          </div>

          ${!isApproved && params.notes ? `
            <div class="notes-box">
              <strong>Notes/Changes Requested:</strong><br/>
              ${params.notes}
            </div>
          ` : ""}

          ${isApproved && params.notes ? `
            <div class="notes-box" style="background-color: #f0fdf4; border-left-color: #10b981; color: #14532d;">
              <strong>Design Team Notes:</strong><br/>
              ${params.notes}
            </div>
          ` : ""}

          <div class="details-box">
            <div class="details-row"><span>Business Name:</span><span>${params.businessName}</span></div>
            <div class="details-row"><span>Campaign:</span><span>${params.campaignName}</span></div>
            <div class="details-row"><span>Category:</span><span>${params.categoryName}</span></div>
          </div>

          ${isApproved ? `
            <p>Congratulations! Your ad layout is approved and is now locked in for printing and mailing. No further action is required from your side. We will notify you once the cards are printed and mailed.</p>
          ` : `
            <p>Please click the button below to view your submission and make the requested edits as soon as possible so we can proceed with design finalization:</p>
            <div style="text-align: center;">
              <a href="${params.creativeSubmissionUrl}" class="cta-button" style="background-color: #f59e0b;">Update Ad Creative</a>
            </div>
          `}
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
