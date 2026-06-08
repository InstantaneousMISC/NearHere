"use client"

import { useState, use } from "react"
import { trpc } from "@/components/providers"
import { formatPrice, formatDate } from "@/lib/utils"
import Link from "next/link"
import { ApprovalStatus } from "@prisma/client"

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params)
  const [copied, setCopied] = useState(false)
  const [updating, setUpdating] = useState(false)

  // Query order details
  const { data: order, isLoading, refetch } = trpc.order.getById.useQuery({ id })
  const updateApprovalMutation = trpc.creative.updateApproval.useMutation()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold text-sm">Loading order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">Order Not Found</h2>
        <p className="text-slate-500 mt-2 text-sm">The requested transaction could not be located.</p>
        <Link href="/admin/orders" className="mt-4 inline-flex text-blue-650 hover:underline font-semibold">
          Return to Orders
        </Link>
      </div>
    )
  }

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const link = `${window.location.origin}/submit-creative/${order.creativeSubmissionToken}`
      navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleApprovalChange = async (status: ApprovalStatus) => {
    if (!order.creativeSubmission) return

    let notes = ""
    if (status === ApprovalStatus.NEEDS_REVIEW) {
      const response = prompt("Specify the revision requests/reasons for the advertiser:")
      if (response === null) return // Canceled
      notes = response.trim()
      if (!notes) {
        alert("Revision notes are required when requesting revisions.")
        return
      }
    } else if (status === ApprovalStatus.REJECTED) {
      const response = prompt("Specify rejection reasons (optional):")
      if (response === null) return
      notes = response.trim()
    } else {
      const confirmApproval = confirm("Are you sure you want to approve this creative submission?")
      if (!confirmApproval) return
    }

    setUpdating(true)
    try {
      await updateApprovalMutation.mutateAsync({
        submissionId: order.creativeSubmission.id,
        approvalStatus: status,
        approvalNotes: notes || undefined,
      })
      await refetch()
    } catch (err: any) {
      console.error(err)
      alert(err.message || "Failed to update approval status.")
    } finally {
      setUpdating(false)
    }
  }

  // Parse additional images JSON array
  let additionalImages: string[] = []
  if (order.creativeSubmission?.additionalImages) {
    try {
      const parsed = typeof order.creativeSubmission.additionalImages === "string"
        ? JSON.parse(order.creativeSubmission.additionalImages)
        : order.creativeSubmission.additionalImages
      if (Array.isArray(parsed)) {
        additionalImages = parsed
      }
    } catch (e) {
      console.error("Error parsing additional images:", e)
    }
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/orders"
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
          >
            ← Back to Orders
          </Link>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Order Details
            </h1>
            <span className="font-mono text-xs text-slate-400 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg">
              ID: {order.id}
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Placed on <span className="font-semibold text-slate-800">{formatDate(order.createdAt)}</span>
          </p>
        </div>

        {/* Action tags */}
        <div className="flex items-center gap-3 flex-wrap">
          {order.stripeCheckoutSessionId && (
            <a
              href={`https://dashboard.stripe.com/test/payments/${order.stripePaymentIntentId || ""}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-350 bg-white hover:bg-slate-50 font-bold text-xs px-4 py-2.5 text-slate-700 transition-colors shadow-sm"
            >
              💳 View in Stripe
            </a>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Overview and Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Advertiser & Campaign details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Advertiser Info */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Advertiser Profile
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-400 font-semibold text-xs block">Business Name</span>
                  <span className="font-bold text-slate-800 text-base">{order.advertiser.businessName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold text-xs block">Contact Representative</span>
                  <span className="font-semibold text-slate-800">{order.advertiser.contactName}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-50 pt-2">
                  <div>
                    <span className="text-slate-400 font-semibold text-xs block">Email Address</span>
                    <a href={`mailto:${order.advertiser.email}`} className="font-semibold text-blue-650 hover:underline truncate block">
                      {order.advertiser.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-xs block">Phone Number</span>
                    <span className="font-semibold text-slate-800">{order.advertiser.phone}</span>
                  </div>
                </div>
                {order.advertiser.website && (
                  <div className="border-t border-slate-50 pt-2">
                    <span className="text-slate-400 font-semibold text-xs block">Business Website</span>
                    <a
                      href={order.advertiser.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-650 hover:underline block truncate"
                    >
                      {order.advertiser.website}
                    </a>
                  </div>
                )}
                {order.advertiser.businessAddress && (
                  <div className="border-t border-slate-50 pt-2">
                    <span className="text-slate-400 font-semibold text-xs block">Mailing Address</span>
                    <span className="text-slate-600 block">{order.advertiser.businessAddress}</span>
                  </div>
                )}
                {order.advertiser.heardAboutUs && (
                  <div className="border-t border-slate-50 pt-2">
                    <span className="text-slate-400 font-semibold text-xs block">Referral Source</span>
                    <span className="text-slate-600 block italic">"{order.advertiser.heardAboutUs}"</span>
                  </div>
                )}
              </div>
            </div>

            {/* Campaign & Spot details */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Purchased Asset Details
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-slate-400 font-semibold text-xs block">Target Campaign</span>
                  <Link
                    href={`/admin/campaigns/${order.campaignId}`}
                    className="font-bold text-blue-650 hover:underline text-base"
                  >
                    {order.campaign.name}
                  </Link>
                </div>
                <div>
                  <span className="text-slate-400 font-semibold text-xs block">Campaign Location</span>
                  <span className="font-semibold text-slate-700">
                    {order.campaign.city}, {order.campaign.state.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-2">
                  <div>
                    <span className="text-slate-400 font-semibold text-xs block">Category Tag</span>
                    <span className="inline-block bg-slate-150 text-slate-800 text-xs px-2 py-0.5 rounded font-bold uppercase mt-0.5">
                      {order.campaignSpot.category.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-xs block">Postcard Side</span>
                    <span className="font-bold text-slate-700 block">{order.campaignSpot.side}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-xs block">Ad Spot Label</span>
                    <span className="font-semibold text-slate-700 block">{order.campaignSpot.label}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold text-xs block">Size Tier</span>
                    <span className="font-semibold text-slate-750 block">{order.campaignSpot.spotType}</span>
                  </div>
                </div>
                <div className="border-t border-slate-50 pt-2">
                  <span className="text-slate-400 font-semibold text-xs block">Design Coordinates (X, Y, W, H)</span>
                  <span className="font-mono text-xs text-slate-500 block mt-0.5">
                    {order.campaignSpot.x}%, {order.campaignSpot.y}%, {order.campaignSpot.width}%, {order.campaignSpot.height}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Creative Submission Preview Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Advertiser Creative Submissions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review and verify text and image assets uploaded by the client.
                </p>
              </div>

              {order.status === "PAID" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-250 hover:bg-slate-50 text-slate-700 font-bold text-xs px-3.5 py-2 transition-all shadow-sm"
                  >
                    {copied ? "✓ Copied Link" : "📋 Copy Upload Link"}
                  </button>
                </div>
              )}
            </div>

            {order.status !== "PAID" ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm">
                ⚠️ Ad Creative submission is only active for completed payments (Status: PAID).
              </div>
            ) : !order.creativeSubmission ? (
              <div className="bg-amber-50 border border-dashed border-amber-200 rounded-2xl p-8 text-center space-y-3">
                <span className="text-2xl block">⏳</span>
                <h4 className="font-bold text-amber-900 text-sm">Pending Assets Upload</h4>
                <p className="text-xs text-amber-700 max-w-md mx-auto leading-relaxed">
                  The client has not yet uploaded copy or image files. You can send them this URL to complete their setup:
                </p>
                <div className="max-w-md mx-auto flex items-center bg-white border border-amber-200 rounded-xl p-1.5 gap-2 text-xs">
                  <span className="font-mono text-slate-505 truncate flex-1 pl-2 select-all">
                    {typeof window !== "undefined" && `${window.location.origin}/submit-creative/${order.creativeSubmissionToken}`}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-1.5 font-bold transition-all shadow-sm shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : (
              // Submitted Creative Display
              <div className="space-y-6">
                
                {/* Visual grid content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  
                  {/* Left Specs */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block">Headline Copy</span>
                      <span className="font-bold text-slate-900 text-base mt-0.5 block">
                        {order.creativeSubmission.headline || <span className="text-slate-350 font-normal italic">No Headline Provided</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block">Offer / Deal Details</span>
                      <span className="font-bold text-slate-850 text-base mt-0.5 block text-indigo-700">
                        {order.creativeSubmission.offerDeal || <span className="text-slate-350 font-normal italic">No Offer Provided</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block">Promo Description</span>
                      <p className="text-slate-650 mt-1 leading-relaxed whitespace-pre-line bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                        {order.creativeSubmission.description || <span className="text-slate-350 font-normal italic">No Description Provided</span>}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block">Call to Action (CTA)</span>
                      <span className="font-bold text-slate-800 block mt-0.5">
                        {order.creativeSubmission.cta || <span className="text-slate-350 font-normal italic">No CTA Provided</span>}
                      </span>
                    </div>
                    {order.creativeSubmission.notes && (
                      <div className="border-t border-slate-100 pt-3">
                        <span className="text-slate-400 font-semibold text-xs uppercase block">Advertiser Instructions / Notes</span>
                        <p className="text-slate-600 mt-1 italic leading-relaxed whitespace-pre-line">
                          "{order.creativeSubmission.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Images and Contact Overrides */}
                  <div className="space-y-5">
                    
                    {/* Logo asset */}
                    <div>
                      <span className="text-slate-400 font-semibold text-xs uppercase tracking-wider block mb-2">Advertiser Logo File</span>
                      {order.creativeSubmission.logoUrl ? (
                        <div className="relative border border-slate-200 bg-slate-50 p-4 rounded-2xl inline-flex max-w-[200px] hover:shadow-md transition-shadow">
                          <img
                            src={order.creativeSubmission.logoUrl}
                            alt="Advertiser Logo"
                            className="max-h-[140px] max-w-full object-contain mx-auto"
                          />
                          <a
                            href={order.creativeSubmission.logoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-950 text-white rounded-lg p-1.5 text-[10px] font-bold"
                          >
                            ↗ Open
                          </a>
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400 italic">
                          No Logo File Uploaded
                        </div>
                      )}
                    </div>

                    {/* Contact details override */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2.5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider block border-b border-slate-200 pb-1">
                        Postcard Contact Text
                      </span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 font-semibold block">Business Name</span>
                          <span className="font-bold text-slate-800 mt-0.5 block truncate">
                            {order.creativeSubmission.businessName || order.advertiser.businessName}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 font-semibold block">Phone</span>
                          <span className="font-bold text-slate-800 mt-0.5 block">
                            {order.creativeSubmission.phone || order.advertiser.phone}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 font-semibold block">Website URL</span>
                          <span className="font-bold text-slate-800 mt-0.5 block truncate">
                            {order.creativeSubmission.website || order.advertiser.website || "—"}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 font-semibold block">Address Details</span>
                          <span className="font-bold text-slate-800 mt-0.5 block truncate">
                            {order.creativeSubmission.address || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Prompt details */}
                    {order.creativeSubmission.wantsAiHelp && (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                          <span>🤖</span>
                          <span>Requested copywriting assistance</span>
                        </div>
                        {order.creativeSubmission.aiPrompt && (
                          <p className="text-indigo-755 italic bg-white/70 rounded-xl p-2.5 border border-indigo-100 leading-relaxed">
                            "{order.creativeSubmission.aiPrompt}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional image uploads gallery */}
                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Additional Media Assets ({additionalImages.length} of 5)
                  </h4>
                  {additionalImages.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No additional campaign photos or deals coupons uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {additionalImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-square border border-slate-200 bg-slate-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
                          <img
                            src={url}
                            alt={`Creative Attachment ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity"
                          >
                            Open Size ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Status details and reviews */}
        <div className="space-y-8">
          
          {/* Checkout transaction details */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Payment & Transaction
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-semibold">Payment Status:</span>
                <span
                  className={`inline-block text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider ${
                    order.status === "PAID"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      : order.status === "PENDING"
                      ? "bg-amber-50 text-amber-700 border border-amber-100"
                      : order.status === "REFUNDED"
                      ? "bg-purple-50 text-purple-700 border border-purple-100"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm border-t border-slate-50 pt-3">
                <span className="text-slate-500 font-semibold">Transaction Amount:</span>
                <span className="text-lg font-black text-slate-900">
                  {formatPrice(order.amount)}
                </span>
              </div>

              {order.paidAt && (
                <div className="flex justify-between items-center text-sm border-t border-slate-50 pt-3">
                  <span className="text-slate-500 font-semibold">Paid Timestamp:</span>
                  <span className="font-bold text-slate-800">{formatDate(order.paidAt)}</span>
                </div>
              )}

              {order.stripeCheckoutSessionId && (
                <div className="space-y-1.5 border-t border-slate-50 pt-3 text-xs">
                  <span className="text-slate-400 font-bold block">Stripe Session Reference:</span>
                  <span className="font-mono text-slate-500 block break-all select-all font-semibold bg-slate-50 border border-slate-100 p-2 rounded-lg">
                    {order.stripeCheckoutSessionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Ad Creative Review status action panel */}
          {order.status === "PAID" && order.creativeSubmission && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                Creative Review Panel
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Current Approval Status
                  </span>
                  <span
                    className={`inline-block text-xs font-extrabold px-3.5 py-1.5 rounded-xl uppercase tracking-wider border ${
                      order.creativeSubmission.approvalStatus === "APPROVED"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : order.creativeSubmission.approvalStatus === "NEEDS_REVIEW"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : order.creativeSubmission.approvalStatus === "REJECTED"
                        ? "bg-red-50 text-red-700 border-red-100"
                        : "bg-blue-50 text-blue-700 border-blue-100"
                    }`}
                  >
                    {order.creativeSubmission.approvalStatus}
                  </span>
                </div>

                {order.creativeSubmission.approvalNotes && (
                  <div className="space-y-1 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider block">
                      Internal Review Notes
                    </span>
                    <p className="text-slate-650 italic mt-1 leading-relaxed">
                      "{order.creativeSubmission.approvalNotes}"
                    </p>
                  </div>
                )}

                {/* Review status CTA actions */}
                <div className="space-y-3 pt-2">
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleApprovalChange(ApprovalStatus.APPROVED)}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-3 transition-colors shadow"
                  >
                    {updating ? "Processing..." : "✓ Approve Ad Assets"}
                  </button>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleApprovalChange(ApprovalStatus.NEEDS_REVIEW)}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm px-4 py-3 transition-colors shadow"
                  >
                    {updating ? "Processing..." : "✏️ Request Revisions"}
                  </button>

                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => handleApprovalChange(ApprovalStatus.REJECTED)}
                    className="w-full inline-flex items-center justify-center rounded-xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-700 hover:text-red-750 font-bold text-sm px-4 py-3 transition-colors shadow-sm"
                  >
                    {updating ? "Processing..." : "✕ Reject Submission"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
