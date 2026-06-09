"use client"

import React, { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"

export default function AdminCreativeReviewPage() {
  const utils = trpc.useUtils()

  // Queries
  const { data: soldSpots, isLoading, error } = trpc.creative.getSoldSpotsForReview.useQuery()

  // Selected Order for Detail Pane
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)

  // Regenerated Claim Link State
  const [regeneratedLink, setRegeneratedLink] = useState<string | null>(null)
  const [regeneratedForId, setRegeneratedForId] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [showRegenForm, setShowRegenForm] = useState(false)
  const [regenReason, setRegenReason] = useState("")
  const [sendEmailNotice, setSendEmailNotice] = useState(false)

  // Rejection Notes State
  const [rejectionNotes, setRejectionNotes] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)

  // Mutations
  const updateApprovalMutation = trpc.creative.updateApproval.useMutation()
  const regenerateTokenMutation = trpc.business.regenerateClaimToken.useMutation()

  // Filter States
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setShowRejectForm(false)
    setRejectionNotes("")
    setRegeneratedLink(null)
    setRegeneratedForId(null)
    setShowRegenForm(false)
    setRegenReason("")
    setSendEmailNotice(false)
  }

  const handleApprove = async (submissionId: string) => {
    if (!confirm("Are you sure you want to approve this postcard creative for printing?")) return
    setSubmittingReview(true)

    try {
      await updateApprovalMutation.mutateAsync({
        submissionId,
        approvalStatus: "APPROVED",
        approvalNotes: "Approved for print layout.",
      })
      alert("Postcard creative approved successfully!")
      utils.creative.getSoldSpotsForReview.invalidate()
    } catch (err: any) {
      alert(`Error approving creative: ${err.message}`)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleUpdateStatus = async (submissionId: string, status: "PRINTED" | "MAILED" | "APPROVED") => {
    const labels: Record<string, string> = {
      PRINTED: "printed",
      MAILED: "mailed",
      APPROVED: "approved",
    }
    const label = labels[status]
    if (!confirm(`Are you sure you want to mark this creative as ${label}?`)) return
    setSubmittingReview(true)

    try {
      await updateApprovalMutation.mutateAsync({
        submissionId,
        approvalStatus: status,
        approvalNotes: `Creative status updated to ${label}.`,
      })
      alert(`Postcard creative marked as ${label} successfully!`)
      utils.creative.getSoldSpotsForReview.invalidate()
    } catch (err: any) {
      alert(`Error updating status: ${err.message}`)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleReject = async (submissionId: string) => {
    if (!rejectionNotes.trim()) {
      alert("Please enter notes explaining what changes are needed.")
      return
    }
    setSubmittingReview(true)

    try {
      await updateApprovalMutation.mutateAsync({
        submissionId,
        approvalStatus: "REJECTED",
        approvalNotes: rejectionNotes,
      })
      alert("Creative status updated to Needs Changes. Merchant notified.")
      setShowRejectForm(false)
      setRejectionNotes("")
      utils.creative.getSoldSpotsForReview.invalidate()
    } catch (err: any) {
      alert(`Error updating creative status: ${err.message}`)
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleRegenerateClaim = async (businessId: string) => {
    if (!regenReason.trim()) {
      alert("Please enter a reason for regenerating the claim link.")
      return
    }
    setRegenerating(true)
    try {
      const data = await regenerateTokenMutation.mutateAsync({
        businessId,
        reason: regenReason,
        sendEmailNotification: sendEmailNotice,
      })
      setRegeneratedLink(data.claimLink)
      setRegeneratedForId(businessId)
      setShowRegenForm(false)
      setRegenReason("")
      setSendEmailNotice(false)
      alert("Claim link regenerated successfully!")
    } catch (err: any) {
      alert(`Error generating claim link: ${err.message}`)
    } finally {
      setRegenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-10 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">
          <div className="lg:col-span-1 bg-slate-200 rounded" />
          <div className="lg:col-span-2 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  if (error || !soldSpots) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-3xl text-left">
        <h3 className="font-bold text-lg">Error Loading Reviews</h3>
        <p className="text-sm mt-1">{error?.message || "Failed to query creative reviews queue."}</p>
      </div>
    )
  }

  // Compute Review Status helper
  const getComputedStatus = (order: any) => {
    const campaignStatus = order.campaign.status
    const creative = order.creativeSubmission

    if (campaignStatus === "MAILED" || creative?.approvalStatus === "MAILED") return "MAILED"
    if (campaignStatus === "PRINTING" || creative?.approvalStatus === "PRINTED") return "PRINTING"

    if (!creative || !creative.submittedAt) return "PENDING_CREATIVE"

    const qrCode = order.qrCodes?.[0]
    const business = qrCode?.business
    const hasProfileDescription = !!business?.description?.trim()
    const hasProfileLogo = !!business?.logoUrl?.trim()
    const hasProfileAddress = !!business?.address?.trim()
    const isProfileComplete = hasProfileDescription && hasProfileLogo && hasProfileAddress

    if (!isProfileComplete) return "PENDING_PROFILE"
    if (creative.approvalStatus === "PENDING") return "PENDING_REVIEW"
    if (creative.approvalStatus === "REJECTED") return "NEEDS_CHANGES"
    if (creative.approvalStatus === "APPROVED") return "APPROVED_FOR_PRINT"

    return "PENDING_REVIEW"
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "MAILED":
        return "bg-purple-50 text-purple-700 border border-purple-200"
      case "PRINTING":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200"
      case "APPROVED_FOR_PRINT":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200"
      case "PENDING_REVIEW":
        return "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"
      case "NEEDS_CHANGES":
        return "bg-red-50 text-red-700 border border-red-200"
      case "PENDING_PROFILE":
        return "bg-orange-50 text-orange-700 border border-orange-200"
      case "PENDING_CREATIVE":
      default:
        return "bg-slate-100 text-slate-700 border border-slate-200"
    }
  }

  // Filter & Search Logic
  const filteredSpots = soldSpots.filter((order) => {
    const status = getComputedStatus(order)
    const matchesSearch = 
      order.advertiser.businessName.toLowerCase().includes(search.toLowerCase()) ||
      order.campaign.name.toLowerCase().includes(search.toLowerCase()) ||
      order.campaignSpot.label.toLowerCase().includes(search.toLowerCase())
    
    if (statusFilter === "ALL") return matchesSearch
    return matchesSearch && status === statusFilter
  })

  // Selected Spot context
  const selectedOrder = soldSpots.find((o) => o.id === selectedOrderId)
  const selectedStatus = selectedOrder ? getComputedStatus(selectedOrder) : null

  // Compute print readiness checklists
  const getReadinessScore = (order: any) => {
    const creative = order.creativeSubmission
    const qrCode = order.qrCodes?.[0]
    const business = qrCode?.business
    const hasProfileDescription = !!business?.description?.trim()
    const hasProfileLogo = !!business?.logoUrl?.trim()
    const hasProfileAddress = !!business?.address?.trim()
    const isProfileComplete = hasProfileDescription && hasProfileLogo && hasProfileAddress

    const items = [
      order.status === "PAID", // Payment
      isProfileComplete, // Profile setup
      !!creative?.submittedAt, // Creative submitted
      !!qrCode, // QR generated
      (qrCode?._count?.scans ?? 0) > 0, // QR tested (scan > 0)
      business?.status === "ACTIVE", // Landing page active
      creative?.approvalStatus === "APPROVED", // Approved
    ]

    const completed = items.filter(Boolean).length
    return Math.round((completed / items.length) * 100)
  }

  return (
    <div className="space-y-8 text-left font-sans">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Creative Review Queue
        </h1>
        <p className="mt-1.5 text-slate-500">
          Review advertiser postcard assets, verify landing pages, test print QR codes, and approve designs for print layout.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by business, campaign, or spot label..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm text-slate-800 focus:outline-none"
          >
            <option value="ALL">All Sold Slots</option>
            <option value="PENDING_CREATIVE">Pending Creative Details</option>
            <option value="PENDING_PROFILE">Pending Profile Setup</option>
            <option value="PENDING_REVIEW">Pending Admin Review</option>
            <option value="NEEDS_CHANGES">Needs Changes</option>
            <option value="APPROVED_FOR_PRINT">Approved for Print</option>
            <option value="PRINTING">Printing</option>
            <option value="MAILED">Mailed</option>
          </select>
        </div>
      </div>

      {/* Main Review Portal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Listing List */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4 max-h-[700px] overflow-y-auto select-none">
          <h3 className="font-bold text-slate-900 border-b border-slate-100 pb-3">Sold Campaign Slots ({filteredSpots.length})</h3>
          
          <div className="space-y-3">
            {filteredSpots.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-6 text-center">No campaign slots match the filters.</p>
            ) : (
              filteredSpots.map((order) => {
                const status = getComputedStatus(order)
                const score = getReadinessScore(order)
                const isSelected = order.id === selectedOrderId

                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order.id)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all ${
                      isSelected 
                        ? "border-blue-500 bg-blue-50/20" 
                        : "border-slate-100 hover:border-slate-300 hover:bg-slate-50/30"
                    }`}
                  >
                    <div className="text-left space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900 truncate max-w-[150px]">
                          {order.advertiser.businessName}
                        </span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getStatusBadgeClass(status)}`}>
                          {status.replace(/_/g, " ")}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium">
                        {order.campaign.name} • {order.campaignSpot.label}
                      </p>

                      <div className="pt-2 flex items-center justify-between gap-4">
                        <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${score}%` }}
                            className="bg-blue-600 h-full rounded-full"
                          />
                        </div>
                        <span className="font-mono text-[9px] font-bold text-slate-500">{score}% ready</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Right Side: Detail review panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[500px]">
          {selectedOrder ? (
            <div className="space-y-6">
              
              {/* Header Title details */}
              <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">Reviewing Merchant creative</span>
                  <h2 className="font-bold text-xl text-slate-900 leading-tight">
                    {selectedOrder.advertiser.businessName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Category spot: <span className="font-bold text-slate-700">{selectedOrder.campaignSpot.label}</span> on campaign <span className="font-bold text-slate-700">{selectedOrder.campaign.name}</span>
                  </p>
                </div>

                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${getStatusBadgeClass(selectedStatus || "")}`}>
                  {selectedStatus?.replace(/_/g, " ")}
                </span>
              </div>

              {/* Checklist Section */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-3 select-none">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 text-left">Print-Readiness Verification Checklist</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-slate-700 text-left font-medium">
                  {/* Payment */}
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>Payment Verified ({formatPrice(selectedOrder.amount)})</span>
                  </div>

                  {/* Profile completed */}
                  <div className="flex items-center gap-2">
                    {!!selectedOrder.qrCodes?.[0]?.business?.description && !!selectedOrder.qrCodes?.[0]?.business?.logoUrl ? (
                      <span className="text-emerald-500 font-bold">✓</span>
                    ) : (
                      <span className="text-amber-500">⏳</span>
                    )}
                    <span>Business Profile Setup Completed</span>
                  </div>

                  {/* Creative Submission */}
                  <div className="flex items-center gap-2">
                    {selectedOrder.creativeSubmission?.submittedAt ? (
                      <span className="text-emerald-500 font-bold">✓</span>
                    ) : (
                      <span className="text-amber-500">⏳</span>
                    )}
                    <span>Creative Details Submitted</span>
                  </div>

                  {/* QR Code exists */}
                  <div className="flex items-center gap-2">
                    {selectedOrder.qrCodes?.[0] ? (
                      <span className="text-emerald-500 font-bold">✓</span>
                    ) : (
                      <span className="text-amber-500">⏳</span>
                    )}
                    <span>QR Code Slug Generated</span>
                  </div>

                  {/* QR code tested */}
                  <div className="flex items-center gap-2">
                    {(selectedOrder.qrCodes?.[0]?._count?.scans ?? 0) > 0 ? (
                      <span className="text-emerald-500 font-bold">✓</span>
                    ) : (
                      <span className="text-slate-400">○</span>
                    )}
                    <span>QR tested ({(selectedOrder.qrCodes?.[0]?._count?.scans ?? 0)} live scans logged)</span>
                  </div>

                  {/* Landing page active */}
                  <div className="flex items-center gap-2">
                    {selectedOrder.qrCodes?.[0]?.business?.status === "ACTIVE" ? (
                      <span className="text-emerald-500 font-bold">✓</span>
                    ) : (
                      <span className="text-amber-500">⏳</span>
                    )}
                    <span>Landing Page Active (`/b/${selectedOrder.qrCodes?.[0]?.business?.slug}`)</span>
                  </div>

                  {/* Admin Approved */}
                  <div className="col-span-1 md:col-span-2 flex items-center gap-2 pt-1.5 border-t border-slate-200">
                    {selectedOrder.creativeSubmission?.approvalStatus === "MAILED" ? (
                      <>
                        <span className="text-purple-500 font-bold">📬</span>
                        <span className="font-bold text-purple-700">Postcards mailed to local homes</span>
                      </>
                    ) : selectedOrder.creativeSubmission?.approvalStatus === "PRINTED" ? (
                      <>
                        <span className="text-indigo-500 font-bold">🖨️</span>
                        <span className="font-bold text-indigo-700">Postcards printed & preparing to mail</span>
                      </>
                    ) : selectedOrder.creativeSubmission?.approvalStatus === "APPROVED" ? (
                      <>
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span className="font-bold text-emerald-700">Creative ad design approved for printing</span>
                      </>
                    ) : selectedOrder.creativeSubmission?.approvalStatus === "REJECTED" ? (
                      <>
                        <span className="text-red-500 font-bold">❌</span>
                        <span className="font-bold text-red-600">Rejection notes sent: "{selectedOrder.creativeSubmission.approvalNotes}"</span>
                      </>
                    ) : (
                      <>
                        <span className="text-amber-500">⏳</span>
                        <span className="text-slate-500">Pending final admin approval</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Review details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* Postcard Creative ad details */}
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-1.5 uppercase">Printed Postcard Details</h4>
                  
                  {selectedOrder.creativeSubmission ? (
                    <div className="space-y-3.5 text-xs text-slate-700">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Printed Headline</span>
                        <p className="font-semibold text-slate-800 bg-slate-50 p-2 border border-slate-100 rounded-lg">{selectedOrder.creativeSubmission.headline || "None"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Postcard Offer / Deal</span>
                        <p className="font-bold text-nh-red bg-slate-50 p-2 border border-slate-100 rounded-lg uppercase">{selectedOrder.creativeSubmission.offerDeal || "None"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Call to Action (CTA)</span>
                        <p className="font-semibold text-slate-800">{selectedOrder.creativeSubmission.cta || "None"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Creative phone</span>
                        <p className="font-semibold text-slate-800">{selectedOrder.creativeSubmission.phone || "None"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase block mb-0.5">Notes for designer</span>
                        <p className="font-medium text-slate-500 bg-slate-50 p-2 rounded-lg italic">{selectedOrder.creativeSubmission.notes || "No notes provided."}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic font-medium">Postcard creative details have not been submitted.</p>
                  )}
                </div>

                {/* Digital Landing Page details */}
                <div className="space-y-4 select-none">
                  <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-1.5 uppercase">Digital Landing Page & QR</h4>
                  
                  {selectedOrder.qrCodes?.[0] ? (
                    <div className="space-y-4 text-xs text-slate-700">
                      
                      {/* Logo preview */}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden rounded-lg">
                          {selectedOrder.qrCodes[0].business.logoUrl ? (
                            <img src={selectedOrder.qrCodes[0].business.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                          ) : (
                            <span className="text-slate-300 font-bold uppercase">{selectedOrder.advertiser.businessName.slice(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-400 uppercase block">Landing Page Logo</span>
                          <span className="font-semibold text-slate-800 block truncate max-w-[180px]">{selectedOrder.qrCodes[0].business.logoUrl ? "Custom uploaded logo" : "Using initials fallback"}</span>
                        </div>
                      </div>

                      {/* Links review */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-400 uppercase block">Destination Url path</span>
                        <Link href={`/b/${selectedOrder.qrCodes[0].business.slug}`} target="_blank" className="font-semibold text-blue-600 hover:underline break-all block">
                          /b/{selectedOrder.qrCodes[0].business.slug}
                        </Link>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-mono text-slate-400 uppercase block">Print Tracking redirect path</span>
                        <Link href={`/q/${selectedOrder.qrCodes[0].slug}`} target="_blank" className="font-semibold text-blue-600 hover:underline block font-mono">
                          /q/{selectedOrder.qrCodes[0].slug}
                        </Link>
                      </div>

                      {/* Account claiming stats */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-mono text-[9px] uppercase">Profile Claimed</span>
                          <span className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-full ${
                            selectedOrder.qrCodes[0].business.ownerUserId 
                              ? "bg-emerald-50 text-emerald-700" 
                              : "bg-amber-50 text-amber-600"
                          }`}>
                            {selectedOrder.qrCodes[0].business.ownerUserId ? "Claimed" : "Unclaimed"}
                          </span>
                        </div>

                        {/* Regenerate claim link helper */}
                        <div className="space-y-2 pt-1 border-t border-dashed border-slate-100">
                          {!showRegenForm ? (
                            <button
                              type="button"
                              onClick={() => {
                                setShowRegenForm(true)
                                setRegenReason("")
                                setSendEmailNotice(false)
                                setRegeneratedLink(null)
                              }}
                              className="px-2.5 py-1 text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              {selectedOrder.qrCodes[0].business.ownerUserId
                                ? "⚠️ Reset & Regenerate Claim Link"
                                : "🔑 Regenerate Claim Link"}
                            </button>
                          ) : (
                            <div className="bg-slate-50 border border-slate-200 p-3.5 space-y-3">
                              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block">Reset & Regenerate Claim Link</span>
                              <div>
                                <label className="block text-[8px] font-mono font-bold text-slate-500 uppercase mb-1">Reason for reset *</label>
                                <input
                                  type="text"
                                  required
                                  value={regenReason}
                                  onChange={(e) => setRegenReason(e.target.value)}
                                  placeholder="e.g. merchant lost link / account transfer"
                                  className="w-full text-[10px] bg-white border border-slate-200 px-2.5 py-1.5 text-slate-700 outline-none focus:border-slate-400"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="sendEmailNotice"
                                  checked={sendEmailNotice}
                                  onChange={(e) => setSendEmailNotice(e.target.checked)}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                />
                                <label htmlFor="sendEmailNotice" className="text-[10px] font-medium text-slate-600 cursor-pointer select-none">
                                  Notify business owner via email
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled={regenerating || !regenReason.trim()}
                                  onClick={() => handleRegenerateClaim(selectedOrder.qrCodes[0].business.id)}
                                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[9px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                >
                                  {regenerating ? "Regenerating..." : "Confirm Reset"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setShowRegenForm(false)}
                                  className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}

                          {regeneratedLink && regeneratedForId === selectedOrder.qrCodes[0].business.id && (
                            <div className="bg-slate-50 border border-slate-200 p-2.5 space-y-1.5">
                              <span className="text-[9px] font-mono text-slate-400 uppercase block">Claim link:</span>
                              <input
                                type="text"
                                readOnly
                                value={regeneratedLink}
                                className="w-full text-[10px] bg-white border border-slate-200 px-2 py-1 text-slate-700 outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(regeneratedLink)
                                  alert("Claim link copied to clipboard!")
                                }}
                                className="px-2 py-0.5 bg-blue-600 text-white text-[9px] uppercase font-bold tracking-wider"
                              >
                                Copy Link
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic font-medium">No active tracking QR code generated.</p>
                  )}
                </div>
              </div>

              {/* Action buttons (Approve/Reject controls) */}
              <div className="border-t border-slate-100 pt-6 select-none text-right">
                {selectedOrder.creativeSubmission ? (
                  <div className="space-y-4">
                    {showRejectForm ? (
                      <div className="space-y-3 bg-red-50/20 border border-red-100 p-4 text-left animate-fade-up">
                        <label className="block text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Rejection / Required Changes Notes</label>
                        <textarea
                          rows={3}
                          placeholder="Tell the merchant what changes are required (e.g. please update phone format or replace low-res logo)..."
                          value={rejectionNotes}
                          onChange={(e) => setRejectionNotes(e.target.value)}
                          className="w-full rounded-xl border border-red-200 p-3 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400"
                        />
                        <div className="flex gap-2.5">
                          <button
                            type="button"
                            onClick={() => handleReject(selectedOrder.creativeSubmission!.id)}
                            disabled={submittingReview}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-wider text-[11px] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Send Rejection Notes
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowRejectForm(false)}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 font-bold uppercase tracking-wider text-[11px] rounded-lg transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3.5">
                        {selectedOrder.creativeSubmission.approvalStatus === "MAILED" ? (
                          <div className="px-5 py-2.5 bg-purple-100 text-purple-700 font-bold uppercase tracking-wider text-xs rounded-xl">
                            📬 Postcards Completed & Mailed
                          </div>
                        ) : selectedOrder.creativeSubmission.approvalStatus === "PRINTED" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder.creativeSubmission!.id, "MAILED")}
                            disabled={submittingReview}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          >
                            📬 Mark as Mailed
                          </button>
                        ) : selectedOrder.creativeSubmission.approvalStatus === "APPROVED" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder.creativeSubmission!.id, "PRINTED")}
                            disabled={submittingReview}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                          >
                            🖨️ Mark as Printed
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setShowRejectForm(true)}
                              disabled={submittingReview}
                              className="px-5 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 font-bold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer"
                            >
                              ❌ Request Changes
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(selectedOrder.creativeSubmission!.id, "APPROVED")}
                              disabled={submittingReview}
                              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                            >
                              ✓ Approve for Printing
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic text-center py-2">Approval actions disabled. Awaiting merchant asset submission.</p>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center text-slate-400 select-none">
              <span className="text-4xl mb-3">🎨</span>
              <p className="font-bold text-sm">Review Panel Offline</p>
              <p className="text-xs mt-1 text-slate-400">Select a sold campaign spot from the left sidebar to begin verification review.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
