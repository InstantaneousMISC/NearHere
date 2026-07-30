"use client"

import Link from "next/link"
import { useActionState } from "react"
import {
  requestBusinessPasswordReset,
  updateBusinessPassword,
  type PasswordResetState,
} from "@/app/auth/actions"

const initialState: PasswordResetState = {}

function RecoveryShell({ children, title, description }: { children: React.ReactNode; title: string; description: string }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <p className="text-sm font-semibold text-[#1e3a5f] mb-2">Advertiser Portal</p>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600 mt-2 mb-6">{description}</p>
        {children}
      </section>
    </main>
  )
}

export function ForgotBusinessPasswordForm() {
  const [state, formAction, pending] = useActionState(requestBusinessPasswordReset, initialState)
  return (
    <RecoveryShell title="Reset your password" description="Enter your business account email and we’ll send a secure reset link.">
      <form action={formAction} className="space-y-5">
        {state.error && <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{state.error}</p>}
        {state.message && <p className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">{state.message}</p>}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm" />
        </div>
        <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Sending…" : "Send reset link"}
        </button>
        <Link href="/auth/business/login" className="block text-center text-sm text-[#1e3a5f] underline">Back to Business Login</Link>
      </form>
    </RecoveryShell>
  )
}

export function ResetBusinessPasswordForm() {
  const [state, formAction, pending] = useActionState(updateBusinessPassword, initialState)
  return (
    <RecoveryShell title="Choose a new password" description="Set a new password for your business account.">
      <form action={formAction} className="space-y-5">
        {state.error && <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{state.error}</p>}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
          <input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm" />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm new password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" required minLength={10} autoComplete="new-password" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm" />
        </div>
        <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {pending ? "Updating…" : "Update password"}
        </button>
      </form>
    </RecoveryShell>
  )
}
