"use client"

import { useState } from "react"
import { trpc } from "@/components/providers"
import { SpotType } from "@prisma/client"
import { formatPrice } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-press leading-none">
            Industry Categories
          </h1>
          <p className="text-xs text-warm font-medium">
            Manage business categories for campaign spot assignment and exclusivity constraints.
          </p>
        </div>
        {!isAdding && !editingCategory && (
          <div>
            <Button
              type="button"
              onClick={handleAddClick}
            >
              ＋ Add Category
            </Button>
          </div>
        )}
      </div>

      {/* Add / Edit Form Block */}
      {(isAdding || editingCategory) && (
        <Card className="p-6 sm:p-8 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="font-headline font-extrabold text-lg uppercase tracking-tight text-press border-b border-border pb-2">
              {editingCategory ? `Edit Category: ${editingCategory.name}` : "Create New Category"}
            </h3>

            {error && (
              <div className="rounded-none bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-xs text-red-500 font-bold uppercase tracking-wide">
                ⚠️ {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              {/* Name */}
              <div className="space-y-1.5 md:col-span-2 text-left">
                <label htmlFor="catName" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                  Category Name
                </label>
                <Input
                  id="catName"
                  type="text"
                  required
                  disabled={loading}
                  value={name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Roof Cleaning"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5 md:col-span-2 text-left">
                <label htmlFor="catSlug" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                  Category Slug (Unique)
                </label>
                <Input
                  id="catSlug"
                  type="text"
                  required
                  disabled={loading}
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                  placeholder="e.g. roof-cleaning"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5 md:col-span-2 text-left">
                <label htmlFor="catDesc" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                  Description
                </label>
                <Textarea
                  id="catDesc"
                  rows={2}
                  disabled={loading}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              {/* Default Price */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="catPrice" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                  Default Price (USD)
                </label>
                <Input
                  id="catPrice"
                  type="number"
                  disabled={loading}
                  value={defaultPriceDollars}
                  onChange={e => setDefaultPriceDollars(e.target.value)}
                />
              </div>

              {/* Default Spot Type */}
              <div className="space-y-1.5 text-left">
                <label htmlFor="catType" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                  Default Spot Size
                </label>
                <select
                  id="catType"
                  disabled={loading}
                  value={defaultSpotType}
                  onChange={e => setDefaultSpotType(e.target.value as SpotType)}
                  className="w-full rounded-none border border-input bg-card text-press h-10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
                >
                  <option value="PREMIUM">Premium</option>
                  <option value="LARGE">Large</option>
                  <option value="STANDARD">Standard</option>
                  <option value="SMALL">Small</option>
                </select>
              </div>

              {/* Exclusivity Override */}
              <div className="md:col-span-2 pt-2 text-left">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowsMultipleAdvertisers}
                    onChange={e => setAllowsMultipleAdvertisers(e.target.checked)}
                    className="w-5 h-5 text-primary border-press rounded-none mt-0.5 focus:ring-1 focus:ring-primary"
                  />
                  <div>
                    <span className="block text-sm font-semibold text-press font-headline uppercase tracking-tight">
                      Allows Multiple Advertisers (Bypass Exclusivity)
                    </span>
                    <span className="block text-xs text-warm font-medium">
                      E.g. Check this for Food and Restaurant categories to allow multiple competitors on the same card.
                    </span>
                  </div>
                </label>
              </div>

              {/* Active Status (edit only) */}
              {editingCategory && (
                <div className="md:col-span-2 pt-2 text-left">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="w-5 h-5 text-primary border-press rounded-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-sm font-semibold text-press font-headline uppercase tracking-tight">Active and Configurable</span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex gap-4 pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Saving..." : editingCategory ? "Update Category" : "Save Category"}
              </Button>
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Categories List View */}
      {!isAdding && !editingCategory && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 px-6">Category Info</TableHead>
                <TableHead className="py-4 px-6">Exclusivity Rule</TableHead>
                <TableHead className="py-4 px-6">Default Spot Type</TableHead>
                <TableHead className="py-4 px-6">Default Price</TableHead>
                <TableHead className="py-4 px-6">Status</TableHead>
                <TableHead className="py-4 px-6 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!categories || categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-warm italic">
                    No categories found.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="py-4 px-6">
                      <div className="space-y-0.5 text-left">
                        <span className="font-headline font-black text-base text-press uppercase tracking-tight">{cat.name}</span>
                        <span className="text-[10px] text-warm font-mono font-bold uppercase tracking-wider block">
                          slug: {cat.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {cat.allowsMultipleAdvertisers ? (
                        <Badge variant="warning">
                          Multi-advertiser
                        </Badge>
                      ) : (
                        <Badge variant="default">
                          Exclusive Category
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-warm font-bold text-xs uppercase">{cat.defaultSpotType}</TableCell>
                    <TableCell className="py-4 px-6 font-bold text-press">{formatPrice(cat.defaultPrice)}</TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge
                        variant={cat.isActive ? "success" : "outline"}
                      >
                        {cat.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <Button
                        type="button"
                        onClick={() => handleEditClick(cat)}
                        variant="outline"
                        size="sm"
                      >
                        Edit Settings
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
