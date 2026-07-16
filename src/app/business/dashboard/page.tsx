"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { trpc } from "@/lib/trpc/client"
import QRCodeImage from "@/components/postcard/QRCodeImage"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"

export default function BusinessDashboardPage() {
  const [origin, setOrigin] = useState("")
  const [mounted, setMounted] = useState(false)
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
    setMounted(true)
  }, [])

  const { data: business, isLoading: isBusinessLoading } = trpc.business.getMyBusiness.useQuery()
  const { data: placements, isLoading: isPlacementsLoading } = trpc.business.getCampaignPlacements.useQuery()

  // Select first placement by default
  useEffect(() => {
    if (placements && placements.length > 0 && !selectedPlacementId) {
      setSelectedPlacementId(placements[0].orderId)
    }
  }, [placements, selectedPlacementId])

  const selectedPlacement = placements?.find((p) => p.orderId === selectedPlacementId) || placements?.[0] || null

  const { data: timeSeries, isLoading: isTimeSeriesLoading } = trpc.business.getCampaignPlacementTimeSeries.useQuery(
    {
      campaignId: selectedPlacement?.campaign?.id,
      qrCodeId: selectedPlacement?.qrCode?.id,
    },
    {
      enabled: !!selectedPlacement,
    }
  )

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
        width: 1024,
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

  const isLoading = isBusinessLoading || isPlacementsLoading

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

  if (!placements || placements.length === 0) {
    return (
      <div className="py-16 text-center max-w-md mx-auto font-sans">
        <div className="text-4xl mb-4">📬</div>
        <h3 className="font-headline font-black text-xl uppercase tracking-tight text-press">No Campaigns Yet</h3>
        <p className="text-sm text-warm mt-2 leading-relaxed">
          Once you purchase a campaign spot or have an active reservation, it will show up here.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/campaigns">Browse Open Campaigns</Link>
        </Button>
      </div>
    )
  }

  // Selected campaign/creative stats mapping
  const campaign = selectedPlacement?.campaign
  const spot = selectedPlacement?.campaignSpot
  const qrCode = selectedPlacement?.qrCode
  const creative = selectedPlacement?.creativeSubmission
  const creativeStatus = selectedPlacement?.creativeStatus
  const stats = selectedPlacement?.stats || {
    scansCount: 0,
    pageViewsCount: 0,
    outboundClicksCount: 0,
    callClicksCount: 0,
    ctaClicksCount: 0,
  }

  // Onboarding checklist calculations for selected placement
  const hasProfileDescription = !!business?.description?.trim()
  const hasProfileLogo = !!business?.logoUrl?.trim()
  const hasProfileAddress = !!business?.address?.trim()
  const isProfileComplete = hasProfileDescription && hasProfileLogo && hasProfileAddress

  const hasCreativeSubmitted = !!creative
  const isApprovedOrBeyond = creativeStatus && ["APPROVED", "PRINTED", "MAILED"].includes(creativeStatus)
  const isCreativeRejected = creativeStatus === "REJECTED"
  const isNeedsReview = creativeStatus === "NEEDS_REVIEW"
  const isPrinted = campaign?.status === "PRINTING" || creativeStatus === "PRINTED"
  const isMailed = campaign?.status === "MAILED" || creativeStatus === "MAILED"
  const hasQrGenerated = !!qrCode

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
    nextActionUrl = selectedPlacement ? `/submit-creative/${selectedPlacement.creativeSubmissionToken}` : "#"
    nextActionNotes = "Your business profile is set up. Submit your headline, offer, description, and contact details for layout."
  } else if (isNeedsReview) {
    nextActionLabel = "🔍 Review Postcard Layout Proof"
    nextActionUrl = selectedPlacement ? `/submit-creative/${selectedPlacement.creativeSubmissionToken}` : "#"
    nextActionNotes = "Your postcard layout proof is ready! Please review and approve it, or request design revisions."
  } else if (isCreativeRejected) {
    nextActionLabel = "Update Creative Details"
    nextActionUrl = selectedPlacement ? `/submit-creative/${selectedPlacement.creativeSubmissionToken}` : "#"
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

  // Chart data availability
  const hasChartData =
    timeSeries &&
    timeSeries.length > 0 &&
    timeSeries.some((item) => item.scans > 0 || item.views > 0 || item.clicks > 0)

  let chartContent = (
    <div className="h-72 flex items-center justify-center bg-press/5 border border-dashed border-border select-none">
      <span className="text-xs text-warm font-medium">Loading timeline statistics...</span>
    </div>
  )

  if (!mounted) {
    chartContent = (
      <div className="h-72 bg-press/5 animate-pulse border border-border" />
    )
  } else if (isTimeSeriesLoading) {
    chartContent = (
      <div className="h-72 flex items-center justify-center bg-press/5 border border-dashed border-border select-none">
        <span className="text-xs text-warm font-medium">Loading statistics...</span>
      </div>
    )
  } else if (!hasChartData) {
    chartContent = (
      <div className="h-72 flex flex-col items-center justify-center bg-press/5 border border-dashed border-border p-6 text-center select-none">
        <span className="text-2xl mb-2">📊</span>
        <h4 className="text-xs font-semibold text-press uppercase tracking-wider">No Analytics Data Yet</h4>
        <p className="text-[11px] text-warm mt-1 max-w-xs leading-relaxed">
          Once customers scan your postcard and interact with your landing page, daily metrics will update here.
        </p>
      </div>
    )
  } else {
    chartContent = (
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={timeSeries || []}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EA580C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#EA580C" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D97706" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#D97706" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#78716C", fontSize: 10, fontWeight: 500 }}
              dy={8}
              tickFormatter={(val) => {
                if (!val) return ""
                const parts = val.split("-")
                if (parts.length >= 3) {
                  return `${parts[1]}/${parts[2]}`
                }
                return val
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#78716C", fontSize: 10, fontWeight: 500 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#211D1C",
                borderColor: "#211D1C",
                borderRadius: "0px",
                color: "#FFFFFF",
                fontSize: "11px",
                fontFamily: "monospace",
              }}
              itemStyle={{ color: "#FFFFFF" }}
              labelClassName="font-bold border-b border-white/20 pb-1 mb-1"
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "10px", fontWeight: "bold", fontFamily: "monospace" }}
            />
            <Area
              type="monotone"
              dataKey="scans"
              name="QR Scans"
              stroke="#EA580C"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorScans)"
            />
            <Area
              type="monotone"
              dataKey="views"
              name="Page Views"
              stroke="#2563EB"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorViews)"
            />
            <Area
              type="monotone"
              dataKey="clicks"
              name="Link Clicks"
              stroke="#D97706"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClicks)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="space-y-8 text-left animate-fade-up font-sans">
      {/* Welcome & Profile Header */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="font-headline font-black text-2xl uppercase text-press leading-none tracking-tight">
            Your Campaign Placements: {business?.name || "Advertiser"}
          </h1>
          <p className="text-xs text-warm font-medium">
            Manage campaign setup, creative status, business page details, and basic QR activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 select-none">
          <Button onClick={handleCopyLink} variant="outline" size="sm">
            📋 Copy Public Link
          </Button>
          <Button asChild size="sm">
            <Link href={`/b/${business?.slug}`} target="_blank" rel="noopener noreferrer">
              👀 View Landing Page
            </Link>
          </Button>
        </div>
      </Card>

      {/* Campaign Placement Selector */}
      <div className="space-y-2 select-none">
        <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-widest block">
          Select Campaign Placement
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {placements.map((p) => {
            const isSelected = p.orderId === selectedPlacementId
            const isPlMailed = p.campaign?.status === "MAILED" || p.creativeStatus === "MAILED"
            const isPlPrinted = p.campaign?.status === "PRINTING" || p.creativeStatus === "PRINTED"
            const isPlApproved = ["APPROVED", "PRINTED", "MAILED"].includes(p.creativeStatus || "")
            const isPlNeedsReview = p.creativeStatus === "NEEDS_REVIEW"

            let statusBadge = <Badge variant="secondary">Reviewing</Badge>
            if (isPlMailed) {
              statusBadge = <Badge className="bg-purple-600 text-white border-transparent">Mailed</Badge>
            } else if (isPlPrinted) {
              statusBadge = <Badge className="bg-indigo-600 text-white border-transparent">Printed</Badge>
            } else if (isPlNeedsReview) {
              statusBadge = (
                <Badge className="bg-amber-500 text-white border-transparent animate-pulse">
                  Proof Ready
                </Badge>
              )
            } else if (p.creativeStatus === "REJECTED") {
              statusBadge = <Badge variant="destructive">Rejected</Badge>
            } else if (isPlApproved) {
              statusBadge = <Badge className="bg-emerald-600 text-white border-transparent">Approved</Badge>
            }

            return (
              <Card
                key={p.orderId}
                onClick={() => setSelectedPlacementId(p.orderId)}
                className={`p-4 cursor-pointer transition-all border-2 text-left relative ${
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:border-warm/50"
                }`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-headline font-black text-sm uppercase text-press truncate max-w-[70%]">
                      {p.campaign?.name || "Direct Profile Link"}
                    </h3>
                    {statusBadge}
                  </div>
                  <div className="text-[11px] text-warm font-mono font-bold uppercase">
                    ⭐ {p.campaignSpot?.label || "General QR"}
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mt-1">
                    <span>Scans: {p.stats.scansCount}</span>
                    <span>Views: {p.stats.pageViewsCount}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {isNeedsReview && selectedPlacement && (
        <div className="bg-amber-500/10 border-2 border-amber-500 text-amber-900 p-5 rounded-none flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-up">
          <div className="space-y-1">
            <h4 className="font-headline font-black text-sm uppercase tracking-tight text-amber-900 leading-tight">
              Postcard Proof Ready for Review!
            </h4>
            <p className="text-xs font-medium">
              Our designers have uploaded the print proof for your postcard ad space. Please review it as
              soon as possible.
            </p>
          </div>
          <Button asChild size="sm" className="bg-[#D19F1F] hover:bg-[#D19F1F]/90 text-white border-transparent">
            <Link href={`/submit-creative/${selectedPlacement.creativeSubmissionToken}`}>
              Review Design Proof ↗
            </Link>
          </Button>
        </div>
      )}

      {/* Selected Placement Details Grid */}
      {selectedPlacement && (
        <>
          {/* Onboarding Checklist Section */}
          <Card className="p-6 space-y-4">
            <div className="space-y-1 border-b border-border pb-3">
              <h2 className="font-headline font-extrabold text-base uppercase text-press tracking-tight flex items-center gap-2">
                Placement Setup & Status: {campaign?.name} ({spot?.label})
              </h2>
              <p className="text-xs text-warm font-medium">
                Track the steps required to prepare your placement and business page for the campaign.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 py-2 select-none text-left">
              {/* Item 1: Payment */}
              <div className="border border-border p-4 flex flex-col justify-between h-24 bg-press/5">
                <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider">
                  1. Spot Reserved
                </span>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-emerald-600 text-xl font-bold">✓</span>
                  <span className="text-xs font-semibold text-press">PAID</span>
                </div>
              </div>

              {/* Item 2: Profile Setup */}
              <div
                className={`border p-4 flex flex-col justify-between h-24 ${
                  isProfileComplete ? "border-border bg-press/5" : "border-primary/20 bg-primary/5"
                }`}
              >
                <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider">
                  2. Profile Setup
                </span>
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
              <div
                className={`border p-4 flex flex-col justify-between h-24 ${
                  hasCreativeSubmitted ? "border-border bg-press/5" : "border-primary/20 bg-primary/5"
                }`}
              >
                <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider">
                  3. Creative Submitted
                </span>
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
              <div
                className={`border p-4 flex flex-col justify-between h-24 ${
                  hasQrGenerated ? "border-border bg-press/5" : "border-primary/20 bg-primary/5"
                }`}
              >
                <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider">
                  4. Tracking Ready
                </span>
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

              {/* Item 5: Campaign Status */}
              <div
                className={`border p-4 flex flex-col justify-between h-24 ${
                  isApprovedOrBeyond
                    ? "border-border bg-press/5"
                    : isCreativeRejected
                    ? "border-destructive/20 bg-destructive/5"
                    : isNeedsReview
                    ? "border-amber-500/20 bg-amber-500/5 animate-pulse"
                    : "border-primary/20 bg-primary/5"
                }`}
              >
                <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider">
                  5. Campaign Status
                </span>
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
                <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider block">
                  Recommended Next Action
                </span>
                <p className="text-xs font-semibold text-press leading-relaxed">{nextActionNotes}</p>
              </div>
              {nextActionUrl !== "#" ? (
                <Button asChild size="sm">
                  <Link href={nextActionUrl}>{nextActionLabel}</Link>
                </Button>
              ) : (
                <Button disabled size="sm" variant="outline">
                  {nextActionLabel}
                </Button>
              )}
            </div>
          </Card>

          {/* Analytics Counter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {/* Scans */}
            <Card className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-widest block">
                  QR Code Scans
                </span>
                <span className="font-headline font-black text-4xl text-primary leading-none block">
                  {stats.scansCount}
                </span>
              </div>
              <div className="text-3xl bg-primary/10 w-12 h-12 flex items-center justify-center text-primary border border-primary/20">
                📱
              </div>
            </Card>

            {/* views */}
            <Card className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-widest block">
                  Landing Views
                </span>
                <span className="font-headline font-black text-4xl text-press leading-none block">
                  {stats.pageViewsCount}
                </span>
              </div>
              <div className="text-3xl bg-press/5 w-12 h-12 flex items-center justify-center border border-border">
                👀
              </div>
            </Card>

            {/* Outbound Clicks */}
            <Card className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-widest block">
                  Outbound Clicks
                </span>
                <span className="font-headline font-black text-4xl text-gold leading-none block">
                  {stats.outboundClicksCount + stats.ctaClicksCount}
                </span>
              </div>
              <div className="text-3xl bg-accent/15 w-12 h-12 flex items-center justify-center border border-accent/40 text-accent">
                ⚡
              </div>
            </Card>

            {/* Call clicks */}
            <Card className="p-6 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-widest block">
                  Phone Click-to-Calls
                </span>
                <span className="font-headline font-black text-4xl text-emerald-600 leading-none block">
                  {stats.callClicksCount}
                </span>
              </div>
              <div className="text-3xl bg-emerald-500/10 w-12 h-12 flex items-center justify-center text-emerald-600 border border-emerald-500/20">
                📞
              </div>
            </Card>
          </div>

          {/* Daily Timeline Chart */}
          <Card className="p-6 space-y-4 text-left">
            <div className="space-y-1 border-b border-border pb-3">
              <h3 className="font-headline font-extrabold text-base uppercase text-press tracking-wide">
                Daily Performance Timeline
              </h3>
              <p className="text-xs text-warm font-medium">
                QR scans, profile views, and click engagements over the last 14 days.
              </p>
            </div>
            {chartContent}
          </Card>

          {/* QR Code and Guidelines Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 select-none">
            {/* QR Code Graphic Section */}
            <Card className="p-6 flex flex-col justify-between gap-6">
              <div className="text-left space-y-1 border-b border-border pb-3">
                <h3 className="font-headline font-extrabold text-base uppercase text-press tracking-wide">
                  Unique Spot Placement QR Code
                </h3>
                <p className="text-xs text-warm font-medium">
                  This QR code is unique to this campaign placement. It routes customers to your active
                  landing page and attributes their scans to this campaign.
                </p>
              </div>

              <div className="flex items-center gap-6 text-left">
                {qrCode ? (
                  <>
                    <QRCodeImage value={`${origin}/q/${qrCode.slug}`} size={112} />
                    <div className="space-y-3">
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono font-bold text-warm uppercase tracking-wider block">
                          Tracking Destination Path
                        </span>
                        <span className="text-xs font-semibold text-press break-all font-mono">
                          {`${origin}/q/${qrCode.slug}`}
                        </span>
                      </div>
                      <Button
                        onClick={() => handleDownloadQr(qrCode.slug, campaign?.name || "profile")}
                        variant="outline"
                        size="sm"
                      >
                        💾 Download Print QR
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-left text-warm font-medium">
                    <p className="text-xs">QR Code has not been generated yet.</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Tracking code is automatically configured once design layouts begin review.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Print Guidelines */}
            <Card className="p-6 flex flex-col justify-between gap-4">
              <div className="text-left space-y-1.5">
                <h3 className="font-headline font-extrabold text-base uppercase text-primary tracking-wide">
                  🖨️ Print Reliability Guidelines
                </h3>
                <ul className="text-xs text-warm space-y-2 list-disc pl-5 font-semibold leading-relaxed">
                  <li>
                    <strong>High Error Correction (Level H):</strong> The downloaded QR code uses a 30% error
                    correction density layout so scan reliability is preserved if smudged, creased, or stained.
                  </li>
                  <li>
                    <strong>Minimum Print Size:</strong> Ensure design layouts print the QR code at no smaller
                    than <strong>0.75" x 0.75"</strong> boundary width.
                  </li>
                  <li>
                    <strong>Avoid Color Inversions:</strong> Always keep the background white/light and keep
                    the QR code blocks high-contrast dark gray/black.
                  </li>
                </ul>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* Attribution Disclaimer */}
      <p className="text-[10px] leading-relaxed text-warm font-medium select-none text-left">
        Reporting reflects recorded QR scans, page views, and tracked outbound links. Phone calls, direct
        website visits, postcard mentions, and offline redemptions may not be fully attributable.
      </p>
    </div>
  )
}
