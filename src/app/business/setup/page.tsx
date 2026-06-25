"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { BusinessLinkType } from "@prisma/client"
import Link from "next/link"
import { useUploadThing } from "@/lib/uploadthing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

export default function SetupWizardPage() {
  const router = useRouter()
  const utils = trpc.useUtils()

  // Queries
  const { data: business, isLoading: businessLoading } = trpc.business.getMyBusiness.useQuery()
  const { data: orders, isLoading: ordersLoading } = trpc.business.getMyOrders.useQuery()

  const isPrintedOrMailed = React.useMemo(() => {
    if (!orders) return false
    return orders.some((order) => {
      const campaignStatus = order.campaign.status
      const creativeStatus = order.creativeSubmission?.approvalStatus
      return (
        campaignStatus === "PRINTING" ||
        campaignStatus === "MAILED" ||
        campaignStatus === "READY_FOR_PRINT" ||
        creativeStatus === "PRINTED" ||
        creativeStatus === "MAILED" ||
        creativeStatus === "APPROVED"
      )
    })
  }, [orders])

  // Mutations
  const updateProfileMutation = trpc.business.updateProfile.useMutation()
  const upsertLinkMutation = trpc.business.upsertLink.useMutation()

  // Wizard States
  const [step, setStep] = useState(1)
  const totalSteps = 6

  // Form States
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [zipCode, setZipCode] = useState("")

  // Links States (booking, socials)
  const [bookingUrl, setBookingUrl] = useState("")
  const [facebookUrl, setFacebookUrl] = useState("")
  const [instagramUrl, setInstagramUrl] = useState("")

  // Validation Error States
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

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
        setErrors((prev) => ({ ...prev, logoUrl: `Logo upload failed: ${err.message}` }))
      },
    }
  )

  // UploadThing hook for Cover Image Uploader
  const { startUpload: startCoverUpload, isUploading: isCoverUploading } = useUploadThing(
    "logoUploader",
    {
      onClientUploadComplete: (res) => {
        if (res && res[0]) {
          setCoverImageUrl(res[0].ufsUrl)
        }
      },
      onUploadError: (err) => {
        setErrors((prev) => ({ ...prev, coverImageUrl: `Cover upload failed: ${err.message}` }))
      },
    }
  )

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.logoUrl
        return next
      })
      await startLogoUpload([file])
    }
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.coverImageUrl
        return next
      })
      await startCoverUpload([file])
    }
  }

  // Sync business data to form states when loaded
  useEffect(() => {
    if (business) {
      setName(business.name || "")
      setDescription(business.description || "")
      setPhone(business.phone || "")
      setEmail(business.email || "")
      setWebsite(business.website || "")
      setLogoUrl(business.logoUrl || "")
      setCoverImageUrl(business.coverImageUrl || "")
      setAddress(business.address || "")
      setCity(business.city || "")
      setState(business.state || "")
      setZipCode(business.zipCode || "")

      // Extract existing links
      const booking = business.links.find((l) => l.type === BusinessLinkType.BOOKING)
      if (booking) setBookingUrl(booking.url)

      const fb = business.links.find((l) => l.type === BusinessLinkType.FACEBOOK)
      if (fb) setFacebookUrl(fb.url)

      const insta = business.links.find((l) => l.type === BusinessLinkType.INSTAGRAM)
      if (insta) setInstagramUrl(insta.url)
    }
  }, [business])

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!name.trim()) {
        newErrors.name = "Business name is required."
      }
    }

    if (currentStep === 2) {
      // Must provide either phone or website, but allow others optional
      if (!phone.trim() && !website.trim()) {
        newErrors.contact = "Please provide either a phone number or a website URL so customers can reach you."
      }
      if (website.trim()) {
        try {
          new URL(website)
        } catch {
          newErrors.website = "Please enter a valid website URL (including https://)."
        }
      }
      if (email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
          newErrors.email = "Please enter a valid email address."
        }
      }
    }

    if (currentStep === 3) {
      if (bookingUrl.trim()) {
        try {
          new URL(bookingUrl)
        } catch {
          newErrors.bookingUrl = "Please enter a valid URL (including https://)."
        }
      }
      if (facebookUrl.trim()) {
        try {
          new URL(facebookUrl)
        } catch {
          newErrors.facebookUrl = "Please enter a valid URL (including https://)."
        }
      }
      if (instagramUrl.trim()) {
        try {
          new URL(instagramUrl)
        } catch {
          newErrors.instagramUrl = "Please enter a valid URL (including https://)."
        }
      }
    }

    if (currentStep === 4) {
      if (logoUrl.trim()) {
        try {
          new URL(logoUrl)
        } catch {
          newErrors.logoUrl = "Please enter a valid image URL."
        }
      }
      if (coverImageUrl.trim()) {
        try {
          new URL(coverImageUrl)
        } catch {
          newErrors.coverImageUrl = "Please enter a valid image URL."
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1))
  }

  const handleSaveAndLaunch = async () => {
    if (!validateStep(step)) return
    setSaving(true)

    try {
      // 1. Save Core profile details
      await updateProfileMutation.mutateAsync({
        name,
        description,
        phone,
        email,
        website,
        logoUrl,
        coverImageUrl,
        address,
        city,
        state,
        zipCode,
      })

      // 2. Save Custom Links
      if (business) {
        // Booking link
        const existingBooking = business.links.find((l) => l.type === BusinessLinkType.BOOKING)
        if (bookingUrl.trim()) {
          await upsertLinkMutation.mutateAsync({
            id: existingBooking?.id,
            type: BusinessLinkType.BOOKING,
            label: "Book Appointment",
            url: bookingUrl,
            sortOrder: 1,
            isActive: true,
          })
        } else if (existingBooking) {
          // If cleared, we could optionally leave or deactivate, but we keep it simple
        }

        // Facebook link
        const existingFb = business.links.find((l) => l.type === BusinessLinkType.FACEBOOK)
        if (facebookUrl.trim()) {
          await upsertLinkMutation.mutateAsync({
            id: existingFb?.id,
            type: BusinessLinkType.FACEBOOK,
            label: "Facebook Page",
            url: facebookUrl,
            sortOrder: 2,
            isActive: true,
          })
        }

        // Instagram link
        const existingInsta = business.links.find((l) => l.type === BusinessLinkType.INSTAGRAM)
        if (instagramUrl.trim()) {
          await upsertLinkMutation.mutateAsync({
            id: existingInsta?.id,
            type: BusinessLinkType.INSTAGRAM,
            label: "Instagram Profile",
            url: instagramUrl,
            sortOrder: 3,
            isActive: true,
          })
        }
      }

      await utils.business.getMyBusiness.invalidate()
      router.push("/business/dashboard")
    } catch (err) {
      console.error("Failed to complete setup wizard:", err)
      alert("An error occurred while saving your details. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const isLoading = businessLoading || ordersLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-center items-center font-sans">
        <div className="w-12 h-12 border-4 border-[#D13F1F] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-widest text-[#77706A]">Loading Setup Wizard...</p>
      </div>
    )
  }

  // Get active creative submission details from the orders
  const activeOrder = orders?.find((o) => o.status === "PAID")
  const creative = activeOrder?.creativeSubmission

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between font-sans selection:bg-primary selection:text-primary-foreground select-none">
      
      {/* Header Branding */}
      <header className="py-6 border-b border-border bg-background shrink-0">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="font-headline font-black text-xl tracking-tighter text-primary flex items-center gap-0.5">
            <span className="text-press">Near</span>Here
          </div>
          <span className="font-mono text-[9px] font-bold text-warm uppercase tracking-wider bg-press/5 px-2 py-1">
            Setup Step {step} of {totalSteps}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <Card className="p-8 space-y-6 shadow-none">
          
          {/* Step Progress Bar */}
          <div className="w-full bg-border h-1.5 rounded-none overflow-hidden mb-4">
            <div 
              style={{ width: `${(step / totalSteps) * 100}%` }}
              className="bg-primary h-full transition-all duration-300"
            />
          </div>

          {isPrintedOrMailed && (
            <div className="rounded-none bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-800 font-medium font-sans animate-fade-up">
              ⚠️ One or more of your postcard campaigns has already been printed or mailed. Changes here may update your digital landing page, but they will not change the physical postcard.
            </div>
          )}

          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-up">
              <div className="space-y-1">
                <h2 className="font-headline font-black uppercase text-lg text-press leading-none">
                  Step 1: Business Basics
                </h2>
                <p className="text-xs text-warm">
                  Define the core name and description of your business profile.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Business Name *
                  </label>
                  <Input
                    type="text"
                    required
                    disabled={isPrintedOrMailed}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Converse Plumbing Pros"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.name}</p>}
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Business Tagline / Description (Optional)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Briefly describe what services you offer to local homeowners..."
                    className="resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Street Address (Optional)
                  </label>
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Commerce St"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                      City
                    </label>
                    <Input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Converse"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                      State
                    </label>
                    <Input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="TX"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                      Zip
                    </label>
                    <Input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="78109"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTACT */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-up">
              <div className="space-y-1">
                <h2 className="font-headline font-black uppercase text-lg text-press leading-none">
                  Step 2: Contact Information
                </h2>
                <p className="text-xs text-warm">
                  How should local residents reach your business? Provide either a phone number or a website.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {errors.contact && (
                  <div className="bg-[#FBEBE8] border border-[#E85D44] text-[#801B0B] text-xs p-3 rounded-none font-medium">
                    ⚠️ {errors.contact}
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    disabled={isPrintedOrMailed}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 210-555-0199"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Website URL
                  </label>
                  <Input
                    type="url"
                    disabled={isPrintedOrMailed}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://mybusiness.com"
                  />
                  {errors.website && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.website}</p>}
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Email Address (Optional)
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@mybusiness.com"
                  />
                  {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.email}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: ACTION LINKS */}
          {step === 3 && (
            <div className="space-y-4 animate-fade-up">
              <div className="space-y-1">
                <h2 className="font-headline font-black uppercase text-lg text-press leading-none">
                  Step 3: Social & Action Links
                </h2>
                <p className="text-xs text-warm">
                  Add optional booking, Facebook, or Instagram links for visitors to your business page.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Booking / Scheduling URL
                  </label>
                  <Input
                    type="url"
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    placeholder="e.g. https://calendly.com/mybusiness"
                  />
                  {errors.bookingUrl && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.bookingUrl}</p>}
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Facebook Page URL
                  </label>
                  <Input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/mybusiness"
                  />
                  {errors.facebookUrl && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.facebookUrl}</p>}
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Instagram Profile URL
                  </label>
                  <Input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/mybusiness"
                  />
                  {errors.instagramUrl && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.instagramUrl}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: VISUAL ASSETS */}
          {step === 4 && (
            <div className="space-y-4 animate-fade-up">
              <div className="space-y-1">
                <h2 className="font-headline font-black uppercase text-lg text-press leading-none">
                  Step 4: Branding & Images
                </h2>
                <p className="text-xs text-warm">
                  Upload or select files for your business logo and cover header image (both optional).
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {/* Logo Image */}
                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Business Logo (PNG, JPG, SVG - Max 4MB)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className={`cursor-pointer inline-flex items-center justify-center bg-press/5 hover:bg-press/10 border border-border text-press font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-3 rounded-none transition-colors ${isPrintedOrMailed ? "opacity-50 cursor-not-allowed" : ""}`}>
                      {isLogoUploading ? "Uploading..." : logoUrl ? "Change Logo" : "Upload Logo"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isLogoUploading || isPrintedOrMailed}
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    {logoUrl && (
                      <div className="relative w-12 h-12 border border-border bg-card rounded-none overflow-hidden flex items-center justify-center p-1 shadow-sm">
                        <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                  </div>
                  {errors.logoUrl && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.logoUrl}</p>}
                </div>

                {/* Cover Image */}
                <div>
                  <label className="block text-[9px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Cover Header Image (PNG, JPG - Max 4MB)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="cursor-pointer inline-flex items-center justify-center bg-press/5 hover:bg-press/10 border border-border text-press font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-3 rounded-none transition-colors">
                      {isCoverUploading ? "Uploading..." : coverImageUrl ? "Change Cover" : "Upload Cover"}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isCoverUploading}
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
                    {coverImageUrl && (
                      <div className="relative h-12 w-32 border border-border bg-card rounded-none overflow-hidden flex items-center justify-center shadow-sm">
                        <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  {errors.coverImageUrl && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.coverImageUrl}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: POSTCARD CREATIVE REVIEW */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-up">
              <div className="space-y-1">
                <h2 className="font-headline font-black uppercase text-lg text-press leading-none">
                  Step 5: Postcard Creative Review
                </h2>
                <p className="text-xs text-warm">
                  This is the exclusive printed postcard deal details associated with your campaign purchase. It is locked because it represents printed physical material.
                </p>
              </div>

              {creative ? (
                <div className="bg-card border border-border p-4 text-left space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-border pb-1.5">
                    <span className="text-warm uppercase">Headline</span>
                    <span className="font-sans font-bold text-press">{creative.headline || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-1.5">
                    <span className="text-warm uppercase">Deal / Offer</span>
                    <span className="font-sans font-extrabold text-primary uppercase">{creative.offerDeal || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-1.5">
                    <span className="text-warm uppercase">Creative Phone</span>
                    <span className="text-press">{creative.phone || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-warm uppercase">Approval Status</span>
                    <Badge variant="secondary">
                      {creative.approvalStatus}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FDF9F2] border border-gold/30 p-4 text-left text-xs text-gold font-semibold">
                  📬 Postcard creative details have not been submitted yet. You can submit details after onboarding via the dashboard checklist.
                </div>
              )}
            </div>
          )}

          {/* STEP 6: PREVIEW & LAUNCH */}
          {step === 6 && (
            <div className="space-y-4 animate-fade-up">
              <div className="space-y-1">
                <h2 className="font-headline font-black uppercase text-lg text-press leading-none">
                  Step 6: Preview & Launch
                </h2>
                <p className="text-xs text-warm">
                  Review your setup summary and launch your profile landing page.
                </p>
              </div>

              <div className="bg-card border border-border p-5 text-left space-y-3 text-xs">
                <p className="font-bold text-press uppercase font-mono text-[10px] tracking-widest">Setup Summary</p>
                <div className="space-y-1">
                  <p><strong>Business Name:</strong> {name}</p>
                  <p><strong>Phone:</strong> {phone || "None"}</p>
                  <p><strong>Website:</strong> {website || "None"}</p>
                  <p><strong>Booking Link:</strong> {bookingUrl ? "Configured" : "None"}</p>
                  <p><strong>Cover Image:</strong> {coverImageUrl ? "Custom URL" : "Default Gradient"}</p>
                </div>
              </div>

              <div className="p-4 bg-[#F3FAF6] border border-[#A7E2C4] text-[#1D5E3A] text-xs font-semibold leading-relaxed">
                🚀 Your digital landing page is compile-ready. Scan redirection paths will route active scans to your business profile slug `/b/{business?.slug}`.
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between border-t border-border pt-6 gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
              >
                ➔ Back
              </Button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <Button
                type="button"
                onClick={handleNext}
              >
                Continue ➔
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSaveAndLaunch}
                disabled={saving}
              >
                {saving ? "Saving Onboarding..." : "🚀 Finish & Launch Profile"}
              </Button>
            )}
          </div>

        </Card>
      </main>

      {/* Footer branding */}
      <footer className="py-6 text-center border-t border-border bg-press/5 shrink-0">
        <p className="text-[9px] font-mono tracking-widest uppercase text-warm">
          Powered by NearHere Neighborhood Mailers
        </p>
      </footer>

    </div>
  )
}
