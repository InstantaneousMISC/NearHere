"use client"

import { useState, useEffect, useRef } from "react"
import { trpc } from "@/components/providers"

interface CampaignInquiryFormProps {
  campaignId: string
  campaignUrl: string
  facebookUrl?: string | null
}

export default function CampaignInquiryForm({
  campaignId,
  campaignUrl,
  facebookUrl,
}: CampaignInquiryFormProps) {
  const [name, setName] = useState("")
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [businessCategory, setBusinessCategory] = useState("")
  const [websiteOrFacebook, setWebsiteOrFacebook] = useState("")
  const [preferredContactMethod, setPreferredContactMethod] = useState("text")
  const [interestType, setInterestType] = useState("pricing")
  const [message, setMessage] = useState("")
  const [honeypot, setHoneypot] = useState("")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const createInquiryMutation = trpc.campaignInquiry.create.useMutation()
  const { data: categories } = trpc.category.list.useQuery()
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const filteredCategories = categories?.filter(cat => 
    cat.name.toLowerCase().includes(businessCategory.toLowerCase())
  ) || []

  const handleCategorySelect = (name: string) => {
    setBusinessCategory(name)
    setShowCategoryDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Basic validation - all contact details are strictly required
    if (!businessName.trim()) {
      setError("Please enter your business name.")
      setLoading(false)
      return
    }
    if (!name.trim()) {
      setError("Please enter your contact name.")
      setLoading(false)
      return
    }
    if (!email.trim()) {
      setError("Please enter your email address.")
      setLoading(false)
      return
    }
    if (!phone.trim()) {
      setError("Please enter your phone number.")
      setLoading(false)
      return
    }
    if (!preferredContactMethod) {
      setError("Please select your preferred contact method.")
      setLoading(false)
      return
    }
    if (!businessCategory.trim()) {
      setError("Please enter or select your business type.")
      setLoading(false)
      return
    }

    try {
      await createInquiryMutation.mutateAsync({
        campaignId,
        name: name.trim(),
        businessName: businessName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        businessCategory: businessCategory.trim(),
        websiteOrFacebook: websiteOrFacebook.trim() || null,
        preferredContactMethod,
        interestType,
        message: message.trim() || null,
        honeypot,
      })

      setSuccess(true)
      setLoading(false)
    } catch (err: any) {
      console.error("[INQUIRY SUBMIT ERROR]", err)
      setError(err?.message || "An unexpected error occurred. Please try again.")
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center py-8 font-sans">
        <div className="rounded-none bg-emerald-500/10 border border-emerald-500/20 px-6 py-10 text-press max-w-md mx-auto space-y-4">
          <span className="text-4xl block">📬</span>
          <h4 className="text-xl font-headline font-black uppercase tracking-tight text-emerald-700">Inquiry Submitted!</h4>
          <p className="text-sm text-press/85 leading-relaxed">
            Thank you for contacting us! We have received your inquiry. A confirmation email has been sent to <span className="font-bold">{email}</span>.
          </p>
          <p className="text-xs text-warm leading-relaxed">
            A representative will review your request and get in touch with you shortly.
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <a
            href={campaignUrl}
            className="inline-flex items-center justify-center bg-transparent border border-press text-press font-mono text-xs uppercase font-bold tracking-widest px-6 py-3.5 rounded-none hover:bg-press hover:text-paper transition-colors"
          >
            ← Return to Campaign
          </a>
          {facebookUrl && (
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-[#1877F2] text-white border border-[#1877F2] font-mono text-xs uppercase font-bold tracking-widest px-6 py-3.5 rounded-none hover:bg-[#166FE5] transition-colors"
            >
              💬 Chat on Messenger
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-left">
      {error && (
        <div className="rounded-none bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-sm text-red-500 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Honeypot Spam Protection (visually hidden) */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="inquiry_honeypot_field">Leave this field empty</label>
        <input
          id="inquiry_honeypot_field"
          type="text"
          name="inquiry_honeypot_field"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
          Required Details
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
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Acme Plumbing Pros"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Business Type (Category) Autocomplete */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label htmlFor="businessCategory" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Business Type <span className="text-primary">*</span>
            </label>
            <div className="relative">
              <input
                id="businessCategory"
                type="text"
                required
                disabled={loading}
                value={businessCategory}
                onChange={(e) => {
                  setBusinessCategory(e.target.value)
                  setShowCategoryDropdown(true)
                }}
                onFocus={() => setShowCategoryDropdown(true)}
                placeholder="e.g. Plumbing, Dentist, Cafe"
                className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all pr-10"
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/60">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            {showCategoryDropdown && (
              <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto z-50 bg-background border border-border shadow-2xl rounded-none py-1">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategorySelect(cat.name)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted text-foreground transition-colors cursor-pointer block border-b border-border/20 last:border-b-0"
                    >
                      {cat.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    No matching types found. Click outside to use custom type.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact Name */}
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Contact Name <span className="text-primary">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              disabled={loading}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Jane Smith"
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
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. jane@acmeplumbing.com"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
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
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. (210) 555-0199"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Preferred Contact Method */}
          <div className="space-y-1.5">
            <label htmlFor="preferredContactMethod" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Preferred Contact Method <span className="text-primary">*</span>
            </label>
            <select
              id="preferredContactMethod"
              required
              disabled={loading}
              value={preferredContactMethod}
              onChange={(e) => setPreferredContactMethod(e.target.value)}
              className="w-full rounded-none border border-border bg-background px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
            >
              <option value="text">Text Message (SMS)</option>
              <option value="email">Email</option>
              <option value="phone">Phone Call</option>
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
          Inquiry Options (Optional)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Website or Facebook Page */}
          <div className="space-y-1.5">
            <label htmlFor="websiteOrFacebook" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Website or Facebook URL
            </label>
            <input
              id="websiteOrFacebook"
              type="text"
              disabled={loading}
              value={websiteOrFacebook}
              onChange={(e) => setWebsiteOrFacebook(e.target.value)}
              placeholder="e.g. facebook.com/acmeplumbing"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
            />
          </div>



          {/* Interest Type */}
          <div className="space-y-1.5">
            <label htmlFor="interestType" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              What do you need help with?
            </label>
            <select
              id="interestType"
              disabled={loading}
              value={interestType}
              onChange={(e) => setInterestType(e.target.value)}
              className="w-full rounded-none border border-border bg-background px-4 py-3.5 text-sm text-foreground focus:outline-none focus:border-primary transition-all"
            >
              <option value="pricing">Pricing & Placements Questions</option>
              <option value="ready_to_book">Ready to Book (Assisted Setup)</option>
              <option value="design_help">Postcard Design & Copy Questions</option>
              <option value="custom_size">Custom Reach or Route Inquiry</option>
              <option value="general">General Information</option>
            </select>
          </div>

          {/* Message (Full Width) */}
          <div className="col-span-1 md:col-span-2 space-y-1.5">
            <label htmlFor="message" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Your Message or Questions
            </label>
            <textarea
              id="message"
              rows={4}
              disabled={loading}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your business, the offer you want to promote, or ask us any questions."
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all resize-none"
            />
            <span className="text-[10px] text-warm font-mono uppercase tracking-wider block text-right">
              {message.length} / 2000 characters
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 inline-flex items-center justify-center bg-foreground text-background border border-foreground font-bold tracking-wider uppercase text-sm py-4 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none rounded-none"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-background" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting Inquiry...
            </span>
          ) : (
            "Submit Inquiry →"
          )}
        </button>

        {facebookUrl && (
          <a
            href={facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-[#1877F2] text-white border border-[#1877F2] font-bold tracking-wider uppercase text-sm px-6 py-4 transition-all hover:bg-[#166FE5] select-none rounded-none text-center"
          >
            💬 Chat on Messenger
          </a>
        )}
      </div>
    </form>
  )
}
