import { db } from "@/server/db"
import { after } from "next/server"

export type ClaimBusinessErrorCode = "NOT_FOUND" | "BAD_REQUEST" | "FORBIDDEN"

export class ClaimBusinessError extends Error {
  constructor(
    message: string,
    public readonly code: ClaimBusinessErrorCode
  ) {
    super(message)
    this.name = "ClaimBusinessError"
  }
}

/**
 * Links an authenticated user to the business represented by a valid claim
 * token. Both the interactive claim button and first-time account creation use
 * this exact authorization path.
 */
export async function claimBusinessForUser({
  token,
  userId,
  userEmail,
}: {
  token: string
  userId: string
  userEmail?: string | null
}) {
  const business = await db.business.findUnique({
    where: { claimToken: token },
    include: { advertiser: true },
  })

  if (!business) {
    throw new ClaimBusinessError("Invalid claim token.", "NOT_FOUND")
  }
  if (business.claimTokenExpiresAt && business.claimTokenExpiresAt < new Date()) {
    throw new ClaimBusinessError("Claim token has expired.", "BAD_REQUEST")
  }
  if (business.ownerUserId) {
    throw new ClaimBusinessError("This business has already been claimed.", "BAD_REQUEST")
  }

  const isAdmin = Boolean(
    await db.adminUser.findUnique({
      where: { supabaseUserId: userId },
      select: { id: true },
    })
  )
  const normalizedUserEmail = userEmail?.trim().toLowerCase() || ""
  const businessEmail = business.email?.trim().toLowerCase() || ""
  const advertiserEmail = business.advertiser?.email?.trim().toLowerCase() || ""
  const emailMatches = normalizedUserEmail && (
    normalizedUserEmail === businessEmail || normalizedUserEmail === advertiserEmail
  )

  if (!isAdmin && !emailMatches) {
    throw new ClaimBusinessError(
      "You can only claim this business using the email address associated with the purchase.",
      "FORBIDDEN"
    )
  }

  const claimedBusiness = await db.business.update({
    where: { id: business.id },
    data: {
      ownerUserId: userId,
      claimedAt: new Date(),
      claimToken: null,
      claimTokenExpiresAt: null,
    },
  })

  const { createBusinessNotification } = await import("@/server/helpers/businessNotifications")
  await createBusinessNotification({
    businessId: claimedBusiness.id,
    type: "ACCOUNT_CLAIMED",
    title: "Welcome to your business dashboard",
    message: "Your account is verified and connected to this business profile. You can now complete and manage your public profile.",
    link: "/business/dashboard",
  })

  if (claimedBusiness.email) {
    // The claim is complete once ownership is stored. Deliver the notification
    // after the redirect response so email-provider latency cannot block access
    // to the dashboard. `after` keeps the task attached to this request.
    after(async () => {
      try {
        const { sendClaimSuccessEmail } = await import("@/server/email/actions")
        await sendClaimSuccessEmail(claimedBusiness.id)
      } catch (error) {
        console.error("[EMAIL ERROR] Failed to send claim success email:", error)
      }
    })
  }

  return claimedBusiness
}
