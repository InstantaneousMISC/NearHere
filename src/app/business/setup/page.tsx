"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/lib/trpc/client"
import { BusinessLinkType } from "@prisma/client"
import Link from "next/link"

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
    <div className="min-h-screen bg-[#FAF8F4] flex flex-col justify-between font-sans selection:bg-[#D13F1F] selection:text-paper select-none">
      
      {/* Header Branding */}
      <header className="py-6 border-b border-[#E7E0D8] bg-[#FAF8F4] shrink-0">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="font-headline font-black text-xl tracking-tighter text-[#D13F1F] flex items-center gap-0.5">
            <span className="text-[#211D1C]">Near</span>Here
          </div>
          <span className="font-mono text-[9px] font-bold text-[#77706A] uppercase tracking-wider bg-[#211D1C]/5 px-2 py-1">
            Setup Step {step} of {totalSteps}
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-white border-2 border-[#211D1C] p-8 space-y-6 shadow-[0_15px_40px_rgba(33,29,28,0.06)] text-left">
          
          {/* Step Progress Bar */}
          <div className="w-full bg-[#E7E0D8] h-1.5 rounded-none overflow-hidden mb-4">
            <div 
              style={{ width: `${(step / totalSteps) * 100}%` }}
              className="bg-[#D13F1F] h-full transition-all duration-300"
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
                <h2 className="font-headline font-black uppercase text-lg text-[#211D1C] leading-none">
                  Step 1: Business Basics
                </h2>
                <p className="text-xs text-[#77706A]">
                  Define the core name and description of your business profile.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isPrintedOrMailed}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Converse Plumbing Pros"
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.name}</p>}
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Business Tagline / Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    placeholder="Briefly describe what services you offer to local homeowners..."
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Street Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="123 Commerce St"
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Converse"
                      className="w-full rounded-none border border-[#E7E0D8] px-2 py-2.5 text-sm text-[#211D1C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="TX"
                      className="w-full rounded-none border border-[#E7E0D8] px-2 py-2.5 text-sm text-[#211D1C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                      Zip
                    </label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="78109"
                      className="w-full rounded-none border border-[#E7E0D8] px-2 py-2.5 text-sm text-[#211D1C] focus:outline-none"
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
                <h2 className="font-headline font-black uppercase text-lg text-[#211D1C] leading-none">
                  Step 2: Contact Information
                </h2>
                <p className="text-xs text-[#77706A]">
                  How should local customers reach you? You must provide either a phone number or a website.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {errors.contact && (
                  <div className="bg-[#FBEBE8] border border-[#E85D44] text-[#801B0B] text-xs p-3 rounded-none font-medium">
                    ⚠️ {errors.contact}
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    disabled={isPrintedOrMailed}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 210-555-0199"
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="url"
                    disabled={isPrintedOrMailed}
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://mybusiness.com"
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {errors.website && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.website}</p>}
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@mybusiness.com"
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C]"
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
                <h2 className="font-headline font-black uppercase text-lg text-[#211D1C] leading-none">
                  Step 3: Social & Action Links
                </h2>
                <p className="text-xs text-[#77706A]">
                  Add booking, Facebook, or Instagram links to redirect scanning customers (all links are optional).
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Booking / Scheduling URL
                  </label>
                  <input
                    type="url"
                    value={bookingUrl}
                    onChange={(e) => setBookingUrl(e.target.value)}
                    placeholder="e.g. https://calendly.com/mybusiness"
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C]"
                  />
                  {errors.bookingUrl && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.bookingUrl}</p>}
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={facebookUrl}
                    onChange={(e) => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/mybusiness"
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C]"
                  />
                  {errors.facebookUrl && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.facebookUrl}</p>}
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Instagram Profile URL
                  </label>
                  <input
                    type="url"
                    value={instagramUrl}
                    onChange={(e) => setInstagramUrl(e.target.value)}
                    placeholder="https://instagram.com/mybusiness"
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C]"
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
                <h2 className="font-headline font-black uppercase text-lg text-[#211D1C] leading-none">
                  Step 4: Branding & Images
                </h2>
                <p className="text-xs text-[#77706A]">
                  Upload URLs for your business logo and cover header image (both optional).
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Logo Image URL
                  </label>
                  <input
                    type="url"
                    disabled={isPrintedOrMailed}
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none focus:border-[#211D1C] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {errors.logoUrl && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.logoUrl}</p>}
                </div>

                <div>
                  <label className="block text-[9px] font-mono font-bold text-[#77706A] uppercase tracking-wider mb-1.5">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-none border border-[#E7E0D8] px-3.5 py-2.5 text-sm text-[#211D1C] focus:outline-none"
                  />
                  {errors.coverImageUrl && <p className="text-[10px] text-red-500 font-bold mt-1">⚠️ {errors.coverImageUrl}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: POSTCARD CREATIVE REVIEW */}
          {step === 5 && (
            <div className="space-y-4 animate-fade-up">
              <div className="space-y-1">
                <h2 className="font-headline font-black uppercase text-lg text-[#211D1C] leading-none">
                  Step 5: Postcard Creative Review
                </h2>
                <p className="text-xs text-[#77706A]">
                  This is the exclusive printed postcard deal details associated with your campaign purchase. It is locked because it represents printed physical material.
                </p>
              </div>

              {creative ? (
                <div className="bg-[#FAF8F4] border border-[#211D1C] p-4 text-left space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-[#E7E0D8] pb-1.5">
                    <span className="text-[#77706A] uppercase">Headline</span>
                    <span className="font-sans font-bold text-[#211D1C]">{creative.headline || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E7E0D8] pb-1.5">
                    <span className="text-[#77706A] uppercase">Deal / Offer</span>
                    <span className="font-sans font-extrabold text-[#D13F1F] uppercase">{creative.offerDeal || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E7E0D8] pb-1.5">
                    <span className="text-[#77706A] uppercase">Creative Phone</span>
                    <span className="text-[#211D1C]">{creative.phone || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#77706A] uppercase">Approval Status</span>
                    <span className="bg-[#211D1C] text-paper px-2 py-0.5 font-bold uppercase tracking-wider text-[10px]">
                      {creative.approvalStatus}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#FDF9F2] border border-[#C9993E] p-4 text-left text-xs text-[#5C4212] font-semibold">
                  📬 Postcard creative details have not been submitted yet. You can submit details after onboarding via the dashboard checklist.
                </div>
              )}
            </div>
          )}

          {/* STEP 6: PREVIEW & LAUNCH */}
          {step === 6 && (
            <div className="space-y-4 animate-fade-up">
              <div className="space-y-1">
                <h2 className="font-headline font-black uppercase text-lg text-[#211D1C] leading-none">
                  Step 6: Preview & Launch
                </h2>
                <p className="text-xs text-[#77706A]">
                  Review your setup summary and launch your profile landing page.
                </p>
              </div>

              <div className="bg-[#FAF8F4] border border-[#E7E0D8] p-5 text-left space-y-3 text-xs">
                <p className="font-bold text-[#211D1C] uppercase font-mono text-[10px] tracking-widest">Setup Summary</p>
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
          <div className="flex justify-between border-t border-[#E7E0D8] pt-6 gap-3">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 border border-[#211D1C] hover:bg-[#E7E0D8] font-bold text-xs uppercase tracking-wider text-[#211D1C] transition-colors cursor-pointer"
              >
                ➔ Back
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-[#211D1C] hover:bg-[#FAF8F4] text-[#FAF8F4] hover:text-[#211D1C] border border-[#211D1C] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Continue ➔
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveAndLaunch}
                disabled={saving}
                className="px-6 py-2.5 bg-[#D13F1F] hover:bg-[#B53A1A] text-paper border border-[#211D1C] font-bold text-xs uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving Onboarding..." : "🚀 Finish & Launch Profile"}
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Footer branding */}
      <footer className="py-6 text-center border-t border-[#E7E0D8] bg-[#211D1C]/5 shrink-0">
        <p className="text-[9px] font-mono tracking-widest uppercase text-[#77706A]">
          Powered by NearHere Neighborhood Mailers
        </p>
      </footer>

    </div>
  )
}
