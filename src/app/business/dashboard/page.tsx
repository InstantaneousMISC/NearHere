"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import QRCodeImage from "@/components/postcard/QRCodeImage"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

export default function BusinessDashboardPage() {
  const [origin, setOrigin] = useState("")

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const { data: business, isLoading: isBusinessLoading } = trpc.business.getMyBusiness.useQuery()
  const { data: analytics, isLoading: isAnalyticsLoading } = trpc.business.getAnalyticsSummary.useQuery()
  const { data: qrCodes, isLoading: isQrLoading } = trpc.business.getQrCodes.useQuery()
  const { data: orders, isLoading: isOrdersLoading } = trpc.business.getMyOrders.useQuery()

  const handleCopyLink = () => {
    if (!business?.slug) return
    const publicUrl = `${origin}/b/${business.slug}`
    navigator.clipboard.writeText(publicUrl)
    alert("Public link copied to clipboard!")
  }

  const handleDownloadQr = async (slug: string, campaignName: string) => {
    try {
      const QRCode = (await import("qrcode")).default
      const trackingUrl = `${origin}/q/${slug}`
      const dataUrl = await QRCode.toDataURL(trackingUrl, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 1024, // High resolution for print design
        color: {
          dark: "#211D1C",
          light: "#FFFFFF",
        },
      })

      const link = document.createElement("a")
      link.href = dataUrl
      const cleanCampName = campaignName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      link.download = `nearhere-qr-${cleanCampName}-${slug}.png`
      link.click()
    } catch (err) {
      console.error("Failed to download QR code:", err)
      alert("Failed to download QR code. Please try again.")
    }
  }

  const isLoading = isBusinessLoading || isAnalyticsLoading || isQrLoading || isOrdersLoading

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left font-sans">
        <div className="h-10 bg-press/10 w-1/3 rounded-none" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-28 bg-press/5 border border-border rounded-none" />
          <div className="h-28 bg-press/5 border border-border rounded-none" />
          <div className="h-28 bg-press/5 border border-border rounded-none" />
        </div>
        <div className="h-64 bg-press/5 border border-border rounded-none" />
      </div>
    )
  }

  const totalClicks = analytics
    ? Object.values(analytics.clicksByType).reduce((a, b) => a + b, 0)
    : 0

  // Onboarding checklist calculations
  const hasProfileDescription = !!business?.description?.trim()
  const hasProfileLogo = !!business?.logoUrl?.trim()
  const hasProfileAddress = !!business?.address?.trim()
  const isProfileComplete = hasProfileDescription && hasProfileLogo && hasProfileAddress

  const isPageActive = business?.status === "ACTIVE"
  const hasQrGenerated = qrCodes && qrCodes.length > 0

  const activeOrder = orders?.find((o) => o.status === "PAID")
  const campaign = activeOrder?.campaign
  const creative = activeOrder?.creativeSubmission
  const hasCreativeSubmitted = !!creative?.submittedAt
  const isApprovedOrBeyond = creative && ["APPROVED", "PRINTED", "MAILED"].includes(creative.approvalStatus)
  const isCreativeRejected = creative?.approvalStatus === "REJECTED"
  const isNeedsReview = creative?.approvalStatus === "NEEDS_REVIEW"
  const isPrinted = campaign?.status === "PRINTING" || creative?.approvalStatus === "PRINTED"
  const isMailed = campaign?.status === "MAILED" || creative?.approvalStatus === "MAILED"

  // Onboarding next action configs
  let nextActionLabel = "View Landing Page"
  let nextActionUrl = `/b/${business?.slug}`
  let nextActionNotes = "Your profile and creative details are complete. Review campaign status and QR activity below."

  if (!isProfileComplete) {
    nextActionLabel = "Complete Setup Wizard"
    nextActionUrl = "/business/setup"
    nextActionNotes = "Complete your business description, address details, logo, and links to publish your profile page."
  } else if (!hasCreativeSubmitted) {
    nextActionLabel = "Submit Creative Details"
    nextActionUrl = activeOrder ? `/submit-creative/${activeOrder.creativeSubmissionToken}` : "#"
    nextActionNotes = "Your business profile is set up. Submit your headline, offer, description, and contact details for layout."
  } else if (isNeedsReview) {
    nextActionLabel = "🔍 Review Postcard Layout Proof"
    nextActionUrl = activeOrder ? `/submit-creative/${activeOrder.creativeSubmissionToken}` : "#"
    nextActionNotes = "Your postcard layout proof is ready! Please review and approve it, or request design revisions."
  } else if (isCreativeRejected) {
    nextActionLabel = "Update Creative Details"
    nextActionUrl = activeOrder ? `/submit-creative/${activeOrder.creativeSubmissionToken}` : "#"
    nextActionNotes = `Admin requested creative changes: "${creative?.approvalNotes || "Please review ad details and submit again."}"`
  } else if (!isApprovedOrBeyond) {
    nextActionLabel = "Pending Admin Review"
    nextActionUrl = "#"
    nextActionNotes = "Creative details were submitted and are awaiting review. Your business page is available for preview."
  } else if (isMailed) {
    nextActionLabel = "Postcards Mailed!"
    nextActionUrl = `/b/${business?.slug}`
    nextActionNotes = "The campaign has been mailed. Basic QR scan and page activity may now appear in your reporting."
  } else if (isPrinted) {
    nextActionLabel = "Postcards Printed!"
    nextActionUrl = `/b/${business?.slug}`
    nextActionNotes = "Your postcard campaign has been printed! They are preparing to mail. Your landing page is live and ready."
  }

  return (
    <div className="space-y-8 text-left animate-fade-up font-sans">
      
      {/* Welcome & Profile Header */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="font-headline font-black text-2xl uppercase text-press leading-none tracking-tight">
            Your Campaign Placement: {business?.name || "Advertiser"}
          </h1>
          <p className="text-xs text-warm font-medium">
            Manage campaign setup, creative status, business page details, and basic QR activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 select-none">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="sm"
          >
            📋 Copy Public Link
          </Button>
          <Button
            asChild
            size="sm"
          >
            <Link
              href={`/b/${business?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              👀 View Landing Page
            </Link>
          </Button>
        </div>
      </Card>

      {isNeedsReview && activeOrder && (
        <div className="bg-amber-500/10 border-2 border-amber-500 text-amber-900 p-5 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-up">
          <div className="space-y-1">
            <h4 className="font-headline font-black text-sm uppercase tracking-tight text-amber-900 leading-tight">Postcard Proof Ready for Review!</h4>
            <p className="text-xs font-medium">Our designers have uploaded the print proof for your postcard ad space. Please review it as soon as possible.</p>
          </div>
          <Button asChild size="sm" className="bg-[#D19F1F] hover:bg-[#D19F1F]/90 text-white border-transparent">
            <Link href={`/submit-creative/${activeOrder.creativeSubmissionToken}`}>
              Review Design Proof ↗
            </Link>
          </Button>
        </div>
      )}

      {/* Onboarding Checklist Section */}
      <Card className="p-6 space-y-4">
        <div className="space-y-1 border-b border-border pb-3">
          <h2 className="font-headline font-extrabold text-base uppercase text-press tracking-tight flex items-center gap-2">
            Campaign Setup and Status
          </h2>
          <p className="text-xs text-warm font-medium">
            Track the steps required to prepare your placement and business page for the campaign.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 py-2 select-none text-left">
          {/* Item 1: Payment */}
          <div className="border border-border p-4 flex flex-col justify-between h-24 bg-press/5">
            <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider">1. Spot Reserved</span>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-emerald-600 text-xl font-bold">✓</span>
              <span className="text-xs font-semibold text-press">PAID</span>
            </div>
          </div>

          {/* Item 2: Profile Setup */}
          <div className={`border p-4 flex flex-col justify-between h-24 ${isProfileComplete ? "border-border bg-press/5" : "border-primary/20 bg-primary/5"}`}>
            <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider">2. Profile Setup</span>
            <div className="flex items-center gap-2 mt-2">
              {isProfileComplete ? (
                <>
                  <span className="text-emerald-600 text-xl font-bold">✓</span>
                  <span className="text-xs font-semibold text-press">Complete</span>
                </>
              ) : (
                <>
                  <span className="text-primary text-base">⏳</span>
                  <span className="text-xs font-semibold text-primary">Pending</span>
                </>
              )}
            </div>
          </div>

          {/* Item 3: Creative Submission */}
          <div className={`border p-4 flex flex-col justify-between h-24 ${hasCreativeSubmitted ? "border-border bg-press/5" : "border-primary/20 bg-primary/5"}`}>
            <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider">3. Creative Submitted</span>
            <div className="flex items-center gap-2 mt-2">
              {hasCreativeSubmitted ? (
                <>
                  <span className="text-emerald-600 text-xl font-bold">✓</span>
                  <span className="text-xs font-semibold text-press">Submitted</span>
                </>
              ) : (
                <>
                  <span className="text-primary text-base">⏳</span>
                  <span className="text-xs font-semibold text-primary">Pending</span>
                </>
              )}
            </div>
          </div>

          {/* Item 4: QR & Redirections */}
          <div className={`border p-4 flex flex-col justify-between h-24 ${hasQrGenerated ? "border-border bg-press/5" : "border-primary/20 bg-primary/5"}`}>
            <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider">4. Tracking Ready</span>
            <div className="flex items-center gap-2 mt-2">
              {hasQrGenerated ? (
                <>
                  <span className="text-emerald-600 text-xl font-bold">✓</span>
                  <span className="text-xs font-semibold text-press">Generated</span>
                </>
              ) : (
                <>
                  <span className="text-primary text-base">⏳</span>
                  <span className="text-xs font-semibold text-primary">Compiling</span>
                </>
              )}
            </div>
          </div>

          {/* Item 5: Postcard status */}
          <div className={`border p-4 flex flex-col justify-between h-24 ${isApprovedOrBeyond ? "border-border bg-press/5" : isCreativeRejected ? "border-destructive/20 bg-destructive/5" : isNeedsReview ? "border-amber-500/20 bg-amber-500/5 animate-pulse" : "border-primary/20 bg-primary/5"}`}>
            <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider">5. Campaign Status</span>
            <div className="flex items-center gap-2 mt-2">
              {isMailed ? (
                <>
                  <span className="text-purple-600 text-xl font-bold">📬</span>
                  <span className="text-xs font-semibold text-purple-700">Mailed</span>
                </>
              ) : isPrinted ? (
                <>
                  <span className="text-indigo-600 text-xl font-bold">🖨️</span>
                  <span className="text-xs font-semibold text-indigo-700">Printed</span>
                </>
              ) : isApprovedOrBeyond ? (
                <>
                  <span className="text-emerald-600 text-xl font-bold">✓</span>
                  <span className="text-xs font-semibold text-press">Approved</span>
                </>
              ) : isNeedsReview ? (
                <>
                  <span className="text-amber-600 text-base">🔍</span>
                  <span className="text-xs font-semibold text-amber-700">Proof Ready</span>
                </>
              ) : isCreativeRejected ? (
                <>
                  <span className="text-destructive text-base">❌</span>
                  <span className="text-xs font-semibold text-destructive">Rejected</span>
                </>
              ) : (
                <>
                  <span className="text-primary text-base">⏳</span>
                  <span className="text-xs font-semibold text-primary">Reviewing</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Action Block */}
        <div className="p-4 bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div className="space-y-0.5 max-w-lg">
            <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider block">Recommended Next Action</span>
            <p className="text-xs font-semibold text-press leading-relaxed">
              {nextActionNotes}
            </p>
          </div>
          {nextActionUrl !== "#" ? (
            <Button
              asChild
              size="sm"
            >
              <Link href={nextActionUrl}>
                {nextActionLabel}
              </Link>
            </Button>
          ) : (
            <Button
              disabled
              size="sm"
              variant="outline"
            >
              {nextActionLabel}
            </Button>
          )}
        </div>
      </Card>

      {/* Business Profile Section */}
      <Card className="p-6 space-y-6">
        <div className="space-y-1 text-left border-b border-border pb-3">
          <h2 className="font-headline font-extrabold text-lg uppercase text-press tracking-tight">
            Business Profile
          </h2>
          <p className="text-xs text-warm font-medium">
            Your NearHere Business Profile is included with your campaign placement. It displays your business details, local offer, contact buttons, QR destination, and a link back to your website. This gives customers another way to reach you and helps support your local online presence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-2 font-mono text-xs select-none text-left">
          <div className="border border-border p-4 bg-press/5 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-warm uppercase tracking-wider block">Profile Status</span>
            <span className={`text-xs font-bold uppercase ${business?.status === 'ACTIVE' ? 'text-emerald-700' : 'text-primary'} mt-1`}>
              ● {business?.status || 'DRAFT'}
            </span>
          </div>

          <div className="border border-border p-4 bg-press/5 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-warm uppercase tracking-wider block">Website Backlink</span>
            <span className={`text-xs font-bold uppercase ${business?.website ? 'text-emerald-700' : 'text-warm'} mt-1`}>
              {business?.website ? '✓ Enabled' : 'Not Configured'}
            </span>
          </div>

          <div className="border border-border p-4 bg-press/5 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-warm uppercase tracking-wider block">Offer Shown</span>
            <span className="text-xs font-bold text-press truncate max-w-full mt-1">
              {creative?.offerDeal || 'No offer active'}
            </span>
          </div>

          <div className="border border-border p-4 bg-press/5 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-warm uppercase tracking-wider block">QR Destination</span>
            <span className="text-xs font-bold text-press truncate max-w-full mt-1">
              /q/{qrCodes?.[0]?.slug || ''}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-4">
              <div className="text-left">
                <span className="text-warm block uppercase font-mono text-[9px] tracking-wider">Profile Views</span>
                <span className="font-headline font-black text-lg text-press">{analytics?.totalPageViews ?? 0}</span>
              </div>
              <div className="border-l border-border h-8" />
              <div className="text-left">
                <span className="text-warm block uppercase font-mono text-[9px] tracking-wider">Website Clicks</span>
                <span className="font-headline font-black text-lg text-press">{analytics?.clicksByType?.WEBSITE ?? 0}</span>
              </div>
              <div className="border-l border-border h-8" />
              <div className="text-left">
                <span className="text-warm block uppercase font-mono text-[9px] tracking-wider">QR Scans</span>
                <span className="font-headline font-black text-lg text-press">{analytics?.totalScans ?? 0}</span>
              </div>
            </div>
          </div>
          <Button
            asChild
            variant="outline"
          >
            <Link
              href={`/business/${business?.slug}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Business Profile
            </Link>
          </Button>
        </div>
      </Card>

      {/* Analytics Counter Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Scans Card */}
        <Card className="p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-widest block">
              Recorded QR Scans
            </span>
            <span className="font-headline font-black text-4xl text-primary leading-none block">
              {analytics?.totalScans ?? 0}
            </span>
          </div>
          <div className="text-3xl bg-primary/10 w-12 h-12 flex items-center justify-center text-primary border border-primary/20">
            📱
          </div>
        </Card>

        {/* Total Page Views Card */}
        <Card className="p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-widest block">
              Landing Page Views
            </span>
            <span className="font-headline font-black text-4xl text-press leading-none block">
              {analytics?.totalPageViews ?? 0}
            </span>
          </div>
          <div className="text-3xl bg-press/5 w-12 h-12 flex items-center justify-center border border-border">
            👀
          </div>
        </Card>

        {/* Link Clicks Card */}
        <Card className="p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-widest block">
              Outbound Link Clicks
            </span>
            <span className="font-headline font-black text-4xl text-gold leading-none block">
              {totalClicks}
            </span>
          </div>
          <div className="text-3xl bg-accent/15 w-12 h-12 flex items-center justify-center border border-accent/40 text-accent">
            ⚡
          </div>
        </Card>

      </div>

      <p className="text-[10px] leading-relaxed text-warm font-medium select-none text-left">
        Reporting reflects recorded QR scans, page views, and tracked outbound links. Phone calls,
        direct website visits, postcard mentions, and offline redemptions may not be fully
        attributable.
      </p>

      {/* Booked Category Spot Campaigns */}
      <Card>
        
        {/* Section Header */}
        <div className="p-6 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
          <div className="space-y-0.5">
            <h2 className="font-headline font-extrabold text-lg uppercase text-press tracking-tight">
              Your Campaign Placements
            </h2>
            <p className="text-[11px] text-warm font-medium">
              Campaigns where your business has a reserved placement.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
          >
            <Link href="/business/profile">
              ✏️ Edit Creative Details
            </Link>
          </Button>
        </div>

        {/* Campaign Slots Table */}
        <div className="overflow-x-auto select-none">
          {qrCodes && qrCodes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4">Campaign Name</TableHead>
                  <TableHead className="px-6 py-4">Business Category</TableHead>
                  <TableHead className="px-6 py-4">Mailing Date</TableHead>
                  <TableHead className="px-6 py-4 text-center">Recorded Scans</TableHead>
                  <TableHead className="px-6 py-4 text-right">QR Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {qrCodes.map((qr) => {
                  const mailingDate = qr.campaign?.estimatedMailDate
                    ? new Date(qr.campaign.estimatedMailDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "MOCK / DEMO"

                  return (
                    <TableRow key={qr.id}>
                      <TableCell className="px-6 py-4 font-headline font-black uppercase text-base text-press tracking-tight">
                        {qr.campaign?.name || "Direct Profile Link"}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="secondary">
                          ⭐ {qr.campaignSpot?.label || "General QR"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4 font-mono text-xs text-warm font-bold">
                        {mailingDate}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-center font-headline font-extrabold text-lg text-primary">
                        {qr._count.scans}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button
                          onClick={() => handleDownloadQr(qr.slug, qr.campaign?.name || "profile")}
                          size="sm"
                        >
                          💾 Download Print QR
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-warm font-medium">
              <p className="text-base">No active campaigns found.</p>
              <p className="text-xs mt-1 text-slate-400">Once your order is paid, your campaign spot will appear here.</p>
            </div>
          )}
        </div>

      </Card>

      {/* QR Previews & Print Guidelines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
        
        {/* QR Code Graphic Section */}
        <Card className="p-6 flex flex-col justify-between gap-6">
          <div className="text-left space-y-1 border-b border-border pb-3">
            <h3 className="font-headline font-extrabold text-base uppercase text-press tracking-wide">
              Your Profile QR Code
            </h3>
            <p className="text-xs text-warm font-medium">
              Print this code on custom business flyers, cards, or receipts to redirect people directly to your NearHere profile.
            </p>
          </div>

          <div className="flex items-center gap-6 text-left">
            {business?.slug && (
              <QRCodeImage
                value={`${origin}/q/profile-${business.slug}`} // Mock general profile slug
                size={112}
              />
            )}
            <div className="space-y-3">
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider block">Destination Path</span>
                <span className="text-xs font-semibold text-press break-all">{`${origin}/b/${business?.slug}`}</span>
              </div>
              <Button
                onClick={() => handleDownloadQr(`profile-${business?.slug}`, "general-profile")}
                disabled={!business?.slug}
                variant="outline"
                size="sm"
              >
                💾 Get Profile QR
              </Button>
            </div>
          </div>
        </Card>

        {/* Print Guidelines */}
        <Card className="p-6 flex flex-col justify-between gap-4">
          <div className="text-left space-y-1.5">
            <h3 className="font-headline font-extrabold text-base uppercase text-primary tracking-wide">
              🖨️ Print Reliability Tips
            </h3>
            <ul className="text-xs text-warm space-y-2 list-disc pl-5 font-semibold leading-relaxed">
              <li>
                <strong>High Error Correction (Level H):</strong> Our QR codes are pre-configured with high error tolerance so they remain scan-friendly even if smudged or slightly folded in mailboxes.
              </li>
              <li>
                <strong>Minimum Print Size:</strong> We recommend printing QR codes at no smaller than <strong>0.75" x 0.75"</strong> for fast scan reliability.
              </li>
              <li>
                <strong>Contrast is Key:</strong> Ensure the background remains white or near-white, and the dark patterns stay dark gray or black.
              </li>
            </ul>
          </div>
        </Card>

      </div>

    </div>
  )
}
