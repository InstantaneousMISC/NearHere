"use client"

import React, { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

interface ClaimPageProps {
  params: Promise<{ token: string }>
}

export default function ClaimBusinessPage({ params }: ClaimPageProps) {
  const { token } = use(params)
  const router = useRouter()
  const supabase = createClient()

  // Auth States
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup")
  const [authEmail, setAuthEmail] = useState("")
  const [authPassword, setAuthPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null)
  const [processingAuth, setProcessingAuth] = useState(false)

  // Claim State
  const [claimError, setClaimError] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState(false)
  const [claiming, setClaiming] = useState(false)

  // Fetch Business Details using Public Query
  const { data: business, isLoading: businessLoading, error: businessError } = 
    trpc.business.getBusinessDetailsByClaimToken.useQuery({ token }, {
      retry: false,
    })

  // Mutation to Claim Business
  const claimMutation = trpc.business.claimBusiness.useMutation()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      setAuthLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError(null)
    setAuthSuccessMsg(null)
    setProcessingAuth(true)

    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        })

        if (error) {
          setAuthError(error.message)
        } else if (data.user && !data.session) {
          setAuthSuccessMsg("Account created! Please check your email for a confirmation link.")
        } else {
          setAuthSuccessMsg("Account created and signed in successfully!")
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        })

        if (error) {
          setAuthError(error.message)
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed. Please try again.")
    } finally {
      setProcessingAuth(false)
    }
  }

  const handleClaimConfirm = async () => {
    setClaimError(null)
    setClaiming(true)

    claimMutation.mutate(
      { token },
      {
        onSuccess: (data) => {
          setClaimSuccess(true)
          setTimeout(() => {
            router.push("/business/setup")
          }, 2000)
        },
        onError: (err) => {
          setClaimError(err.message || "Failed to claim business account.")
          setClaiming(false)
        },
      }
    )
  }

  const isLoading = businessLoading || authLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-center items-center font-sans">
        <div className="w-12 h-12 border-4 border-[#D13F1F] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#77706A]">Loading reservation details...</p>
      </div>
    )
  }

  if (businessError || !business) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-center items-center px-4 font-sans text-center">
        <div className="w-full max-w-md bg-[#FAF8F4] border-2 border-[#211D1C] p-8 space-y-4 shadow-[0_12px_30px_rgba(33,29,28,0.08)]">
          <div className="text-4xl">⚠️</div>
          <h1 className="font-headline font-black uppercase text-xl text-[#211D1C] leading-none">Invalid or Expired Token</h1>
          <p className="text-xs text-[#77706A] leading-relaxed">
            This account claim link is invalid, expired, or has already been claimed. If you believe this is an error, please contact support or your account administrator to regenerate your claim token.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block px-5 py-2.5 bg-[#211D1C] hover:bg-[#FAF8F4] text-[#FAF8F4] hover:text-[#211D1C] border border-[#211D1C] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-center items-center px-4 py-12 font-sans select-none">
      
      {/* Branding */}
      <div className="text-center mb-8">
        <div className="font-headline font-black text-2xl tracking-tighter text-[#D13F1F] flex items-center justify-center gap-0.5">
          <span className="text-[#211D1C]">Near</span>Here
        </div>
        <p className="text-[10px] font-mono tracking-widest uppercase text-[#77706A] mt-1">
          Merchant Onboarding Portal
        </p>
      </div>

      <div className="w-full max-w-md bg-[#FAF8F4] border-2 border-[#211D1C] p-8 space-y-6 shadow-[0_15px_40px_rgba(33,29,28,0.06)] relative overflow-hidden">
        
        {/* Reservation banner */}
        <div className="bg-[#FAF8F4] border border-[#E7E0D8] p-4 text-left space-y-2">
          <span className="text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider block">
            Verifying Listing Reservation
          </span>
          <h2 className="font-headline font-black uppercase text-base text-[#211D1C] leading-none">
            {business.name}
          </h2>
          <p className="text-xs text-[#77706A] leading-relaxed">
            This business is ready to claim. Purchaser Email: <strong className="font-mono text-[11px] text-[#211D1C]">{business.maskedEmail}</strong>
          </p>
        </div>

        {/* Claim Success Celebration */}
        {claimSuccess ? (
          <div className="text-center py-6 space-y-4 animate-fade-up">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FDF9F2] border border-[#C9993E] text-[#C9993E] text-3xl font-mono">
              ✓
            </div>
            <h3 className="font-headline font-black uppercase text-lg text-[#211D1C]">
              Ownership Confirmed!
            </h3>
            <p className="text-xs text-[#77706A] leading-relaxed">
              Account claimed successfully. Redirecting you to the Guided setup wizard...
            </p>
          </div>
        ) : (
          <>
            {/* Case A: User is NOT authenticated */}
            {!user ? (
              <div className="space-y-4">
                <div className="text-left space-y-1">
                  <h3 className="font-headline font-extrabold uppercase text-sm text-[#211D1C] tracking-tight">
                    Step 1: Authenticate Your Merchant Account
                  </h3>
                  <p className="text-xs text-[#77706A] leading-relaxed">
                    To claim your listing, you must log in or sign up below. Please register using the same email address that received the claim link.
                  </p>
                </div>

                {/* Auth Tabs */}
                <div className="flex border-b border-[#E7E0D8] text-xs">
                  <button
                    onClick={() => { setAuthMode("signup"); setAuthError(null); }}
                    className={`flex-1 py-2 font-mono font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                      authMode === "signup" ? "border-[#D13F1F] text-[#D13F1F]" : "border-transparent text-[#77706A]"
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => { setAuthMode("login"); setAuthError(null); }}
                    className={`flex-1 py-2 font-mono font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                      authMode === "login" ? "border-[#D13F1F] text-[#D13F1F]" : "border-transparent text-[#77706A]"
                    }`}
                  >
                    Log In
                  </button>
                </div>

                {/* Auth Form */}
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authError && (
                    <div className="bg-[#FBEBE8] border border-[#E85D44] text-[#801B0B] text-xs p-3 rounded-none font-medium text-left">
                      ⚠️ {authError}
                    </div>
                  )}
                  {authSuccessMsg && (
                    <div className="bg-[#F3FAF6] border border-[#A7E2C4] text-[#1D5E3A] text-xs p-3 rounded-none font-medium text-left">
                      ✓ {authSuccessMsg}
                    </div>
                  )}

                  <div className="text-left">
                    <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="merchant@mybusiness.com"
                      className="w-full rounded-none border border-[#E7E0D8] px-3 py-2 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C]"
                    />
                  </div>

                  <div className="text-left">
                    <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-none border border-[#E7E0D8] px-3 py-2 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={processingAuth}
                    className="w-full py-2.5 bg-[#211D1C] hover:bg-[#FAF8F4] text-[#FAF8F4] hover:text-[#211D1C] border border-[#211D1C] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {processingAuth ? "Processing..." : authMode === "signup" ? "Sign Up & Continue" : "Log In & Continue"}
                  </button>
                </form>
              </div>
            ) : (
              /* Case B: User IS authenticated, ready to Claim */
              <div className="space-y-5">
                <div className="text-left space-y-1">
                  <h3 className="font-headline font-extrabold uppercase text-sm text-[#211D1C] tracking-tight">
                    Step 2: Confirm Account Claim
                  </h3>
                  <p className="text-xs text-[#77706A] leading-relaxed">
                    You are logged in as <strong className="font-mono text-[#211D1C]">{user.email}</strong>. Ready to link your login credential to this business profile.
                  </p>
                </div>

                {claimError && (
                  <div className="bg-[#FBEBE8] border border-[#E85D44] text-[#801B0B] text-xs p-3 rounded-none font-medium text-left">
                    ⚠️ {claimError}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    onClick={handleClaimConfirm}
                    disabled={claiming}
                    className="w-full py-3 bg-[#D13F1F] hover:bg-[#B53A1A] text-paper border border-[#211D1C] font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {claiming ? "Claiming..." : "⚡ Claim Business Ownership"}
                  </button>
                  
                  <button
                    onClick={async () => {
                      await supabase.auth.signOut()
                      setUser(null)
                    }}
                    className="w-full mt-2.5 py-1.5 border border-dashed border-[#77706A] hover:bg-[#E7E0D8] text-[#77706A] text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                  >
                    Sign in with another account
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
