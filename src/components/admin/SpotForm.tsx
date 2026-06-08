"use client"

import { useState } from "react"
import { trpc } from "@/components/providers"
import { SpotType, PostcardSide, SpotStatus } from "@prisma/client"
import { SPOT_STATUS_COLORS } from "@/lib/constants"

interface SpotFormProps {
  campaignId: string
  initialData?: {
    id: string
    categoryId: string
    label: string
    side: PostcardSide
    spotType: SpotType
    price: number // cents
    x: number
    y: number
    width: number
    height: number
    sortOrder: number
    status: SpotStatus
  }
  onSaveSuccess?: () => void
  onCancel?: () => void
}

export default function SpotForm({
  campaignId,
  initialData,
  onSaveSuccess,
  onCancel,
}: SpotFormProps) {
  const isEditing = !!initialData

  const [categoryId, setCategoryId] = useState(initialData?.categoryId || "")
  const [label, setLabel] = useState(initialData?.label || "")
  const [side, setSide] = useState<PostcardSide>(initialData?.side || PostcardSide.FRONT)
  const [spotType, setSpotType] = useState<SpotType>(initialData?.spotType || SpotType.STANDARD)
  const [priceDollars, setPriceDollars] = useState(
    initialData ? String(initialData.price / 100) : "499"
  )
  const [x, setX] = useState(initialData?.x ?? 0)
  const [y, setY] = useState(initialData?.y ?? 0)
  const [width, setWidth] = useState(initialData?.width ?? 25)
  const [height, setHeight] = useState(initialData?.height ?? 25)
  const [sortOrder, setSortOrder] = useState(initialData?.sortOrder ?? 0)
  const [status, setStatus] = useState<SpotStatus>(initialData?.status || SpotStatus.OPEN)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch active categories for dropdown
  const { data: categories } = trpc.category.list.useQuery()

  const createMutation = trpc.spot.create.useMutation()
  const updateMutation = trpc.spot.update.useMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const parsedPrice = Math.round(parseFloat(priceDollars) * 100)

    if (!categoryId || !label || isNaN(parsedPrice) || parsedPrice <= 0) {
      setError("Please verify category, label, and price are valid.")
      setLoading(false)
      return
    }

    try {
      if (isEditing && initialData) {
        await updateMutation.mutateAsync({
          id: initialData.id,
          categoryId,
          label,
          side,
          spotType,
          price: parsedPrice,
          x,
          y,
          width,
          height,
          sortOrder,
          status,
        })
      } else {
        await createMutation.mutateAsync({
          campaignId,
          categoryId,
          label,
          side,
          spotType,
          price: parsedPrice,
          x,
          y,
          width,
          height,
          sortOrder,
        })
      }

      onSaveSuccess?.()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Failed to save campaign spot.")
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* Form Details */}
      <form onSubmit={handleSubmit} className="space-y-5 bg-slate-50 border border-slate-200 rounded-3xl p-6 shadow-inner">
        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2">
          {isEditing ? "Edit Campaign Spot" : "Add New Postcard Spot"}
        </h3>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3.5 text-sm text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          {/* Label */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="spotLabel" className="block font-semibold text-slate-700">
              Spot Label / Text Display
            </label>
            <input
              id="spotLabel"
              type="text"
              required
              disabled={loading}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Plumber, HVAC, Realtor"
              className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category selection */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="spotCategory" className="block font-semibold text-slate-700">
              Industry Category
            </label>
            <select
              id="spotCategory"
              required
              disabled={loading}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a Category</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.slug})
                </option>
              ))}
            </select>
          </div>

          {/* Side */}
          <div className="space-y-1.5">
            <label htmlFor="spotSide" className="block font-semibold text-slate-700">
              Postcard Side
            </label>
            <select
              id="spotSide"
              disabled={loading}
              value={side}
              onChange={(e) => setSide(e.target.value as PostcardSide)}
              className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none"
            >
              <option value="FRONT">Front</option>
              <option value="BACK">Back</option>
            </select>
          </div>

          {/* Spot Type */}
          <div className="space-y-1.5">
            <label htmlFor="spotType" className="block font-semibold text-slate-700">
              Size/Type Tier
            </label>
            <select
              id="spotType"
              disabled={loading}
              value={spotType}
              onChange={(e) => setSpotType(e.target.value as SpotType)}
              className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none"
            >
              <option value="PREMIUM">Premium</option>
              <option value="LARGE">Large</option>
              <option value="STANDARD">Standard</option>
              <option value="SMALL">Small</option>
            </select>
          </div>

          {/* Price Dollars */}
          <div className="space-y-1.5">
            <label htmlFor="spotPrice" className="block font-semibold text-slate-700">
              Price (USD Dollars)
            </label>
            <input
              id="spotPrice"
              type="number"
              required
              disabled={loading}
              value={priceDollars}
              onChange={(e) => setPriceDollars(e.target.value)}
              placeholder="499"
              className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none"
            />
          </div>

          {/* Sort Order */}
          <div className="space-y-1.5">
            <label htmlFor="spotSort" className="block font-semibold text-slate-700">
              Sort Order
            </label>
            <input
              id="spotSort"
              type="number"
              disabled={loading}
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none"
            />
          </div>

          {/* Live Status - edit only */}
          {isEditing && (
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="spotStatus" className="block font-semibold text-slate-700">
                Live Status
              </label>
              <select
                id="spotStatus"
                disabled={loading}
                value={status}
                onChange={(e) => setStatus(e.target.value as SpotStatus)}
                className="w-full bg-white rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none"
              >
                <option value="OPEN">Open / Available</option>
                <option value="HELD">Held in Checkout</option>
                <option value="SOLD">Sold / Reserved</option>
                <option value="UNAVAILABLE">Closed / Unavailable</option>
              </select>
            </div>
          )}

          {/* Coordinates grid */}
          <div className="md:col-span-2 border-t border-slate-200 pt-4 mt-2">
            <h4 className="font-bold text-slate-800 mb-3">Position Percentages (0 - 100)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">X Coordinate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={x}
                  onChange={(e) => setX(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Y Coordinate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={y}
                  onChange={(e) => setY(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Width (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={width}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500">Height (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={height}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-3 shadow"
          >
            {loading ? "Saving..." : isEditing ? "Update Spot" : "Add Spot"}
          </button>
          {onCancel && (
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm px-4 py-3"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Visual coordinates live preview */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-800">Coordinates Live Preview ({side} Side)</h4>
        <div className="relative w-full aspect-[12/9] border border-slate-300 bg-white rounded-2xl shadow overflow-hidden p-[2%]">
          {/* Header placeholder on the mini- postcard */}
          <div className="h-[12%] border-b border-dashed border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-semibold select-none">
            <span>Converse Campaign Mockup</span>
            <span>Est. 10,000 Mailings</span>
          </div>
          {/* Spots grid wrapper */}
          <div className="relative w-full h-[84%] bg-slate-50 rounded-xl border border-dashed border-slate-200 mt-1">
            {/* Live Spot preview box */}
            <div
              style={{
                left: `${x}%`,
                top: `${y}%`,
                width: `${width}%`,
                height: `${height}%`,
              }}
              className={`absolute rounded-lg border-2 border-dashed flex flex-col items-center justify-center p-1 text-[8px] md:text-[10px] text-center bg-blue-100 border-blue-500 text-blue-800 z-10`}
            >
              <span className="font-bold leading-tight truncate w-full">{label || "Spot Label"}</span>
              <span className="text-[8px] font-semibold text-blue-600 mt-0.5">
                ${parseFloat(priceDollars || "0").toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
