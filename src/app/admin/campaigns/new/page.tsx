"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trpc } from "@/components/providers"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

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
  const [cardSize, setCardSize] = useState<"9x12" | "6x11" | "9x12-16-regular">("9x12")
  const [cardSkin, setCardSkin] = useState("cream")

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
        cardSize,
        cardSkin,
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
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="space-y-1">
          <Link
            href="/admin/campaigns"
            className="text-[10px] font-mono font-bold text-warm hover:text-primary transition-colors uppercase tracking-widest"
          >
            ← Back to Campaigns
          </Link>
          <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-press leading-none mt-2">
            Create Campaign
          </h1>
        </div>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-none bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-xs text-red-500 font-bold uppercase tracking-wide">
              ⚠️ {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campaign Name */}
            <div className="space-y-1.5 md:col-span-2 text-left">
              <label htmlFor="name" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                Campaign Name <span className="text-primary">*</span>
              </label>
              <Input
                id="name"
                type="text"
                required
                disabled={loading}
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Converse 10K Local Business Postcard"
              />
            </div>

            {/* Slug */}
            <div className="space-y-1.5 md:col-span-2 text-left">
              <label htmlFor="slug" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                URL Slug <span className="text-primary">*</span>
              </label>
              <Input
                id="slug"
                type="text"
                required
                disabled={loading}
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="e.g. local-business-postcard"
              />
              <span className="text-[10px] text-warm font-medium block">
                Auto-generated from name. Controls the landing page URL path segment.
              </span>
            </div>

            {/* Postcard Size Template */}
            <div className="space-y-1.5 md:col-span-2 text-left">
              <label htmlFor="cardSize" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                Postcard Size Format <span className="text-primary">*</span>
              </label>
              <select
                id="cardSize"
                disabled={loading}
                value={cardSize}
                onChange={e => setCardSize(e.target.value as any)}
                className="w-full rounded-none border border-input bg-card text-press h-10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
              >
                <option value="9x12">9x12 NearHere Shared Card (Premium Grid, 21 paid placements)</option>
                <option value="6x11">6x11 Community Card (Style B: Spotlight Rail, 12 slots)</option>
                <option value="9x12-16-regular">9×12 – 16 Regular Placements (Eight equal placements on each side)</option>
              </select>
              <span className="text-[10px] text-warm font-medium block">
                Determines the layout structure, dimensions, and default spots initialized for the campaign.
              </span>
            </div>

            {/* Postcard Skin Theme */}
            <div className="space-y-1.5 md:col-span-2 text-left">
              <label htmlFor="cardSkin" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                Postcard Skin Theme
              </label>
              <select
                id="cardSkin"
                disabled={loading}
                value={cardSkin}
                onChange={e => setCardSkin(e.target.value)}
                className="w-full rounded-none border border-input bg-card text-press h-10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
              >
                <option value="cream">Cream (Traditional warm cardstock)</option>
                <option value="dark">Slate Dark (Bold charcoal style)</option>
                <option value="minimalist">Modern White (Clean minimalist design)</option>
              </select>
              <span className="text-[10px] text-warm font-medium block">
                Controls the background styling, font colors, and border themes of the postcard templates.
              </span>
            </div>

            {/* City */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="city" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                City <span className="text-primary">*</span>
              </label>
              <Input
                id="city"
                type="text"
                required
                disabled={loading}
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. converse"
              />
            </div>

            {/* State */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="state" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                State <span className="text-primary">*</span>
              </label>
              <Input
                id="state"
                type="text"
                required
                disabled={loading}
                value={state}
                onChange={e => setState(e.target.value)}
                placeholder="e.g. texas"
              />
            </div>

            {/* County */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="county" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                County
              </label>
              <Input
                id="county"
                type="text"
                disabled={loading}
                value={county}
                onChange={e => setCounty(e.target.value)}
                placeholder="e.g. Bexar"
              />
            </div>

            {/* ZIP Code */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="zipCode" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                Mailing ZIP Code
              </label>
              <Input
                id="zipCode"
                type="text"
                disabled={loading}
                value={zipCode}
                onChange={e => setZipCode(e.target.value)}
                placeholder="e.g. 78109"
              />
            </div>

            {/* Mailing Quantity */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="quantity" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                Mailing Quantity (Homes) <span className="text-primary">*</span>
              </label>
              <Input
                id="quantity"
                type="number"
                required
                disabled={loading}
                value={mailingQuantity}
                onChange={e => setMailingQuantity(Number(e.target.value))}
                placeholder="10000"
              />
            </div>

            {/* Estimated Mail Date */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="mailDate" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                Estimated Mail Date
              </label>
              <Input
                id="mailDate"
                type="date"
                disabled={loading}
                value={estimatedMailDate}
                onChange={e => setEstimatedMailDate(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 md:col-span-2 text-left">
              <label htmlFor="desc" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                Campaign Description
              </label>
              <Textarea
                id="desc"
                rows={3}
                disabled={loading}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Enter context, target homeowner criteria..."
              />
            </div>

            {/* Front Background URL */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="frontBg" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                Front Background Image URL
              </label>
              <Input
                id="frontBg"
                type="url"
                disabled={loading}
                value={frontBackgroundUrl}
                onChange={e => setFrontBackgroundUrl(e.target.value)}
                placeholder="https://example.com/front-bg.jpg"
              />
              <span className="text-[10px] text-warm font-medium block">
                Optional. If left blank, defaults to standard background patterns matching the selected skin theme.
              </span>
            </div>

            {/* Back Background URL */}
            <div className="space-y-1.5 text-left">
              <label htmlFor="backBg" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
                Back Background Image URL
              </label>
              <Input
                id="backBg"
                type="url"
                disabled={loading}
                value={backBackgroundUrl}
                onChange={e => setBackBackgroundUrl(e.target.value)}
                placeholder="https://example.com/back-bg.jpg"
              />
              <span className="text-[10px] text-warm font-medium block">
                Optional. If left blank, defaults to standard background patterns matching the selected skin theme.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Creating..." : "💾 Save Campaign"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
