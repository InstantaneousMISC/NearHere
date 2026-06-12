"use client"

import { useState } from "react"
import { useUploadThing } from "@/lib/uploadthing"
import { trpc } from "@/components/providers"
import { findCategoryByName } from "@/data/advertiserCategories"
import { validatePhone, validateAndNormalizeUrl } from "@/lib/validation"

interface CreativeFormProps {
  token: string
  order: {
    advertiser: {
      businessName: string
      phone: string
      website: string | null
      businessAddress: string | null
    }
    campaignSpot?: {
      category?: {
        name: string
      }
    }
    campaign?: {
      status: string
    }
  }
  initialData: {
    businessName: string | null
    logoUrl: string | null
    additionalImages: string | null // stringified JSON
    headline: string | null
    offerDeal: string | null
    description: string | null
    cta: string | null
    phone: string | null
    website: string | null
    address: string | null
    serviceArea?: string | null
    hours?: string | null
    preferredCta?: string | null
    socialLinks?: any | null
    notes: string | null
    wantsAiHelp: boolean
    aiPrompt: string | null
    approvalStatus?: string | null
  } | null
}

export default function CreativeForm({ token, order, initialData }: CreativeFormProps) {
  const [businessName, setBusinessName] = useState(
    initialData?.businessName || order.advertiser.businessName || ""
  )
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "")

  const isPrintedOrMailed = 
    order.campaign?.status === "PRINTING" || 
    order.campaign?.status === "MAILED" || 
    order.campaign?.status === "READY_FOR_PRINT" ||
    initialData?.approvalStatus === "APPROVED" || 
    initialData?.approvalStatus === "PRINTED" || 
    initialData?.approvalStatus === "MAILED"
  
  // Parse additional images if they exist
  let parsedImages: string[] = []
  if (initialData?.additionalImages) {
    try {
      parsedImages = JSON.parse(initialData.additionalImages)
    } catch {
      parsedImages = []
    }
  }
  const [additionalImages, setAdditionalImages] = useState<string[]>(parsedImages)

  const [headline, setHeadline] = useState(initialData?.headline || "")
  const [offerDeal, setOfferDeal] = useState(initialData?.offerDeal || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [cta, setCta] = useState(initialData?.cta || "")
  const [phone, setPhone] = useState(initialData?.phone || order.advertiser.phone || "")
  const [website, setWebsite] = useState(initialData?.website || order.advertiser.website || "")
  const [address, setAddress] = useState(initialData?.address || order.advertiser.businessAddress || "")
  const [serviceArea, setServiceArea] = useState(initialData?.serviceArea || "")
  const [hours, setHours] = useState(initialData?.hours || "")

  // Parse social links
  let initialSocials: Record<string, string> = { facebook: "", instagram: "", twitter: "" }
  if (initialData?.socialLinks) {
    try {
      const parsed = typeof initialData.socialLinks === 'string'
        ? JSON.parse(initialData.socialLinks)
        : initialData.socialLinks
      initialSocials = { ...initialSocials, ...parsed }
    } catch {
      initialSocials = { facebook: "", instagram: "", twitter: "" }
    }
  }
  const [facebook, setFacebook] = useState(initialSocials.facebook || "")
  const [instagram, setInstagram] = useState(initialSocials.instagram || "")
  const [twitter, setTwitter] = useState(initialSocials.twitter || "")

  const [notes, setNotes] = useState(initialData?.notes || "")
  const [wantsAiHelp, setWantsAiHelp] = useState(initialData?.wantsAiHelp || false)
  const [aiPrompt, setAiPrompt] = useState(initialData?.aiPrompt || "")

  // Get category-specific suggested offers based on confirmed spot category
  const categoryName = order.campaignSpot?.category?.name || ""
  const categoryData = findCategoryByName(categoryName)
  const suggestedOffers = categoryData?.idealOffers || []

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  // UploadThing hook for Logo Uploader
  const { startUpload: startLogoUpload, isUploading: isLogoUploading } = useUploadThing(
    "logoUploader",
    {
      onClientUploadComplete: (res) => {
        if (res && res[0]) {
          setLogoUrl(res[0].ufsUrl)
        }
      },
      onUploadError: (err) => {
        setError(`Logo upload failed: ${err.message}`)
      },
    }
  )

  // UploadThing hook for Additional Images Uploader
  const { startUpload: startImagesUpload, isUploading: isImagesUploading } = useUploadThing(
    "additionalImages",
    {
      onClientUploadComplete: (res) => {
        if (res) {
          const urls = res.map((f) => f.ufsUrl)
          setAdditionalImages((prev) => [...prev, ...urls].slice(0, 5))
        }
      },
      onUploadError: (err) => {
        setError(`Images upload failed: ${err.message}`)
      },
    }
  )

  const upsertMutation = trpc.creative.upsert.useMutation()

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setError(null)
      await startLogoUpload([file])
    }
  }

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length > 0) {
      if (additionalImages.length + files.length > 5) {
        setError("You can only upload up to 5 additional showcase images.")
        return
      }
      setError(null)
      await startImagesUpload(files)
    }
  }

  const handleRemoveImage = (indexToRemove: number) => {
    setAdditionalImages((prev) => prev.filter((_, idx) => idx !== indexToRemove))
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaveLoading(true)

    if (!businessName.trim()) {
      setError("Business display name is required.")
      setSaveLoading(false)
      return
    }

    if (phone.trim() && !validatePhone(phone)) {
      setError("Please enter a valid phone number (at least 10 digits).")
      setSaveLoading(false)
      return
    }

    let normalizedWebsite = website.trim()
    if (normalizedWebsite) {
      const normalized = validateAndNormalizeUrl(normalizedWebsite)
      if (!normalized) {
        setError("Please enter a valid website URL.")
        setSaveLoading(false)
        return
      }
      normalizedWebsite = normalized
    }

    let normalizedFacebook = facebook.trim()
    if (normalizedFacebook) {
      const normalized = validateAndNormalizeUrl(normalizedFacebook)
      if (!normalized) {
        setError("Please enter a valid Facebook URL.")
        setSaveLoading(false)
        return
      }
      normalizedFacebook = normalized
    }

    let normalizedInstagram = instagram.trim()
    if (normalizedInstagram) {
      const normalized = validateAndNormalizeUrl(normalizedInstagram)
      if (!normalized) {
        setError("Please enter a valid Instagram URL.")
        setSaveLoading(false)
        return
      }
      normalizedInstagram = normalized
    }

    let normalizedTwitter = twitter.trim()
    if (normalizedTwitter) {
      const normalized = validateAndNormalizeUrl(normalizedTwitter)
      if (!normalized) {
        setError("Please enter a valid Twitter/X URL.")
        setSaveLoading(false)
        return
      }
      normalizedTwitter = normalized
    }

    try {
      await upsertMutation.mutateAsync({
        token,
        businessName,
        logoUrl: logoUrl || undefined,
        additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
        headline: headline.trim() ? headline : undefined,
        offerDeal: offerDeal.trim() ? offerDeal : undefined,
        description: description.trim() ? description : undefined,
        cta: cta.trim() ? cta : undefined,
        phone: phone.trim() ? phone : undefined,
        website: normalizedWebsite || undefined,
        address: address.trim() ? address : undefined,
        serviceArea: serviceArea.trim() ? serviceArea : undefined,
        hours: hours.trim() ? hours : undefined,
        preferredCta: cta.trim() ? cta : undefined,
        socialLinks: { facebook: normalizedFacebook, instagram: normalizedInstagram, twitter: normalizedTwitter },
        notes: notes.trim() ? notes : undefined,
        wantsAiHelp,
        aiPrompt: wantsAiHelp && aiPrompt.trim() ? aiPrompt : undefined,
      })
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Failed to submit. Please try again.")
    } finally {
      setSaveLoading(false)
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8">
      {/* Introduction Copy */}
      <div className="rounded-none border border-border bg-[#FAF8F4] p-5 text-sm text-press leading-relaxed font-sans space-y-2">
        <h4 className="font-bold text-base uppercase text-primary tracking-wide">Postcard Ad & Business Profile Details</h4>
        <p>
          Use this form to send us the details needed to build your postcard ad and your included NearHere Business Profile. Your profile can feature your business description, offer, phone number, service area, website link, and QR campaign destination.
        </p>
      </div>

      {isPrintedOrMailed && (
        <div className="rounded-none bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-800 font-medium font-sans">
          ⚠️ One or more of your postcard campaigns has already been printed or mailed. Changes here may update your digital landing page, but they will not change the physical postcard.
        </div>
      )}

      {error && (
        <div className="rounded-none bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-sm text-red-500 font-medium font-mono uppercase tracking-wide">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="rounded-none bg-emerald-500/10 border border-emerald-500/20 px-4 py-3.5 text-sm text-emerald-600 font-semibold text-center font-mono uppercase tracking-wide">
          🎉 Creative details saved successfully! Your assets are now ready for design review.
        </div>
      )}

      {/* Basic Ad Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
          1. Brand Identifiers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Category (Read-only/Confirm) */}
          <div className="space-y-1.5 md:col-span-2 bg-stone-bg/30 p-3 border border-border/60">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Business Category
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={order.campaignSpot?.category?.name || "Local Business"}
              className="w-full rounded-none border border-border bg-stone-bg/50 px-4 py-2.5 text-xs text-muted-foreground focus:outline-none cursor-not-allowed uppercase font-mono tracking-wider font-bold"
            />
            <p className="text-[10px] leading-relaxed text-muted-foreground mt-1">
              Confirmed business category reserved for your campaign spot.
            </p>
          </div>

          {/* Business Display Name */}
          <div className="space-y-1.5">
            <label htmlFor="businessName" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Business Display Name <span className="text-primary">*</span>
            </label>
            <input
              id="businessName"
              type="text"
              required
              disabled={saveLoading || isPrintedOrMailed}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Display name on the card"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Logo Uploader */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Business Logo (PNG, JPG, SVG - Max 4MB)
            </label>
            <div className="flex items-center gap-4">
              <label className={`cursor-pointer inline-flex items-center justify-center bg-stone-bg hover:bg-stone-bg/85 border border-border text-foreground font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-3 rounded-none transition-colors ${isPrintedOrMailed ? "opacity-50 cursor-not-allowed" : ""}`}>
                {isLogoUploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={isLogoUploading || saveLoading || isPrintedOrMailed}
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
              {logoUrl && (
                <div className="relative w-12 h-12 border border-border bg-white rounded-none overflow-hidden flex items-center justify-center p-1 shadow-sm">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ad Copy */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
          2. Ad Copy & Deal Offer
        </h3>

        <div className="space-y-5">
          {/* Headline */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="headline" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Headline Copy
              </label>
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{headline.length}/80 chars</span>
            </div>
            <input
              id="headline"
              type="text"
              maxLength={80}
              disabled={saveLoading || isPrintedOrMailed}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Your Local Plumber Experts!"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Offer/Deal */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="offerDeal" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Offer / Promotion
              </label>
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{offerDeal.length}/160 chars</span>
            </div>
            <textarea
              id="offerDeal"
              maxLength={160}
              rows={2}
              disabled={saveLoading || isPrintedOrMailed}
              value={offerDeal}
              onChange={(e) => setOfferDeal(e.target.value)}
              placeholder="e.g. $50 OFF any service call! Mention this card. Expires 12/31."
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            
            {/* Suggested Offers suggestions grid */}
            {suggestedOffers.length > 0 && !isPrintedOrMailed && (
              <div className="space-y-2 pt-1 pb-2">
                <span className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#77706A]">
                  💡 Suggested Offers for {categoryName} (click to pre-fill):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedOffers.map((offer, idx) => {
                    const isSelected = offerDeal === offer
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setOfferDeal(offer)}
                        className={`text-left text-xs p-3 border transition-all duration-200 select-none cursor-pointer rounded-none flex items-center justify-between group ${
                          isSelected
                            ? "bg-[#211D1C] text-[#FAF8F4] border-[#211D1C]"
                            : "bg-[#FAF8F4] text-[#211D1C] border-[#E7E0D8] hover:bg-[#FAF8F4]/80 hover:border-[#211D1C] hover:-translate-y-[1px]"
                        }`}
                      >
                        <span className="font-sans font-medium line-clamp-2 pr-2 leading-relaxed">{offer}</span>
                        <span className={`text-[9px] font-mono uppercase font-bold shrink-0 transition-opacity ${
                          isSelected ? "text-[#C9993E] opacity-100" : "opacity-0 group-hover:opacity-100 text-[#D13F1F]"
                        }`}>
                          {isSelected ? "Active" : "Use Offer"}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="rounded-none bg-primary/5 border border-primary/20 p-3 mt-1.5 text-[11px] text-muted-foreground leading-relaxed font-sans">
              <span className="font-bold text-foreground">Make the value easy to understand:</span>{" "}
              Examples include <span className="font-semibold text-primary">"$50 off a completed service"</span>,{" "}
              <span className="font-semibold text-primary">"10% off a first project"</span>, or{" "}
              <span className="font-semibold text-primary">"Free estimate"</span>. Offers must be accurate and include any important restrictions.
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="description" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Business Description
              </label>
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{description.length}/300 chars</span>
            </div>
            <textarea
              id="description"
              maxLength={300}
              rows={3}
              disabled={saveLoading || isPrintedOrMailed}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Friendly technicians, 24/7 emergency service, family-owned since 1999."
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Describe what you do in plain language. Aim for one short sentence that a homeowner
              can understand quickly.
            </p>
          </div>

          {/* CTA */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="cta" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
                Call to Action Text
              </label>
              <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{cta.length}/60 chars</span>
            </div>
            <input
              id="cta"
              type="text"
              maxLength={60}
              disabled={saveLoading || isPrintedOrMailed}
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="e.g. Call today to book your appointment!"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Use a direct next step such as "Call for an estimate," "Scan to book," or "Visit our
              website."
            </p>
          </div>
        </div>
      </div>

      {/* Ad Contact Info */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
          3. Ad Display Contact Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="displayPhone" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Phone Number
            </label>
            <input
              id="displayPhone"
              type="tel"
              disabled={saveLoading || isPrintedOrMailed}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <label htmlFor="displayWebsite" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Website URL
            </label>
            <input
              id="displayWebsite"
              type="url"
              disabled={saveLoading || isPrintedOrMailed}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-[9px] leading-relaxed text-muted-foreground mt-1 font-mono uppercase">
              We’ll use this for your business profile, postcard QR destination, and website backlink.
            </p>
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label htmlFor="displayAddress" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Address
            </label>
            <input
              id="displayAddress"
              type="text"
              disabled={saveLoading || isPrintedOrMailed}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Service Area */}
          <div className="space-y-1.5">
            <label htmlFor="displayServiceArea" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Service Area / City
            </label>
            <input
              id="displayServiceArea"
              type="text"
              disabled={saveLoading || isPrintedOrMailed}
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="e.g. Converse, TX & surrounding areas"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Hours */}
          <div className="space-y-1.5">
            <label htmlFor="displayHours" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Hours (if provided)
            </label>
            <input
              id="displayHours"
              type="text"
              disabled={saveLoading || isPrintedOrMailed}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. Mon-Fri: 8AM - 5PM"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Social Links Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
          3.5. Social Links (Optional)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Facebook */}
          <div className="space-y-1.5">
            <label htmlFor="facebookLink" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Facebook URL
            </label>
            <input
              id="facebookLink"
              type="url"
              disabled={saveLoading}
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="https://facebook.com/yourpage"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Instagram */}
          <div className="space-y-1.5">
            <label htmlFor="instagramLink" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Instagram URL
            </label>
            <input
              id="instagramLink"
              type="url"
              disabled={saveLoading}
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="https://instagram.com/yourprofile"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Twitter */}
          <div className="space-y-1.5">
            <label htmlFor="twitterLink" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Twitter / X URL
            </label>
            <input
              id="twitterLink"
              type="url"
              disabled={saveLoading}
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="https://x.com/yourhandle"
              className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="border border-border bg-stone-bg/30 p-4 text-xs leading-relaxed text-muted-foreground">
        <span className="font-bold text-foreground">Your unique QR destination:</span> NearHere
        creates the QR code for your placement. It links to your local business page and supports
        basic scan activity reporting, so you do not need to upload a QR code.
      </div>

      {/* Image Showcase */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground border-b border-border pb-2">
          4. Optional Business Images (Work, Team, or Products - Max 5, 8MB each)
        </h3>

        <div className="space-y-4">
          <label className="cursor-pointer inline-flex items-center justify-center bg-stone-bg hover:bg-stone-bg/85 border border-border text-foreground font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-3 rounded-none transition-colors">
            {isImagesUploading ? "Uploading Images..." : "Select Business Images"}
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={isImagesUploading || saveLoading || additionalImages.length >= 5}
              onChange={handleImagesChange}
              className="hidden"
            />
          </label>

          {/* Additional Images Preview Grid */}
          {additionalImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {additionalImages.map((img, idx) => (
                <div key={idx} className="relative aspect-square border border-border bg-white rounded-none overflow-hidden shadow-sm group">
                  <img src={img} alt="Business submission" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-none p-1 shadow transition-colors flex items-center justify-center"
                    style={{ width: "20px", height: "20px", fontSize: "10px", lineHeight: "1" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant (wantsAiHelp) */}
      <div className="space-y-4 pt-4 rounded-none border border-border bg-stone-bg/30 p-6">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={wantsAiHelp}
            onChange={(e) => setWantsAiHelp(e.target.checked)}
            disabled={saveLoading}
            className="w-5 h-5 text-primary border-border focus:ring-primary focus:ring-2 rounded-none mt-0.5"
          />
          <div>
            <span className="block text-sm font-bold text-foreground">Request Copy Help</span>
            <span className="block text-[10px] text-muted-foreground uppercase font-mono tracking-wider mt-1">NearHere can suggest headline and offer wording based on the notes you provide.</span>
          </div>
        </label>

        {wantsAiHelp && (
          <div className="space-y-1.5 pt-2">
            <label htmlFor="aiPrompt" className="block text-xs font-mono font-bold uppercase tracking-wider text-foreground">
              AI Creative Directives / Special Instructions
            </label>
            <textarea
              id="aiPrompt"
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Focus on our 24/7 service and friendliness. Headline should be humorous."
              className="w-full bg-background rounded-none border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2 pt-2">
        <label htmlFor="notes" className="block text-xs font-mono font-bold uppercase tracking-wider text-muted-foreground">
          Designer Instructions / Feedback Notes (Max 1000 characters)
        </label>
        <textarea
          id="notes"
          maxLength={1000}
          rows={4}
          disabled={saveLoading}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special details for our graphics designers? e.g. Prefer colors to match logo hex #23ff9a."
          className="w-full rounded-none border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saveLoading || isLogoUploading || isImagesUploading}
        className="w-full inline-flex items-center justify-center bg-foreground text-background border border-foreground font-bold tracking-wider uppercase text-sm py-4 transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none rounded-none"
      >
        {saveLoading ? "Submitting Creative Details..." : "Submit Creative Details"}
      </button>
    </form>
  )
}
