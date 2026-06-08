"use client"

import { useState } from "react"
import { trpc } from "@/components/providers"
import { useUploadThing } from "@/lib/uploadthing"

interface CheckoutFormProps {
  spotId: string
  onLoadingChange?: (loading: boolean) => void
}

export default function CheckoutForm({ spotId, onLoadingChange }: CheckoutFormProps) {
  const [contactName, setContactName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [heardAboutUs, setHeardAboutUs] = useState("")

  // Dynamic ad display fields
  const [logoUrl, setLogoUrl] = useState("")
  const [adNotes, setAdNotes] = useState("")
  const [adOffer, setAdOffer] = useState("")
  const [uploadError, setUploadError] = useState<string | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const createOrderMutation = trpc.order.create.useMutation()

  const { startUpload: startLogoUpload, isUploading: isLogoUploading } = useUploadThing(
    "logoUploader",
    {
      onClientUploadComplete: (res) => {
        if (res && res[0]) {
          setLogoUrl(res[0].ufsUrl)
        }
      },
      onUploadError: (err) => {
        setUploadError(`Logo upload failed: ${err.message}`)
      },
    }
  )

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadError(null)
      await startLogoUpload([file])
    }
  }

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

    try {
      const response = await createOrderMutation.mutateAsync({
        spotId,
        contactName,
        businessName,
        email,
        phone,
        website: website.trim() ? website : undefined,
        businessAddress: businessAddress.trim() ? businessAddress : undefined,
        heardAboutUs: heardAboutUs.trim() ? heardAboutUs : undefined,
        logoUrl: logoUrl.trim() ? logoUrl : undefined,
        adNotes: adNotes.trim() ? adNotes : undefined,
        adOffer: adOffer.trim() ? adOffer : undefined,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-none bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-sm text-red-500 font-medium">
          ⚠️ {error}
        </div>
      )}

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
              We'll send your invoice and creative link here.
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
          Optional Details (For Ad Display)
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {/* Website */}
          <div className="space-y-1.5">
            <label htmlFor="website" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Website URL
            </label>
            <input
              id="website"
              type="url"
              disabled={loading}
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="e.g. https://www.converseplumbing.com"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Business Address */}
          <div className="space-y-1.5">
            <label htmlFor="businessAddress" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Business Address
            </label>
            <input
              id="businessAddress"
              type="text"
              disabled={loading}
              value={businessAddress}
              onChange={e => setBusinessAddress(e.target.value)}
              placeholder="e.g. 101 Main St, Converse, TX 78109"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* How did you hear about us? */}
          <div className="space-y-1.5">
            <label htmlFor="heardAboutUs" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              How did you hear about us?
            </label>
            <input
              id="heardAboutUs"
              type="text"
              disabled={loading}
              value={heardAboutUs}
              onChange={e => setHeardAboutUs(e.target.value)}
              placeholder="e.g. Direct mail, Facebook, Word of mouth..."
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
          Ad Assets & Instructions (Optional)
        </h3>

        {uploadError && (
          <div className="rounded-none bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs text-red-500 font-medium">
            ⚠️ {uploadError}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {/* Logo Uploader */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Business Logo (PNG, JPG, SVG - Max 4MB)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer inline-flex items-center justify-center bg-stone-bg hover:bg-stone-bg/85 border border-border text-foreground font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-3 rounded-none transition-colors">
                {isLogoUploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={isLogoUploading || loading}
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
              {logoUrl && (
                <div className="relative w-12 h-12 border border-border bg-white rounded-none overflow-hidden flex items-center justify-center p-1 shadow-sm">
                  <img src={logoUrl} alt="Uploaded Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Ad Offer/Deal */}
          <div className="space-y-1.5">
            <label htmlFor="adOffer" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Special Coupon / Promo Offer
            </label>
            <input
              id="adOffer"
              type="text"
              disabled={loading}
              value={adOffer}
              onChange={e => setAdOffer(e.target.value)}
              placeholder="e.g., $50 OFF any service call! Mention this card."
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
            <div className="rounded-none bg-primary/5 border border-primary/20 p-3 mt-1.5 text-[11px] text-muted-foreground leading-relaxed font-sans">
              💡 <span className="font-bold text-foreground">Pro-tip for maximum return:</span> We highly recommend offering a clear deal (such as <span className="font-semibold text-primary">"$50 OFF"</span>, <span className="font-semibold text-primary">"10% Discount"</span>, or a <span className="font-semibold text-primary">"Free Inspection"</span>). Direct-mail coupons create strong local value for homeowners and dramatically increase your booking rate.
            </div>
          </div>

          {/* What to display / Ad Notes */}
          <div className="space-y-1.5">
            <label htmlFor="adNotes" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Ad Content details & display notes
            </label>
            <textarea
              id="adNotes"
              disabled={loading}
              value={adNotes}
              onChange={e => setAdNotes(e.target.value)}
              placeholder="e.g., Please highlight that we are family-owned since 1999 and licensed. Use blue/gray matching our brand."
              rows={3}
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || isLogoUploading}
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
