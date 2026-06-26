"use client"

"use client"

import { useState, useEffect, useRef } from "react"
import { trpc } from "@/components/providers"
import { Lock, ArrowRight, Loader2 } from "lucide-react"

interface CampaignInquiryFormProps {
  campaignId: string
  campaignUrl: string
  facebookUrl?: string | null
  source?: string
}

export default function CampaignInquiryForm({
  campaignId,
  campaignUrl,
  facebookUrl,
  source = "WEBSITE",
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

    // Basic validation
    if (!businessName.trim()) {
      setError("Please enter your business name.")
      setLoading(false)
      return
    }
    if (!businessCategory.trim()) {
      setError("Please enter or select your business type.")
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
        source,
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
      <div className="space-y-6 text-center py-8 font-sans text-white">
        <div className="rounded-none bg-emerald-500/10 border border-emerald-500/20 px-6 py-10 max-w-md mx-auto space-y-4">
          <span className="text-4xl block">📬</span>
          <h4 className="text-2xl font-headline font-black uppercase tracking-tight text-emerald-400">
            You're on the list.
          </h4>
          <p className="text-sm text-stone-300 leading-relaxed">
            Thanks for reaching out — we received your info and will contact you soon to help with pricing, category availability, and setup.
          </p>
        </div>
        <div className="pt-4 flex justify-center">
          <a
            href={campaignUrl}
            className="inline-flex items-center justify-center bg-transparent border border-stone-700 text-stone-300 font-headline text-xs uppercase font-bold tracking-wider px-8 py-3.5 rounded-none hover:bg-white hover:text-[#1A1716] transition-colors"
          >
            ← Back to Campaign
          </a>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-left text-white">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        {/* Business Name */}
        <div className="space-y-1.5">
          <label htmlFor="businessName" className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
            Business Name <span className="text-nh-red">*</span>
          </label>
          <input
            id="businessName"
            type="text"
            required
            disabled={loading}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g., Acme Plumbing Pros"
            className="w-full rounded-none border border-stone-800 bg-[#211D1C] px-4 py-3.5 text-sm text-[#FAF8F4] placeholder:text-stone-600 focus:outline-none focus:border-nh-red transition-all"
          />
        </div>

        {/* Business Type (Category) Autocomplete with Handwritten annotation */}
        <div className="space-y-1.5 relative" ref={dropdownRef}>
          <div className="relative">
            <label htmlFor="businessCategory" className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-1.5">
              Business Type <span className="text-nh-red">*</span>
            </label>
            <span className="absolute font-handwriting text-nh-red text-lg md:text-xl -top-5 right-1 rotate-[-5deg] pointer-events-none tracking-normal">
              We make it easy!
            </span>
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
                placeholder="e.g., Plumbing, Dentist, Cafe"
                className="w-full rounded-none border border-stone-800 bg-[#211D1C] px-4 py-3.5 text-sm text-[#FAF8F4] placeholder:text-stone-600 focus:outline-none focus:border-nh-red transition-all pr-10"
                autoComplete="off"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          
          {showCategoryDropdown && (
            <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto z-50 bg-[#1A1716] border border-stone-800 shadow-2xl rounded-none py-1">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.name)}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-stone-800 text-[#FAF8F4] transition-colors cursor-pointer block border-b border-stone-800/40 last:border-b-0"
                  >
                    {cat.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-stone-500 font-mono">
                  No matching types found. Type custom name or click outside.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Contact Name */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
            Contact Name <span className="text-nh-red">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            disabled={loading}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Jane Smith"
            className="w-full rounded-none border border-stone-800 bg-[#211D1C] px-4 py-3.5 text-sm text-[#FAF8F4] placeholder:text-stone-600 focus:outline-none focus:border-nh-red transition-all"
          />
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
            Email Address <span className="text-nh-red">*</span>
          </label>
          <input
            id="email"
            type="email"
            required
            disabled={loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., jane@acmeplumbing.com"
            className="w-full rounded-none border border-stone-800 bg-[#211D1C] px-4 py-3.5 text-sm text-[#FAF8F4] placeholder:text-stone-600 focus:outline-none focus:border-nh-red transition-all"
          />
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label htmlFor="phone" className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
            Phone Number <span className="text-nh-red">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            required
            disabled={loading}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g., (210) 555-0199"
            className="w-full rounded-none border border-stone-800 bg-[#211D1C] px-4 py-3.5 text-sm text-[#FAF8F4] placeholder:text-stone-600 focus:outline-none focus:border-nh-red transition-all"
          />
        </div>

        {/* Preferred Contact Method */}
        <div className="space-y-1.5">
          <label htmlFor="preferredContactMethod" className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
            Preferred Contact Method <span className="text-nh-red">*</span>
          </label>
          <select
            id="preferredContactMethod"
            required
            disabled={loading}
            value={preferredContactMethod}
            onChange={(e) => setPreferredContactMethod(e.target.value)}
            className="w-full rounded-none border border-stone-800 bg-[#211D1C] px-4 py-3.5 text-sm text-[#FAF8F4] focus:outline-none focus:border-nh-red transition-all appearance-none cursor-pointer"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2378716c\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
          >
            <option value="text" className="bg-[#1A1716]">Text Message (SMS)</option>
            <option value="phone" className="bg-[#1A1716]">Phone Call</option>
            <option value="email" className="bg-[#1A1716]">Email</option>
            <option value="facebook" className="bg-[#1A1716]">Facebook Message</option>
          </select>
        </div>

        {/* Optional divider */}
        <div className="col-span-1 md:col-span-2 text-xs font-mono font-bold uppercase tracking-widest text-stone-600 border-b border-stone-800/80 pb-2 mt-4 select-none">
          Optional (Help us help you faster)
        </div>

        {/* Website or Facebook Page */}
        <div className="space-y-1.5">
          <label htmlFor="websiteOrFacebook" className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
            Website or Facebook URL
          </label>
          <input
            id="websiteOrFacebook"
            type="text"
            disabled={loading}
            value={websiteOrFacebook}
            onChange={(e) => setWebsiteOrFacebook(e.target.value)}
            placeholder="e.g., facebook.com/acmeplumbing"
            className="w-full rounded-none border border-stone-800 bg-[#211D1C] px-4 py-3.5 text-sm text-[#FAF8F4] placeholder:text-stone-600 focus:outline-none focus:border-nh-red transition-all"
          />
        </div>

        {/* Interest Type */}
        <div className="space-y-1.5">
          <label htmlFor="interestType" className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
            What do you need help with?
          </label>
          <select
            id="interestType"
            disabled={loading}
            value={interestType}
            onChange={(e) => setInterestType(e.target.value)}
            className="w-full rounded-none border border-stone-800 bg-[#211D1C] px-4 py-3.5 text-sm text-[#FAF8F4] focus:outline-none focus:border-nh-red transition-all appearance-none cursor-pointer"
            style={{ backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%2378716c\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3E%3C/svg%3E")', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25rem', backgroundRepeat: 'no-repeat' }}
          >
            <option value="pricing" className="bg-[#1A1716]">Pricing & Placement Questions</option>
            <option value="availability" className="bg-[#1A1716]">Check Category Availability</option>
            <option value="spot_help" className="bg-[#1A1716]">Help Choosing a Spot</option>
            <option value="assisted_setup" className="bg-[#1A1716]">Done-For-You Setup</option>
            <option value="future_interest" className="bg-[#1A1716]">Future Campaign Interest</option>
            <option value="other" className="bg-[#1A1716]">Other</option>
          </select>
        </div>

        {/* Message (Full Width) */}
        <div className="col-span-1 md:col-span-2 space-y-1.5">
          <label htmlFor="message" className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
            Your Message or Questions
          </label>
          <textarea
            id="message"
            rows={4}
            maxLength={2000}
            disabled={loading}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your business, the offer you want to promote, or ask us any questions."
            className="w-full rounded-none border border-stone-800 bg-[#211D1C] px-4 py-3.5 text-sm text-[#FAF8F4] placeholder:text-stone-600 focus:outline-none focus:border-nh-red transition-all resize-none"
          />
          <div className="text-[10px] text-stone-500 font-mono uppercase tracking-wider text-right">
            {message.length} / 2000 characters
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center bg-nh-red hover:bg-[#b03015] border border-nh-red text-white font-headline text-sm font-bold uppercase tracking-wider py-4 transition-colors cursor-pointer select-none rounded-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin h-4 w-4 text-white" />
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              Send My Info & Get Help Now <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-stone-500 font-mono uppercase tracking-widest pt-3 select-none">
          <Lock className="h-3 w-3 text-stone-600" />
          <span>Your information is safe and will never be shared.</span>
        </div>
      </div>
    </form>
  )
}
