"use client"

import React, { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { BusinessLinkType } from "@prisma/client"

export default function BusinessProfilePage() {
  const utils = trpc.useUtils()
  
  // Tab states: "profile" or "links"
  const [activeTab, setActiveTab] = useState<"profile" | "links">("profile")

  // Query profile details
  const { data: business, isLoading } = trpc.business.getMyBusiness.useQuery()
  const { data: orders, isLoading: isLoadingOrders } = trpc.business.getMyOrders.useQuery()

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
      alert("Profile updated successfully!")
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

  // Link Form States
  const [linkId, setLinkId] = useState<string | undefined>(undefined)
  const [linkType, setLinkType] = useState<BusinessLinkType>(BusinessLinkType.WEBSITE)
  const [linkLabel, setLinkLabel] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [linkSortOrder, setLinkSortOrder] = useState(0)
  const [linkIsActive, setLinkIsActive] = useState(true)
  const [isEditingLink, setIsEditingLink] = useState(false)

  // Sync business data to form states when loaded
  React.useEffect(() => {
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
    }
  }, [business])

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfileMutation.mutate({
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
  }

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    upsertLinkMutation.mutate({
      id: linkId,
      type: linkType,
      label: linkLabel,
      url: linkUrl,
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

  if (isLoading || isLoadingOrders) {
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

      {/* Tabs Selector */}
      <div className="flex border-b border-[#E7E0D8] select-none">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeTab === "profile"
              ? "border-[#D13F1F] text-[#D13F1F]"
              : "border-transparent text-warm hover:text-press"
          }`}
        >
          📝 Core Profile
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeTab === "links"
              ? "border-[#D13F1F] text-[#D13F1F]"
              : "border-transparent text-warm hover:text-press"
          }`}
        >
          🔗 Outbound Links
        </button>
      </div>

      {/* Profile Form Tab */}
      {activeTab === "profile" && (
        <form onSubmit={handleProfileSubmit} className="bg-white border-2 border-press p-6 rounded-none space-y-6 shadow-sm">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Basic Details */}
            <div className="space-y-4">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-[#E7E0D8] pb-1">
                Company Details
              </h3>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={isPrintedOrMailed}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Short Description / Tagline
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Tell customers what your business does..."
                  className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    disabled={isPrintedOrMailed}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://mybusiness.com"
                  disabled={isPrintedOrMailed}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

            </div>

            {/* Right Column: Branding & Location */}
            <div className="space-y-4">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-[#E7E0D8] pb-1">
                Visual Assets & Location
              </h3>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Logo Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://uploadthing.com/..."
                  disabled={isPrintedOrMailed}
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://uploadthing.com/..."
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="123 Main St"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-none border border-rule px-2 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    placeholder="TX"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-none border border-rule px-2 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Zip Code
                  </label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-full rounded-none border border-rule px-2 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors"
                  />
                </div>
              </div>

            </div>

          </div>

          <div className="pt-4 border-t border-[#E7E0D8] text-right">
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="px-6 py-3 bg-[#D13F1F] hover:bg-[#B53A1A] text-paper font-bold uppercase tracking-wider text-xs border border-press transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {updateProfileMutation.isPending ? "Saving..." : "💾 Save Changes"}
            </button>
          </div>

        </form>
      )}

      {/* Links Form Tab */}
      {activeTab === "links" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left / Middle: Add / Edit Link Form */}
          <div className="lg:col-span-1 bg-white border-2 border-press p-6 rounded-none h-fit shadow-sm space-y-4">
            <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-[#E7E0D8] pb-1">
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
                  className="w-full rounded-none border border-rule bg-white px-3 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F]"
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
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow Us on Instagram"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                  Destination URL
                </label>
                <input
                  type="text"
                  required
                  placeholder={linkType === "PHONE" ? "tel:+1234567890" : linkType === "EMAIL" ? "mailto:name@email.com" : "https://instagram.com/mybusiness"}
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none focus:ring-1 focus:ring-[#D13F1F] focus:border-[#D13F1F] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider mb-1.5">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={linkSortOrder}
                    onChange={(e) => setLinkSortOrder(parseInt(e.target.value) || 0)}
                    className="w-full rounded-none border border-rule px-3.5 py-2.5 text-sm text-press focus:outline-none"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-press select-none">
                    <input
                      type="checkbox"
                      checked={linkIsActive}
                      onChange={(e) => setLinkIsActive(e.target.checked)}
                      className="rounded border-[#E7E0D8] text-[#D13F1F] focus:ring-[#D13F1F]"
                    />
                    <span>Link Active</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={upsertLinkMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-[#D13F1F] hover:bg-[#B53A1A] text-paper font-bold uppercase tracking-wider text-xs border border-press transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {upsertLinkMutation.isPending ? "Saving..." : "💾 Save Link"}
                </button>
                {isEditingLink && (
                  <button
                    type="button"
                    onClick={resetLinkForm}
                    className="px-4 py-2.5 border border-press hover:bg-[#E7E0D8] text-xs font-bold uppercase tracking-wider text-press cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

          </div>

          {/* Right: Active Links List */}
          <div className="lg:col-span-2 bg-white border border-rule p-6 rounded-none h-fit shadow-sm space-y-4 select-none">
            <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-[#E7E0D8] pb-1">
              Active Outbound Links list
            </h3>

            {business?.links && business.links.length > 0 ? (
              <div className="divide-y divide-rule">
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
                          <span className="text-[9px] font-mono font-bold uppercase bg-red-50 px-2 py-0.5 text-red-500 border border-red-200">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-warm truncate break-all max-w-md font-medium">
                        {link.url}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditLinkClick(link)}
                        className="px-2.5 py-1 text-[10px] border border-press hover:bg-[#E7E0D8] font-bold uppercase tracking-wider text-press transition-colors cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLinkClick(link.id)}
                        className="px-2.5 py-1 text-[10px] border border-red-200 hover:bg-red-50 text-red-500 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
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
