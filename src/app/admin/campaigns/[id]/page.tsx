/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, use } from "react"
import { trpc } from "@/components/providers"
import { CampaignStatus, SpotStatus, ApprovalStatus } from "@prisma/client"
import { formatPrice, formatDate } from "@/lib/utils"
import SpotForm from "@/components/admin/SpotForm"
import Link from "next/link"
import CampaignOffersPanel from "@/components/admin/CampaignOffersPanel"
import ManualBookingForm from "@/components/admin/ManualBookingForm"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

interface CampaignDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params)
  const [activeTab, setActiveTab] = useState<"overview" | "spots" | "orders" | "creative" | "offers">("overview")
  const [editingSpot, setEditingSpot] = useState<any | null>(null)
  const [isAddingSpot, setIsAddingSpot] = useState(false)
  const [bookingSpot, setBookingSpot] = useState<any | null>(null)
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false)

  // Fetch campaign by ID
  const { data: campaign, isLoading, refetch } = trpc.campaign.getById.useQuery({ id })

  const updateStatusMutation = trpc.campaign.updateStatus.useMutation()
  const deleteSpotMutation = trpc.spot.delete.useMutation()
  const updateApprovalMutation = trpc.creative.updateApproval.useMutation()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-pulse">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-none animate-spin" />
        <p className="text-warm font-mono font-bold text-xs uppercase tracking-wider">Loading campaign details...</p>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-12 space-y-4">
        <h2 className="font-headline font-black text-xl text-primary uppercase">Campaign Not Found</h2>
        <Button asChild variant="outline">
          <Link href="/admin/campaigns">
            Return to Campaigns List
          </Link>
        </Button>
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-border pb-6 gap-4">
        <div className="space-y-1 text-left">
          <Link
            href="/admin/campaigns"
            className="text-[10px] font-mono font-bold text-warm hover:text-primary transition-colors uppercase tracking-widest"
          >
            ← Back to Campaigns
          </Link>
          <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-press leading-none mt-2">
            {campaign.name}
          </h1>
          <div className="flex items-center gap-3 mt-1 flex-wrap text-xs font-medium text-warm">
            <span>
              Slug: <span className="font-mono font-bold text-press">{campaign.slug}</span>
            </span>
            <span className="text-border">|</span>
            <Link
              href={`/campaigns/${campaign.state.toLowerCase()}/${campaign.city.toLowerCase()}/${campaign.slug.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-headline font-bold text-primary hover:underline transition-colors inline-flex items-center gap-0.5 uppercase tracking-wider"
            >
              Public Page ↗
            </Link>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-3 select-none">
          <label htmlFor="campaignStatus" className="text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
            Status:
          </label>
          <select
            id="campaignStatus"
            disabled={statusUpdateLoading}
            value={campaign.status}
            onChange={(e) => handleStatusChange(e.target.value as CampaignStatus)}
            className="rounded-none border border-input bg-card text-press h-10 px-4 py-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
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
      <div className="flex border-b border-border select-none">
        {(["overview", "spots", "orders", "creative", "offers"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab)
              setEditingSpot(null)
              setIsAddingSpot(false)
              setBookingSpot(null)
            }}
            className={`px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-warm hover:text-press"
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
            <Card className="md:col-span-2 p-6 sm:p-8 space-y-4">
              <h3 className="font-headline font-extrabold text-lg uppercase tracking-tight text-press border-b border-border pb-2">
                Details & Targets
              </h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">City</span>
                  <span className="font-headline font-bold text-lg text-press mt-1 block uppercase">{campaign.city}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">State</span>
                  <span className="font-headline font-bold text-lg text-press mt-1 block uppercase">{campaign.state}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Mailing Quantity</span>
                  <span className="font-headline font-bold text-lg text-press mt-1 block">
                    {new Intl.NumberFormat().format(campaign.mailingQuantity)} homes
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Est. Mail Date</span>
                  <span className="font-headline font-bold text-lg text-press mt-1 block uppercase">
                    {campaign.estimatedMailDate ? formatDate(campaign.estimatedMailDate) : "Not Set"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Card Size Format</span>
                  <span className="font-headline font-bold text-lg text-press mt-1 block uppercase">
                    {campaign.cardSize === "6x11" ? "6x11 Community Card" : "9x12 Shared Card"}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Postcard Skin Theme</span>
                  <span className="font-headline font-bold text-lg text-press mt-1 block uppercase">
                    {(campaign as any).cardSkin || "cream"}
                  </span>
                </div>
                {campaign.county && (
                  <div>
                    <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">County</span>
                    <span className="font-headline font-bold text-lg text-press mt-1 block uppercase">{campaign.county}</span>
                  </div>
                )}
                {campaign.zipCode && (
                  <div>
                    <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">ZIP Code</span>
                    <span className="font-headline font-bold text-lg text-press mt-1 block uppercase">{campaign.zipCode}</span>
                  </div>
                )}
              </div>
              {campaign.description && (
                <div className="border-t border-border pt-4 space-y-1">
                  <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Description</span>
                  <p className="text-press text-sm leading-relaxed">{campaign.description}</p>
                </div>
              )}
              
              <div className="border-t border-border pt-6 space-y-4">
                <h4 className="font-headline font-extrabold text-sm uppercase tracking-wide text-press">
                  Campaign Placement Pricing
                </h4>
                <div className="overflow-x-auto border-2 border-press bg-card">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-press bg-press/5 text-warm font-mono text-[9px] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Placement / Tier</th>
                        <th className="py-2.5 px-4">Base Price</th>
                        <th className="py-2.5 px-4 text-right">Cost Per Home ({new Intl.NumberFormat().format(campaign.mailingQuantity)} homes)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-press">
                      {campaign.cardSize === "6x11" ? (
                        <>
                          <tr className="hover:bg-press/5">
                            <td className="py-2 px-4 font-bold">Premium Spotlight (Front Left)</td>
                            <td className="py-2 px-4 font-mono">$1,000</td>
                            <td className="py-2 px-4 text-right font-mono font-bold">
                              {((1000 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-press/5">
                            <td className="py-2 px-4 font-bold">Standard Feature (Front Right / Back)</td>
                            <td className="py-2 px-4 font-mono">$450</td>
                            <td className="py-2 px-4 text-right font-mono font-bold">
                              {((450 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-press/5">
                            <td className="py-2 px-4 font-bold">Compact Ad Space (Front Bottom)</td>
                            <td className="py-2 px-4 font-mono">$250</td>
                            <td className="py-2 px-4 text-right font-mono font-bold">
                              {((250 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr className="hover:bg-press/5">
                            <td className="py-2 px-4 font-bold">Front Standard Spot</td>
                            <td className="py-2 px-4 font-mono">$490</td>
                            <td className="py-2 px-4 text-right font-mono font-bold">
                              {((490 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-press/5">
                            <td className="py-2 px-4 font-bold">Back Standard Slot</td>
                            <td className="py-2 px-4 font-mono">$590</td>
                            <td className="py-2 px-4 text-right font-mono font-bold">
                              {((590 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-press/5">
                            <td className="py-2 px-4 font-bold">Front Double Slot</td>
                            <td className="py-2 px-4 font-mono">$890</td>
                            <td className="py-2 px-4 text-right font-mono font-bold">
                              {((890 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-press/5">
                            <td className="py-2 px-4 font-bold">Back Double Slot</td>
                            <td className="py-2 px-4 font-mono">$990</td>
                            <td className="py-2 px-4 text-right font-mono font-bold">
                              {((990 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                          <tr className="hover:bg-press/5">
                            <td className="py-2 px-4 font-bold">Premium Center Back Spot</td>
                            <td className="py-2 px-4 font-mono">$1,490</td>
                            <td className="py-2 px-4 text-right font-mono font-bold">
                              {((1490 * 100) / campaign.mailingQuantity).toFixed(1)}¢
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
 
            {/* Campaign Readiness Checklist */}
            <Card className="p-6 space-y-6">
              <div className="space-y-1">
                <h3 className="font-headline font-extrabold text-lg uppercase tracking-tight text-press border-b border-border pb-2">Readiness Checklist</h3>
                <p className="text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                  Steps to prepare campaign
                </p>
              </div>

              <div className="space-y-4">
                {checklist.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
                    <div className="mt-0.5 shrink-0 select-none">
                      {item.isDone ? (
                        <span className="flex items-center justify-center w-5 h-5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-xs">
                          ✓
                        </span>
                      ) : item.optional ? (
                        <span className="flex items-center justify-center w-5 h-5 bg-amber-50 text-amber-700 border border-amber-200 font-mono text-[8px] font-bold">
                          HOLD
                        </span>
                      ) : (
                        <span className="flex items-center justify-center w-5 h-5 border border-press bg-transparent font-bold text-xs" />
                      )}
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className={`font-headline font-bold uppercase tracking-tight text-sm block ${item.isDone ? "text-warm line-through opacity-60" : "text-press"}`}>
                        {item.label}
                      </span>
                      <span className="text-xs text-warm font-medium block leading-normal">
                        {item.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border pt-4 flex flex-col gap-2">
                <div className="flex justify-between text-xs font-mono font-bold uppercase tracking-wider text-warm pb-2">
                  <span>Spots Summary</span>
                  <span>{soldSpots}/{totalSpots} Sold</span>
                </div>
                <Button asChild variant="outline">
                  <Link href={`/admin/campaigns/${campaign.id}/edit`}>
                    Edit Campaign Settings
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Spots Tab */}
        {activeTab === "spots" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-headline font-extrabold text-lg uppercase tracking-tight text-press">Campaign Placements</h3>
              {!isAddingSpot && !editingSpot && !bookingSpot && (
                <Button
                  onClick={() => setIsAddingSpot(true)}
                  size="sm"
                >
                  ＋ Add Spot
                </Button>
              )}
            </div>

            {/* Render Add/Edit Spot Form */}
            {(isAddingSpot || editingSpot) && !bookingSpot && (
              <Card className="p-6">
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
              </Card>
            )}

            {/* Render Manual Booking Form */}
            {bookingSpot && (
              <Card className="p-6">
                <ManualBookingForm
                  key={bookingSpot.id}
                  spot={bookingSpot}
                  onSaveSuccess={async () => {
                    setBookingSpot(null)
                    await refetch()
                  }}
                  onCancel={() => {
                    setBookingSpot(null)
                  }}
                />
              </Card>
            )}

            {/* List Table of Spots */}
            {!isAddingSpot && !editingSpot && !bookingSpot && (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="px-6 py-4">Label / Category</TableHead>
                      <TableHead className="px-6 py-4">Side</TableHead>
                      <TableHead className="px-6 py-4">Size Tier</TableHead>
                      <TableHead className="px-6 py-4">Price</TableHead>
                      <TableHead className="px-6 py-4">Coordinates (x, y, w, h)</TableHead>
                      <TableHead className="px-6 py-4">Status</TableHead>
                      <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaign.spots.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-10 text-center text-warm italic">
                          No spots configured yet. Click &quot;Add Spot&quot; to configure.
                        </TableCell>
                      </TableRow>
                    ) : (
                      campaign.spots.map((spot) => (
                        <TableRow key={spot.id}>
                          <TableCell className="px-6 py-4 font-bold text-press">
                            <div className="space-y-0.5 text-left">
                              <div className="font-headline font-black text-sm uppercase tracking-tight">{spot.label}</div>
                              <span className="text-[10px] text-warm font-mono font-bold uppercase tracking-wider block">
                                {spot.category.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-warm font-bold text-xs uppercase">{spot.side}</TableCell>
                          <TableCell className="px-6 py-4 text-warm font-medium text-xs uppercase">{spot.spotType}</TableCell>
                          <TableCell className="px-6 py-4 font-bold text-press">
                            {formatPrice(spot.price)}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-warm font-mono text-xs">
                            {spot.x}%, {spot.y}%, {spot.width}%, {spot.height}%
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge
                              variant={
                                spot.status === "OPEN"
                                  ? "success"
                                  : spot.status === "HELD"
                                  ? "warning"
                                  : spot.status === "SOLD"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {spot.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right space-x-2">
                            {spot.status === "OPEN" && (
                              <Button
                                onClick={() => setBookingSpot(spot)}
                                size="sm"
                                variant="outline"
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250"
                              >
                                Book Manually
                              </Button>
                            )}
                            <Button
                              onClick={() => setEditingSpot(spot)}
                              size="sm"
                              variant="outline"
                            >
                              Edit
                            </Button>
                            {spot.status === "OPEN" && (
                              <Button
                                onClick={() => handleDeleteSpot(spot.id)}
                                size="sm"
                                variant="destructive"
                              >
                                Delete
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="px-6 py-4">Order ID</TableHead>
                  <TableHead className="px-6 py-4">Business Name</TableHead>
                  <TableHead className="px-6 py-4">Category Spot</TableHead>
                  <TableHead className="px-6 py-4">Paid Amount</TableHead>
                  <TableHead className="px-6 py-4">Date</TableHead>
                  <TableHead className="px-6 py-4 text-right">Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaign.orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-warm italic">
                      No orders recorded yet for this campaign.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaign.orders.map((ord) => (
                    <TableRow key={ord.id}>
                      <TableCell className="px-6 py-4 font-mono text-xs text-warm">
                        <Link href={`/admin/orders/${ord.id}`} className="text-primary font-bold hover:underline">
                          {ord.id.substring(0, 12)}...
                        </Link>
                      </TableCell>
                      <td className="px-6 py-4 font-bold text-press">
                        {ord.advertiser.businessName}
                      </td>
                      <TableCell className="px-6 py-4">
                        <span className="bg-press text-paper text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5">
                          {ord.campaignSpot.label}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-4 font-bold text-press">
                        {formatPrice(ord.amount)}
                      </TableCell>
                      <TableCell className="px-6 py-4 font-mono text-xs text-warm font-bold">
                        {formatDate(ord.createdAt)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Badge
                          variant={
                            ord.status === "PAID"
                              ? "success"
                              : ord.status === "PENDING"
                              ? "warning"
                              : "outline"
                          }
                        >
                          {ord.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Creative Submissions Tab */}
        {activeTab === "creative" && (
          <div className="space-y-6">
            <h3 className="font-headline font-extrabold text-lg uppercase tracking-tight text-press border-b border-border pb-3 text-left">Business Ad Assets Review</h3>

            <div className="grid grid-cols-1 gap-6">
              {campaign.orders.filter(o => o.status === "PAID").length === 0 ? (
                <Card className="p-8 text-center text-warm italic">
                  No paid creative submissions to review yet.
                </Card>
              ) : (
                campaign.orders
                  .filter((o) => o.status === "PAID")
                  .map((ord) => {
                    const creative = ord.creativeSubmission
                    if (!creative) {
                      return (
                        <Card
                          key={ord.id}
                          className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="text-left">
                            <span className="text-[10px] text-warm font-mono font-bold uppercase tracking-wider block">
                              Category: {ord.campaignSpot.label}
                            </span>
                            <span className="font-headline font-black text-lg text-press uppercase tracking-tight">{ord.advertiser.businessName}</span>
                          </div>
                          <div className="text-xs text-warm font-semibold italic bg-press/5 px-3 py-1.5 border border-border">
                            Creative Details Not Yet Submitted by Advertiser
                          </div>
                        </Card>
                      )
                    }

                    return (
                      <Card
                        key={ord.id}
                        className="p-6 sm:p-8 space-y-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 gap-4">
                          <div className="text-left">
                            <span className="text-[10px] text-warm font-mono font-bold uppercase tracking-wider block">
                              Category: {ord.campaignSpot.label}
                            </span>
                            <span className="font-headline font-black text-xl text-press uppercase tracking-tight">
                              {creative.businessName || ord.advertiser.businessName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Review Status:</span>
                            <Badge
                              variant={
                                creative.approvalStatus === "APPROVED"
                                  ? "success"
                                  : creative.approvalStatus === "NEEDS_REVIEW"
                                  ? "warning"
                                  : "secondary"
                              }
                            >
                              {creative.approvalStatus}
                            </Badge>
                          </div>
                        </div>

                        {/* Creative Details Specs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-left">
                          <div className="space-y-3">
                            <div>
                              <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Headline Copy</span>
                              <span className="font-bold text-press text-base mt-0.5 block">
                                {creative.headline || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Offer Copy</span>
                              <span className="font-bold text-press text-base mt-0.5 block">
                                {creative.offerDeal || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Description</span>
                              <p className="text-press mt-0.5 leading-relaxed">{creative.description || "—"}</p>
                            </div>
                            <div>
                              <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Call to Action</span>
                              <span className="font-semibold text-press mt-0.5 block">{creative.cta || "—"}</span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            {/* Logo File */}
                            {creative.logoUrl ? (
                              <div className="space-y-1.5">
                                <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Logo Asset</span>
                                <div className="border border-border bg-[#FAF8F4] p-2 inline-block max-w-[120px] max-h-[120px]">
                                  <img src={creative.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Logo Asset</span>
                                <span className="text-xs text-warm italic block mt-0.5">No logo uploaded.</span>
                              </div>
                            )}

                            {/* Contact overrides */}
                            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                              <div>
                                <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Phone</span>
                                <span className="text-press block mt-0.5">{creative.phone || "—"}</span>
                              </div>
                              <div>
                                <span className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">Website</span>
                                <span className="text-press block mt-0.5">{creative.website || "—"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Approval Action Buttons */}
                        <div className="border-t border-border pt-4 flex justify-end gap-3">
                          <Button
                            type="button"
                            onClick={() => handleApprovalChange(creative.id, "NEEDS_REVIEW")}
                            variant="outline"
                            className="bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                          >
                            Needs Revision
                          </Button>
                          <Button
                            type="button"
                            onClick={() => handleApprovalChange(creative.id, "APPROVED")}
                          >
                            Approve Ad Creative
                          </Button>
                        </div>
                      </Card>
                    )
                  })
              )}
            </div>
          </div>
        )}

        {/* Offers Tab */}
        {activeTab === "offers" && (
          <CampaignOffersPanel campaignId={campaign.id} />
        )}
      </div>
    </div>
  )
}
