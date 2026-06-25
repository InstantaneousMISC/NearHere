"use client"

import React, { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUploadThing } from "@/lib/uploadthing"

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

  // Layout Proof States
  const [draftProofUrl, setDraftProofUrl] = useState<string | null>(null)
  const [isUploadingProof, setIsUploadingProof] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { startUpload: startProofUpload } = useUploadThing(
    "draftProofUploader",
    {
      onClientUploadComplete: (res) => {
        if (res && res[0]) {
          setDraftProofUrl(res[0].ufsUrl)
          setUploadError(null)
          alert("Proof file uploaded successfully! Ready to submit to advertiser.")
        }
      },
      onUploadError: (err) => {
        setUploadError(`Upload failed: ${err.message}`)
      },
    }
  )

  const handleProofFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadError(null)
      setIsUploadingProof(true)
      try {
        await startProofUpload([file])
      } catch (err: any) {
        setUploadError(err.message || "Failed to upload file")
      } finally {
        setIsUploadingProof(false)
      }
    }
  }

  const handleSendProof = async (submissionId: string) => {
    if (!draftProofUrl) {
      alert("Please upload a proof file first.")
      return
    }
    setSubmittingReview(true)
    try {
      await updateApprovalMutation.mutateAsync({
        submissionId,
        approvalStatus: "NEEDS_REVIEW",
        draftProofUrl,
        approvalNotes: "Layout proof ready for review.",
      })
      alert("Proof submitted to advertiser successfully!")
      setDraftProofUrl(null)
      utils.creative.getSoldSpotsForReview.invalidate()
    } catch (err: any) {
      alert(`Error submitting proof: ${err.message}`)
    } finally {
      setSubmittingReview(false)
    }
  }

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
    setDraftProofUrl(null)
    setUploadError(null)
  }

  const handleApprove = async (submissionId: string) => {
    if (!confirm("Are you sure you want to approve this campaign creative for printing?")) return
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
      alert("Creative status updated to Needs Changes. Advertiser notified.")
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
      <div className="space-y-6 animate-pulse text-left font-sans">
        <div className="h-10 bg-press/10 w-1/4 rounded-none" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">
          <div className="lg:col-span-1 bg-press/5 border border-border rounded-none" />
          <div className="lg:col-span-2 bg-press/5 border border-border rounded-none" />
        </div>
      </div>
    )
  }

  if (error || !soldSpots) {
    return (
      <Card className="bg-red-500/10 border border-red-500/20 text-red-700 p-6 text-left font-sans">
        <h3 className="font-headline font-black uppercase text-lg tracking-tight">Error Loading Reviews</h3>
        <p className="text-xs font-semibold mt-1">{error?.message || "Failed to query creative reviews queue."}</p>
      </Card>
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
    if (creative.approvalStatus === "NEEDS_REVIEW") return "NEEDS_REVIEW"
    if (creative.approvalStatus === "REJECTED") return "NEEDS_CHANGES"
    if (creative.approvalStatus === "APPROVED") return "APPROVED_FOR_PRINT"

    return "PENDING_REVIEW"
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "MAILED":
        return "secondary"
      case "PRINTING":
        return "secondary"
      case "APPROVED_FOR_PRINT":
        return "success"
      case "PENDING_REVIEW":
        return "warning"
      case "NEEDS_REVIEW":
        return "warning"
      case "NEEDS_CHANGES":
        return "destructive"
      case "PENDING_PROFILE":
        return "warning"
      case "PENDING_CREATIVE":
      default:
        return "outline"
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
      creative?.approvalStatus === "APPROVED" || creative?.approvalStatus === "PRINTED" || creative?.approvalStatus === "MAILED", // Approved
    ]

    const completed = items.filter(Boolean).length
    return Math.round((completed / items.length) * 100)
  }

  return (
    <div className="space-y-8 text-left font-sans">
      
      {/* Title */}
      <div className="space-y-1">
        <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-press leading-none">
          Creative Review Queue
        </h1>
        <p className="text-xs text-warm font-medium">
          Review advertiser postcard assets, verify landing pages, test print QR codes, and approve designs for print layout.
        </p>
      </div>

      {/* Filters */}
      <Card className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search by business, campaign, or spot label..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Filter Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-none border border-input bg-card text-press h-10 px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
          >
            <option value="ALL">All Sold Slots</option>
            <option value="PENDING_CREATIVE">Pending Creative Details</option>
            <option value="PENDING_PROFILE">Pending Profile Setup</option>
            <option value="PENDING_REVIEW">Pending Admin Review</option>
            <option value="NEEDS_REVIEW">Proof Ready / Review Needed</option>
            <option value="NEEDS_CHANGES">Needs Changes</option>
            <option value="APPROVED_FOR_PRINT">Approved for Print</option>
            <option value="PRINTING">Printing</option>
            <option value="MAILED">Mailed</option>
          </select>
        </div>
      </Card>

      {/* Main Review Portal Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Listing List */}
        <Card className="lg:col-span-1 p-6 space-y-4 max-h-[700px] overflow-y-auto select-none">
          <h3 className="font-headline font-extrabold text-base uppercase tracking-tight text-press border-b border-border pb-3">
            Reserved Placements ({filteredSpots.length})
          </h3>
          
          <div className="space-y-3">
            {filteredSpots.length === 0 ? (
              <p className="text-xs text-warm font-medium italic py-6 text-center">No campaign slots match the filters.</p>
            ) : (
              filteredSpots.map((order) => {
                const status = getComputedStatus(order)
                const score = getReadinessScore(order)
                const isSelected = order.id === selectedOrderId

                return (
                  <div
                    key={order.id}
                    onClick={() => handleSelectOrder(order.id)}
                    className={`p-4 border transition-all cursor-pointer rounded-none text-left ${
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-press hover:bg-press/5"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-headline font-extrabold text-sm text-press uppercase tracking-tight truncate max-w-[150px]">
                          {order.advertiser.businessName}
                        </span>
                        <Badge variant={getStatusBadgeVariant(status)}>
                          {status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-warm font-bold uppercase font-mono tracking-tight">
                        {order.campaign.name} • {order.campaignSpot.label}
                      </p>

                      <div className="pt-2 flex items-center justify-between gap-4">
                        <div className="flex-1 bg-[#E7E0D8]/45 h-1.5 border border-border overflow-hidden rounded-none">
                          <div
                            style={{ width: `${score}%` }}
                            className="bg-primary h-full"
                          />
                        </div>
                        <span className="font-mono text-[9px] font-bold text-warm uppercase tracking-wider">{score}% ready</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        {/* Right Side: Detail review panel */}
        <Card className="lg:col-span-2 p-6 min-h-[500px]">
          {selectedOrder ? (
            <div className="space-y-6">
              
              {/* Header Title details */}
              <div className="border-b border-border pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-widest block">Reviewing Advertiser Creative</span>
                  <h2 className="font-headline font-black text-xl text-press uppercase tracking-tight leading-tight">
                    {selectedOrder.advertiser.businessName}
                  </h2>
                  <p className="text-xs text-warm font-semibold">
                    Campaign placement: <span className="font-bold text-press">{selectedOrder.campaignSpot.label}</span> on campaign <span className="font-bold text-press">{selectedOrder.campaign.name}</span>
                  </p>
                </div>

                <Badge variant={getStatusBadgeVariant(selectedStatus || "")}>
                  {selectedStatus?.replace(/_/g, " ")}
                </Badge>
              </div>

              {/* Checklist Section */}
              <div className="bg-[#FAF8F4] border-2 border-press p-5 space-y-3 select-none">
                <h4 className="font-headline font-extrabold text-xs uppercase tracking-wider text-press text-left border-b border-border pb-1.5">Print-Readiness Verification Checklist</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs text-press text-left font-semibold">
                  {/* Payment */}
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold text-base">✓</span>
                    <span>Payment Verified ({formatPrice(selectedOrder.amount)})</span>
                  </div>

                  {/* Profile completed */}
                  <div className="flex items-center gap-2">
                    {!!selectedOrder.qrCodes?.[0]?.business?.description && !!selectedOrder.qrCodes?.[0]?.business?.logoUrl ? (
                      <span className="text-emerald-600 font-bold text-base">✓</span>
                    ) : (
                      <span className="text-primary text-base">⏳</span>
                    )}
                    <span>Business Profile Setup Completed</span>
                  </div>

                  {/* Creative Submission */}
                  <div className="flex items-center gap-2">
                    {selectedOrder.creativeSubmission?.submittedAt ? (
                      <span className="text-emerald-600 font-bold text-base">✓</span>
                    ) : (
                      <span className="text-primary text-base">⏳</span>
                    )}
                    <span>Creative Details Submitted</span>
                  </div>

                  {/* QR Code exists */}
                  <div className="flex items-center gap-2">
                    {selectedOrder.qrCodes?.[0] ? (
                      <span className="text-emerald-600 font-bold text-base">✓</span>
                    ) : (
                      <span className="text-primary text-base">⏳</span>
                    )}
                    <span>QR Code Slug Generated</span>
                  </div>

                  {/* QR code tested */}
                  <div className="flex items-center gap-2">
                    {(selectedOrder.qrCodes?.[0]?._count?.scans ?? 0) > 0 ? (
                      <span className="text-emerald-600 font-bold text-base">✓</span>
                    ) : (
                      <span className="text-warm font-mono font-bold text-[9px] uppercase tracking-wider border border-press px-1 bg-card">TEST</span>
                    )}
                    <span>QR tested ({(selectedOrder.qrCodes?.[0]?._count?.scans ?? 0)} recorded scans)</span>
                  </div>

                  {/* Landing page active */}
                  <div className="flex items-center gap-2">
                    {selectedOrder.qrCodes?.[0]?.business?.status === "ACTIVE" ? (
                      <span className="text-emerald-600 font-bold text-base">✓</span>
                    ) : (
                      <span className="text-primary text-base">⏳</span>
                    )}
                    <span>Landing Page Active (`/b/${selectedOrder.qrCodes?.[0]?.business?.slug}`)</span>
                  </div>

                  {/* Admin Approved */}
                  <div className="col-span-1 md:col-span-2 flex items-center gap-2 pt-2 border-t border-border">
                    {selectedOrder.creativeSubmission?.approvalStatus === "MAILED" ? (
                      <>
                        <span className="text-purple-600 text-base">📬</span>
                        <span className="font-headline font-bold text-purple-750 uppercase tracking-tight text-sm">Postcards mailed to local homes</span>
                      </>
                    ) : selectedOrder.creativeSubmission?.approvalStatus === "PRINTED" ? (
                      <>
                        <span className="text-indigo-600 text-base">🖨️</span>
                        <span className="font-headline font-bold text-indigo-750 uppercase tracking-tight text-sm">Postcards printed & preparing to mail</span>
                      </>
                    ) : selectedOrder.creativeSubmission?.approvalStatus === "APPROVED" ? (
                      <>
                        <span className="text-emerald-600 font-bold text-base">✓</span>
                        <span className="font-headline font-bold text-emerald-700 uppercase tracking-tight text-sm">Creative ad design approved for printing</span>
                      </>
                    ) : selectedOrder.creativeSubmission?.approvalStatus === "REJECTED" ? (
                      <>
                        <span className="text-red-500 text-base">❌</span>
                        <span className="font-bold text-red-650">Rejection notes sent: "{selectedOrder.creativeSubmission.approvalNotes}"</span>
                      </>
                    ) : (
                      <>
                        <span className="text-primary text-base">⏳</span>
                        <span className="text-warm uppercase tracking-wider font-mono text-[10px]">Pending final admin approval</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Review details grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                
                {/* Postcard Creative ad details */}
                <div className="space-y-4">
                  <h4 className="font-headline font-extrabold text-sm text-press border-b border-border pb-1.5 uppercase">Printed Postcard Details</h4>
                  
                  {selectedOrder.creativeSubmission ? (
                    <div className="space-y-3.5 text-xs text-press">
                      <div>
                        <span className="text-[10px] font-mono text-warm uppercase block mb-1">Printed Headline</span>
                        <p className="font-bold text-press bg-press/5 p-2 border border-border rounded-none">{selectedOrder.creativeSubmission.headline || "None"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-warm uppercase block mb-1">Postcard Offer / Deal</span>
                        <p className="font-headline font-black text-primary bg-press/5 p-2 border border-border rounded-none uppercase tracking-tight text-sm">{selectedOrder.creativeSubmission.offerDeal || "None"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-warm uppercase block mb-0.5">Call to Action (CTA)</span>
                        <p className="font-bold text-press">{selectedOrder.creativeSubmission.cta || "None"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-warm uppercase block mb-0.5">Creative Phone</span>
                        <p className="font-bold text-press">{selectedOrder.creativeSubmission.phone || "None"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-warm uppercase block mb-1">Notes for Designer</span>
                        <p className="font-medium text-warm bg-press/5 p-2 rounded-none border border-border italic">{selectedOrder.creativeSubmission.notes || "No notes provided."}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-warm italic font-medium">Postcard creative details have not been submitted.</p>
                  )}
                </div>

                {/* Digital Landing Page details */}
                <div className="space-y-4 select-none">
                  <h4 className="font-headline font-extrabold text-sm text-press border-b border-border pb-1.5 uppercase">Digital Landing Page & QR</h4>
                  
                  {selectedOrder.qrCodes?.[0] ? (
                    <div className="space-y-4 text-xs text-press">
                      
                      {/* Logo preview */}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 border border-border bg-press/5 flex items-center justify-center overflow-hidden rounded-none p-1 bg-card">
                          {selectedOrder.qrCodes[0].business.logoUrl ? (
                            <img src={selectedOrder.qrCodes[0].business.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" />
                          ) : (
                            <span className="text-press font-headline font-black uppercase text-base">{selectedOrder.advertiser.businessName.slice(0, 2)}</span>
                          )}
                        </div>
                        <div className="text-left">
                          <span className="text-[9px] font-mono text-warm uppercase block">Landing Page Logo</span>
                          <span className="font-semibold text-press block truncate max-w-[180px]">{selectedOrder.qrCodes[0].business.logoUrl ? "Custom uploaded logo" : "Using initials fallback"}</span>
                        </div>
                      </div>

                      {/* Links review */}
                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-mono text-warm uppercase block">Destination Url Path</span>
                        <Link href={`/b/${selectedOrder.qrCodes[0].business.slug}`} target="_blank" className="font-bold text-primary hover:underline break-all block">
                          /b/{selectedOrder.qrCodes[0].business.slug}
                        </Link>
                      </div>

                      <div className="space-y-1 text-left">
                        <span className="text-[9px] font-mono text-warm uppercase block">Print Tracking Redirect Path</span>
                        <Link href={`/q/${selectedOrder.qrCodes[0].slug}`} target="_blank" className="font-bold text-primary hover:underline block font-mono">
                          /q/{selectedOrder.qrCodes[0].slug}
                        </Link>
                      </div>

                      {/* Account claiming stats */}
                      <div className="pt-2 border-t border-border space-y-2 text-left">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-warm font-mono text-[9px] uppercase">Profile Claimed</span>
                          <Badge variant={selectedOrder.qrCodes[0].business.ownerUserId ? "success" : "warning"}>
                            {selectedOrder.qrCodes[0].business.ownerUserId ? "Claimed" : "Unclaimed"}
                          </Badge>
                        </div>

                        {/* Regenerate claim link helper */}
                        <div className="space-y-2 pt-2 border-t border-dashed border-border">
                          {!showRegenForm ? (
                            <Button
                              type="button"
                              onClick={() => {
                                setShowRegenForm(true)
                                setRegenReason("")
                                setSendEmailNotice(false)
                                setRegeneratedLink(null)
                                setRegeneratedForId(null)
                              }}
                              size="sm"
                              variant="outline"
                              className="w-full text-[10px]"
                            >
                              {selectedOrder.qrCodes[0].business.ownerUserId
                                ? "⚠️ Reset & Regenerate Claim Link"
                                : "🔑 Regenerate Claim Link"}
                            </Button>
                          ) : (
                            <div className="bg-[#FAF8F4] border border-border p-3.5 space-y-3 rounded-none">
                              <span className="text-[9px] font-mono font-bold text-warm uppercase block">Reset & Regenerate Claim Link</span>
                              <div>
                                <label className="block text-[8px] font-mono font-bold text-warm uppercase mb-1">Reason for reset *</label>
                                <Input
                                  type="text"
                                  required
                                  value={regenReason}
                                  onChange={(e) => setRegenReason(e.target.value)}
                                  placeholder="e.g. lost link"
                                  className="h-8 text-[10px]"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id="sendEmailNotice"
                                  checked={sendEmailNotice}
                                  onChange={(e) => setSendEmailNotice(e.target.checked)}
                                  className="border-press rounded-none text-primary focus:ring-primary w-3.5 h-3.5"
                                />
                                <label htmlFor="sendEmailNotice" className="text-[10px] font-bold text-press cursor-pointer select-none">
                                  Notify business owner via email
                                </label>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  disabled={regenerating || !regenReason.trim()}
                                  onClick={() => handleRegenerateClaim(selectedOrder.qrCodes[0].business.id)}
                                  size="sm"
                                >
                                  {regenerating ? "Regenerating..." : "Confirm Reset"}
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => setShowRegenForm(false)}
                                  size="sm"
                                  variant="outline"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}

                          {regeneratedLink && regeneratedForId === selectedOrder.qrCodes[0].business.id && (
                            <div className="bg-press/5 border border-border p-2.5 space-y-1.5">
                              <span className="text-[9px] font-mono text-warm uppercase block">Claim link:</span>
                              <Input
                                type="text"
                                readOnly
                                value={regeneratedLink}
                                className="h-8 text-[10px] bg-card"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(regeneratedLink)
                                  alert("Claim link copied to clipboard!")
                                }}
                                size="sm"
                              >
                                Copy Link
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <p className="text-xs text-warm italic font-medium">No active tracking QR code generated.</p>
                  )}
                </div>
              </div>

              {/* Layout Proof Section */}
              <div className="border-t border-border pt-6 space-y-4 text-left">
                <h4 className="font-headline font-extrabold text-sm text-press border-b border-border pb-1.5 uppercase">
                  Layout Proof & Advertiser Approval Flow
                </h4>

                {selectedOrder.creativeSubmission ? (
                  <div className="space-y-4">
                    {/* Active proof or status */}
                    {selectedOrder.creativeSubmission.draftProofUrl ? (
                      <div className="bg-[#FAF8F4] border border-border p-4 rounded-none space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono text-warm uppercase block mb-1">Uploaded Draft Proof</span>
                            <a
                              href={selectedOrder.creativeSubmission.draftProofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary font-bold hover:underline text-xs break-all"
                            >
                              {selectedOrder.creativeSubmission.draftProofUrl} ↗
                            </a>
                          </div>
                          <Badge variant={getStatusBadgeVariant(selectedStatus || "")}>
                            {selectedStatus?.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        {selectedOrder.creativeSubmission.draftFeedback && (
                          <div className="bg-red-500/5 border border-red-200 p-3 rounded-none mt-2">
                            <span className="text-[10px] font-mono text-red-700 font-bold uppercase block mb-1">
                              Revision Feedback from Advertiser:
                            </span>
                            <p className="text-xs text-red-700 italic">
                              "{selectedOrder.creativeSubmission.draftFeedback}"
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-stone-bg/20 border border-dashed border-border p-4 text-center rounded-none">
                        <p className="text-xs text-warm font-medium">No layout proof has been uploaded yet for this creative submission.</p>
                      </div>
                    )}

                    {/* Uploader (for uploading new/revised proof) */}
                    {selectedOrder.creativeSubmission.approvalStatus !== "APPROVED" &&
                     selectedOrder.creativeSubmission.approvalStatus !== "PRINTED" &&
                     selectedOrder.creativeSubmission.approvalStatus !== "MAILED" && (
                      <div className="space-y-3 p-4 border border-border bg-press/5 rounded-none">
                        <span className="text-[10px] font-mono text-warm uppercase block font-bold">
                          Upload Layout Proof (JPG, PNG, PDF - Max 8MB/16MB)
                        </span>

                        <div className="flex items-center gap-4">
                          <label className="cursor-pointer inline-flex items-center justify-center bg-card hover:bg-stone-bg border border-border text-foreground font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-2.5 rounded-none transition-colors">
                            {isUploadingProof ? "Uploading..." : draftProofUrl ? "Change Proof File" : "Select Proof File"}
                            <input
                              type="file"
                              accept="image/*,application/pdf"
                              disabled={isUploadingProof || submittingReview}
                              onChange={handleProofFileChange}
                              className="hidden"
                            />
                          </label>

                          {draftProofUrl && (
                            <span className="text-xs text-emerald-600 font-bold font-mono">
                              ✓ Uploaded & ready to submit
                            </span>
                          )}
                        </div>

                        {uploadError && (
                          <p className="text-xs text-red-500 font-mono mt-1">⚠️ {uploadError}</p>
                        )}

                        {draftProofUrl && (
                          <div className="pt-2">
                            <Button
                              type="button"
                              onClick={() => handleSendProof(selectedOrder.creativeSubmission!.id)}
                              disabled={submittingReview}
                              className="w-full sm:w-auto"
                            >
                              {submittingReview ? "Submitting..." : "Submit Draft Proof to Advertiser"}
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-warm italic">Postcard creative details must be submitted before layout proofs can be uploaded.</p>
                )}
              </div>

              {/* Action buttons (Approve/Reject controls) */}
              <div className="border-t border-border pt-6 select-none text-right">
                {selectedOrder.creativeSubmission ? (
                  <div className="space-y-4">
                    {showRejectForm ? (
                      <div className="space-y-3 bg-red-500/5 border border-red-200 p-4 text-left animate-fade-up">
                        <label className="block text-xs font-bold text-red-700 font-headline uppercase tracking-wider mb-1">Rejection / Required Changes Notes</label>
                        <Textarea
                          rows={3}
                          placeholder="Tell the advertiser what changes are required..."
                          value={rejectionNotes}
                          onChange={(e) => setRejectionNotes(e.target.value)}
                        />
                        <div className="flex gap-2.5">
                          <Button
                            type="button"
                            onClick={() => handleReject(selectedOrder.creativeSubmission!.id)}
                            disabled={submittingReview}
                            variant="destructive"
                          >
                            Send Rejection Notes
                          </Button>
                          <Button
                            type="button"
                            onClick={() => setShowRejectForm(false)}
                            variant="outline"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-3.5">
                        {selectedOrder.creativeSubmission.approvalStatus === "MAILED" ? (
                          <div className="px-5 py-2.5 bg-press text-paper font-headline font-bold uppercase tracking-wider text-xs rounded-none border border-press">
                            📬 Postcards Completed & Mailed
                          </div>
                        ) : selectedOrder.creativeSubmission.approvalStatus === "PRINTED" ? (
                          <Button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder.creativeSubmission!.id, "MAILED")}
                            disabled={submittingReview}
                            className="bg-purple-600 hover:bg-purple-750 text-white border-purple-700"
                          >
                            📬 Mark as Mailed
                          </Button>
                        ) : selectedOrder.creativeSubmission.approvalStatus === "APPROVED" ? (
                          <Button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder.creativeSubmission!.id, "PRINTED")}
                            disabled={submittingReview}
                            className="bg-indigo-600 hover:bg-indigo-755 text-white border-indigo-700"
                          >
                            🖨️ Mark as Printed
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              onClick={() => setShowRejectForm(true)}
                              disabled={submittingReview}
                              variant="outline"
                              className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                            >
                              ❌ Request Changes
                            </Button>
                            <Button
                              type="button"
                              onClick={() => handleUpdateStatus(selectedOrder.creativeSubmission!.id, "APPROVED")}
                              disabled={submittingReview}
                            >
                              ✓ Approve for Printing
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-warm italic text-center py-2">Approval actions disabled. Awaiting advertiser creative submission.</p>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center text-warm select-none">
              <span className="text-4xl mb-3">🎨</span>
              <p className="font-headline font-black text-lg uppercase tracking-tight text-press">Review Panel Offline</p>
              <p className="text-xs mt-1 text-warm font-medium">Select a sold campaign spot from the left sidebar to begin verification review.</p>
            </div>
          )}
        </Card>

      </div>

    </div>
  )
}
