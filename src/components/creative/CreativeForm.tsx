"use client"

import { useState } from "react"
import { useUploadThing } from "@/lib/uploadthing"
import { trpc } from "@/components/providers"

interface CreativeFormProps {
  token: string
  order: {
    advertiser: {
      businessName: string
      phone: string
      website: string | null
      businessAddress: string | null
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
    notes: string | null
    wantsAiHelp: boolean
    aiPrompt: string | null
  } | null
}

export default function CreativeForm({ token, order, initialData }: CreativeFormProps) {
  const [businessName, setBusinessName] = useState(
    initialData?.businessName || order.advertiser.businessName || ""
  )
  const [logoUrl, setLogoUrl] = useState(initialData?.logoUrl || "")
  
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
  const [notes, setNotes] = useState(initialData?.notes || "")
  const [wantsAiHelp, setWantsAiHelp] = useState(initialData?.wantsAiHelp || false)
  const [aiPrompt, setAiPrompt] = useState(initialData?.aiPrompt || "")

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
        website: website.trim() ? website : undefined,
        address: address.trim() ? address : undefined,
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
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3.5 text-sm text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3.5 text-sm text-emerald-800 font-semibold text-center">
          🎉 Creative details saved successfully! Your assets are now ready for design review.
        </div>
      )}

      {/* Basic Ad Info */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          1. Brand Identifiers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Display Name */}
          <div className="space-y-1.5">
            <label htmlFor="businessName" className="block text-sm font-semibold text-slate-700">
              Business Display Name <span className="text-red-500">*</span>
            </label>
            <input
              id="businessName"
              type="text"
              required
              disabled={saveLoading}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Display name on the card"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Logo Uploader */}
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700">
              Business Logo (PNG, JPG, SVG - Max 4MB)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-3 border border-slate-200 transition-colors">
                {isLogoUploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
                <input
                  type="file"
                  accept="image/*"
                  disabled={isLogoUploading || saveLoading}
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </label>
              {logoUrl && (
                <div className="relative w-12 h-12 border border-slate-200 bg-white rounded-lg overflow-hidden flex items-center justify-center p-1 shadow-sm">
                  <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ad Copy */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          2. Ad Copy & Deal Offer
        </h3>

        <div className="space-y-5">
          {/* Headline */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="headline" className="block text-sm font-semibold text-slate-700">
                Headline Copy
              </label>
              <span className="text-[10px] text-slate-400 font-medium">{headline.length}/80 chars</span>
            </div>
            <input
              id="headline"
              type="text"
              maxLength={80}
              disabled={saveLoading}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Your Local Converse Plumber Experts!"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Offer/Deal */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="offerDeal" className="block text-sm font-semibold text-slate-750">
                Special Offer / Promo Coupon
              </label>
              <span className="text-[10px] text-slate-400 font-medium">{offerDeal.length}/160 chars</span>
            </div>
            <textarea
              id="offerDeal"
              maxLength={160}
              rows={2}
              disabled={saveLoading}
              value={offerDeal}
              onChange={(e) => setOfferDeal(e.target.value)}
              placeholder="e.g. $50 OFF any service call! Mention this card. Expires 12/31."
              className="w-full rounded-none border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-background text-foreground"
            />
            <div className="rounded-none bg-primary/5 border border-primary/20 p-3 mt-1.5 text-[11px] text-slate-650 leading-relaxed font-sans">
              💡 <span className="font-bold text-slate-800">Pro-tip for maximum return:</span> We highly recommend offering a clear deal (such as <span className="font-semibold text-primary">"$50 OFF"</span>, <span className="font-semibold text-primary">"10% Discount"</span>, or a <span className="font-semibold text-primary">"Free Inspection"</span>). Direct-mail coupons create strong local value for homeowners and dramatically increase your booking rate.
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="description" className="block text-sm font-semibold text-slate-700">
                Short Description / Bullet Points
              </label>
              <span className="text-[10px] text-slate-400 font-medium">{description.length}/300 chars</span>
            </div>
            <textarea
              id="description"
              maxLength={300}
              rows={3}
              disabled={saveLoading}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Friendly technicians, 24/7 emergency service, family-owned since 1999."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* CTA */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="cta" className="block text-sm font-semibold text-slate-700">
                Call to Action
              </label>
              <span className="text-[10px] text-slate-400 font-medium">{cta.length}/60 chars</span>
            </div>
            <input
              id="cta"
              type="text"
              maxLength={60}
              disabled={saveLoading}
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="e.g. Call today to book your appointment!"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Ad Contact Info */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          3. Ad Display Contact Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="displayPhone" className="block text-sm font-semibold text-slate-700">
              Phone Number
            </label>
            <input
              id="displayPhone"
              type="tel"
              disabled={saveLoading}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Website */}
          <div className="space-y-1.5">
            <label htmlFor="displayWebsite" className="block text-sm font-semibold text-slate-700">
              Website URL
            </label>
            <input
              id="displayWebsite"
              type="url"
              disabled={saveLoading}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label htmlFor="displayAddress" className="block text-sm font-semibold text-slate-700">
              Address
            </label>
            <input
              id="displayAddress"
              type="text"
              disabled={saveLoading}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Image Showcase */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
          4. Ad Showcase Images (e.g. Work Samples, Staff - Max 5, 8MB each)
        </h3>

        <div className="space-y-4">
          <label className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-4 py-3 border border-slate-200 transition-colors">
            {isImagesUploading ? "Uploading Showcase..." : "Select Showcase Images"}
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
                <div key={idx} className="relative aspect-square border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm group">
                  <img src={img} alt="Showcase" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow transition-colors flex items-center justify-center"
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
      <div className="space-y-4 pt-4 rounded-2xl border border-blue-100 bg-blue-50/50 p-6">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={wantsAiHelp}
            onChange={(e) => setWantsAiHelp(e.target.checked)}
            disabled={saveLoading}
            className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 focus:ring-2"
          />
          <div>
            <span className="block text-sm font-bold text-blue-900">🪄 Request AI Design Assistant Copy Help</span>
            <span className="block text-[10px] text-blue-600">Our copywriting assistant will write headline ideas and offers based on your notes.</span>
          </div>
        </label>

        {wantsAiHelp && (
          <div className="space-y-1.5 pt-2">
            <label htmlFor="aiPrompt" className="block text-xs font-semibold text-blue-800">
              AI Creative Directives / Special Instructions
            </label>
            <textarea
              id="aiPrompt"
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Focus on our 24/7 service and friendliness. Headline should be humorous."
              className="w-full bg-white rounded-xl border border-blue-200 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-2 pt-2">
        <label htmlFor="notes" className="block text-sm font-semibold text-slate-700">
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
          className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={saveLoading || isLogoUploading || isImagesUploading}
        className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-6 py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]"
      >
        {saveLoading ? "Saving Ad Details..." : "Save Ad Details & Assets"}
      </button>
    </form>
  )
}
