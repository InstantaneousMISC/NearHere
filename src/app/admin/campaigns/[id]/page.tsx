"use client"

import { useState, use } from "react"
import { trpc } from "@/components/providers"
import { CampaignStatus, SpotStatus, ApprovalStatus } from "@prisma/client"
import { formatPrice, formatDate } from "@/lib/utils"
import SpotForm from "@/components/admin/SpotForm"
import Link from "next/link"

interface CampaignDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<"overview" | "spots" | "orders" | "creative">("overview")
  const [editingSpot, setEditingSpot] = useState<any | null>(null)
  const [isAddingSpot, setIsAddingSpot] = useState(false)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)

  // Fetch campaign by ID
  const { data: campaign, isLoading, refetch } = trpc.campaign.getById.useQuery({ id })

  const updateStatusMutation = trpc.campaign.updateStatus.useMutation()
  const deleteSpotMutation = trpc.spot.delete.useMutation()
  const updateApprovalMutation = trpc.creative.updateApproval.useMutation()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold text-sm">Loading campaign details...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-red-600">Campaign Not Found</h2>
        <Link href="/admin/campaigns" className="mt-4 inline-block text-blue-600 font-semibold">
          Return to Campaigns List
        </Link>
      </div>
    )
  }

  const handleStatusChange = async (newStatus: CampaignStatus) => {
    setStatusUpdateLoading(true)
    try {
      await updateStatusMutation.mutateAsync({ id, status: newStatus })
      await refetch()
    } catch (err) {
      alert("Failed to update status")
    } finally {
      setStatusUpdateLoading(false)
    }
  }

  const handleDeleteSpot = async (spotId: string) => {
    if (!confirm("Are you sure you want to delete this spot?")) return
    try {
      await deleteSpotMutation.mutateAsync({ id: spotId })
      await refetch()
    } catch (err: any) {
      alert(err.message || "Failed to delete spot")
    }
  }

  const handleApprovalChange = async (submissionId: string, status: ApprovalStatus) => {
    const notes = prompt("Enter approval/revision notes (optional):") || undefined
    try {
      await updateApprovalMutation.mutateAsync({
        submissionId,
        approvalStatus: status,
        approvalNotes: notes,
      })
      await refetch()
    } catch (err) {
      alert("Failed to update approval status")
    }
  }

  // Calculations for campaign readiness checklist
  const totalSpots = campaign.spots.length
  const openSpots = campaign.spots.filter((s) => s.status === "OPEN").length
  const heldSpots = campaign.spots.filter((s) => s.status === "HELD").length
  const soldSpots = campaign.spots.filter((s) => s.status === "SOLD").length
  const paidOrdersCount = campaign.orders.filter((o) => o.status === "PAID").length
  const submittedCreativesCount = campaign.orders.filter(
    (o) => o.status === "PAID" && o.creativeSubmission?.submittedAt !== null && o.creativeSubmission !== null
  ).length
  const approvedCreativesCount = campaign.orders.filter(
    (o) => o.status === "PAID" && o.creativeSubmission?.approvalStatus === "APPROVED"
  ).length

  const checklist = [
    {
      label: "Campaign Details Complete",
      description: "ZIP code, est. mail date, and description are set.",
      isDone: !!campaign.zipCode && !!campaign.estimatedMailDate && !!campaign.description,
    },
    {
      label: "Spots Configured",
      description: `At least 10 spots configured (currently: ${totalSpots}).`,
      isDone: totalSpots >= 10,
    },
    {
      label: "Categories Assigned",
      description: "All configured spots have categories assigned.",
      isDone: totalSpots > 0 && campaign.spots.every((s) => !!s.categoryId),
    },
    {
      label: "Open Spots Remaining",
      description: `${openSpots} campaign placements currently available.`,
      isDone: openSpots === 0 && totalSpots > 0,
      optional: true,
    },
    {
      label: "Orders Paid",
      description: `All spots paid (${paidOrdersCount}/${totalSpots}).`,
      isDone: totalSpots > 0 && paidOrdersCount === totalSpots,
    },
    {
      label: "Creative Submitted",
      description: `All paid orders submitted assets (${submittedCreativesCount}/${paidOrdersCount}).`,
      isDone: paidOrdersCount > 0 && submittedCreativesCount === paidOrdersCount,
    },
    {
      label: "Creative Approved",
      description: `All submitted assets approved (${approvedCreativesCount}/${paidOrdersCount}).`,
      isDone: paidOrdersCount > 0 && approvedCreativesCount === paidOrdersCount,
    },
    {
      label: "Ready for Design",
      description: "At least one order paid and all paid ads have creative submitted.",
      isDone: paidOrdersCount > 0 && submittedCreativesCount === paidOrdersCount,
    },
    {
      label: "Ready for Print",
      description: "All creatives are approved.",
      isDone: paidOrdersCount > 0 && approvedCreativesCount === paidOrdersCount,
    },
    {
      label: "Mailed",
      description: `Campaign status is set to MAILED (current status: ${campaign.status}).`,
      isDone: campaign.status === "MAILED",
    },
  ]

  return (
    <div className="space-y-8 font-sans">
      {/* Header Block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
        <div className="space-y-1">
          <Link
            href="/admin/campaigns"
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
          >
            ← Back to Campaigns
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
            {campaign.name}
          </h1>
          <p className="text-slate-500 text-sm">
            Slug: <span className="font-semibold text-slate-800">{campaign.slug}</span>
          </p>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-3">
          <label htmlFor="campaignStatus" className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Status:
          </label>
          <select
            id="campaignStatus"
            disabled={statusUpdateLoading}
            value={campaign.status}
            onChange={(e) => handleStatusChange(e.target.value as CampaignStatus)}
            className="bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-900 focus:outline-none"
          >
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active (Public)</option>
            <option value="SOLD_OUT">Sold Out</option>
            <option value="CLOSED">Closed</option>
            <option value="MAILED">Mailed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200">
        {(["overview", "spots", "orders", "creative"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab)
              setEditingSpot(null)
              setIsAddingSpot(false)
            }}
            className={`px-6 py-3 font-bold text-sm border-b-2 uppercase tracking-wide transition-all ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-400 hover:text-slate-950"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Details panel */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
              <h3 className="text-lg font-bold text-slate-950 border-b border-slate-100 pb-2">
                Details & Targets
              </h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="block text-slate-400 font-semibold">City</span>
                  <span className="font-bold text-slate-800 mt-1 block">{campaign.city}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold">State</span>
                  <span className="font-bold text-slate-800 mt-1 block">{campaign.state}</span>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold">Mailing Quantity</span>
                  <span className="font-bold text-slate-800 mt-1 block">
                    {new Intl.NumberFormat().format(campaign.mailingQuantity)} homes
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold">Est. Mail Date</span>
                  <span className="font-bold text-slate-800 mt-1 block">
                    {campaign.estimatedMailDate ? formatDate(campaign.estimatedMailDate) : "Not Set"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold">Card Size Format</span>
                  <span className="font-bold text-slate-800 mt-1 block uppercase">
                    {campaign.cardSize === "6x11" ? "6x11 Community Card" : "9x12 Shared Card"}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold">Postcard Skin Theme</span>
                  <span className="font-bold text-slate-800 mt-1 block capitalize">
                    {(campaign as any).cardSkin || "cream"}
                  </span>
                </div>
                {campaign.county && (
                  <div>
                    <span className="block text-slate-400 font-semibold">County</span>
                    <span className="font-bold text-slate-800 mt-1 block">{campaign.county}</span>
                  </div>
                )}
                {campaign.zipCode && (
                  <div>
                    <span className="block text-slate-400 font-semibold">ZIP Code</span>
                    <span className="font-bold text-slate-800 mt-1 block">{campaign.zipCode}</span>
                  </div>
                )}
              </div>
              {campaign.description && (
                <div className="border-t border-slate-100 pt-4 space-y-1">
                  <span className="block text-slate-400 font-semibold text-xs uppercase tracking-wider">Description</span>
                  <p className="text-slate-600 text-sm leading-relaxed">{campaign.description}</p>
                </div>
              )}
              
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
                  Campaign Placement Pricing
                </h4>
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Placement / Tier</th>
                        <th className="py-2.5 px-4">Base Price</th>
                        <th className="py-2.5 px-4 text-right">Cost Per Home ({new Intl.NumberFormat().format(campaign.mailingQuantity)} homes)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {campaign.cardSize === "6x11" ? (
                        <>
                          <tr className="hover:bg-slate-55/10">
                            <td className="py-2 px-4 font-semibold">Premium Spotlight (Front Left)</td>
                            <td className="py-2 px-4">$1,000</td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                              {((1000 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-55/10">
                            <td className="py-2 px-4 font-semibold">Standard Feature (Front Right / Back)</td>
                            <td className="py-2 px-4">$450</td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                              {((450 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-55/10">
                            <td className="py-2 px-4 font-semibold">Compact Ad Space (Front Bottom)</td>
                            <td className="py-2 px-4">$250</td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                              {((250 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr className="hover:bg-slate-55/10">
                            <td className="py-2 px-4 font-semibold">Front Standard Slot</td>
                            <td className="py-2 px-4">$490</td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                              {((490 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-55/10">
                            <td className="py-2 px-4 font-semibold">Back Standard Slot</td>
                            <td className="py-2 px-4">$590</td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                              {((590 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-55/10">
                            <td className="py-2 px-4 font-semibold">Front Double Slot</td>
                            <td className="py-2 px-4">$890</td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                              {((890 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-55/10">
                            <td className="py-2 px-4 font-semibold">Back Double Slot</td>
                            <td className="py-2 px-4">$990</td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                              {((990 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-55/10">
                            <td className="py-2 px-4 font-semibold">Premium Center Back Spot</td>
                            <td className="py-2 px-4">$1,490</td>
                            <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">
                              {((1490 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Campaign Readiness Checklist */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-950">Readiness Checklist</h3>
                <p className="text-xs text-slate-400 font-medium">
                  Steps required to prepare and run this campaign.
                </p>
              </div>

              <div className="space-y-4">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 shrink-0">
                      {item.isDone ? (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold text-xs">
                          ✓
                        </span>
                      ) : item.optional ? (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-50 text-amber-600 border border-amber-100 font-bold text-[8px] font-mono">
                          HOLD
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-5 h-5 rounded-full border border-slate-200 bg-slate-50 text-slate-300 font-bold text-xs">
                          
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className={`font-bold block ${item.isDone ? "text-slate-500 line-through opacity-60" : "text-slate-800"}`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-400 font-medium block leading-normal">
                        {item.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono font-bold uppercase tracking-wider text-slate-400 pb-2">
                  <span>Spots Summary</span>
                  <span>{soldSpots}/{totalSpots} Sold</span>
                </div>
                <Link
                  href={`/admin/campaigns/${campaign.id}/edit`}
                  className="w-full inline-flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-400 text-slate-700 font-bold text-sm px-4 py-3 bg-slate-50 transition-colors text-center"
                >
                  Edit Campaign Settings
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Spots Tab */}
        {activeTab === "spots" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Campaign Placements</h3>
              {!isAddingSpot && !editingSpot && (
                <button
                  type="button"
                  onClick={() => setIsAddingSpot(true)}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 shadow"
                >
                  ＋ Add Spot
                </button>
              )}
            </div>

            {/* Render Add/Edit Spot Form */}
            {(isAddingSpot || editingSpot) && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <SpotForm
                  campaignId={campaign.id}
                  initialData={editingSpot || undefined}
                  onSaveSuccess={async () => {
                    setEditingSpot(null)
                    setIsAddingSpot(false)
                    await refetch()
                  }}
                  onCancel={() => {
                    setEditingSpot(null)
                    setIsAddingSpot(false)
                  }}
                />
              </div>
            )}

            {/* List Table of Spots */}
            {!isAddingSpot && !editingSpot && (
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-55/20 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-6">Label / Category</th>
                        <th className="py-3 px-6">Side</th>
                        <th className="py-3 px-6">Size Tier</th>
                        <th className="py-3 px-6">Price</th>
                        <th className="py-3 px-6">Coordinates (x, y, w, h)</th>
                        <th className="py-3 px-6">Status</th>
                        <th className="py-3 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {campaign.spots.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400 italic">
                            No spots configured yet. Click "Add Spot" to configure.
                          </td>
                        </tr>
                      ) : (
                        campaign.spots.map((spot) => (
                          <tr key={spot.id} className="hover:bg-slate-55/10">
                            <td className="py-3 px-6 font-bold text-slate-900">
                              <div className="space-y-0.5">
                                <div>{spot.label}</div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                                  {spot.category.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-6 text-slate-600 font-semibold">{spot.side}</td>
                            <td className="py-3 px-6 text-slate-600 font-medium">{spot.spotType}</td>
                            <td className="py-3 px-6 font-bold text-slate-800">
                              {formatPrice(spot.price)}
                            </td>
                            <td className="py-3 px-6 text-slate-500 font-mono text-xs">
                              {spot.x}%, {spot.y}%, {spot.width}%, {spot.height}%
                            </td>
                            <td className="py-3 px-6">
                              <span
                                className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  spot.status === "OPEN"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                    : spot.status === "HELD"
                                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                                    : spot.status === "SOLD"
                                    ? "bg-slate-100 text-slate-500 border border-slate-200"
                                    : "bg-red-50 text-red-700 border border-red-100"
                                }`}
                              >
                                {spot.status}
                              </span>
                            </td>
                            <td className="py-3 px-6 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => setEditingSpot(spot)}
                                className="text-blue-600 hover:text-blue-700 font-bold"
                              >
                                Edit
                              </button>
                              {spot.status === "OPEN" && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSpot(spot.id)}
                                  className="text-red-600 hover:text-red-700 font-bold ml-2"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-55/20 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-4 px-6">Order ID</th>
                    <th className="py-4 px-6">Business Name</th>
                    <th className="py-4 px-6">Category Spot</th>
                    <th className="py-4 px-6">Paid Amount</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaign.orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                        No orders recorded yet for this campaign.
                      </td>
                    </tr>
                  ) : (
                    campaign.orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-55/10">
                        <td className="py-4 px-6 font-mono text-xs text-slate-400">
                          <Link href={`/admin/orders/${ord.id}`} className="text-blue-600 hover:underline">
                            {ord.id.substring(0, 12)}...
                          </Link>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {ord.advertiser.businessName}
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">
                            {ord.campaignSpot.label}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">
                          {formatPrice(ord.amount)}
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium">
                          {formatDate(ord.createdAt)}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              ord.status === "PAID"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : ord.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Creative Submissions Tab */}
        {activeTab === "creative" && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900">Business Ad Assets Review</h3>

            <div className="grid grid-cols-1 gap-6">
              {campaign.orders.filter(o => o.status === "PAID").length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-slate-400 italic shadow-sm">
                  No paid creative submissions to review yet.
                </div>
              ) : (
                campaign.orders
                  .filter((o) => o.status === "PAID")
                  .map((ord) => {
                    const creative = ord.creativeSubmission
                    if (!creative) {
                      return (
                        <div
                          key={ord.id}
                          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex justify-between items-center"
                        >
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                              Category: {ord.campaignSpot.label}
                            </span>
                            <span className="font-bold text-slate-900 text-base">{ord.advertiser.businessName}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-semibold italic bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            Creative Details Not Yet Submitted by Advertiser
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={ord.id}
                        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 gap-4">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                              Category: {ord.campaignSpot.label}
                            </span>
                            <span className="font-extrabold text-slate-900 text-lg">
                              {creative.businessName || ord.advertiser.businessName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-slate-400 uppercase">Review Status:</span>
                            <span
                              className={`inline-block text-[10px] font-extrabold px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                                creative.approvalStatus === "APPROVED"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : creative.approvalStatus === "NEEDS_REVIEW"
                                  ? "bg-amber-50 text-amber-700 border border-amber-100"
                                  : "bg-blue-50 text-blue-700 border border-blue-100"
                              }`}
                            >
                              {creative.approvalStatus}
                            </span>
                          </div>
                        </div>

                        {/* Creative Details Specs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                          <div className="space-y-3">
                            <div>
                              <span className="block text-slate-400 font-semibold text-xs uppercase">Headline Copy</span>
                              <span className="font-bold text-slate-800 text-base mt-0.5 block">
                                {creative.headline || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-slate-400 font-semibold text-xs uppercase">Offer Copy</span>
                              <span className="font-bold text-slate-800 text-base mt-0.5 block">
                                {creative.offerDeal || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-slate-400 font-semibold text-xs uppercase">Description</span>
                              <p className="text-slate-600 mt-0.5 leading-relaxed">{creative.description || "—"}</p>
                            </div>
                            <div>
                              <span className="block text-slate-400 font-semibold text-xs uppercase">Call to Action</span>
                              <span className="font-semibold text-slate-700 mt-0.5 block">{creative.cta || "—"}</span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {/* Logo File */}
                            {creative.logoUrl ? (
                              <div className="space-y-1.5">
                                <span className="block text-slate-400 font-semibold text-xs uppercase">Logo Asset</span>
                                <div className="border border-slate-200 bg-slate-50 p-2 rounded-xl inline-block max-w-[120px] max-h-[120px]">
                                  <img src={creative.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="block text-slate-400 font-semibold text-xs uppercase">Logo Asset</span>
                                <span className="text-xs text-slate-400 italic block mt-0.5">No logo uploaded.</span>
                              </div>
                            )}

                            {/* Contact overrides */}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="block text-slate-400 font-semibold uppercase">Phone</span>
                                <span className="font-bold text-slate-800 block mt-0.5">{creative.phone || "—"}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 font-semibold uppercase">Website</span>
                                <span className="font-bold text-slate-800 block mt-0.5">{creative.website || "—"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Approval Action Buttons */}
                        <div className="border-t border-slate-100 pt-4 flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => handleApprovalChange(creative.id, "NEEDS_REVIEW")}
                            className="inline-flex items-center justify-center rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2.5 transition-colors shadow"
                          >
                            Needs Revision
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprovalChange(creative.id, "APPROVED")}
                            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 transition-colors shadow"
                          >
                            Approve Ad Creative
                          </button>
                        </div>
                      </div>
                    )
                  })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
