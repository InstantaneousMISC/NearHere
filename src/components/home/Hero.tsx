"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PostcardMockup } from "./PostcardMockup"
import { trpc } from "@/components/providers"

export function Hero() {
  const router = useRouter()
  const [zip, setZip] = useState("")
  const [searching, setSearching] = useState(false)
  const [showLeadForm, setShowLeadForm] = useState(false)

  // Lead form fields
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [leadSuccess, setLeadSuccess] = useState(false)
  const [leadLoading, setLeadLoading] = useState(false)
  const [leadError, setLeadError] = useState<string | null>(null)

  const utils = trpc.useUtils()
  const createLeadMutation = trpc.lead.create.useMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSearching(true)
    setShowLeadForm(false)
    setLeadSuccess(false)
    setLeadError(null)

    const cleanZip = zip.trim()
    if (!cleanZip) {
      setSearching(false)
      return
    }

    try {
      const campaign = await utils.campaign.searchByZip.fetch({ zipCode: cleanZip })
      if (campaign) {
        // Redirect to campaign page
        router.push(`/campaigns/${campaign.state}/${campaign.city}/${campaign.slug}`)
      } else {
        setShowLeadForm(true)
      }
    } catch (err: any) {
      console.error("[ZIP SEARCH ERROR]", err)
      setShowLeadForm(true)
    } finally {
      setSearching(false)
    }
  }

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLeadLoading(true)
    setLeadError(null)

    try {
      await createLeadMutation.mutateAsync({
        businessName: businessName.trim() ? businessName : undefined,
        email: email.trim(),
        zipCode: zip.trim(),
      })
      setLeadSuccess(true)
      setBusinessName("")
      setEmail("")
    } catch (err: any) {
      setLeadError(err.message || "Failed to submit interest. Please try again.")
    } finally {
      setLeadLoading(false)
    }
  }

  return (
    <header className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-32 font-sans bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-up">
            <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
              Physical Presence / Local Reach
            </span>
            <h1 className="max-w-xl text-balance text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl text-foreground">
              Own the mailbox in your neighborhood.
            </h1>
            <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              Shared direct mail for local experts. Reach thousands of households for a fraction of
              the cost. One plumber, one realtor, one dentist per zone.
            </p>
            
            <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 overflow-hidden border border-foreground bg-background">
                <input
                  type="text"
                  required
                  placeholder="Enter your ZIP code (e.g. 78109)"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full bg-transparent px-4 py-4 text-sm outline-none placeholder:text-muted-foreground/50 text-foreground"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-foreground px-8 py-4 text-sm font-bold text-background transition-colors hover:bg-primary hover:text-primary-foreground shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searching ? "SEARCHING..." : "RESERVE SLOT"}
                </button>
              </div>
            </form>

            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Currently booking for the next drop. Test our live demo zone by entering ZIP <span className="font-bold text-foreground underline select-all">78109</span> (Converse, TX).
            </p>

            {/* Launch Waitlist Lead Capture Form */}
            {showLeadForm && (
              <div className="mt-8 border border-border bg-card p-6 rounded-none space-y-4 animate-fade-in">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary block">
                    We're not live in ZIP {zip} yet!
                  </span>
                  <h4 className="text-lg font-extrabold uppercase text-foreground">
                    Get notified when we launch
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Be the first to secure category exclusivity in your ZIP code. Join our local launch waitlist today.
                  </p>
                </div>

                {leadSuccess ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3.5 text-xs text-emerald-600 font-mono font-bold uppercase tracking-wider text-center">
                    🎉 Thank you! We'll notify you as soon as we drop in {zip}.
                  </div>
                ) : (
                  <form onSubmit={handleLeadSubmit} className="space-y-4 pt-2">
                    {leadError && (
                      <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-500 font-mono uppercase">
                        ⚠️ {leadError}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label htmlFor="leadBusinessName" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                          Business Name (Optional)
                        </label>
                        <input
                          id="leadBusinessName"
                          type="text"
                          disabled={leadLoading}
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="e.g. Converse Plumbing"
                          className="w-full bg-background border border-border px-3 py-2 text-xs outline-none text-foreground rounded-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="leadEmail" className="block text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                          Email Address *
                        </label>
                        <input
                          id="leadEmail"
                          type="email"
                          required
                          disabled={leadLoading}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. contact@converseplumbing.com"
                          className="w-full bg-background border border-border px-3 py-2 text-xs outline-none text-foreground rounded-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={leadLoading}
                      className="w-full bg-foreground text-background font-mono font-bold uppercase tracking-widest text-xs py-3 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors rounded-none"
                    >
                      {leadLoading ? "SUBMITTING..." : "JOIN LAUNCH WAITLIST"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
          
          <div className="animate-fade-up [animation-delay:200ms]">
            <PostcardMockup />
          </div>
        </div>
      </div>
    </header>
  )
}
