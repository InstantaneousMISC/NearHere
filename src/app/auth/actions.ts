"use server"

import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { getSafePortalDestination, hasPortalAccess } from "@/server/auth/portal"

export interface PortalLoginState {
  error?: string
}

export interface PasswordResetState {
  error?: string
  message?: string
}

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  portal: z.enum(["admin", "business"]),
  redirectTo: z.string().optional(),
})

export async function signInToPortal(
  _previousState: PortalLoginState,
  formData: FormData
): Promise<PortalLoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    portal: formData.get("portal"),
    redirectTo: formData.get("redirectTo") || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details and try again." }
  }

  const { email, password, portal, redirectTo } = parsed.data
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return { error: "Invalid email or password." }
  }

  if (!(await hasPortalAccess(data.user.id, portal))) {
    await supabase.auth.signOut()
    return {
      error:
        portal === "admin"
          ? "This account is not authorized for the admin portal."
          : "This account has no claimed business with an active paid placement.",
    }
  }

  redirect(getSafePortalDestination(portal, redirectTo))
}

export async function signOutAndContinue(formData: FormData) {
  const portal = formData.get("portal") === "business" ? "business" : "admin"
  const value = formData.get("redirectTo")
  const redirectTo = typeof value === "string" ? value : undefined
  const supabase = await createClient()

  await supabase.auth.signOut()

  // Local development supports mock identities. Clear them alongside the
  // Supabase session so a user is not immediately re-authenticated on the
  // redirected login request.
  const cookieStore = await cookies()
  cookieStore.delete("mock_admin")
  cookieStore.delete("mock_user_email")
  cookieStore.delete("mock_user_id")

  redirect(`/auth/${portal}/login?redirectTo=${encodeURIComponent(getSafePortalDestination(portal, redirectTo))}`)
}

export async function requestBusinessPasswordReset(
  _previousState: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const email = z.string().trim().email("Enter a valid email address.").safeParse(formData.get("email"))
  if (!email.success) {
    return { error: email.error.issues[0]?.message ?? "Enter a valid email address." }
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "")
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${appUrl}/auth/callback?next=/auth/business/reset-password`,
  })

  // Deliberately do not disclose whether an account exists for this address.
  return { message: "If an account exists for that email, a password reset link is on its way." }
}

export async function updateBusinessPassword(
  _previousState: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const parsed = z.object({
    password: z.string().min(10, "Use a password with at least 10 characters."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  }).safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details and try again." }
  }
  if (parsed.data.password !== parsed.data.confirmPassword) {
    return { error: "The passwords do not match." }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Your reset link has expired. Request a new password reset email." }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    return { error: error.message }
  }

  await supabase.auth.signOut()
  redirect("/auth/business/login?reset=success")
}
