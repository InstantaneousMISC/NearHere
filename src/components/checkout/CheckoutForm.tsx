"use client"

import { useState, useEffect } from "react"
import { trpc } from "@/components/providers"

interface CheckoutFormProps {
  spotId: string
  categoryId: string
  categoryName: string
  campaignUrl: string
  onLoadingChange?: (loading: boolean) => void
}

export default function CheckoutForm({
  spotId,
  categoryId,
  categoryName,
  campaignUrl,
  onLoadingChange,
}: CheckoutFormProps) {
  const [contactName, setContactName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")

  const [sessionId, setSessionId] = useState<string>("")
  const [holdError, setHoldError] = useState<string | null>(null)
  const [isHolding, setIsHolding] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const createOrderMutation = trpc.order.create.useMutation()

  useEffect(() => {
    // Generate or fetch client checkout session ID
    let id = localStorage.getItem("localspot_checkout_session_id")
    if (!id) {
      id = "sess_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
      localStorage.setItem("localspot_checkout_session_id", id)
    }
    setSessionId(id)
  }, [spotId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    onLoadingChange?.(true)

    // Quick basic validation
    if (!contactName.trim() || !businessName.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in all required fields.")
      setLoading(false)
      onLoadingChange?.(false)
      return
    }

    // Format website URL if provided
    let formattedWebsite = website.trim()
    if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
      formattedWebsite = `https://${formattedWebsite}`
    }

    try {
      const response = await createOrderMutation.mutateAsync({
        spotId,
        categoryId,
        sessionId,
        contactName,
        businessName,
        email,
        phone,
        website: formattedWebsite || undefined,
      })

      if (response?.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = response.checkoutUrl
      } else {
        throw new Error("Missing checkout URL from server response")
      }
    } catch (err: any) {
      console.error("[CHECKOUT ERROR]", err)
      setError(err?.message || "An unexpected error occurred. Please try again.")
      setLoading(false)
      onLoadingChange?.(false)
    }
  }

  if (isHolding) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 font-mono">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-none" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Securing temporary hold on ad space...</p>
      </div>
    )
  }

  if (holdError) {
    return (
      <div className="space-y-6 text-center py-8 font-sans">
        <div className="rounded-none bg-red-500/10 border border-red-500/20 px-6 py-8 text-red-500 max-w-md mx-auto">
          <span className="text-3xl block mb-3">⚠️</span>
          <h4 className="text-sm font-mono font-bold uppercase tracking-wider mb-2">Space Unavailable</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {holdError}
          </p>
        </div>
        <div>
          <a
            href={campaignUrl}
            className="inline-flex items-center justify-center bg-foreground text-background border border-foreground font-mono text-xs uppercase font-bold tracking-widest px-6 py-3.5 rounded-none hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
          >
            ← Return to Campaign
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-none bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-sm text-red-500 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Category confirmation banner */}
      <div className="border border-border bg-stone-bg/25 p-4 rounded-none font-mono">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Selected Business Category</span>
        <span className="text-base font-extrabold text-foreground block uppercase mt-0.5">{categoryName}</span>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
          Business Contact Details
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business Name */}
          <div className="space-y-1.5">
            <label htmlFor="businessName" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Business Name <span className="text-primary">*</span>
            </label>
            <input
              id="businessName"
              type="text"
              required
              disabled={loading}
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="e.g. Converse Plumbing Pros"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Contact Name */}
          <div className="space-y-1.5">
            <label htmlFor="contactName" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Contact Name <span className="text-primary">*</span>
            </label>
            <input
              id="contactName"
              type="text"
              required
              disabled={loading}
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Email Address <span className="text-primary">*</span>
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. john@converseplumbing.com"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
            <span className="text-[9px] font-mono text-muted-foreground block uppercase tracking-wider">
              We will send your receipt, profile link, and creative submission link here.
            </span>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Phone Number <span className="text-primary">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              required
              disabled={loading}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. (210) 555-0199"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
          Optional Business Details
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {/* Website */}
          <div className="space-y-1.5">
            <label htmlFor="website" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Website URL
            </label>
            <input
              id="website"
              type="text"
              disabled={loading}
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="e.g. www.converseplumbing.com"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="rounded-none bg-primary/5 border border-primary/20 p-4 font-sans text-xs text-muted-foreground leading-relaxed">
        <span className="font-bold text-foreground">What happens after payment?</span> Your placement
        is reserved, then you can claim your business profile and submit your logo, offer,
        description, and creative preferences. NearHere coordinates layout, print preparation, and
        mailing.
      </div>

      <p className="text-[10px] leading-relaxed text-muted-foreground">
        Direct mail results vary by market, offer, creative, timing, and audience. NearHere does not
        guarantee leads, calls, sales, revenue, or return on investment.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center bg-foreground text-background border border-foreground font-bold tracking-wider uppercase text-sm py-4 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none rounded-none"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-background" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirecting to Stripe...
          </span>
        ) : (
          "Proceed to Secure Checkout →"
        )}
      </button>
    </form>
  )
}
