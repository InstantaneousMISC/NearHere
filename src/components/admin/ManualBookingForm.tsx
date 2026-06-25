"use client"

import { useState } from "react"
import { trpc } from "@/components/providers"
import { formatPrice } from "@/lib/utils"

interface ManualBookingFormProps {
  spot: {
    id: string
    label: string
    price: number // in cents
    categoryId: string
    campaignId: string
    category: {
      name: string
    }
  }
  onSaveSuccess?: () => void
  onCancel?: () => void
}

export default function ManualBookingForm({
  spot,
  onSaveSuccess,
  onCancel,
}: ManualBookingFormProps) {
  const [searchQuery, setSearchQuery] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<any | null>(null)

  // Form Fields
  const [businessName, setBusinessName] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [website, setWebsite] = useState("")
  const [businessAddress, setBusinessAddress] = useState("")
  const [categoryId, setCategoryId] = useState(spot.categoryId)
  const [priceDollars, setPriceDollars] = useState(String(spot.price / 100))
  const [notes, setNotes] = useState("")
  const [overrideExclusivity, setOverrideExclusivity] = useState(false)

  // Statuses
  const [error, setError] = useState<string | null>(null)
  const [exclusivityConflict, setExclusivityConflict] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // TRPC Queries & Mutations
  const { data: categories } = trpc.category.list.useQuery()
  
  // Fetch advertisers matching searchQuery (min 2 chars)
  const { data: searchResults, isLoading: searchLoading } = trpc.order.searchAdvertisers.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.trim().length >= 2 }
  )

  const bookMutation = trpc.order.bookManually.useMutation()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelectAdvertiser = (adv: any) => {
    setSelectedAdvertiser(adv)
    setBusinessName(adv.businessName || "")
    setContactName(adv.contactName || "")
    setEmail(adv.email || "")
    setPhone(adv.phone || "")
    setWebsite(adv.website || "")
    setBusinessAddress(adv.businessAddress || "")
    setSearchQuery("")
  };

  const handleClearSelectedAdvertiser = () => {
    setSelectedAdvertiser(null)
    setBusinessName("")
    setContactName("")
    setEmail("")
    setPhone("")
    setWebsite("")
    setBusinessAddress("")
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setExclusivityConflict(null)
    setLoading(true)

    const parsedPrice = Math.round(parseFloat(priceDollars) * 100)

    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Please enter a valid price.")
      setLoading(false)
      return
    }

    try {
      await bookMutation.mutateAsync({
        spotId: spot.id,
        categoryId,
        advertiserId: selectedAdvertiser?.id,
        businessName,
        contactName,
        email,
        phone,
        website: website || undefined,
        businessAddress: businessAddress || undefined,
        amount: parsedPrice,
        overrideExclusivity,
        notes: notes || undefined,
      })

      onSaveSuccess?.()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("[MANUAL BOOKING FORM ERROR]:", err)
      if (err.message && err.message.includes("conflict")) {
        setExclusivityConflict(err.message)
      } else {
        setError(err.message || "An unexpected error occurred while booking.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
          Reserve Placement: {spot.label}
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Manually secure this spot for a business. A paid order and business profile will be generated.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-800 font-medium">
          ⚠️ {error}
        </div>
      )}

      {exclusivityConflict && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 space-y-4">
          <div className="text-sm text-amber-800 font-bold flex items-center gap-2">
            <span>⚠️ Exclusivity Exceeded</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            {exclusivityConflict}
          </p>
          <label className="flex items-start gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={overrideExclusivity}
              onChange={(e) => setOverrideExclusivity(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs text-amber-900 font-bold">
              Override Exclusivity Protection (Check this box to force reservation)
            </span>
          </label>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Business Selection / Lookup */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            1. Select or Create Business
          </h4>

          {!selectedAdvertiser ? (
            <div className="relative space-y-1">
              <label htmlFor="searchQuery" className="block text-xs font-bold text-slate-500 uppercase tracking-wide">
                Search Existing Businesses
              </label>
              <input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type 2+ characters to search name, contact, or email..."
                className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />

              {searchLoading && (
                <div className="absolute right-3 top-8 text-xs text-slate-400">Searching...</div>
              )}

              {searchResults && searchResults.length > 0 && (
                <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.map((adv) => (
                    <button
                      key={adv.id}
                      type="button"
                      onClick={() => handleSelectAdvertiser(adv)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex flex-col gap-0.5 text-sm"
                    >
                      <span className="font-bold text-slate-800">{adv.businessName}</span>
                      <span className="text-xs text-slate-500">
                        Contact: {adv.contactName} • {adv.email}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.trim().length >= 2 && searchResults?.length === 0 && (
                <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow p-4 text-center text-xs text-slate-400">
                  No matching businesses found. Enter details manually below.
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="space-y-0.5">
                <span className="text-[10px] text-blue-600 font-extrabold uppercase tracking-widest block">
                  Selected Existing Business
                </span>
                <span className="font-bold text-blue-900 text-sm">{selectedAdvertiser.businessName}</span>
                <span className="text-xs text-blue-700 block">
                  {selectedAdvertiser.contactName} ({selectedAdvertiser.email})
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearSelectedAdvertiser}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
              >
                Change
              </button>
            </div>
          )}

          {/* Business Details Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="bizName" className="block text-xs font-semibold text-slate-600">
                Business Name *
              </label>
              <input
                id="bizName"
                type="text"
                required
                disabled={loading}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Acme Plumbing"
                className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="contactName" className="block text-xs font-semibold text-slate-600">
                Contact Name *
              </label>
              <input
                id="contactName"
                type="text"
                required
                disabled={loading}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-semibold text-slate-600">
                Contact Email *
              </label>
              <input
                id="email"
                type="email"
                required
                disabled={loading || !!selectedAdvertiser}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-sm disabled:bg-slate-100 disabled:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-xs font-semibold text-slate-600">
                Contact Phone *
              </label>
              <input
                id="phone"
                type="tel"
                required
                disabled={loading}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-0100"
                className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="website" className="block text-xs font-semibold text-slate-600">
                Website (Optional)
              </label>
              <input
                id="website"
                type="text"
                disabled={loading}
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="address" className="block text-xs font-semibold text-slate-600">
                Business Address (Optional)
              </label>
              <input
                id="address"
                type="text"
                disabled={loading}
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="123 Main St, Converse, TX"
                className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Placement & Price Settings */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            2. Placement & Price Details
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="bookingCategory" className="block text-xs font-semibold text-slate-600">
                Assign Category (Locks Exclusivity) *
              </label>
              <select
                id="bookingCategory"
                required
                disabled={loading}
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  setOverrideExclusivity(false)
                  setExclusivityConflict(null)
                }}
                className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select a Category</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Override */}
            <div className="space-y-1.5">
              <label htmlFor="bookingPrice" className="block text-xs font-semibold text-slate-600">
                Booked Price (USD) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-sm text-slate-400 font-bold">$</span>
                <input
                  id="bookingPrice"
                  type="number"
                  required
                  disabled={loading}
                  value={priceDollars}
                  onChange={(e) => setPriceDollars(e.target.value)}
                  className="w-full bg-white rounded-xl border border-slate-300 pl-8 pr-4 py-2.5 text-sm focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-slate-400">
                Base price for this spot is {formatPrice(spot.price)}. Enter override price if discounted/custom.
              </p>
            </div>

            {/* Admin Notes */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="bookingNotes" className="block text-xs font-semibold text-slate-600">
                Internal Administrative Notes (Auditable)
              </label>
              <textarea
                id="bookingNotes"
                rows={3}
                disabled={loading}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. In-person sales rep booking. Special package pricing applied."
                className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 shadow transition-colors"
          >
            {loading ? "Processing Reservation..." : "Confirm & Secure Spot"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm px-6 py-3 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
