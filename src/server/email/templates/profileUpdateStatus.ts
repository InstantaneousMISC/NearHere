import { getNearHereEmailWrapper } from "./wrapper"
import { escapeHtml } from "../escapeHtml"

export function getProfileUpdateStatusTemplate(params: {
  businessName: string
  status: "APPROVED" | "REJECTED"
  rejectionReason?: string | null
  profileUrl?: string | null
}) {
  const businessName = escapeHtml(params.businessName)
  const isApproved = params.status === "APPROVED"
  const statusLabel = isApproved ? "Approved" : "Needs Revision"
  const subject = `Your profile update request has been ${isApproved ? "approved" : "rejected"}`

  const contentHtml = `
    <h2>Profile Update Status</h2>
    <p>Hi there,</p>
    <p>Your request to update the business profile for <strong>${businessName}</strong> has been reviewed by our administration team.</p>

    <div class="details-card">
      <div class="details-title">Review Decision</div>
      <div class="details-row">
        <span class="details-label">Business:</span>
        <span class="details-value">${businessName}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Review Status:</span>
        <span class="details-value" style="color: ${isApproved ? "#10B981" : "#D13F1F"}; font-weight: bold;">${statusLabel}</span>
      </div>
      ${
        !isApproved && params.rejectionReason
          ? `
      <div class="notes-box">
        <div class="notes-title">Rejection Notes / Reasons</div>
        <div class="notes-content">${escapeHtml(params.rejectionReason)}</div>
      </div>
      `
          : ""
      }
    </div>

    ${
      isApproved
        ? `
          <p>Your live business profile directory page and dynamic QR redirections have been updated successfully with the new content.</p>
          ${
            params.profileUrl
              ? `<div class="cta-container"><a class="btn" href="${escapeHtml(params.profileUrl)}">View Your Live Profile</a></div>
                 <p class="link-alt">If the button does not work, copy this link:<br /><a href="${escapeHtml(params.profileUrl)}">${escapeHtml(params.profileUrl)}</a></p>`
              : ""
          }
        `
        : `<p>Please log in to your dashboard to review the feedback, adjust your profile, and resubmit the change request for approval.</p>`
    }

    <p>If you have any questions, please contact our support team.</p>
  `

  const html = getNearHereEmailWrapper({
    title: `Profile Update ${statusLabel}`,
    preheader: `Your profile update request has been ${params.status.toLowerCase()}.`,
    contentHtml,
  })

  return { subject, html }
}
