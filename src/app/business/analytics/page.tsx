"use client"

import React from "react"
import { trpc } from "@/lib/trpc/client"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function BusinessAnalyticsPage() {
  const { data: analytics, isLoading } = trpc.business.getAnalyticsSummary.useQuery()
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-10 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-24 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-200 rounded" />
        </div>
        <div className="h-64 bg-slate-200 rounded animate-pulse" />
      </div>
    )
  }

  const dailyActivity = analytics?.dailyActivity || []

  // Calculate overall metrics
  const totalClicks = analytics
    ? Object.values(analytics.clicksByType).reduce((a, b) => a + b, 0)
    : 0

  const scans14d = dailyActivity.reduce((acc, curr) => acc + curr.scans, 0)
  const views14d = dailyActivity.reduce((acc, curr) => acc + curr.views, 0)
  const clicks14d = dailyActivity.reduce((acc, curr) => acc + curr.clicks, 0)

  const scanToViewRate = (analytics?.totalScans ?? 0) > 0
    ? ((analytics?.totalPageViews ?? 0) / (analytics?.totalScans ?? 1)) * 100
    : 0

  const viewToClickRate = (analytics?.totalPageViews ?? 0) > 0
    ? (totalClicks / (analytics?.totalPageViews ?? 1)) * 100
    : 0

  const engagementRoi = (analytics?.totalScans ?? 0) > 0
    ? (totalClicks / (analytics?.totalScans ?? 1)) * 100
    : 0

  // Max scans & clicks for campaign breakdowns
  const maxScans = analytics?.scansByCampaign.length
    ? Math.max(...analytics.scansByCampaign.map((c) => c.scansCount), 1)
    : 1

  const maxClicks = analytics
    ? Math.max(...Object.values(analytics.clicksByType), 1)
    : 1

  // SVG dimensions and metrics
  const width = 700
  const height = 300
  const paddingLeft = 40
  const paddingRight = 20
  const paddingTop = 20
  const paddingBottom = 40
  const graphW = width - paddingLeft - paddingRight
  const graphH = height - paddingTop - paddingBottom

  const maxVal = Math.max(
    ...dailyActivity.map((d) => Math.max(d.scans, d.views, d.clicks)),
    5
  )

  const getNiceMax = (val: number) => {
    if (val <= 5) return 5
    if (val <= 10) return 10
    if (val <= 25) return 25
    if (val <= 50) return 50
    if (val <= 100) return 100
    return Math.ceil(val / 50) * 50
  }
  const niceMax = getNiceMax(maxVal)

  const getX = (index: number) => {
    if (dailyActivity.length <= 1) return paddingLeft
    return paddingLeft + (index / (dailyActivity.length - 1)) * graphW
  }

  const getY = (value: number) => {
    return height - paddingBottom - (value / niceMax) * graphH
  }

  const formatMMDD = (dateStr: string) => {
    const parts = dateStr.split("-")
    if (parts.length < 3) return dateStr
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const yTicks = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax]

  const scansPoints = dailyActivity.map((d, idx) => `${getX(idx)},${getY(d.scans)}`).join(" ")
  const viewsPoints = dailyActivity.map((d, idx) => `${getX(idx)},${getY(d.views)}`).join(" ")
  const clicksPoints = dailyActivity.map((d, idx) => `${getX(idx)},${getY(d.clicks)}`).join(" ")

  return (
    <div className="space-y-8 text-left animate-fade-up">
      
      {/* Title */}
      <div className="space-y-0.5">
        <h1 className="font-headline font-black text-2xl uppercase text-press leading-none tracking-tight">
          QR Scan & Engagement Reports
        </h1>
        <p className="text-xs text-warm font-medium">
          Review recorded QR scans, business page views, and tracked outbound link activity.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-none border-2 border-press p-6 bg-card relative overflow-hidden">
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-widest font-mono text-warm uppercase block">
              Total Postcard Scans
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-black text-press">
                {analytics?.totalScans ?? 0}
              </span>
              <span className="text-[10px] font-mono font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5">
                +{scans14d} (14d)
              </span>
            </div>
            <p className="text-[10px] text-warm font-mono">
              Scans recorded across all physical mailer QR codes.
            </p>
          </div>
        </Card>

        <Card className="rounded-none border-2 border-press p-6 bg-card relative overflow-hidden">
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-widest font-mono text-warm uppercase block">
              Total Page Views
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-black text-press">
                {analytics?.totalPageViews ?? 0}
              </span>
              <span className="text-[10px] font-mono font-bold text-press uppercase bg-secondary/15 px-1.5 py-0.5">
                +{views14d} (14d)
              </span>
            </div>
            <p className="text-[10px] text-warm font-mono">
              Hits on your digital business profile landing page.
            </p>
          </div>
        </Card>

        <Card className="rounded-none border-2 border-press p-6 bg-card relative overflow-hidden">
          <div className="space-y-2">
            <span className="text-[10px] font-bold tracking-widest font-mono text-warm uppercase block">
              Total Link Clicks
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-black text-press">
                {totalClicks}
              </span>
              <span className="text-[10px] font-mono font-bold text-gold uppercase bg-gold/10 px-1.5 py-0.5">
                +{clicks14d} (14d)
              </span>
            </div>
            <p className="text-[10px] text-warm font-mono">
              Actions taken on your social, website, and phone links.
            </p>
          </div>
        </Card>
      </div>

      {/* 14-Day Timeline Chart */}
      <Card className="border-2 border-press rounded-none shadow-none bg-card p-6">
        <CardHeader className="p-0 pb-4 border-b border-border text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm uppercase tracking-wider font-mono">14-Day Engagement Timeline</CardTitle>
              <CardDescription className="text-[11px] text-warm font-mono">
                Daily activity tracking scan response and subsequent page clicks.
              </CardDescription>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] font-mono font-bold select-none">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-primary inline-block"></span>
                <span>QR SCANS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-secondary inline-block"></span>
                <span>PAGE VIEWS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-gold inline-block"></span>
                <span>LINK CLICKS</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-6">
          {dailyActivity.length > 0 ? (
            <div className="relative w-full h-[300px]">
              <svg
                viewBox="0 0 700 300"
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Grid Lines & Labels */}
                {yTicks.map((tick, idx) => {
                  const yVal = getY(tick)
                  return (
                    <g key={idx}>
                      <line
                        x1={paddingLeft}
                        y1={yVal}
                        x2={width - paddingRight}
                        y2={yVal}
                        stroke="#E7E0D8"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={yVal + 3}
                        textAnchor="end"
                        className="fill-press font-mono text-[9px] font-bold"
                      >
                        {Math.round(tick)}
                      </text>
                    </g>
                  )
                })}

                {/* X Axis Line */}
                <line
                  x1={paddingLeft}
                  y1={height - paddingBottom}
                  x2={width - paddingRight}
                  y2={height - paddingBottom}
                  stroke="#211D1C"
                  strokeWidth="1.5"
                />

                {/* X Axis Ticks & Labels */}
                {dailyActivity.map((d, idx) => {
                  const xVal = getX(idx)
                  const showText = idx % 2 === 0 || idx === dailyActivity.length - 1
                  return (
                    <g key={idx}>
                      <line
                        x1={xVal}
                        y1={height - paddingBottom}
                        x2={xVal}
                        y2={height - paddingBottom + 5}
                        stroke="#211D1C"
                        strokeWidth="1"
                      />
                      {showText && (
                        <text
                          x={xVal}
                          y={height - paddingBottom + 18}
                          textAnchor="middle"
                          className="fill-press font-mono text-[9px] font-bold"
                        >
                          {formatMMDD(d.date)}
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Views Line */}
                {viewsPoints && (
                  <polyline
                    points={viewsPoints}
                    fill="none"
                    stroke="#211D1C"
                    strokeWidth="2"
                  />
                )}
                {/* Scans Line */}
                {scansPoints && (
                  <polyline
                    points={scansPoints}
                    fill="none"
                    stroke="#D13F1F"
                    strokeWidth="2"
                  />
                )}
                {/* Clicks Line */}
                {clicksPoints && (
                  <polyline
                    points={clicksPoints}
                    fill="none"
                    stroke="#C9993E"
                    strokeWidth="2"
                  />
                )}

                {/* Circular markers */}
                {dailyActivity.map((d, idx) => (
                  <g key={idx}>
                    <circle cx={getX(idx)} cy={getY(d.views)} r="3" fill="#FAF8F4" stroke="#211D1C" strokeWidth="1.5" />
                    <circle cx={getX(idx)} cy={getY(d.scans)} r="3" fill="#FAF8F4" stroke="#D13F1F" strokeWidth="1.5" />
                    <circle cx={getX(idx)} cy={getY(d.clicks)} r="3" fill="#FAF8F4" stroke="#C9993E" strokeWidth="1.5" />
                  </g>
                ))}

                {/* Interactive Columns for Tooltip trigger */}
                {dailyActivity.map((d, idx) => {
                  const xVal = getX(idx)
                  const colWidth = graphW / (dailyActivity.length - 1)
                  return (
                    <rect
                      key={idx}
                      x={xVal - colWidth / 2}
                      y={paddingTop}
                      width={colWidth}
                      height={graphH}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  )
                })}

                {/* Active Tooltip and rings */}
                {hoveredIndex !== null && dailyActivity[hoveredIndex] && (
                  <>
                    <line
                      x1={getX(hoveredIndex)}
                      y1={paddingTop}
                      x2={getX(hoveredIndex)}
                      y2={height - paddingBottom}
                      stroke="#211D1C"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      pointerEvents="none"
                    />
                    <circle cx={getX(hoveredIndex)} cy={getY(dailyActivity[hoveredIndex].views)} r="5" fill="none" stroke="#211D1C" strokeWidth="1.5" pointerEvents="none" />
                    <circle cx={getX(hoveredIndex)} cy={getY(dailyActivity[hoveredIndex].scans)} r="5" fill="none" stroke="#D13F1F" strokeWidth="1.5" pointerEvents="none" />
                    <circle cx={getX(hoveredIndex)} cy={getY(dailyActivity[hoveredIndex].clicks)} r="5" fill="none" stroke="#C9993E" strokeWidth="1.5" pointerEvents="none" />

                    <g pointerEvents="none">
                      <rect
                        x={getX(hoveredIndex) > width / 2 ? getX(hoveredIndex) - 155 : getX(hoveredIndex) + 15}
                        y={paddingTop + 10}
                        width="140"
                        height="80"
                        fill="#FAF8F4"
                        stroke="#211D1C"
                        strokeWidth="2"
                      />
                      <line
                        x1={getX(hoveredIndex) > width / 2 ? getX(hoveredIndex) - 155 : getX(hoveredIndex) + 15}
                        y1={paddingTop + 30}
                        x2={getX(hoveredIndex) > width / 2 ? getX(hoveredIndex) - 15 : getX(hoveredIndex) + 155}
                        y2={paddingTop + 30}
                        stroke="#211D1C"
                        strokeWidth="1"
                      />
                      <text
                        x={getX(hoveredIndex) > width / 2 ? getX(hoveredIndex) - 147 : getX(hoveredIndex) + 23}
                        y={paddingTop + 23}
                        className="fill-[#211D1C] font-mono text-[9px] font-black uppercase tracking-wider"
                      >
                        {formatMMDD(dailyActivity[hoveredIndex].date)}
                      </text>
                      <text
                        x={getX(hoveredIndex) > width / 2 ? getX(hoveredIndex) - 147 : getX(hoveredIndex) + 23}
                        y={paddingTop + 43}
                        className="fill-[#D13F1F] font-mono text-[9px] font-bold"
                      >
                        SCANS: {dailyActivity[hoveredIndex].scans}
                      </text>
                      <text
                        x={getX(hoveredIndex) > width / 2 ? getX(hoveredIndex) - 147 : getX(hoveredIndex) + 23}
                        y={paddingTop + 56}
                        className="fill-[#211D1C] font-mono text-[9px] font-bold"
                      >
                        VIEWS: {dailyActivity[hoveredIndex].views}
                      </text>
                      <text
                        x={getX(hoveredIndex) > width / 2 ? getX(hoveredIndex) - 147 : getX(hoveredIndex) + 23}
                        y={paddingTop + 69}
                        className="fill-[#C9993E] font-mono text-[9px] font-bold"
                      >
                        CLICKS: {dailyActivity[hoveredIndex].clicks}
                      </text>
                    </g>
                  </>
                )}
              </svg>
            </div>
          ) : (
            <div className="py-12 text-center text-warm font-medium">
              Timeline data currently unavailable.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Funnel & performance metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Funnel Card */}
        <Card className="lg:col-span-2 border-2 border-press rounded-none shadow-none bg-card p-6">
          <CardHeader className="p-0 pb-4 border-b border-border text-left">
            <CardTitle className="text-sm uppercase tracking-wider font-mono">Conversion Funnel Journey</CardTitle>
            <CardDescription className="text-[11px] text-warm font-mono">
              From physical mailer scans to active profile button clicks.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-6">
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 font-mono select-none">
              
              {/* Funnel Step 1: Scans */}
              <div className="flex-1 border border-press p-4 bg-press/5 flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-[9px] font-bold text-warm uppercase block">STEP 1: PLACEMENT SCAN</span>
                  <span className="text-2xl font-black text-press block mt-1">{analytics?.totalScans ?? 0}</span>
                  <span className="text-[10px] text-warm">QR Scans from Mailer</span>
                </div>
                <span className="text-[9px] text-primary font-bold mt-4 uppercase">Source: Physical Postcard</span>
              </div>

              {/* Connector 1 */}
              <div className="flex items-center justify-center py-2 md:py-0 md:px-2">
                <div className="text-center">
                  <span className="hidden md:inline text-xl text-warm">➔</span>
                  <span className="inline md:hidden text-xl text-warm">▼</span>
                  <div className="text-[10px] font-bold text-press mt-1">
                    {scanToViewRate.toFixed(1)}%
                  </div>
                  <div className="text-[8px] text-warm uppercase">SCAN-TO-VIEW</div>
                </div>
              </div>

              {/* Funnel Step 2: Views */}
              <div className="flex-1 border border-press p-4 bg-secondary/5 flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-[9px] font-bold text-warm uppercase block">STEP 2: PROFILE PAGE VIEW</span>
                  <span className="text-2xl font-black text-press block mt-1">{analytics?.totalPageViews ?? 0}</span>
                  <span className="text-[10px] text-warm">Digital Profile Visits</span>
                </div>
                <span className="text-[9px] text-press font-bold mt-4 uppercase">Source: Web Application</span>
              </div>

              {/* Connector 2 */}
              <div className="flex items-center justify-center py-2 md:py-0 md:px-2">
                <div className="text-center">
                  <span className="hidden md:inline text-xl text-warm">➔</span>
                  <span className="inline md:hidden text-xl text-warm">▼</span>
                  <div className="text-[10px] font-bold text-press mt-1">
                    {viewToClickRate.toFixed(1)}%
                  </div>
                  <div className="text-[8px] text-warm uppercase">VIEW-TO-CLICK</div>
                </div>
              </div>

              {/* Funnel Step 3: Clicks */}
              <div className="flex-1 border border-press p-4 bg-gold/5 flex flex-col justify-between min-h-[120px]">
                <div>
                  <span className="text-[9px] font-bold text-warm uppercase block">STEP 3: OUTBOUND ENGAGEMENT</span>
                  <span className="text-2xl font-black text-press block mt-1">{totalClicks}</span>
                  <span className="text-[10px] text-warm">Outbound Button Clicks</span>
                </div>
                <span className="text-[9px] text-gold font-bold mt-4 uppercase">Source: Direct Links</span>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Conversion Performance ROI */}
        <Card className="border-2 border-press rounded-none shadow-none bg-card p-6 flex flex-col justify-between">
          <CardHeader className="p-0 pb-4 border-b border-border text-left">
            <CardTitle className="text-sm uppercase tracking-wider font-mono">Conversion Performance</CardTitle>
            <CardDescription className="text-[11px] text-warm font-mono">
              Key performance rates for your postcard campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 pt-6 flex-1 flex flex-col justify-between font-mono">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-dashed border-border">
                <span className="text-[10px] font-bold text-warm uppercase">Scan-to-View Rate</span>
                <span className="text-xs font-black text-press">{scanToViewRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-border">
                <span className="text-[10px] font-bold text-warm uppercase">View-to-Click Rate</span>
                <span className="text-xs font-black text-press">{viewToClickRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-dashed border-border">
                <span className="text-[10px] font-bold text-warm uppercase">Engagement ROI</span>
                <span className="text-xs font-black text-press">{engagementRoi.toFixed(1)}%</span>
              </div>
            </div>

            <div className="mt-6 border border-press p-3 bg-card relative">
              <div className="absolute top-0 right-0 bg-press text-white font-bold text-[8px] px-1 uppercase">
                ROI Metric
              </div>
              <p className="text-[9px] text-warm leading-relaxed">
                * Engagement ROI measures the overall conversion rate of postcard scans to direct website clicks (links, bookings, phone calls). Higher rates indicate a highly-compelling offer or strong profile description.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Campaign Scans Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Campaign QR Scans Card */}
        <Card className="flex flex-col justify-between space-y-6">
          <CardHeader className="space-y-0.5 pb-2">
            <CardTitle className="text-sm">Recorded QR Scans by Campaign</CardTitle>
            <CardDescription className="text-[11px] text-warm">
              Comparison of recorded scans across your NearHere campaigns.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 flex-1">
            {analytics?.scansByCampaign && analytics.scansByCampaign.length > 0 ? (
              <div className="space-y-4">
                {analytics.scansByCampaign.map((camp, idx) => {
                  const percentage = (camp.scansCount / maxScans) * 100
                  return (
                    <div key={idx} className="space-y-1 select-none">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-press truncate max-w-[200px]" title={camp.campaignName}>
                          {camp.campaignName}
                        </span>
                        <span className="text-warm font-mono text-[11px]">
                          {camp.scansCount} scans
                        </span>
                      </div>
                      
                      {/* Visual Bar */}
                      <div className="w-full bg-border/45 h-5 rounded-none border border-border overflow-hidden relative">
                        <div
                          className="bg-primary h-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                        <span className="absolute left-2.5 top-0.5 text-[8px] font-mono font-bold text-white uppercase select-none leading-none pt-0.5">
                          {camp.spotLabel}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-warm font-medium">
                No campaign scans recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outbound Link Clicks Breakdown */}
        <Card className="flex flex-col justify-between space-y-6">
          <CardHeader className="space-y-0.5 pb-2">
            <CardTitle className="text-sm">Profile Button Engagement</CardTitle>
            <CardDescription className="text-[11px] text-warm">
              Outbound clicks recorded from your business profile page.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 flex-1">
            {analytics && Object.keys(analytics.clicksByType).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(analytics.clicksByType).map(([type, count], idx) => {
                  const percentage = (count / maxClicks) * 100
                  return (
                    <div key={idx} className="space-y-1 select-none">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-press font-mono uppercase tracking-wider text-[10px] bg-press/5 px-1.5 py-0.5">
                          {type} Link
                        </span>
                        <span className="text-warm font-mono text-[11px]">
                          {count} clicks
                        </span>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full bg-border/45 h-5 rounded-none border border-border overflow-hidden">
                        <div
                          className="bg-gold h-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-warm font-medium">
                No link clicks recorded yet.
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Raw Scan Log Section */}
      <Card className="border border-border rounded-none shadow-none overflow-hidden select-none">
        <CardHeader className="p-6 border-b border-border text-left">
          <CardTitle className="text-sm">Recent Scan Activity</CardTitle>
          <CardDescription className="text-[11px] text-warm">
            The latest recorded QR scan events associated with your campaign placements.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {analytics?.recentScans && analytics.recentScans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4">Time Scanned</TableHead>
                  <TableHead className="px-6 py-4">Device Type</TableHead>
                  <TableHead className="px-6 py-4">Location (Geo)</TableHead>
                  <TableHead className="px-6 py-4 text-right">Scan Validity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.recentScans.map((scan, idx) => {
                  const locationString =
                    scan.city || scan.region || scan.country
                      ? `${scan.city || ""}${scan.city && scan.region ? ", " : ""}${scan.region || ""}${
                          (scan.city || scan.region) && scan.country ? " (" : ""
                        }${scan.country || ""}${(scan.city || scan.region) && scan.country ? ")" : ""}`
                      : "Unknown Geolocation"

                  const dateString = new Date(scan.scannedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })

                  return (
                    <TableRow key={idx}>
                      <TableCell className="px-6 py-3 font-mono text-warm font-bold">{dateString}</TableCell>
                      <TableCell className="px-6 py-3">
                        <Badge variant="outline" className="bg-press/5 text-press border-border">
                          {scan.deviceType === "Mobile" ? "📱" : "💻"} {scan.deviceType}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-3">{locationString}</TableCell>
                      <TableCell className="px-6 py-3 text-right">
                        {scan.isExpiredScan ? (
                          <Badge variant="destructive">
                            Expired Scan
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            Active / Valid
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center text-warm font-medium">
              No recent scans recorded.
            </div>
          )}
        </CardContent>

      </Card>

    </div>
  )
}
