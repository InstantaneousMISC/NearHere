"use client"

import React, { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { BusinessLinkType } from "@prisma/client"
import { useUploadThing } from "@/lib/uploadthing"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { PREPOPULATED_SERVICES, GENERAL_SERVICES } from "@/lib/constants"

function addHttps(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  return /^https:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^http:\/\//i, "")}`
}

export default function BusinessProfilePage() {
  const utils = trpc.useUtils()
  
  // Links are now shown inline below the primary profile editor.
  const [activeTab, setActiveTab] = useState<"profile" | "links">("profile")
  const [showComparison, setShowComparison] = useState(false)

  // Query profile details and pending requests
  const { data: business, isLoading: isBusinessLoading } = trpc.business.getMyBusiness.useQuery()
  const { data: orders, isLoading: isLoadingOrders } = trpc.business.getMyOrders.useQuery()
  const { data: pendingRequest, isLoading: isLoadingPending } = trpc.business.getPendingChangeRequest.useQuery()

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
  const updateProfileMutation = trpc.business.updateProfile.useMutation({
    onSuccess: () => {
      utils.business.getMyBusiness.invalidate()
      utils.business.getPendingChangeRequest.invalidate()
      alert("Profile update request submitted successfully for admin review!")
    },
    onError: (err) => {
      alert(`Error updating profile: ${err.message}`)
    },
  })

  const upsertLinkMutation = trpc.business.upsertLink.useMutation({
    onSuccess: () => {
      utils.business.getMyBusiness.invalidate()
      resetLinkForm()
      alert("Link saved successfully!")
    },
    onError: (err) => {
      alert(`Error saving link: ${err.message}`)
    },
  })

  const deleteLinkMutation = trpc.business.deleteLink.useMutation({
    onSuccess: () => {
      utils.business.getMyBusiness.invalidate()
      alert("Link deleted successfully!")
    },
    onError: (err) => {
      alert(`Error deleting link: ${err.message}`)
    },
  })

  // Profile Form States
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
  const [serviceArea, setServiceArea] = useState("")
  const [hours, setHours] = useState("")
  const [preferredCta, setPreferredCta] = useState("")
  const [facebook, setFacebook] = useState("")
  const [instagram, setInstagram] = useState("")
  const [twitter, setTwitter] = useState("")
  const [establishedYear, setEstablishedYear] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [services, setServices] = useState<any[]>([])
  const [customService, setCustomService] = useState("")
  const [customServiceDesc, setCustomServiceDesc] = useState("")
  const [photos, setPhotos] = useState<string[]>([])
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null)
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null)
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null)

  const { startUpload: startLogoUpload, isUploading: isLogoUploading } = useUploadThing(
    "logoUploader",
    {
      onClientUploadComplete: (files) => {
        const uploadedFile = files?.[0]
        if (!uploadedFile) {
          setLogoUploadError("The logo upload did not return a file. Please try again.")
          return
        }

        setLogoUrl(uploadedFile.ufsUrl)
        setLogoUploadError(null)
      },
      onUploadError: (error) => {
        setLogoUploadError(`Logo upload failed: ${error.message}`)
      },
    }
  )

  const { startUpload: startCoverUpload, isUploading: isCoverUploading } = useUploadThing(
    "logoUploader",
    {
      onClientUploadComplete: (files) => {
        const uploadedFile = files?.[0]
        if (!uploadedFile) {
          setCoverUploadError("The cover upload did not return a file. Please try again.")
          return
        }

        setCoverImageUrl(uploadedFile.ufsUrl)
        setCoverUploadError(null)
      },
      onUploadError: (error) => {
        setCoverUploadError(`Cover upload failed: ${error.message}`)
      },
    }
  )

  const { startUpload: startGalleryUpload, isUploading: isGalleryUploading } = useUploadThing(
    "galleryUploader",
    {
      onClientUploadComplete: (files) => {
        const uploadedUrls = (files || []).map((file) => file.ufsUrl).filter(Boolean)
        if (uploadedUrls.length === 0) {
          setGalleryUploadError("The gallery upload did not return any images. Please try again.")
          return
        }

        setPhotos((current) => Array.from(new Set([...current, ...uploadedUrls])).slice(0, 10))
        setGalleryUploadError(null)
      },
      onUploadError: (error) => {
        setGalleryUploadError(`Gallery upload failed: ${error.message}`)
      },
    }
  )

  // Link Form States
  const [linkId, setLinkId] = useState<string | undefined>(undefined)
  const [linkType, setLinkType] = useState<BusinessLinkType>(BusinessLinkType.WEBSITE)
  const [linkLabel, setLinkLabel] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkSortOrder, setLinkSortOrder] = useState(0)
  const [linkIsActive, setLinkIsActive] = useState(true)
  const [isEditingLink, setIsEditingLink] = useState(false)

  // Sync business/pending data to form states when loaded
  React.useEffect(() => {
    if (business) {
      // Use pending values if a request is currently pending approval
      const isPending = pendingRequest && pendingRequest.status === "PENDING"
      const source = isPending ? pendingRequest : business

      setName(source.name || "")
      setDescription(source.description || "")
      setPhone(source.phone || "")
      setEmail(source.email || "")
      setWebsite(source.website || "")
      setLogoUrl(source.logoUrl || "")
      setCoverImageUrl(source.coverImageUrl || "")
      setAddress(source.address || "")
      setCity(source.city || "")
      setState(source.state || "")
      setZipCode(source.zipCode || "")
      setServiceArea(source.serviceArea || "")
      setHours(source.hours || "")
      setPreferredCta(source.preferredCta || "")
      setEstablishedYear(source.establishedYear || "")
      setLicenseNumber(source.licenseNumber || "")

      const loadedServices = source.services && Array.isArray(source.services) ? (source.services as any[]) : []
      setServices(loadedServices)

      const loadedPhotos = source.photos && Array.isArray(source.photos) ? (source.photos as string[]).slice(0, 10) : []
      setPhotos(loadedPhotos)

      const socials = source.socialLinks && typeof source.socialLinks === "object" ? (source.socialLinks as any) : null
      setFacebook(socials?.facebook || "")
      setInstagram(socials?.instagram || "")
      setTwitter(socials?.twitter || "")
    }
  }, [business, pendingRequest])

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalizedWebsite = addHttps(website)
    const normalizedFacebook = addHttps(facebook)
    const normalizedInstagram = addHttps(instagram)
    const normalizedTwitter = addHttps(twitter)

    setWebsite(normalizedWebsite)
    setFacebook(normalizedFacebook)
    setInstagram(normalizedInstagram)
    setTwitter(normalizedTwitter)

    updateProfileMutation.mutate({
      name,
      description,
      phone,
      email,
      website: normalizedWebsite,
      logoUrl,
      coverImageUrl,
      address,
      city,
      state,
      zipCode,
      serviceArea,
      hours,
      preferredCta,
      facebook: normalizedFacebook,
      instagram: normalizedInstagram,
      twitter: normalizedTwitter,
      services,
      establishedYear,
      licenseNumber,
      photos,
    })
  }

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setLogoUploadError(null)
    await startLogoUpload([file])
  }

  const handleCoverFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    setCoverUploadError(null)
    await startCoverUpload([file])
  }

  const handleGalleryFilesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    event.target.value = ""
    if (selectedFiles.length === 0) return

    const remaining = 10 - photos.length
    if (remaining <= 0) {
      setGalleryUploadError("You can upload up to 10 gallery images.")
      return
    }

    setGalleryUploadError(null)
    if (selectedFiles.length > remaining) {
      setGalleryUploadError(`Only ${remaining} more gallery image${remaining === 1 ? "" : "s"} can be added. The first ${remaining} selected image${remaining === 1 ? "" : "s"} will upload.`)
    }
    await startGalleryUpload(selectedFiles.slice(0, remaining))
  }

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isWebLink = linkType !== BusinessLinkType.PHONE && linkType !== BusinessLinkType.EMAIL
    const normalizedLinkUrl = isWebLink ? addHttps(linkUrl) : linkUrl.trim()
    setLinkUrl(normalizedLinkUrl)
    upsertLinkMutation.mutate({
      id: linkId,
      type: linkType,
      label: linkLabel,
      url: normalizedLinkUrl,
      sortOrder: linkSortOrder,
      isActive: linkIsActive,
    })
  }

  const handleEditLinkClick = (link: any) => {
    setLinkId(link.id)
    setLinkType(link.type)
    setLinkLabel(link.label)
    setLinkUrl(link.url)
    setLinkSortOrder(link.sortOrder)
    setLinkIsActive(link.isActive)
    setIsEditingLink(true)
  }

  const handleDeleteLinkClick = (id: string) => {
    if (confirm("Are you sure you want to delete this link?")) {
      deleteLinkMutation.mutate({ id })
    }
  }

  const resetLinkForm = () => {
    setLinkId(undefined)
    setLinkType(BusinessLinkType.WEBSITE)
    setLinkLabel("")
    setLinkUrl("")
    setLinkSortOrder(0)
    setLinkIsActive(true)
    setIsEditingLink(false)
  }

  const getChangedFields = () => {
    if (!business || !pendingRequest || pendingRequest.status !== "PENDING") return []
    const fields: { label: string; live: string; pending: string }[] = []
    
    const checkField = (key: string, label: string) => {
      const liveVal = String((business as any)[key] || "")
      const pendingVal = String((pendingRequest as any)[key] || "")
      if (liveVal !== pendingVal) {
        fields.push({ 
          label, 
          live: liveVal || "[Empty]", 
          pending: pendingVal || "[Empty]" 
        })
      }
    }

    checkField("name", "Business Name")
    checkField("description", "Description")
    checkField("phone", "Phone Number")
    checkField("email", "Email Address")
    checkField("website", "Website URL")
    checkField("address", "Street Address")
    checkField("city", "City")
    checkField("state", "State")
    checkField("zipCode", "ZIP Code")
    checkField("logoUrl", "Business Logo")
    checkField("coverImageUrl", "Cover Header Image")
    checkField("serviceArea", "Service Area")
    checkField("hours", "Hours")
    checkField("preferredCta", "Preferred CTA")
    checkField("establishedYear", "Established Year")
    checkField("licenseNumber", "License Number")

    const liveServices = Array.isArray(business.services) ? (business.services as string[]).join(", ") : ""
    const pendingServices = Array.isArray(pendingRequest.services) ? (pendingRequest.services as string[]).join(", ") : ""
    if (liveServices !== pendingServices) {
      fields.push({ label: "Offered Services", live: liveServices || "[Empty]", pending: pendingServices || "[Empty]" })
    }

    const liveSocials = business.socialLinks && typeof business.socialLinks === "object" ? (business.socialLinks as any) : null
    const pendingSocials = pendingRequest.socialLinks && typeof pendingRequest.socialLinks === "object" ? (pendingRequest.socialLinks as any) : null
    
    if ((liveSocials?.facebook || "") !== (pendingSocials?.facebook || "")) {
      fields.push({ label: "Facebook Page", live: liveSocials?.facebook || "[Empty]", pending: pendingSocials?.facebook || "[Empty]" })
    }
    if ((liveSocials?.instagram || "") !== (pendingSocials?.instagram || "")) {
      fields.push({ label: "Instagram Profile", live: liveSocials?.instagram || "[Empty]", pending: pendingSocials?.instagram || "[Empty]" })
    }
    if ((liveSocials?.twitter || "") !== (pendingSocials?.twitter || "")) {
      fields.push({ label: "Twitter / X Profile", live: liveSocials?.twitter || "[Empty]", pending: pendingSocials?.twitter || "[Empty]" })
    }

    const livePhotos = Array.isArray(business.photos) ? (business.photos as string[]).join(", ") : ""
    const pendingPhotos = Array.isArray(pendingRequest.photos) ? (pendingRequest.photos as string[]).join(", ") : ""
    if (livePhotos !== pendingPhotos) {
      fields.push({ label: "Portfolio Photos", live: livePhotos || "[Empty]", pending: pendingPhotos || "[Empty]" })
    }
    
    return fields
  }

  const isLoading = isBusinessLoading || isLoadingOrders || isLoadingPending

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-10 bg-slate-200 rounded w-1/4" />
        <div className="h-48 bg-slate-200 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-8 text-left animate-fade-up">
      
      {/* Title */}
      <div className="space-y-0.5">
        <h1 className="font-headline font-black text-2xl uppercase text-press leading-none tracking-tight">
          Business Profile Settings
        </h1>
        <p className="text-xs text-warm font-medium">
          Customize what local customers see when they scan your postcard's QR code.
        </p>
      </div>

      {isPrintedOrMailed && (
        <div className="rounded-none bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-800 font-medium font-sans animate-fade-up">
          ⚠️ One or more of your postcard campaigns has already been printed or mailed. Changes here may update your digital landing page, but they will not change the physical postcard.
        </div>
      )}

      {/* Approval & Notice Banners */}
      <div className="space-y-4">
        {pendingRequest && pendingRequest.status === "PENDING" && (
          <div className="rounded-none bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-800 font-sans space-y-2 animate-fade-up">
            <div className="flex items-center gap-2 font-bold uppercase">
              <span>⚠️ Profile Changes Under Review</span>
            </div>
            <p>
              You submitted profile updates on <strong>{new Date(pendingRequest.submittedAt).toLocaleDateString()}</strong>.
              These changes are currently pending review and approval by the campaign administrator before they go live on the public directory.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowComparison(!showComparison)}
                className="text-xs underline font-bold hover:text-amber-900 cursor-pointer"
              >
                {showComparison ? "Hide submitted changes" : "View submitted changes"}
              </button>
            </div>
            {showComparison && (
              <div className="mt-3 border border-amber-500/20 bg-white/80 rounded-none overflow-hidden max-w-2xl">
                <table className="w-full text-left text-[11px] font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-amber-500/20 bg-amber-500/5 text-amber-900 font-mono text-[9px] uppercase font-bold">
                      <th className="px-3 py-2">Field</th>
                      <th className="px-3 py-2">Live Directory Value</th>
                      <th className="px-3 py-2">Pending Requested Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getChangedFields().map((f) => (
                      <tr key={f.label} className="border-b border-amber-500/10 last:border-0 hover:bg-amber-500/5">
                        <td className="px-3 py-2 font-semibold text-[#77706A]">{f.label}</td>
                        <td className="px-3 py-2 text-stone-500 break-all">{f.live}</td>
                        <td className="px-3 py-2 text-amber-950 font-bold break-all">{f.pending}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {pendingRequest && pendingRequest.status === "REJECTED" && (
          <div className="rounded-none bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-800 font-sans space-y-1.5 animate-fade-up">
            <div className="font-bold uppercase flex items-center gap-2">
              <span>❌ Profile Changes Rejected</span>
            </div>
            <p>
              Your recent profile updates were rejected on <strong>{pendingRequest.reviewedAt ? new Date(pendingRequest.reviewedAt).toLocaleDateString() : ""}</strong> by the campaign administrator.
            </p>
            {pendingRequest.rejectionReason && (
              <div className="bg-red-50 border border-red-100 p-3 font-mono text-[11px] text-red-700 mt-2 whitespace-pre-wrap">
                <strong>Admin Feedback / Instructions:</strong>
                <p className="mt-1">{pendingRequest.rejectionReason}</p>
              </div>
            )}
            <p className="text-[10px] text-red-600 mt-2 font-medium">
              Please review the feedback above, correct the issues in the form below, and re-submit your profile for approval.
            </p>
          </div>
        )}

        {(!pendingRequest || pendingRequest.status === "APPROVED") && (
          <div className="rounded-none bg-blue-500/10 border border-blue-500/20 p-4 text-xs text-blue-800 font-sans space-y-1 animate-fade-up">
            <div className="font-bold uppercase flex items-center gap-2">
              <span>ℹ️ Profile Approval Requirement</span>
            </div>
            <p>
              Before your business profile is made public, or whenever you submit updates, the campaign administrator must review and approve them. Edits will save as a pending request and will not show on the live directory until approved.
            </p>
          </div>
        )}
      </div>

      {/* Tabs Selector */}
      <div className="hidden flex border-b border-border select-none">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeTab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-warm hover:text-press"
          }`}
        >
          📝 Core Profile
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeTab === "links"
              ? "border-primary text-primary"
              : "border-transparent text-warm hover:text-press"
          }`}
        >
          🔗 Outbound Links
        </button>
      </div>

      {/* Profile Form Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="bg-card border-2 border-press p-6 rounded-none space-y-6 shadow-sm">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Basic Details */}
            <div className="space-y-4">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-border pb-1">
                Company Details
              </h3>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Business Name *
                </label>
                <Input
                  type="text"
                  required
                  disabled={isPrintedOrMailed}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Short Description / Tagline
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Tell customers what your business does..."
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    disabled={isPrintedOrMailed}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Website URL
                </label>
                <Input
                  type="text"
                  inputMode="url"
                  placeholder="mybusiness.com"
                  disabled={isPrintedOrMailed}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  onBlur={() => setWebsite((value) => addHttps(value))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Service Area
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Bexar County, Converse, San Antonio"
                  value={serviceArea}
                  onChange={(e) => setServiceArea(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Hours
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Mon-Fri: 8AM-5PM"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Preferred CTA Label
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Call Now, Book Online"
                    value={preferredCta}
                    onChange={(e) => setPreferredCta(e.target.value)}
                  />
                </div>
              </div>

              {/* Services Offered Section */}
              <div className="border-t border-border pt-4 mt-4 space-y-3 text-left">
                <h4 className="text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                  Services Offered
                </h4>
                <p className="text-[10px] text-warm -mt-1">
                  Select the services you offer or add custom ones using the text field below.
                </p>

                {/* Prepopulated Checklist */}
                {(() => {
                  const categorySlug = orders?.[0]?.campaignSpot?.category?.slug || "general"
                  const categoryServices = PREPOPULATED_SERVICES[categorySlug] || GENERAL_SERVICES
                  return (
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded border border-border">
                      {categoryServices.map((serviceName) => {
                        const isChecked = services.some((s) => {
                          const sName = typeof s === "string" ? s : s.name
                          return sName.toLowerCase() === serviceName.toLowerCase()
                        })
                        return (
                          <label key={serviceName} className="flex items-center gap-2 text-xs text-press select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setServices([...services, { name: serviceName }])
                                } else {
                                  setServices(services.filter((s) => {
                                    const sName = typeof s === "string" ? s : s.name
                                    return sName.toLowerCase() !== serviceName.toLowerCase()
                                  }))
                                }
                              }}
                            />
                            <span>{serviceName}</span>
                          </label>
                        )
                      })}
                    </div>
                  )
                })()}

                {/* Custom plain text input */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Custom service name..."
                      value={customService}
                      onChange={(e) => setCustomService(e.target.value)}
                      className="flex-1 text-xs"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        const trimmedName = customService.trim()
                        const trimmedDesc = customServiceDesc.trim()
                        if (trimmedName) {
                          const exists = services.some(s => (typeof s === "string" ? s : s.name).toLowerCase() === trimmedName.toLowerCase())
                          if (!exists) {
                            setServices([...services, { name: trimmedName, description: trimmedDesc || undefined }])
                            setCustomService("")
                            setCustomServiceDesc("")
                          }
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  <Input
                    type="text"
                    placeholder="Service description / additional text (optional)..."
                    value={customServiceDesc}
                    onChange={(e) => setCustomServiceDesc(e.target.value)}
                    className="text-xs w-full"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        const trimmedName = customService.trim()
                        const trimmedDesc = customServiceDesc.trim()
                        if (trimmedName) {
                          const exists = services.some(s => (typeof s === "string" ? s : s.name).toLowerCase() === trimmedName.toLowerCase())
                          if (!exists) {
                            setServices([...services, { name: trimmedName, description: trimmedDesc || undefined }])
                            setCustomService("")
                            setCustomServiceDesc("")
                          }
                        }
                      }
                    }}
                  />
                </div>

                {/* Display selected services as badges */}
                {services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {services.map((s) => {
                      const sName = typeof s === "string" ? s : s.name
                      const sDesc = typeof s === "string" ? "" : s.description
                      return (
                        <span key={sName} className="inline-flex items-center gap-1 bg-slate-100 text-slate-800 text-[11px] font-mono px-2 py-0.5 rounded border border-slate-200" title={sDesc}>
                          {sName} {sDesc && `(${sDesc})`}
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 font-bold ml-1 text-sm font-sans"
                            onClick={() => setServices(services.filter((item) => {
                              const itemName = typeof item === "string" ? item : item.name
                              return itemName.toLowerCase() !== sName.toLowerCase()
                            }))}
                          >
                            &times;
                          </button>
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Branding & Location */}
            <div className="space-y-4">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-border pb-1">
                Visual Assets & Location
              </h3>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Business Logo
                </label>
                <div className="flex items-center gap-3">
                  <label
                    className={`inline-flex cursor-pointer items-center justify-center border border-press bg-press px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-white transition-colors hover:bg-press/90 ${isPrintedOrMailed || isLogoUploading ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {isLogoUploading ? "Uploading..." : logoUrl ? "Replace Logo" : "Upload Logo"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={isPrintedOrMailed || isLogoUploading}
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>
                  {logoUrl && (
                    <>
                      <div className="h-12 w-12 overflow-hidden border border-border bg-card p-1">
                        <img src={logoUrl} alt="Current business logo" className="h-full w-full object-contain" />
                      </div>
                      {!isPrintedOrMailed && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl("")}
                          className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 underline hover:text-red-900"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </div>
                <p className="mt-1.5 text-[10px] text-warm">PNG, JPG, or WebP up to 4 MB.</p>
                {logoUploadError && <p className="mt-1 text-[10px] font-semibold text-red-700">{logoUploadError}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Cover Header Image
                </label>
                <div className="flex items-center gap-3">
                  <label
                    className={`inline-flex cursor-pointer items-center justify-center border border-press bg-press px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-white transition-colors hover:bg-press/90 ${isCoverUploading ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {isCoverUploading ? "Uploading..." : coverImageUrl ? "Replace Cover" : "Upload Cover"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={isCoverUploading}
                      onChange={handleCoverFileChange}
                      className="hidden"
                    />
                  </label>
                  {coverImageUrl && (
                    <>
                      <div className="h-12 w-28 overflow-hidden border border-border bg-card">
                        <img src={coverImageUrl} alt="Current cover image" className="h-full w-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl("")}
                        className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-700 underline hover:text-red-900"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
                <p className="mt-1.5 text-[10px] text-warm">PNG, JPG, or WebP up to 4 MB.</p>
                {coverUploadError && <p className="mt-1 text-[10px] font-semibold text-red-700">{coverUploadError}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Street Address
                </label>
                <Input
                  type="text"
                  placeholder="123 Main St"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <Input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    State
                  </label>
                  <Input
                    type="text"
                    placeholder="TX"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Zip Code
                  </label>
                  <Input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2 text-left">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Established Year
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. 2016"
                    value={establishedYear}
                    onChange={(e) => setEstablishedYear(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    License Number
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. M-42678"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>
              </div>

              <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-border pb-1 pt-2">
                Social Media Links
              </h3>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Facebook Page URL
                </label>
                <Input
                  type="text"
                  inputMode="url"
                  placeholder="facebook.com/..."
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  onBlur={() => setFacebook((value) => addHttps(value))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Instagram Profile URL
                </label>
                <Input
                  type="text"
                  inputMode="url"
                  placeholder="instagram.com/..."
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  onBlur={() => setInstagram((value) => addHttps(value))}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Twitter / X Profile URL
                </label>
                <Input
                  type="text"
                  inputMode="url"
                  placeholder="x.com/..."
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  onBlur={() => setTwitter((value) => addHttps(value))}
                />
              </div>

              {/* Showcase Gallery Section */}
              <div className="space-y-3 pt-2">
                <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-border pb-1">
                  Showcase Gallery (Our Work)
                </h3>
                <p className="text-[10px] text-warm -mt-2.5 leading-normal">
                  Upload up to 10 photos showcasing your work. These will display in a gallery on your public profile once approved.
                </p>
                <div className="flex items-center justify-between gap-3">
                  <label
                    className={`inline-flex cursor-pointer items-center justify-center border border-press bg-press px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-white transition-colors hover:bg-press/90 ${isGalleryUploading || photos.length >= 10 ? "cursor-not-allowed opacity-50" : ""}`}
                  >
                    {isGalleryUploading ? "Uploading..." : "Upload gallery images"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      disabled={isGalleryUploading || photos.length >= 10}
                      onChange={handleGalleryFilesChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-warm">{photos.length}/10 images</span>
                </div>
                <p className="text-[10px] text-warm">PNG, JPG, or WebP up to 8 MB each. Image URLs cannot be added manually.</p>
                {galleryUploadError && <p className="text-[10px] font-semibold text-red-700">{galleryUploadError}</p>}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {photos.map((photoUrl) => (
                      <div key={photoUrl} className="relative aspect-[4/3] bg-slate-100 border border-slate-200 overflow-hidden group">
                        <img src={photoUrl} alt="Showcase" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter(p => p !== photoUrl))}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 leading-none text-xs font-bold w-5 h-5 flex items-center justify-center cursor-pointer shadow border-0"
                          title="Remove photo"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          <div className="pt-4 border-t border-border text-right">
              <Button
                type="submit"
              disabled={updateProfileMutation.isPending || isLogoUploading || isCoverUploading || isGalleryUploading}
                size="lg"
              >
              {isLogoUploading || isCoverUploading || isGalleryUploading
                ? "Uploading image..."
                : updateProfileMutation.isPending
                ? "Saving..."
                : "💾 Save Changes"}
            </Button>
          </div>

        </form>
      )}

      {/* Links Form Tab */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Middle: Add / Edit Link Form */}
          <div className="lg:col-span-1 bg-card border-2 border-press p-6 rounded-none h-fit shadow-sm space-y-4">
            <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-border pb-1">
              {isEditingLink ? "✏️ Edit Outbound Link" : "➕ Add Outbound Link"}
            </h3>

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Link Type
                </label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as BusinessLinkType)}
                  className="w-full rounded-none border border-border bg-card px-3 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                >
                  <option value={BusinessLinkType.WEBSITE}>Website 🔗</option>
                  <option value={BusinessLinkType.PHONE}>Phone 📞</option>
                  <option value={BusinessLinkType.BOOKING}>Booking Page 📅</option>
                  <option value={BusinessLinkType.FACEBOOK}>Facebook Page 📘</option>
                  <option value={BusinessLinkType.INSTAGRAM}>Instagram 📸</option>
                  <option value={BusinessLinkType.GOOGLE_MAPS}>Google Maps Location 📍</option>
                  <option value={BusinessLinkType.MENU}>Menu Link 🍽️</option>
                  <option value={BusinessLinkType.EMAIL}>Email Address ✉️</option>
                  <option value={BusinessLinkType.CUSTOM}>Custom Link 🔗</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Link Label
                </label>
                <Input
                  type="text"
                  required
                  placeholder="e.g. Follow Us on Instagram"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Destination URL
                </label>
                <Input
                  type="text"
                  required
                  placeholder={linkType === "PHONE" ? "tel:+1234567890" : linkType === "EMAIL" ? "mailto:name@email.com" : "https://instagram.com/mybusiness"}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onBlur={() => {
                    if (linkType !== BusinessLinkType.PHONE && linkType !== BusinessLinkType.EMAIL) {
                      setLinkUrl((value) => addHttps(value))
                    }
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    value={linkSortOrder}
                    onChange={(e) => setLinkSortOrder(parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-press select-none">
                    <input
                      type="checkbox"
                      checked={linkIsActive}
                      onChange={(e) => setLinkIsActive(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span>Link Active</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="submit"
                  disabled={upsertLinkMutation.isPending}
                  className="flex-1"
                >
                  {upsertLinkMutation.isPending ? "Saving..." : "💾 Save Link"}
                </Button>
                {isEditingLink && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetLinkForm}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>

          </div>

          {/* Right: Active Links List */}
          <div className="lg:col-span-2 bg-card border border-border p-6 rounded-none h-fit shadow-sm space-y-4 select-none">
            <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-border pb-1">
              Active Outbound Links list
            </h3>

            {business?.links && business.links.length > 0 ? (
              <div className="divide-y divide-border">
                {business.links.map((link) => (
                  <div key={link.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="text-left space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-press truncate">
                          {link.label}
                        </span>
                        <span className="text-[9px] font-mono font-bold uppercase bg-press/5 px-2 py-0.5 text-warm">
                          {link.type}
                        </span>
                        {!link.isActive && (
                          <Badge variant="destructive">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-warm truncate break-all max-w-md font-medium">
                        {link.url}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        onClick={() => handleEditLinkClick(link)}
                        variant="outline"
                        size="sm"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        onClick={() => handleDeleteLinkClick(link.id)}
                        variant="destructive"
                        size="sm"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-warm font-medium">
                <p>No links configured yet.</p>
                <p className="text-xs text-slate-400 mt-1">Configure your booking links, Facebook profiles, maps locations, or menus using the form.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}
