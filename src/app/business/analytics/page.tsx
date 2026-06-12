"use client"

import React from "react"
import { trpc } from "@/lib/trpc/client"

export default function BusinessAnalyticsPage() {
  const { data: analytics, isLoading } = trpc.business.getAnalyticsSummary.useQuery()

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-10 bg-slate-200 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded" />
          <div className="h-64 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  // Calculate percentages/max scans for bar charts
  const maxScans = analytics?.scansByCampaign.length
    ? Math.max(...analytics.scansByCampaign.map((c) => c.scansCount), 1)
    : 1

  const totalClicks = analytics
    ? Object.values(analytics.clicksByType).reduce((a, b) => a + b, 0)
    : 0

  const maxClicks = analytics
    ? Math.max(...Object.values(analytics.clicksByType), 1)
    : 1

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

      {/* Campaign Scans Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Campaign QR Scans Card */}
        <div className="bg-white border-2 border-press p-6 rounded-none shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-0.5 text-left border-b border-rule pb-2">
            <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press">
              Recorded QR Scans by Campaign
            </h3>
            <p className="text-[11px] text-warm font-medium">
              Comparison of recorded scans across your NearHere campaigns.
            </p>
          </div>

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
                    <div className="w-full bg-[#E7E0D8]/45 h-5 rounded-none border border-rule overflow-hidden relative">
                      <div
                        className="bg-[#D13F1F] h-full transition-all duration-500"
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
        </div>

        {/* Outbound Link Clicks Breakdown */}
        <div className="bg-white border border-rule p-6 rounded-none shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-0.5 text-left border-b border-rule pb-2">
            <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press">
              Profile Button Engagement
            </h3>
            <p className="text-[11px] text-warm font-medium">
              Outbound clicks recorded from your business profile page.
            </p>
          </div>

          {analytics && Object.keys(analytics.clicksByType).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(analytics.clicksByType).map(([type, count], idx) => {
                const percentage = (count / maxClicks) * 100
                return (
                  <div key={idx} className="space-y-1 select-none">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-press font-mono uppercase tracking-wider text-[10px] bg-slate-100 px-1.5 py-0.5">
                        {type} Link
                      </span>
                      <span className="text-warm font-mono text-[11px]">
                        {count} clicks
                      </span>
                    </div>

                    {/* Visual Bar */}
                    <div className="w-full bg-[#E7E0D8]/45 h-5 rounded-none border border-rule overflow-hidden">
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
        </div>

      </div>

      {/* Raw Scan Log Section */}
      <div className="bg-white border border-rule rounded-none shadow-sm overflow-hidden select-none">
        
        <div className="p-6 border-b border-rule text-left">
          <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press">
            Recent Scan Activity
          </h3>
          <p className="text-[11px] text-warm font-medium">
            The latest recorded QR scan events associated with your campaign placements.
          </p>
        </div>

        <div className="overflow-x-auto">
          {analytics?.recentScans && analytics.recentScans.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-press/5 font-mono text-[9px] font-bold text-warm uppercase tracking-wider border-b border-rule">
                  <th className="px-6 py-4">Time Scanned</th>
                  <th className="px-6 py-4">Device Type</th>
                  <th className="px-6 py-4">Location (Geo)</th>
                  <th className="px-6 py-4 text-right">Scan Validity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-sans text-xs font-medium text-press">
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
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-warm font-bold">{dateString}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-press border border-slate-200">
                          {scan.deviceType === "Mobile" ? "📱" : "💻"} {scan.deviceType}
                        </span>
                      </td>
                      <td className="px-6 py-3">{locationString}</td>
                      <td className="px-6 py-3 text-right">
                        {scan.isExpiredScan ? (
                          <span className="inline-block px-2 py-0.5 bg-red-50 text-red-500 font-mono text-[9px] font-bold uppercase tracking-wider border border-red-200 rounded-none">
                            Expired Scan
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-600 font-mono text-[9px] font-bold uppercase tracking-wider border border-emerald-200 rounded-none">
                            Active / Valid
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center text-warm font-medium">
              No recent scans recorded.
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
