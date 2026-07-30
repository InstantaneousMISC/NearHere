"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { db } from "@/server/db"
import { ClaimBusinessError, claimBusinessForUser } from "@/server/auth/claim"

export interface ClaimAuthState {
  error?: string
  message?: string
}

const claimAuthSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(1, "Enter your password."),
  confirmPassword: z.string().optional(),
  mode: z.enum(["signup", "login"]),
})

async function getClaimEmail(token: string) {
  const business = await db.business.findUnique({
    where: { claimToken: token },
    include: { advertiser: { select: { email: true } } },
  })

  if (!business || business.ownerUserId || (business.claimTokenExpiresAt && business.claimTokenExpiresAt < new Date())) {
    return null
  }

  return business.email?.trim() || business.advertiser?.email?.trim() || null
}

async function findAuthUserByEmail(email: string) {
  const admin = createAdminClient()
  const normalizedEmail = email.trim().toLowerCase()
  const pageSize = 1_000

  // Supabase's Admin API currently exposes paginated user listing rather than
  // an email lookup. This runs only after a valid, single-use claim link has
  // been presented and is needed to recover a pending account created by the
  // former confirmation-email flow.
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize })
    if (error) throw error

    const user = data.users.find((candidate) => candidate.email?.trim().toLowerCase() === normalizedEmail)
    if (user) return user
    if (data.users.length < pageSize) return null
  }

  throw new Error("Unable to locate the existing account. Please contact support.")
}

/**
 * The claim token is delivered to the purchaser's inbox and is validated
 * before this runs. It is therefore the proof of email possession for this
 * tightly scoped account-activation flow—not a global bypass of Supabase
 * confirmation requirements.
 */
async function provisionClaimAccount(email: string, password: string) {
  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (!error && data.user) {
    return { userId: data.user.id, existingConfirmedAccount: false }
  }

  const isExistingUserError = /already|exists|registered/i.test(error?.message || "")
  if (!isExistingUserError) {
    throw error || new Error("Supabase did not create an account.")
  }

  const existingUser = await findAuthUserByEmail(email)
  if (!existingUser) {
    throw new Error("Supabase reported an existing account but no matching user could be found.")
  }

  if (existingUser.email_confirmed_at) {
    return { userId: existingUser.id, existingConfirmedAccount: true }
  }

  const { data: updated, error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
    password,
    email_confirm: true,
  })
  if (updateError || !updated.user) {
    throw updateError || new Error("Supabase did not activate the existing account.")
  }

  return { userId: updated.user.id, existingConfirmedAccount: false }
}

/** The purchaser email is resolved from the claim token only on the server. */
export async function authenticateClaimAccount(
  _previousState: ClaimAuthState,
  formData: FormData
): Promise<ClaimAuthState> {
  const parsed = claimAuthSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword") || undefined,
    mode: formData.get("mode"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details and try again." }
  }

  const { token, password, confirmPassword, mode } = parsed.data
  if (mode === "signup" && password.length < 10) {
    return { error: "Use a password with at least 10 characters." }
  }
  if (mode === "signup" && password !== confirmPassword) {
    return { error: "The passwords do not match." }
  }

  const email = await getClaimEmail(token)

  if (!email) {
    return { error: "This claim link is invalid, expired, or has already been used." }
  }

  const supabase = await createClient()

  if (mode === "login") {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      return { error: "Incorrect password. Try again or use a different sign-in method." }
    }

    try {
      await claimBusinessForUser({ token, userId: data.user.id, userEmail: data.user.email })
    } catch (error) {
      if (error instanceof ClaimBusinessError) return { error: error.message }
      throw error
    }

    redirect("/business/dashboard")
  }

  let account
  try {
    account = await provisionClaimAccount(email, password)
  } catch (error) {
    console.error("[CLAIM AUTH] Failed to provision advertiser account:", error)
    return { error: "We could not activate your account. Please try again in a moment." }
  }

  if (account.existingConfirmedAccount) {
    return { error: "An account already exists for this email. Choose Log In and use its existing password." }
  }

  // Sign in through the cookie-aware server client after the admin client has
  // created or confirmed the account. This establishes the normal Supabase
  // session without exposing the admin key to the browser.
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.user || data.user.id !== account.userId) {
    return { error: "Your account was activated, but we could not sign you in. Choose Log In to continue." }
  }

  try {
    await claimBusinessForUser({ token, userId: data.user.id, userEmail: data.user.email })
  } catch (error) {
    if (error instanceof ClaimBusinessError) return { error: error.message }
    throw error
  }

  redirect("/business/dashboard")
}
