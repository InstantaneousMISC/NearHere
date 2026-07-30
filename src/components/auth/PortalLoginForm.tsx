"use client"

import { useActionState } from "react"
import Link from "next/link"
import { signInToPortal, signOutAndContinue, type PortalLoginState } from "@/app/auth/actions"
import type { Portal } from "@/server/auth/portal"

const initialState: PortalLoginState = {}

interface PortalLoginFormProps {
  portal: Portal
  redirectTo: string
  accessDenied: boolean
  signedInAs?: string | null
  passwordReset?: boolean
}

export default function PortalLoginForm({ portal, redirectTo, accessDenied, signedInAs, passwordReset }: PortalLoginFormProps) {
  const [state, formAction, pending] = useActionState(signInToPortal, initialState)
  const portalLabel = portal === "admin" ? "Admin Portal" : "Advertiser Portal"

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1e3a5f] mb-4" aria-hidden="true">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 00-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">LocalSpot Mailers</h1>
          <p className="text-slate-500 mt-1">{portalLabel}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Sign in to your account</h2>

          {accessDenied && !signedInAs && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 mb-5">
              This account does not have access to the requested portal.
            </div>
          )}

          {passwordReset && !signedInAs && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 mb-5">
              Password updated. Sign in with your new password.
            </div>
          )}

          {signedInAs ? (
            <div className="space-y-5">
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                You are signed in as <strong>{signedInAs}</strong>, but that account cannot access the {portalLabel.toLowerCase()}.
              </div>
              <p className="text-sm text-slate-600">
                Sign out to use a different account. Your current session will not be redirected into another portal.
              </p>
              <form action={signOutAndContinue}>
                <input type="hidden" name="portal" value={portal} />
                <input type="hidden" name="redirectTo" value={redirectTo} />
                <button type="submit" className="w-full rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#162d4a] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2 transition-colors">
                  Sign out and continue
                </button>
              </form>
            </div>
          ) : (
            <form action={formAction} className="space-y-5">
              <input type="hidden" name="portal" value={portal} />
              <input type="hidden" name="redirectTo" value={redirectTo} />

              {state.error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700" role="alert">{state.error}</div>}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
                <input id="email" name="email" type="email" required autoComplete="email" placeholder={portal === "business" ? "owner@yourbusiness.com" : "admin@localspotmailers.com"} className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-colors" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input id="password" name="password" type="password" required autoComplete="current-password" className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent transition-colors" />
                {portal === "business" && (
                  <Link href="/auth/business/forgot-password" className="mt-2 inline-block text-sm text-[#1e3a5f] underline">
                    Forgot your password?
                  </Link>
                )}
              </div>

              <button type="submit" disabled={pending} className="w-full rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#162d4a] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {pending ? "Signing in…" : "Sign in"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}
