"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Area, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { BarChart3, Bell, CheckCircle2, ClipboardCopy, ExternalLink, Eye, FilePenLine, ImagePlus, Link2, Mail, MapPin, Megaphone, Phone, QrCode, Send, Share2, Sparkles, Upload, Users } from "lucide-react"
import QRCodeImage from "@/components/postcard/QRCodeImage"
import { trpc } from "@/lib/trpc/client"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed"
import { AnalyticsChartCard } from "@/components/dashboard/analytics-chart-card"
import { DateRangeSelector } from "@/components/dashboard/date-range-selector"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MetricCard } from "@/components/dashboard/metric-card"
import { MetricGrid } from "@/components/dashboard/metric-grid"
import { PageHeader } from "@/components/dashboard/page-header"
import { SectionCard } from "@/components/dashboard/section-card"
import { campaignStatusMap, creativeStatusMap, StatusBadge, statusFor } from "@/components/dashboard/status-badge"
import { WorkflowStepper, type WorkflowStep } from "@/components/dashboard/workflow-stepper"
import { PageSkeleton } from "@/components/dashboard/page-skeleton"

type MetricKey = "scans" | "views" | "clicks" | "calls"

export default function BusinessDashboardPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [rangeDays, setRangeDays] = useState(14)
  const [copyLabel, setCopyLabel] = useState("Copy public link")
  const origin = typeof window === "undefined" ? "" : window.location.origin

  const { data: business, isLoading: isBusinessLoading } = trpc.business.getMyBusiness.useQuery(undefined, { staleTime: 30_000 })
  const { data: placements, isLoading: isPlacementsLoading } = trpc.business.getCampaignPlacements.useQuery(undefined, { staleTime: 30_000 })
  const { data: notifications } = trpc.business.listMyNotifications.useQuery(undefined, { staleTime: 30_000 })

  const requestedPlacementId = searchParams.get("placement")
  const selectedPlacement = placements?.find((placement) => placement.orderId === requestedPlacementId) || placements?.[0] || null
  const priorPeriodEnd = useMemo(() => {
    const end = new Date()
    end.setDate(end.getDate() - rangeDays)
    return end
  }, [rangeDays])
  const analyticsInput = { campaignId: selectedPlacement?.campaign?.id, qrCodeId: selectedPlacement?.qrCode?.id, days: rangeDays }
  const { data: timeSeries, isLoading: isTimeSeriesLoading } = trpc.business.getCampaignPlacementTimeSeries.useQuery(analyticsInput, { enabled: Boolean(selectedPlacement), staleTime: 30_000 })
  const { data: priorTimeSeries } = trpc.business.getCampaignPlacementTimeSeries.useQuery({ ...analyticsInput, endDate: priorPeriodEnd }, { enabled: Boolean(selectedPlacement), staleTime: 30_000 })

  const publicProfilePath = (() => {
    const profile = business?.directoryProfile
    const location = profile?.locations[0]
    const category = profile?.categories[0]?.directoryCategory
    if (!profile || !location || !category) return null
    return `/directory/${location.city.state.slug}/${location.city.slug}/businesses/${category.slug}/${profile.slug}`
  })()

  const selectPlacement = (orderId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("placement", orderId)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const copyPublicLink = async () => {
    if (!publicProfilePath || !origin) return
    try {
      await navigator.clipboard.writeText(`${origin}${publicProfilePath}`)
      setCopyLabel("Copied!")
      window.setTimeout(() => setCopyLabel("Copy public link"), 1800)
    } catch { setCopyLabel("Copy failed") }
  }
  const downloadQr = async (slug: string, campaignName: string) => {
    try {
      const QRCode = (await import("qrcode")).default
      const dataUrl = await QRCode.toDataURL(`${origin}/q/${slug}`, { errorCorrectionLevel: "H", margin: 1, width: 1024, color: { dark: "#1D2025", light: "#FFFFFF" } })
      const link = document.createElement("a")
      link.href = dataUrl
      link.download = `nearhere-qr-${campaignName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${slug}.png`
      link.click()
    } catch (error) { console.error("Failed to download QR code:", error) }
  }

  if (isBusinessLoading || isPlacementsLoading) return <PageSkeleton />
  if (!placements?.length || !selectedPlacement) return <EmptyState icon={Megaphone} title="No campaign placements yet" description="Once you purchase a campaign spot, its setup and performance will appear here." action={<Button asChild><Link href="/campaigns">Browse campaigns</Link></Button>} />

  const campaign = selectedPlacement.campaign
  const spot = selectedPlacement.campaignSpot
  const creative = selectedPlacement.creativeSubmission
  const creativeStatus = selectedPlacement.creativeStatus
  const qrCode = selectedPlacement.qrCode
  const hasProfileDescription = Boolean(business?.description?.trim())
  const hasProfileLogo = Boolean(business?.logoUrl?.trim())
  const hasProfileAddress = Boolean(business?.address?.trim())
  const isProfileComplete = hasProfileDescription && hasProfileLogo && hasProfileAddress
  const hasCreativeSubmitted = Boolean(creative)
  const isCreativeRejected = creativeStatus === "REJECTED"
  const isNeedsReview = creativeStatus === "NEEDS_REVIEW"
  const isApprovedOrBeyond = Boolean(creativeStatus && ["APPROVED", "PRINTED", "MAILED"].includes(creativeStatus))
  const isPrinted = campaign?.status === "PRINTING" || creativeStatus === "PRINTED"
  const isMailed = campaign?.status === "MAILED" || creativeStatus === "MAILED"

  const currentTotals = sumMetrics(timeSeries || [])
  const previousTotals = sumMetrics(priorTimeSeries || [])
  const metricTrend = (key: MetricKey) => previousTotals[key] > 0 ? Math.round(((currentTotals[key] - previousTotals[key]) / previousTotals[key]) * 100) : undefined
  const totalEngagements = currentTotals.scans + currentTotals.views + currentTotals.clicks + currentTotals.calls
  const priorTotalEngagements = previousTotals.scans + previousTotals.views + previousTotals.clicks + previousTotals.calls
  const engagementTrend = priorTotalEngagements > 0 ? Math.round(((totalEngagements - priorTotalEngagements) / priorTotalEngagements) * 100) : undefined
  const hasChartData = Boolean(timeSeries?.some((item) => item.scans || item.views || item.clicks || item.calls || item.ctas))
  const displayStatus = isMailed ? statusFor(creativeStatusMap, "MAILED") : creativeStatus ? statusFor(creativeStatusMap, creativeStatus) : statusFor(campaignStatusMap, campaign?.status)
  const workflow: WorkflowStep[] = [
    { id: "reserved", label: "Spot reserved", description: selectedPlacement.orderStatus === "PAID" ? "Payment received" : "Payment pending", status: selectedPlacement.orderStatus === "PAID" ? "complete" : "current" },
    { id: "profile", label: "Profile setup", description: isProfileComplete ? "Complete" : "Action needed", status: isProfileComplete ? "complete" : "current" },
    { id: "creative", label: "Creative submitted", description: isCreativeRejected ? "Changes requested" : hasCreativeSubmitted ? "Submitted" : "Waiting for details", status: isCreativeRejected ? "blocked" : hasCreativeSubmitted ? "complete" : "upcoming" },
    { id: "tracking", label: "Tracking ready", description: qrCode ? "QR code generated" : "Preparing", status: qrCode ? "complete" : hasCreativeSubmitted ? "current" : "upcoming" },
    { id: "mailed", label: "Campaign mailed", description: isMailed ? "On its way" : isPrinted ? "Printing complete" : "Upcoming", status: isMailed ? "complete" : isPrinted || isApprovedOrBeyond ? "current" : "upcoming" },
  ]
  const todos = [
    !isProfileComplete ? { title: "Complete your business profile", description: "Add your description, logo, and address so customers see a complete landing page.", href: "/business/setup", icon: FilePenLine, done: false } : { title: "Business profile complete", description: "Your key landing-page details are in place.", href: "/business/profile", icon: CheckCircle2, done: true },
    !hasCreativeSubmitted ? { title: "Submit your creative", description: "Provide your postcard content for our design team.", href: `/submit-creative/${selectedPlacement.creativeSubmissionToken}`, icon: ImagePlus, done: false } : isCreativeRejected ? { title: "Update requested creative", description: creative?.approvalNotes || "Review the requested updates and submit again.", href: `/submit-creative/${selectedPlacement.creativeSubmissionToken}`, icon: Upload, done: false } : { title: "Creative submitted", description: isNeedsReview ? "Your proof is ready for review." : "We’ll keep you updated as review progresses.", href: `/submit-creative/${selectedPlacement.creativeSubmissionToken}`, icon: CheckCircle2, done: true },
    !publicProfilePath ? { title: "Finish landing-page details", description: "A public link will be available once location and category details are ready.", href: "/business/profile", icon: Link2, done: false } : { title: "Share your campaign", description: "Copy the public link and invite your audience to visit.", href: publicProfilePath, icon: Share2, done: false },
  ].sort((a, b) => Number(a.done) - Number(b.done))
  const activityItems: ActivityItem[] = (notifications || []).slice(0, 4).map((notification) => ({ id: notification.id, title: notification.title, description: notification.message, timestamp: formatDate(notification.createdAt), icon: notification.type.includes("PAYMENT") ? CheckCircle2 : notification.type.includes("CREATIVE") ? ImagePlus : notification.type.includes("PROFILE") ? FilePenLine : Bell, tone: notification.type.includes("PAYMENT") ? "success" : notification.type.includes("CREATIVE") ? "warning" : "info", href: notification.link || undefined }))

  return <div className="space-y-6 sm:space-y-8">
    <PageHeader title={`Welcome back, ${business?.name || "Advertiser"}!`} description="Here’s what’s happening with your campaign." actions={<>{publicProfilePath ? <Button asChild variant="outline"><Link href={publicProfilePath} target="_blank" rel="noopener noreferrer">View landing page <ExternalLink aria-hidden="true" /></Link></Button> : <Button variant="outline" disabled title="Finish your profile location and category to enable the public landing page.">View landing page <ExternalLink aria-hidden="true" /></Button>}<Button onClick={copyPublicLink} disabled={!publicProfilePath || !origin} title={!publicProfilePath ? "Finish your profile location and category to enable sharing." : undefined}><Share2 aria-hidden="true" />{copyLabel}</Button></>} />

    <SectionCard padding="none" className="overflow-hidden">
      <div className="grid lg:grid-cols-[270px_minmax(0,1fr)_250px]">
        <div className="min-h-56 border-b border-border bg-muted/50 p-4 lg:border-b-0 lg:border-r lg:p-5">
          <div className="flex h-full min-h-48 flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-4" style={campaign?.frontBackgroundUrl ? { backgroundImage: `linear-gradient(135deg, rgb(29 32 37 / .84), rgb(29 32 37 / .48)), url(${campaign.frontBackgroundUrl})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}>
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-white"><Megaphone className="size-5" aria-hidden="true" /></div>
            <div className={campaign?.frontBackgroundUrl ? "text-white" : "text-foreground"}><p className="text-xs font-medium opacity-80">Campaign placement</p><p className="mt-1 text-lg font-semibold leading-tight">{spot?.label || "Your placement"}</p><p className="mt-1 text-xs opacity-80">{campaign?.name || "Campaign"}</p></div>
          </div>
        </div>
        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Selected placement</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{campaign?.name || "Campaign placement"}</h2><div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1.5"><MapPin className="size-4 text-primary" aria-hidden="true" />{campaign?.city}, {campaign?.state}</span><span className="inline-flex items-center gap-1.5"><Users className="size-4 text-primary" aria-hidden="true" />{campaign?.mailingQuantity?.toLocaleString()} households</span><span>Placement {spot?.label}</span></div></div><select value={selectedPlacement.orderId} onChange={(event) => selectPlacement(event.target.value)} aria-label="Select campaign placement" className="h-10 max-w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"><option value={selectedPlacement.orderId}>{campaign?.name} · {spot?.label}</option>{placements.filter((placement) => placement.orderId !== selectedPlacement.orderId).map((placement) => <option key={placement.orderId} value={placement.orderId}>{placement.campaign?.name || "Campaign"} · {placement.campaignSpot?.label || "Placement"}</option>)}</select></div>
          <div className="mt-7"><WorkflowStepper steps={workflow} /></div>
        </div>
        <div className="border-t border-border bg-muted/35 p-5 lg:border-l lg:border-t-0 lg:p-6"><p className="text-sm font-medium text-muted-foreground">Campaign status</p><div className="mt-3"><StatusBadge {...displayStatus} dot /></div><p className="mt-4 text-sm leading-6 text-muted-foreground">{isNeedsReview ? "Your postcard proof is ready. Review it so production can continue." : isMailed ? "Your mailer is on its way. Engagement data will appear as customers interact." : "We’ll notify you when your next campaign milestone is ready."}</p><Button asChild className="mt-5 w-full" variant={isNeedsReview ? "default" : "outline"}><Link href={isNeedsReview || isCreativeRejected || !hasCreativeSubmitted ? `/submit-creative/${selectedPlacement.creativeSubmissionToken}` : "/business/setup"}>{isNeedsReview ? "Review proof" : "View setup checklist"}</Link></Button></div>
      </div>
    </SectionCard>

    <MetricGrid>
      <MetricCard label="QR scans" value={currentTotals.scans} icon={QrCode} tone="purple" trend={{ value: metricTrend("scans"), period: `previous ${rangeDays} days`, unavailable: metricTrend("scans") === undefined }} />
      <MetricCard label="Landing page views" value={currentTotals.views} icon={Eye} tone="blue" trend={{ value: metricTrend("views"), period: `previous ${rangeDays} days`, unavailable: metricTrend("views") === undefined }} />
      <MetricCard label="Outbound link clicks" value={currentTotals.clicks} icon={Link2} tone="orange" trend={{ value: metricTrend("clicks"), period: `previous ${rangeDays} days`, unavailable: metricTrend("clicks") === undefined }} />
      <MetricCard label="Phone click-to-calls" value={currentTotals.calls} icon={Phone} tone="green" trend={{ value: metricTrend("calls"), period: `previous ${rangeDays} days`, unavailable: metricTrend("calls") === undefined }} />
      <MetricCard label="Total engagements" value={totalEngagements} icon={Sparkles} tone="orange" trend={{ value: engagementTrend, period: `previous ${rangeDays} days`, unavailable: engagementTrend === undefined }} />
    </MetricGrid>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.85fr)_minmax(300px,.85fr)]">
      <AnalyticsChartCard title="Daily performance" description={`Placement activity during the last ${rangeDays} days.`} controls={<DateRangeSelector value={rangeDays} onChange={setRangeDays} />}>{isTimeSeriesLoading ? <div className="h-72 animate-pulse rounded-lg bg-muted" /> : hasChartData ? <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={timeSeries} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(value) => value.slice(5).replace("-", "/")} /><YAxis tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} /><Tooltip contentStyle={{ borderColor: "var(--border)", borderRadius: 10, fontSize: 12 }} /><Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} /><Area type="monotone" dataKey="scans" fill="var(--primary)" fillOpacity={0.06} stroke="none" /><Line type="monotone" dataKey="scans" name="QR scans" stroke="var(--primary)" strokeWidth={2.5} dot={false} /><Line type="monotone" dataKey="views" name="Profile views" stroke="var(--foreground)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="clicks" name="Link clicks" stroke="var(--warning)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="calls" name="Phone actions" stroke="var(--info)" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div> : <EmptyState icon={BarChart3} title="No analytics data yet" description="Performance will appear here when people scan your mailer and interact with your landing page." />}</AnalyticsChartCard>
      <SectionCard title="Campaign to-dos" action={<Link href="/business/setup" className="text-sm font-medium text-primary hover:underline">View setup</Link>}><div className="space-y-1">{todos.map((todo) => { const Icon = todo.icon; return <Link key={todo.title} href={todo.href} className="flex gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/60"><span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${todo.done ? "bg-success-soft text-success" : "bg-primary/10 text-primary"}`}><Icon className="size-4" aria-hidden="true" /></span><span><span className={`block text-sm font-medium ${todo.done ? "text-muted-foreground" : "text-foreground"}`}>{todo.title}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{todo.description}</span></span></Link> })}</div></SectionCard>
      <SectionCard title="Recent activity" action={<Link href="/business/profile" className="text-sm font-medium text-primary hover:underline">View profile</Link>}><ActivityFeed items={activityItems} emptyMessage="Your campaign activity will appear here." /></SectionCard>
    </div>

    <div className="grid gap-6 lg:grid-cols-2">
      <SectionCard padding="lg"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Send className="size-7" aria-hidden="true" /></span><div><h2 className="text-base font-semibold text-foreground">Share your campaign and get more exposure</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Invite customers and friends to visit your landing page and discover your offer.</p></div></div><Button onClick={copyPublicLink} disabled={!publicProfilePath || !origin}><ClipboardCopy aria-hidden="true" />{copyLabel}</Button></div></SectionCard>
      <SectionCard padding="lg"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-info-soft text-info"><Mail className="size-7" aria-hidden="true" /></span><div><h2 className="text-base font-semibold text-foreground">We’re here to help</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Questions about your placement, proof, or business profile? Our support team is ready.</p></div></div><Button asChild variant="outline"><a href="mailto:support@nearhere.com">Contact support</a></Button></div></SectionCard>
    </div>

    {qrCode ? <SectionCard title="Placement QR code" description="This code routes customers to your campaign landing page and attributes scans to this placement." action={<Button variant="outline" size="sm" onClick={() => downloadQr(qrCode.slug, campaign?.name || "campaign")}>Download QR</Button>}><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><QRCodeImage value={`${origin}/q/${qrCode.slug}`} size={96} /><div><p className="text-sm font-medium text-foreground">{spot?.label || "Campaign placement"}</p><p className="mt-1 break-all text-sm text-muted-foreground">{origin ? `${origin}/q/${qrCode.slug}` : `/q/${qrCode.slug}`}</p></div></div></SectionCard> : null}
  </div>
}

function sumMetrics(items: Array<{ scans: number; views: number; clicks: number; calls: number; ctas: number }>) {
  return items.reduce((totals, item) => ({ scans: totals.scans + item.scans, views: totals.views + item.views, clicks: totals.clicks + item.clicks + item.ctas, calls: totals.calls + item.calls }), { scans: 0, views: 0, clicks: 0, calls: 0 })
}
