"use client"

import { useState } from "react"
import { trpc } from "@/components/providers"
import { SpotType } from "@prisma/client"
import { formatPrice } from "@/lib/utils"

export default function CategoriesPage() {
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Form states
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [description, setDescription] = useState("")
  const [allowsMultipleAdvertisers, setAllowsMultipleAdvertisers] = useState(false)
  const [defaultSpotType, setDefaultSpotType] = useState<SpotType>(SpotType.STANDARD)
  const [defaultPriceDollars, setDefaultPriceDollars] = useState("499")
  const [isActive, setIsActive] = useState(true)

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { data: categories, refetch } = trpc.category.list.useQuery()
  const createMutation = trpc.category.create.useMutation()
  const updateMutation = trpc.category.update.useMutation()

  const handleNameChange = (val: string) => {
    setName(val)
    setSlug(
      val
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
  }

  const handleEditClick = (cat: any) => {
    setEditingCategory(cat)
    setIsAdding(false)
    setName(cat.name)
    setSlug(cat.slug)
    setDescription(cat.description || "")
    setAllowsMultipleAdvertisers(cat.allowsMultipleAdvertisers)
    setDefaultSpotType(cat.defaultSpotType)
    setDefaultPriceDollars(String(cat.defaultPrice / 100))
    setIsActive(cat.isActive)
  }

  const handleAddClick = () => {
    setIsAdding(true)
    setEditingCategory(null)
    setName("")
    setSlug("")
    setDescription("")
    setAllowsMultipleAdvertisers(false)
    setDefaultSpotType(SpotType.STANDARD)
    setDefaultPriceDollars("499")
    setIsActive(true)
  }

  const handleCancel = () => {
    setEditingCategory(null)
    setIsAdding(false)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const parsedPrice = Math.round(parseFloat(defaultPriceDollars) * 100)

    if (!name || !slug || isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Please verify all fields are valid.")
      setLoading(false)
      return
    }

    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          name,
          slug,
          description: description.trim() ? description : undefined,
          allowsMultipleAdvertisers,
          defaultSpotType,
          defaultPrice: parsedPrice,
          isActive,
        })
      } else {
        await createMutation.mutateAsync({
          name,
          slug,
          description: description.trim() ? description : undefined,
          allowsMultipleAdvertisers,
          defaultSpotType,
          defaultPrice: parsedPrice,
        })
      }

      setEditingCategory(null)
      setIsAdding(false)
      await refetch()
    } catch (err: any) {
      console.error(err)
      setError(err?.message || "Failed to save category.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Industry Categories
          </h1>
          <p className="mt-1.5 text-slate-500 text-sm">
            Manage business categories for campaign spot assignment and exclusivity constraints.
          </p>
        </div>
        {!isAdding && !editingCategory && (
          <div>
            <button
              type="button"
              onClick={handleAddClick}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 shadow-md transition-all"
            >
              ＋ Add Category
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Form Block */}
      {(isAdding || editingCategory) && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm max-w-2xl space-y-6">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">
            {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create New Category"}
          </h3>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3.5 text-sm text-red-700 font-medium">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {/* Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="catName" className="block font-semibold text-slate-700">
                Category Name
              </label>
              <input
                id="catName"
                type="text"
                required
                disabled={loading}
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Roof Cleaning"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="catSlug" className="block font-semibold text-slate-700">
                Category Slug (Unique)
              </label>
              <input
                id="catSlug"
                type="text"
                required
                disabled={loading}
                value={slug}
                onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                placeholder="e.g. roof-cleaning"
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2">
              <label htmlFor="catDesc" className="block font-semibold text-slate-700">
                Description
              </label>
              <textarea
                id="catDesc"
                rows={2}
                disabled={loading}
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none resize-none"
              />
            </div>

            {/* Default Price */}
            <div className="space-y-1.5">
              <label htmlFor="catPrice" className="block font-semibold text-slate-700">
                Default Price (USD)
              </label>
              <input
                id="catPrice"
                type="number"
                disabled={loading}
                value={defaultPriceDollars}
                onChange={e => setDefaultPriceDollars(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none"
              />
            </div>

            {/* Default Spot Type */}
            <div className="space-y-1.5">
              <label htmlFor="catType" className="block font-semibold text-slate-700">
                Default Spot Size
              </label>
              <select
                id="catType"
                disabled={loading}
                value={defaultSpotType}
                onChange={e => setDefaultSpotType(e.target.value as SpotType)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:outline-none"
              >
                <option value="PREMIUM">Premium</option>
                <option value="LARGE">Large</option>
                <option value="STANDARD">Standard</option>
                <option value="SMALL">Small</option>
              </select>
            </div>

            {/* Exclusivity Override */}
            <div className="md:col-span-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allowsMultipleAdvertisers}
                  onChange={e => setAllowsMultipleAdvertisers(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-2 focus:ring-blue-500"
                />
                <div>
                  <span className="block text-sm font-semibold text-slate-800">
                    Allows Multiple Advertisers (Bypass Exclusivity)
                  </span>
                  <span className="block text-xs text-slate-400">
                    E.g. Check this for Food and Restaurant categories to allow multiple competitors on the same card.
                  </span>
                </div>
              </label>
            </div>

            {/* Active Status (edit only) */}
            {editingCategory && (
              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded border-slate-300"
                  />
                  <span className="text-sm font-semibold text-slate-800">Active and Configurable</span>
                </label>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-3 shadow"
            >
              {loading ? "Saving..." : editingCategory ? "Update Category" : "Save Category"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 inline-flex items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-sm px-4 py-3"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Categories List View */}
      {!isAdding && !editingCategory && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-55/20 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-4 px-6">Category Info</th>
                  <th className="py-4 px-6">Exclusivity Rule</th>
                  <th className="py-4 px-6">Default Spot Type</th>
                  <th className="py-4 px-6">Default Price</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!categories || categories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 italic">
                      No categories found.
                    </td>
                  </tr>
                ) : (
                  categories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-slate-55/10">
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 text-base">{cat.name}</span>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                            slug: {cat.slug}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">
                        {cat.allowsMultipleAdvertisers ? (
                          <span className="text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-xs">
                            Multi-advertiser
                          </span>
                        ) : (
                          <span className="text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded text-xs">
                            Exclusive Category
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-semibold">{cat.defaultSpotType}</td>
                      <td className="py-4 px-6 font-bold text-slate-800">{formatPrice(cat.defaultPrice)}</td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            cat.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {cat.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleEditClick(cat)}
                          className="text-blue-600 hover:text-blue-700 font-bold"
                        >
                          Edit Settings
                        </button>
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
  )
}
