"use client"

import React, { useState, useEffect } from "react"
import { trpc } from "@/components/providers"
import { CampaignOfferDiscountType, CampaignOfferStatus } from "@prisma/client"
import { formatPrice } from "@/lib/utils"
import QRCodeImage from "@/components/postcard/QRCodeImage"

interface CampaignOffersPanelProps {
  campaignId: string
}

export default function CampaignOffersPanel({ campaignId }: CampaignOffersPanelProps) {
  const [name, setName] = useState("")
  const [discountType, setDiscountType] = useState<CampaignOfferDiscountType>(CampaignOfferDiscountType.AMOUNT_OFF)
  const [discountAmountDollars, setDiscountAmountDollars] = useState("")
  const [discountPercent, setDiscountPercent] = useState("")
  const [maxRedemptions, setMaxRedemptions] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [notes, setNotes] = useState("")

  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [appUrl, setAppUrl] = useState("")

  // Set the app URL on load
  useEffect(() => {
    setAppUrl(window.location.origin)
  }, [])

  // Fetch campaign offers
  const { data: offers = [], refetch, isLoading } = trpc.campaignOffer.listByCampaign.useQuery({ campaignId })

  // Mutations
  const createMutation = trpc.campaignOffer.create.useMutation()
  const disableMutation = trpc.campaignOffer.disable.useMutation()

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)
    setLoading(true)

    if (!name.trim()) {
      setFormError("Offer name is required.")
      setLoading(false)
      return
    }

    let discountAmountCents: number | null = null
    let discountPercentVal: number | null = null

    if (discountType === CampaignOfferDiscountType.AMOUNT_OFF) {
      const parsedDollars = parseFloat(discountAmountDollars)
      if (isNaN(parsedDollars) || parsedDollars <= 0) {
        setFormError("Discount amount must be a positive number.")
        setLoading(false)
        return
      }
      discountAmountCents = Math.round(parsedDollars * 100)
    } else {
      const parsedPercent = parseInt(discountPercent, 105)
      if (isNaN(parsedPercent) || parsedPercent < 1 || parsedPercent > 100) {
        setFormError("Discount percent must be an integer between 1 and 100.")
        setLoading(false)
        return
      }
      discountPercentVal = parsedPercent
    }

    const parsedMaxRedemptions = maxRedemptions ? parseInt(maxRedemptions, 10) : null
    if (parsedMaxRedemptions !== null && (isNaN(parsedMaxRedemptions) || parsedMaxRedemptions <= 0)) {
      setFormError("Max redemptions must be a positive integer.")
      setLoading(false)
      return
    }

    const parsedExpiresAt = expiresAt ? new Date(expiresAt) : null
    if (parsedExpiresAt && isNaN(parsedExpiresAt.getTime())) {
      setFormError("Please enter a valid expiration date.")
      setLoading(false)
      return
    }

    try {
      await createMutation.mutateAsync({
        campaignId,
        name: name.trim(),
        discountType,
        discountAmount: discountAmountCents,
        discountPercent: discountPercentVal,
        maxRedemptions: parsedMaxRedemptions,
        expiresAt: parsedExpiresAt,
        notes: notes.trim() || null,
      })

      // Reset form
      setName("")
      setDiscountAmountDollars("")
      setDiscountPercent("")
      setMaxRedemptions("")
      setExpiresAt("")
      setNotes("")
      setFormSuccess("Campaign offer created successfully!")
      refetch()
    } catch (err: any) {
      console.error("Error creating campaign offer:", err)
      setFormError(err?.message || "An error occurred while creating the offer.")
    } finally {
      setLoading(false)
    }
  }

  const handleDisableOffer = async (id: string) => {
    if (!confirm("Are you sure you want to disable this campaign offer? This cannot be undone and will prevent future checkouts with this token.")) {
      return
    }

    try {
      await disableMutation.mutateAsync({ id })
      refetch()
    } catch (err: any) {
      console.error("Error disabling campaign offer:", err)
      alert(err?.message || "Failed to disable offer.")
    }
  }

  const handleCopyLink = (token: string) => {
    const url = `${appUrl}/o/${token}`
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopiedToken(token)
        setTimeout(() => setCopiedToken(null), 2000)
      })
      .catch((err) => {
        console.error("Failed to copy link:", err)
      })
  }

  const getOfferStatus = (offer: any) => {
    if (offer.status === CampaignOfferStatus.DISABLED) {
      return { label: "Disabled", className: "bg-red-100 text-red-800 border-red-200" }
    }
    if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) {
      return { label: "Expired", className: "bg-amber-100 text-amber-800 border-amber-200" }
    }
    if (offer.maxRedemptions && (offer.redeemedCount + offer.reservedCount) >= offer.maxRedemptions) {
      return { label: "Redeemed Out", className: "bg-purple-100 text-purple-800 border-purple-200" }
    }
    return { label: "Active", className: "bg-emerald-100 text-emerald-800 border-emerald-200" }
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Creation form */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wide">
          Generate New Campaign Offer Card
        </h3>

        {formError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            ⚠️ {formError}
          </div>
        )}

        {formSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
            ✓ {formSuccess}
          </div>
        )}

        <form onSubmit={handleCreateOffer} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Offer Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Offer / Rep Name (e.g. Jim's Fall Discount)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jim's 10% Off Card"
                className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600 transition-all"
              />
            </div>

            {/* Discount Type */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Discount Type
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as CampaignOfferDiscountType)}
                className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600 transition-all"
              >
                <option value={CampaignOfferDiscountType.AMOUNT_OFF}>Amount Off ($)</option>
                <option value={CampaignOfferDiscountType.PERCENT_OFF}>Percent Off (%)</option>
              </select>
            </div>

            {/* Discount Value */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                {discountType === CampaignOfferDiscountType.AMOUNT_OFF ? "Discount Amount ($)" : "Discount Percent (%)"}
              </label>
              {discountType === CampaignOfferDiscountType.AMOUNT_OFF ? (
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={discountAmountDollars}
                  onChange={(e) => setDiscountAmountDollars(e.target.value)}
                  placeholder="150.00"
                  className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600 transition-all"
                />
              ) : (
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  placeholder="20"
                  className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600 transition-all"
                />
              )}
            </div>

            {/* Max Redemptions */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Max Redemptions (Optional)
              </label>
              <input
                type="number"
                min="1"
                value={maxRedemptions}
                onChange={(e) => setMaxRedemptions(e.target.value)}
                placeholder="Unlimited"
                className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600 transition-all"
              />
            </div>

            {/* Expiration Date */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Expiration Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600 transition-all"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1 md:col-span-3">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Internal Notes / Details
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Created for physical leaf-behind flyers in converse neighborhood campaign..."
                className="w-full border border-slate-200 bg-slate-50 focus:bg-white rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? "Generating..." : "Create Offer & Token"}
            </button>
          </div>
        </form>
      </div>

      {/* Listing offers */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm overflow-hidden">
        <h3 className="text-lg font-bold text-slate-800 mb-4 uppercase tracking-wide">
          Existing Campaign Offer Cards
        </h3>

        {isLoading ? (
          <div className="text-center py-12 text-slate-500 text-sm font-semibold">
            Loading campaign offers...
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic text-sm">
            No offer cards generated for this campaign yet. Use the form above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-4">Offer Name</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Rep (Admin)</th>
                  <th className="py-3.5 px-4 text-center">Attribution Stats</th>
                  <th className="py-3.5 px-4 text-center">QR</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {offers.map((offer) => {
                  const status = getOfferStatus(offer);
                  const isOfferActive = offer.status === CampaignOfferStatus.ACTIVE;
                  const discountDisplay =
                    offer.discountType === CampaignOfferDiscountType.AMOUNT_OFF
                      ? formatPrice(offer.discountAmount || 0)
                      : `${offer.discountPercent}%`;

                  return (
                    <tr key={offer.id} className="hover:bg-slate-50/25 transition-colors">
                      {/* Name & Notes */}
                      <td className="py-4 px-4 max-w-xs">
                        <span className="font-bold text-slate-800 block text-base leading-tight">
                          {offer.name}
                        </span>
                        {offer.notes && (
                          <span className="text-[11px] text-slate-400 block mt-1 leading-normal italic">
                            {offer.notes}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-400 block mt-1.5 uppercase">
                          Token: {offer.token.slice(0, 8)}...{offer.token.slice(-4)}
                        </span>
                      </td>

                      {/* Discount amount */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full text-xs border border-blue-100">
                          {discountDisplay}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-1 uppercase font-semibold font-mono">
                          {offer.discountType}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border rounded-full ${status.className}`}>
                          {status.label}
                        </span>
                        {offer.expiresAt && (
                          <span className="text-[10px] text-slate-400 block mt-1">
                            Expires: {new Date(offer.expiresAt).toLocaleDateString()}
                          </span>
                        )}
                      </td>

                      {/* Rep Attribution */}
                      <td className="py-4 px-4 text-xs">
                        <span className="font-bold text-slate-700 block">
                          {offer.adminUser.name || "Unnamed Rep"}
                        </span>
                        <span className="text-slate-400 block mt-0.5">{offer.adminUser.email}</span>
                      </td>

                      {/* Stats columns */}
                      <td className="py-4 px-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1.5 text-center text-xs font-mono">
                          <div className="bg-slate-50 border border-slate-100 p-1 rounded">
                            <span className="text-[9px] text-slate-400 block uppercase">Scans</span>
                            <span className="font-bold text-slate-800">{offer.scanCount}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 p-1 rounded">
                            <span className="text-[9px] text-slate-400 block uppercase">Starts</span>
                            <span className="font-bold text-slate-800">{offer.checkoutStartCount}</span>
                          </div>
                          <div className="bg-slate-50 border border-slate-100 p-1 rounded text-amber-700 border-amber-100 bg-amber-50/20">
                            <span className="text-[9px] text-amber-500 block uppercase">Reserved</span>
                            <span className="font-bold">{offer.reservedCount}</span>
                          </div>
                          <div className="bg-emerald-50 border border-emerald-100 p-1 rounded text-emerald-700">
                            <span className="text-[9px] text-emerald-500 block uppercase">Paid</span>
                            <span className="font-bold">{offer.redeemedCount}</span>
                          </div>
                        </div>
                        {offer.maxRedemptions && (
                          <div className="text-[10px] text-slate-400 text-center mt-1.5 font-mono">
                            Limit: {offer.redeemedCount + offer.reservedCount} / {offer.maxRedemptions} redeemed or pending
                          </div>
                        )}
                      </td>

                      {/* QR mini display */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-block bg-white p-1 border border-slate-100 rounded">
                          <QRCodeImage
                            value={`${appUrl}/o/${offer.token}`}
                            size={48}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end items-center gap-2 flex-wrap max-w-[150px]">
                          {/* Copy Link */}
                          <button
                            type="button"
                            onClick={() => handleCopyLink(offer.token)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded transition-all"
                          >
                            {copiedToken === offer.token ? "✓ Copied!" : "Copy Link"}
                          </button>

                          {/* Print Flyer link */}
                          <a
                            href={`/admin/campaigns/${campaignId}/offers/${offer.id}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold px-2.5 py-1.5 rounded transition-all"
                          >
                            Print Card
                          </a>

                          {/* Disable button */}
                          {isOfferActive && (
                            <button
                              type="button"
                              onClick={() => handleDisableOffer(offer.id)}
                              className="bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-xs font-bold px-2.5 py-1.5 rounded transition-all"
                            >
                              Disable
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
