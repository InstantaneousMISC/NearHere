"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/components/providers"
import Link from "next/link"

export default function NewCampaignPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("")
  const [county, setCounty] = useState("")
  const [zipCode, setZipCode] = useState("")
  const [mailingQuantity, setMailingQuantity] = useState(10000)
  const [description, setDescription] = useState("")
  const [estimatedMailDate, setEstimatedMailDate] = useState("")
  const [frontBackgroundUrl, setFrontBackgroundUrl] = useState("")
  const [backBackgroundUrl, setBackBackgroundUrl] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const createMutation = trpc.campaign.create.useMutation()

  // Generate slug dynamically from name
  const handleNameChange = (val: string) => {
    setName(val)
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
    setSlug(generatedSlug)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!name || !slug || !city || !state || !mailingQuantity) {
      setError("Please fill in all required fields.")
      setLoading(false)
      return
    }

    try {
      const result = await createMutation.mutateAsync({
        name,
        slug,
        city,
        state,
        county: county.trim() ? county : undefined,
        zipCode: zipCode.trim() ? zipCode : undefined,
        mailingQuantity,
        description: description.trim() ? description : undefined,
        estimatedMailDate: estimatedMailDate ? new Date(estimatedMailDate) : undefined,
        frontBackgroundUrl: frontBackgroundUrl.trim() ? frontBackgroundUrl : undefined,
        backBackgroundUrl: backBackgroundUrl.trim() ? backBackgroundUrl : undefined,
      })

      router.push(`/admin/campaigns/${result.id}`)
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Failed to create campaign. Please verify details.")
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 font-sans">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <Link
            href="/admin/campaigns"
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
          >
            ← Back to Campaigns
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-2">
            Create Campaign
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 space-y-6">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3.5 text-sm text-red-700 font-medium">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campaign Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="name" className="block text-sm font-bold text-slate-700">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              disabled={loading}
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="e.g. Converse 10K Local Business Postcard"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="slug" className="block text-sm font-bold text-slate-700">
              URL Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              required
              disabled={loading}
              value={slug}
              onChange={e => setSlug(e.target.value)}
              placeholder="e.g. local-business-postcard"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <span className="text-[10px] text-slate-400 block">
              Auto-generated from name. Controls the landing page URL path segment.
            </span>
          </div>

          {/* City */}
          <div className="space-y-1.5">
            <label htmlFor="city" className="block text-sm font-bold text-slate-700">
              City <span className="text-red-500">*</span>
            </label>
            <input
              id="city"
              type="text"
              required
              disabled={loading}
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="e.g. converse"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* State */}
          <div className="space-y-1.5">
            <label htmlFor="state" className="block text-sm font-bold text-slate-700">
              State <span className="text-red-500">*</span>
            </label>
            <input
              id="state"
              type="text"
              required
              disabled={loading}
              value={state}
              onChange={e => setState(e.target.value)}
              placeholder="e.g. texas"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* County */}
          <div className="space-y-1.5">
            <label htmlFor="county" className="block text-sm font-bold text-slate-700">
              County
            </label>
            <input
              id="county"
              type="text"
              disabled={loading}
              value={county}
              onChange={e => setCounty(e.target.value)}
              placeholder="e.g. Bexar"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* ZIP Code */}
          <div className="space-y-1.5">
            <label htmlFor="zipCode" className="block text-sm font-bold text-slate-700">
              Mailing ZIP Code
            </label>
            <input
              id="zipCode"
              type="text"
              disabled={loading}
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
              placeholder="e.g. 78109"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Mailing Quantity */}
          <div className="space-y-1.5">
            <label htmlFor="quantity" className="block text-sm font-bold text-slate-700">
              Mailing Quantity (Homes) <span className="text-red-500">*</span>
            </label>
            <input
              id="quantity"
              type="number"
              required
              disabled={loading}
              value={mailingQuantity}
              onChange={e => setMailingQuantity(Number(e.target.value))}
              placeholder="10000"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Estimated Mail Date */}
          <div className="space-y-1.5">
            <label htmlFor="mailDate" className="block text-sm font-bold text-slate-700">
              Estimated Mail Date
            </label>
            <input
              id="mailDate"
              type="date"
              disabled={loading}
              value={estimatedMailDate}
              onChange={e => setEstimatedMailDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="desc" className="block text-sm font-bold text-slate-700">
              Campaign Description
            </label>
            <textarea
              id="desc"
              rows={3}
              disabled={loading}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter context, target homeowner criteria..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Front Background URL */}
          <div className="space-y-1.5">
            <label htmlFor="frontBg" className="block text-sm font-bold text-slate-700">
              Front Background Image URL
            </label>
            <input
              id="frontBg"
              type="url"
              disabled={loading}
              value={frontBackgroundUrl}
              onChange={e => setFrontBackgroundUrl(e.target.value)}
              placeholder="https://example.com/front-bg.jpg"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Back Background URL */}
          <div className="space-y-1.5">
            <label htmlFor="backBg" className="block text-sm font-bold text-slate-700">
              Back Background Image URL
            </label>
            <input
              id="backBg"
              type="url"
              disabled={loading}
              value={backBackgroundUrl}
              onChange={e => setBackBackgroundUrl(e.target.value)}
              placeholder="https://example.com/back-bg.jpg"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-6 py-4 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99]"
        >
          {loading ? "Creating..." : "Save Campaign"}
        </button>
      </form>
    </div>
  )
}
