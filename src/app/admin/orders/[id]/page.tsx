"use client"

import { useState, use } from "react"
import { trpc } from "@/components/providers"
import { formatPrice, formatDate } from "@/lib/utils"
import Link from "next/link"
import { ApprovalStatus } from "@prisma/client"
import { getFriendlyApprovalStatusLabel } from "@/lib/statusHelper"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
  const cancelOrRefundMutation = trpc.order.cancelOrRefund.useMutation()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 animate-pulse">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-none animate-spin" />
        <p className="text-warm font-mono font-bold text-xs uppercase tracking-wider">Loading order details...</p>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="font-headline font-black text-xl text-primary uppercase">Order Not Found</h2>
        <p className="text-warm text-sm font-semibold">The requested transaction could not be located.</p>
        <Button asChild variant="outline">
          <Link href="/admin/orders">
            Return to Orders
          </Link>
        </Button>
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

  const handleCancelOrRefund = async (targetStatus: "CANCELLED" | "REFUNDED") => {
    const actionLabel = targetStatus === "REFUNDED" ? "refund" : "cancel"
    const confirmMsg = `Are you sure you want to ${actionLabel} this order? This will release the campaign spot and disable any associated QR codes.`
    if (!confirm(confirmMsg)) return

    const reason = prompt(`Reason for ${actionLabel} (optional):`)
    if (reason === null) return // Canceled

    setUpdating(true)
    try {
      await cancelOrRefundMutation.mutateAsync({
        orderId: order.id,
        status: targetStatus,
        reason: reason.trim() || undefined,
      })
      await refetch()
    } catch (err: any) {
      console.error(err)
      alert(err.message || `Failed to ${actionLabel} the order.`)
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border pb-6 gap-4">
        <div className="space-y-1 text-left">
          <Link
            href="/admin/orders"
            className="text-[10px] font-mono font-bold text-warm hover:text-primary transition-colors uppercase tracking-widest"
          >
            ← Back to Orders
          </Link>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-press leading-none">
              Order Details
            </h1>
            <span className="font-mono text-xs text-warm bg-press/5 border border-border px-3 py-1 rounded-none select-all font-bold">
              ID: {order.id}
            </span>
          </div>
          <p className="text-xs text-warm font-medium">
            Placed on <span className="font-bold text-press">{formatDate(order.createdAt)}</span>
          </p>
        </div>

        {/* Action tags */}
        <div className="flex items-center gap-3 flex-wrap">
          {order.stripeCheckoutSessionId && (
            <Button asChild variant="outline">
              <a
                href={`https://dashboard.stripe.com/test/payments/${order.stripePaymentIntentId || ""}`}
                target="_blank"
                rel="noreferrer"
              >
                💳 View in Stripe
              </a>
            </Button>
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
            <Card className="p-6 space-y-4">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-border pb-2">
                Advertiser Profile
              </h3>
              <div className="space-y-3 text-sm text-left">
                <div>
                  <span className="text-[10px] font-mono font-bold text-warm uppercase block">Business Name</span>
                  <span className="font-headline font-extrabold text-lg text-press uppercase tracking-tight">{order.advertiser.businessName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-warm uppercase block">Contact Representative</span>
                  <span className="font-bold text-press">{order.advertiser.contactName}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-border pt-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-warm uppercase block">Email Address</span>
                    <a href={`mailto:${order.advertiser.email}`} className="font-bold text-primary hover:underline truncate block">
                      {order.advertiser.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-warm uppercase block">Phone Number</span>
                    <span className="font-bold text-press">{order.advertiser.phone}</span>
                  </div>
                </div>
                {order.advertiser.website && (
                  <div className="border-t border-border pt-2">
                    <span className="text-[10px] font-mono font-bold text-warm uppercase block">Business Website</span>
                    <a
                      href={order.advertiser.website}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-primary hover:underline block truncate"
                    >
                      {order.advertiser.website}
                    </a>
                  </div>
                )}
                {order.advertiser.businessAddress && (
                  <div className="border-t border-border pt-2">
                    <span className="text-[10px] font-mono font-bold text-warm uppercase block">Mailing Address</span>
                    <span className="text-press font-semibold block">{order.advertiser.businessAddress}</span>
                  </div>
                )}
                {order.advertiser.heardAboutUs && (
                  <div className="border-t border-border pt-2">
                    <span className="text-[10px] font-mono font-bold text-warm uppercase block">Referral Source</span>
                    <span className="text-warm block italic">"{order.advertiser.heardAboutUs}"</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Campaign & Spot details */}
            <Card className="p-6 space-y-4">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-border pb-2">
                Purchased Asset Details
              </h3>
              <div className="space-y-3 text-sm text-left">
                <div>
                  <span className="text-[10px] font-mono font-bold text-warm uppercase block">Target Campaign</span>
                  <Link
                    href={`/admin/campaigns/${order.campaignId}`}
                    className="font-headline font-extrabold text-lg text-primary hover:underline uppercase tracking-tight"
                  >
                    {order.campaign.name}
                  </Link>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-warm uppercase block">Campaign Location</span>
                  <span className="font-headline font-bold text-base text-press uppercase tracking-tight">
                    {order.campaign.city}, {order.campaign.state.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-warm uppercase block">Category Tag</span>
                    <span className="inline-block bg-press text-paper text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 mt-0.5">
                      {order.campaignSpot.category.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-warm uppercase block">Postcard Side</span>
                    <span className="font-bold text-press block">{order.campaignSpot.side}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-warm uppercase block">Ad Spot Label</span>
                    <span className="font-bold text-press block">{order.campaignSpot.label}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-warm uppercase block">Size Tier</span>
                    <span className="font-bold text-press block">{order.campaignSpot.spotType}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-2">
                  <span className="text-[10px] font-mono font-bold text-warm uppercase block">Design Coordinates (X, Y, W, H)</span>
                  <span className="font-mono text-xs text-warm block mt-0.5 font-bold">
                    {order.campaignSpot.x}%, {order.campaignSpot.y}%, {order.campaignSpot.width}%, {order.campaignSpot.height}%
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Creative Submission Preview Section */}
          <Card className="p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-4">
              <div className="text-left">
                <h3 className="font-headline font-extrabold text-lg uppercase tracking-tight text-press">
                  Advertiser Creative Submissions
                </h3>
                <p className="text-xs text-warm font-medium mt-0.5">
                  Review and verify text and image assets uploaded by the client.
                </p>
              </div>

              {order.status === "PAID" && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                  >
                    {copied ? "✓ Copied Link" : "📋 Copy Upload Link"}
                  </Button>
                </div>
              )}
            </div>

            {order.status !== "PAID" ? (
              <div className="bg-press/5 border border-border p-6 text-center text-warm font-semibold text-xs uppercase tracking-wide">
                ⚠️ Ad Creative submission is only active for completed payments (Status: PAID).
              </div>
            ) : !order.creativeSubmission ? (
              <div className="bg-amber-50 border-2 border-amber-250 p-8 text-center space-y-3 text-left">
                <span className="text-2xl block select-none">⏳</span>
                <h4 className="font-headline font-black text-sm text-amber-900 uppercase tracking-wide">Pending Assets Upload</h4>
                <p className="text-xs text-amber-700 max-w-md mx-auto leading-relaxed font-semibold">
                  The client has not yet uploaded copy or image files. You can send them this URL to complete their setup:
                </p>
                <div className="max-w-md mx-auto flex items-center bg-card border border-amber-250 p-1.5 gap-2 text-xs rounded-none">
                  <span className="font-mono text-press font-bold truncate flex-1 pl-2 select-all">
                    {typeof window !== "undefined" && `${window.location.origin}/submit-creative/${order.creativeSubmissionToken}`}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="bg-press text-paper hover:bg-[#3D3533] px-3 py-1.5 font-headline font-bold uppercase tracking-wider text-[10px] transition-colors shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            ) : (
              // Submitted Creative Display
              <div className="space-y-6 text-left">
                
                {/* Visual grid content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  
                  {/* Left Specs */}
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-warm uppercase block">Headline Copy</span>
                      <span className="font-bold text-press text-base mt-0.5 block">
                        {order.creativeSubmission.headline || <span className="text-warm font-normal italic">No Headline Provided</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-warm uppercase block">Offer / Deal Details</span>
                      <span className="font-bold text-primary text-base mt-0.5 block">
                        {order.creativeSubmission.offerDeal || <span className="text-warm font-normal italic">No Offer Provided</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-warm uppercase block">Promo Description</span>
                      <p className="text-press mt-1 leading-relaxed whitespace-pre-line bg-press/5 border border-border p-3.5 rounded-none font-medium">
                        {order.creativeSubmission.description || <span className="text-warm font-normal italic">No Description Provided</span>}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-warm uppercase block">Call to Action (CTA)</span>
                      <span className="font-bold text-press block mt-0.5">
                        {order.creativeSubmission.cta || <span className="text-warm font-normal italic">No CTA Provided</span>}
                      </span>
                    </div>
                    {order.creativeSubmission.notes && (
                      <div className="border-t border-border pt-3">
                        <span className="text-[10px] font-mono font-bold text-warm uppercase block">Advertiser Instructions / Notes</span>
                        <p className="text-warm mt-1 italic leading-relaxed whitespace-pre-line font-medium">
                          "{order.creativeSubmission.notes}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Images and Contact Overrides */}
                  <div className="space-y-5">
                    
                    {/* Logo asset */}
                    <div>
                      <span className="text-[10px] font-mono font-bold text-warm uppercase block mb-2">Advertiser Logo File</span>
                      {order.creativeSubmission.logoUrl ? (
                        <div className="relative border-2 border-press bg-[#FAF8F4] p-4 inline-flex max-w-[200px] hover:shadow-sm transition-shadow rounded-none">
                          <img
                            src={order.creativeSubmission.logoUrl}
                            alt="Advertiser Logo"
                            className="max-h-[140px] max-w-full object-contain mx-auto"
                          />
                          <a
                            href={order.creativeSubmission.logoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute bottom-2 right-2 bg-press/80 hover:bg-press text-paper px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-press"
                          >
                            ↗ Open
                          </a>
                        </div>
                      ) : (
                        <div className="bg-press/5 border border-border p-4 text-center text-xs text-warm italic font-semibold">
                          No Logo File Uploaded
                        </div>
                      )}
                    </div>

                    {/* Contact details override */}
                    <div className="bg-press/5 border border-border p-4 text-xs space-y-2.5 rounded-none font-semibold">
                      <span className="text-warm font-mono font-bold uppercase tracking-wider block border-b border-border pb-1">
                        Postcard Contact Text
                      </span>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-warm block">Business Name</span>
                          <span className="font-bold text-press mt-0.5 block truncate">
                            {order.creativeSubmission.businessName || order.advertiser.businessName}
                          </span>
                        </div>
                        <div>
                          <span className="text-warm block">Phone</span>
                          <span className="font-bold text-press mt-0.5 block">
                            {order.creativeSubmission.phone || order.advertiser.phone}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-warm block">Website URL</span>
                          <span className="font-bold text-press mt-0.5 block truncate">
                            {order.creativeSubmission.website || order.advertiser.website || "—"}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-warm block">Address Details</span>
                          <span className="font-bold text-press mt-0.5 block truncate">
                            {order.creativeSubmission.address || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Prompt details */}
                    {order.creativeSubmission.wantsAiHelp && (
                      <div className="bg-[#FAF8F4] border-2 border-primary/20 p-4 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 text-primary font-headline font-bold uppercase tracking-wider">
                          <span>🤖</span>
                          <span>Requested copywriting assistance</span>
                        </div>
                        {order.creativeSubmission.aiPrompt && (
                          <p className="text-press italic bg-card rounded-none p-2.5 border border-border leading-relaxed font-semibold">
                            "{order.creativeSubmission.aiPrompt}"
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional image uploads gallery */}
                <div className="border-t border-border pt-5 space-y-3">
                  <h4 className="text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                    Additional Media Assets ({additionalImages.length} of 5)
                  </h4>
                  {additionalImages.length === 0 ? (
                    <p className="text-xs text-warm font-medium italic">No additional campaign photos or deals coupons uploaded.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                      {additionalImages.map((url, idx) => (
                        <div key={url} className="relative aspect-square border border-border bg-press/5 rounded-none overflow-hidden group">
                          <img
                            src={url}
                            alt={`Creative Attachment ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-press/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-paper font-mono font-bold uppercase tracking-wider transition-opacity border border-press"
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
          </Card>
        </div>

        {/* Right column: Status details and reviews */}
        <div className="space-y-8 text-left">
          
          {/* Checkout transaction details */}
          <Card className="p-6 space-y-4">
            <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-border pb-2">
              Payment & Transaction
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-warm font-mono uppercase tracking-wider text-[10px]">Payment Status:</span>
                <Badge
                  variant={
                    order.status === "PAID"
                      ? "success"
                      : order.status === "PENDING"
                      ? "warning"
                      : "outline"
                  }
                >
                  {order.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center text-sm border-t border-border pt-3">
                <span className="text-warm font-mono uppercase tracking-wider text-[10px]">Transaction Amount:</span>
                <span className="font-headline font-black text-2xl text-press">
                  {formatPrice(order.amount)}
                </span>
              </div>

              {order.paidAt && (
                <div className="flex justify-between items-center text-sm border-t border-border pt-3 font-semibold">
                  <span className="text-warm font-mono uppercase tracking-wider text-[10px]">Paid Timestamp:</span>
                  <span className="text-press uppercase text-xs font-mono font-bold">{formatDate(order.paidAt)}</span>
                </div>
              )}

              {order.stripeCheckoutSessionId && (
                <div className="space-y-1.5 border-t border-border pt-3 text-xs">
                  <span className="text-warm font-mono uppercase tracking-wider text-[10px] block">Stripe Session Reference:</span>
                  <span className="font-mono text-warm block break-all select-all font-semibold bg-press/5 border border-border p-2 rounded-none">
                    {order.stripeCheckoutSessionId}
                  </span>
                </div>
              )}

              {/* Cancel or Refund Buttons */}
              {(order.status === "PAID" || order.status === "PENDING") && (
                <div className="border-t border-border pt-4">
                  {order.status === "PAID" ? (
                    <Button
                      type="button"
                      disabled={updating}
                      onClick={() => handleCancelOrRefund("REFUNDED")}
                      variant="destructive"
                      className="w-full h-11"
                    >
                      {updating ? "Processing..." : "💸 Refund & Release Spot"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={updating}
                      onClick={() => handleCancelOrRefund("CANCELLED")}
                      variant="destructive"
                      className="w-full h-11"
                    >
                      {updating ? "Processing..." : "✕ Cancel & Release Spot"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Ad Creative Review status action panel */}
          {order.status === "PAID" && order.creativeSubmission && (
            <Card className="p-6 space-y-4">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press border-b border-border pb-2">
                Creative Review Panel
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-wider block">
                    Current Approval Status
                  </span>
                </div>

                {order.creativeSubmission.approvalNotes && (
                  <div className="space-y-1 bg-press/5 border border-border p-4 rounded-none text-xs">
                    <span className="font-mono font-bold text-warm uppercase tracking-wider block">
                      Internal Review Notes
                    </span>
                    <p className="text-press italic mt-1 leading-relaxed font-semibold">
                      "{order.creativeSubmission.approvalNotes}"
                    </p>
                  </div>
                )}

                {/* Review status CTA actions */}
                <div className="space-y-3 pt-2">
                  <Button
                    type="button"
                    disabled={updating}
                    onClick={() => handleApprovalChange(ApprovalStatus.APPROVED)}
                    className="w-full h-11"
                  >
                    {updating ? "Processing..." : "✓ Approve Ad Assets"}
                  </Button>

                  <Button
                    type="button"
                    disabled={updating}
                    onClick={() => handleApprovalChange(ApprovalStatus.NEEDS_REVIEW)}
                    variant="outline"
                    className="w-full h-11 bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                  >
                    {updating ? "Processing..." : "✏️ Request Revisions"}
                  </Button>

                  <Button
                    type="button"
                    disabled={updating}
                    onClick={() => handleApprovalChange(ApprovalStatus.REJECTED)}
                    variant="outline"
                    className="w-full h-11 bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                  >
                    {updating ? "Processing..." : "✕ Reject Submission"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
