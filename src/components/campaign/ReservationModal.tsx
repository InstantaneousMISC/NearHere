"use client"

import { useMemo, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { trpc } from "@/components/providers"

export type ReservationSpot = {
  id: string
  label: string
  side: "FRONT" | "BACK"
  spotType: "PREMIUM" | "LARGE" | "STANDARD" | "SMALL"
  price: number
  status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
  category: {
    id: string
    name: string
  }
}

export type ReservationPlan = {
  key: string
  name: string
  price: number
  description: string
  costPerHome: string
  inquiryOnly?: boolean
}

function getPairedSpotKey(label: string): string | null {
  const match = label.match(/^(FRONT|BACK)_([1-8])$/)
  if (!match) return null
  const side = match[1]
  const num = parseInt(match[2], 10)
  let pairedNum: number
  if (num === 1) pairedNum = 2
  else if (num === 2) pairedNum = 1
  else if (num === 3) pairedNum = 4
  else if (num === 4) pairedNum = 3
  else if (num === 5) pairedNum = 6
  else if (num === 6) pairedNum = 5
  else if (num === 7) pairedNum = 8
  else if (num === 8) pairedNum = 7
  else return null

  return `${side}_${pairedNum}`
}

interface ReservationModalProps {
  isOpen: boolean
  onClose: () => void
  plan: ReservationPlan | null
  spot: ReservationSpot | null
  spots: ReservationSpot[]
  campaignId: string
  zipCode: string
  checkoutBaseUrl: string
  offer?: any
  cardSize?: string
  setHoveredDoubleKeys?: (keys: string[]) => void
}

function calculateClientOfferDiscount(priceCents: number, offer: any) {
  if (!offer) return 0
  if (offer.discountType === "AMOUNT_OFF") {
    return Math.min(priceCents, offer.discountAmount || 0)
  } else if (offer.discountType === "PERCENT_OFF") {
    const percent = offer.discountPercent || 0
    return Math.round((priceCents * percent) / 100)
  }
  return 0
}

export default function ReservationModal({
  isOpen,
  onClose,
  plan,
  spot,
  spots,
  campaignId,
  zipCode,
  checkoutBaseUrl,
  offer,
  cardSize,
  setHoveredDoubleKeys,
}: ReservationModalProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const offerToken = searchParams.get("offer") || (offer ? offer.token : null)

  const { data: categories = [], isLoading } = trpc.category.list.useQuery(
    undefined,
    { enabled: isOpen }
  )
  const createLead = trpc.lead.create.useMutation()
  const [query, setQuery] = useState("")
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [showCustom, setShowCustom] = useState(false)
  const [businessName, setBusinessName] = useState("")
  const [email, setEmail] = useState("")
  const [requestedCategory, setRequestedCategory] = useState("")
  const [businessDescription, setBusinessDescription] = useState("")
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const getOrCreateSpot = trpc.spot.getOrCreateSpotForPlan.useMutation()
  const [selectedSize, setSelectedSize] = useState<"REGULAR" | "DOUBLE">("REGULAR")

  const pairedSpotKey = useMemo(() => spot ? getPairedSpotKey(spot.label) : null, [spot])
  const pairedSpot = useMemo(() => pairedSpotKey ? spots.find(s => s.label === pairedSpotKey) : null, [pairedSpotKey, spots])
  const isPairAvailable = useMemo(() => pairedSpot && (pairedSpot.status === "OPEN" || pairedSpot.status === "HELD"), [pairedSpot])

  // Sync hover state when selectedSize is DOUBLE
  useEffect(() => {
    if (isOpen && cardSize === "9x12-16-regular" && spot && isPairAvailable && selectedSize === "DOUBLE") {
      setHoveredDoubleKeys?.([spot.label, pairedSpot!.label])
    } else {
      setHoveredDoubleKeys?.([])
    }
  }, [isOpen, cardSize, spot, isPairAvailable, selectedSize, setHoveredDoubleKeys, pairedSpot])

  // Reset selected size when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSize("REGULAR")
    }
  }, [isOpen])

  const soldCategoryIds = useMemo(
    () =>
      new Set(
        spots
          .filter((candidate) => candidate.status === "SOLD")
          .map((candidate) => candidate.category.id)
      ),
    [spots]
  )

  const filteredCategories = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return categories.filter(
      (category) =>
        !normalized || category.name.toLowerCase().includes(normalized)
    )
  }, [categories, query])

  if (!isOpen || !plan) return null

  const basePrice = cardSize === "9x12-16-regular" && selectedSize === "DOUBLE"
    ? (spot?.side === "BACK" ? 990 : 1090)
    : plan.price
  const priceCents = basePrice * 100
  const discountCents = offer ? calculateClientOfferDiscount(priceCents, offer) : 0
  const finalPrice = (priceCents - discountCents) / 100
  const discountAmount = discountCents / 100

  const campaignRecord = spots.length > 0 ? (spots[0] as any).campaign : null
  const quantity = campaignRecord?.mailingQuantity ?? 10000
  const costPerHome = `${((basePrice * 100) / quantity).toFixed(1)} cents per home`

  const selectedCategory = categories.find(
    (category) => category.id === selectedCategoryId
  )
  const categoryTaken = Boolean(
    selectedCategory &&
      soldCategoryIds.has(selectedCategory.id) &&
      !selectedCategory.allowsMultipleAdvertisers
  )
  const inquiryOnly = plan.inquiryOnly || !spot

  const resetAndClose = () => {
    setQuery("")
    setSelectedCategoryId("")
    setShowCustom(false)
    setBusinessName("")
    setEmail("")
    setRequestedCategory("")
    setBusinessDescription("")
    setSuccess(false)
    setError(null)
    onClose()
  }

  const submitLead = async () => {
    setError(null)
    if (!email.trim()) {
      setError("Enter an email address so we can follow up.")
      return
    }
    if (showCustom && !requestedCategory.trim()) {
      setError("Enter the business type you would like us to add.")
      return
    }
    if (showCustom && !businessDescription.trim()) {
      setError("Add a short description of what your business does.")
      return
    }

    try {
      await createLead.mutateAsync({
        businessName: businessName.trim() || undefined,
        email: email.trim(),
        zipCode,
        campaignId,
        categoryId: showCustom ? undefined : selectedCategoryId || undefined,
        requestedCategory: showCustom
          ? requestedCategory.trim() || undefined
          : selectedCategory?.name,
        businessDescription: showCustom
          ? businessDescription.trim() || undefined
          : `${plan.name} reservation inquiry`,
      })
      setSuccess(true)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to submit your request."
      )
    }
  }

  const continueReservation = async () => {
    setError(null)
    if (!selectedCategory) {
      setError("Choose your business category.")
      return
    }

    setIsRedirecting(true)
    try {
      const { spotId } = await getOrCreateSpot.mutateAsync({
        campaignId,
        planKey: (cardSize === "9x12-16-regular" && selectedSize === "DOUBLE" && spot)
          ? `9x12-16-regular-double-${spot.label}`
          : plan.key,
        categoryId: selectedCategory.id,
      })
      let redirectUrl = `${checkoutBaseUrl}/${spotId}?categoryId=${encodeURIComponent(
        selectedCategory.id
      )}`
      if (offerToken) {
        redirectUrl += `&offer=${encodeURIComponent(offerToken)}`
      }
      router.push(redirectUrl)
    } catch (err: any) {
      setIsRedirecting(false)
      setError(err?.message || "Failed to initiate reservation.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close reservation dialog"
        className="absolute inset-0 bg-[#211D1C]/75"
        onClick={resetAndClose}
      />

      <div className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto border border-[#211D1C] bg-[#FAF8F4] p-6 text-[#211D1C] shadow-2xl sm:p-8">
        <button
          type="button"
          onClick={resetAndClose}
          className="absolute right-4 top-4 font-mono text-xs font-bold uppercase"
        >
          Close
        </button>

        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#D13F1F]">
          {inquiryOnly ? "Placement Request" : "Reserve Placement"}
        </p>
        <h2 className="mt-2 font-headline text-3xl font-black uppercase">
          {plan.name}
        </h2>
        <div className="mt-4 flex flex-wrap gap-3 border-y border-[#E7E0D8] py-3 font-mono text-[10px] font-bold uppercase items-center">
          {offer && discountCents > 0 ? (
            <>
              <span className="line-through text-warm">${basePrice.toLocaleString()}</span>
              <span className="text-nh-red font-black font-headline text-xs bg-red-55/10 px-2 py-0.5 rounded border border-[#E7E0D8]">
                ${finalPrice.toLocaleString()} per drop
              </span>
              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-extrabold uppercase text-[9px] border border-emerald-100">
                Discounted ${discountAmount.toLocaleString()}
              </span>
            </>
          ) : (
            <span>${basePrice.toLocaleString()} per drop</span>
          )}
          <span className="text-[#77706A]">{costPerHome}</span>
          {spot && <span className="text-[#77706A]">{spot.label.replace("_", " ")}</span>}
        </div>


        {success ? (
          <div className="mt-8 border border-emerald-700 bg-emerald-50 p-6 text-center">
            <h3 className="font-headline text-2xl font-black uppercase">
              Request received
            </h3>
            <p className="mt-2 text-sm text-[#77706A]">
              We will review the category and placement, then contact you by email.
            </p>
            <button
              type="button"
              onClick={resetAndClose}
              className="mt-5 bg-[#211D1C] px-5 py-3 font-mono text-xs font-bold uppercase text-white"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {cardSize === "9x12-16-regular" && isPairAvailable && !showCustom && (
              <div className="mt-6 border-b border-[#E7E0D8] pb-6 text-left">
                <h3 className="font-headline font-black text-sm uppercase tracking-wide text-[#211D1C] mb-3">
                  Choose Your Ad Size
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSelectedSize("REGULAR")}
                    className={`flex flex-col text-left p-4 border-2 transition-all cursor-pointer ${
                      selectedSize === "REGULAR"
                        ? "border-[#D13F1F] bg-[#D13F1F]/5"
                        : "border-[#E7E0D8] hover:border-[#211D1C] bg-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-headline font-extrabold uppercase text-base text-[#211D1C]">
                        Regular Space
                      </span>
                      <span className="font-mono font-bold text-sm text-[#D13F1F]">
                        {spot?.side === "BACK" ? "$490" : "$590"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#77706A] leading-normal font-sans">
                      Use this individual advertising space.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedSize("DOUBLE")}
                    onMouseEnter={() => setHoveredDoubleKeys?.([spot!.label, pairedSpot!.label])}
                    onMouseLeave={() => {
                      if (selectedSize !== "DOUBLE") {
                        setHoveredDoubleKeys?.([])
                      }
                    }}
                    className={`flex flex-col text-left p-4 border-2 transition-all cursor-pointer ${
                      selectedSize === "DOUBLE"
                        ? "border-[#D13F1F] bg-[#D13F1F]/5"
                        : "border-[#E7E0D8] hover:border-[#211D1C] bg-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="font-headline font-extrabold uppercase text-base text-[#211D1C]">
                        Double Space
                      </span>
                      <span className="font-mono font-bold text-sm text-[#D13F1F]">
                        {spot?.side === "BACK" ? "$990" : "$1,090"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#77706A] leading-normal font-sans">
                      Combine this space with the paired space beside it for a wider advertisement.
                    </p>
                  </button>
                </div>
              </div>
            )}

            {!showCustom && (
              <div className="mt-6">
                <label
                  htmlFor="category-search"
                  className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]"
                >
                  Choose your business type
                </label>
                <input
                  id="category-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search plumbing, HVAC, roofing..."
                  className="mt-2 w-full border border-[#211D1C] bg-white px-4 py-3 text-sm outline-none focus:border-[#D13F1F]"
                />
                <div className="mt-2 max-h-64 overflow-y-auto border border-[#E7E0D8] bg-white">
                  {isLoading ? (
                    <div className="p-4 text-sm text-[#77706A]">
                      Loading categories...
                    </div>
                  ) : filteredCategories.length === 0 ? (
                    <div className="p-4 text-sm text-[#77706A]">
                      No matching business types.
                    </div>
                  ) : (
                    filteredCategories.map((category) => {
                      const taken =
                        soldCategoryIds.has(category.id) &&
                        !category.allowsMultipleAdvertisers
                      const selected = selectedCategoryId === category.id
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setSelectedCategoryId(category.id)}
                          className={`flex w-full items-center justify-between border-b border-[#E7E0D8] px-4 py-3 text-left last:border-b-0 ${
                            selected ? "bg-[#211D1C] text-white" : "hover:bg-[#FAF8F4]"
                          }`}
                        >
                          <span className="font-headline text-lg font-bold uppercase">
                            {category.name}
                          </span>
                          <span
                            className={`font-mono text-[9px] font-bold uppercase ${
                              selected
                                ? "text-white"
                                : taken
                                  ? "text-[#D13F1F]"
                                  : "text-emerald-700"
                            }`}
                          >
                            {taken ? "Taken - Waitlist" : "Available"}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setShowCustom((current) => !current)
                setError(null)
              }}
              className="mt-4 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#D13F1F] underline"
            >
              Don&apos;t see your business type here?
            </button>

            {showCustom && (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <input
                  value={businessName}
                  onChange={(event) => setBusinessName(event.target.value)}
                  placeholder="Business name"
                  className="border border-[#E7E0D8] bg-white px-4 py-3 text-sm outline-none focus:border-[#D13F1F]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email address"
                  className="border border-[#E7E0D8] bg-white px-4 py-3 text-sm outline-none focus:border-[#D13F1F]"
                />
                {showCustom && (
                  <>
                    <input
                      value={requestedCategory}
                      onChange={(event) =>
                        setRequestedCategory(event.target.value)
                      }
                      placeholder="Your business type"
                      className="border border-[#E7E0D8] bg-white px-4 py-3 text-sm outline-none focus:border-[#D13F1F] sm:col-span-2"
                    />
                    <textarea
                      value={businessDescription}
                      onChange={(event) =>
                        setBusinessDescription(event.target.value)
                      }
                      maxLength={500}
                      rows={3}
                      placeholder="Briefly describe what your business does."
                      className="border border-[#E7E0D8] bg-white px-4 py-3 text-sm outline-none focus:border-[#D13F1F] sm:col-span-2"
                    />
                  </>
                )}
              </div>
            )}

            {error && (
              <p className="mt-4 border border-[#D13F1F] bg-red-50 p-3 text-sm text-[#D13F1F]">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={createLead.isPending || getOrCreateSpot.isPending || isRedirecting}
              onClick={showCustom ? () => void submitLead() : () => void continueReservation()}
              className="mt-6 w-full bg-[#D13F1F] px-5 py-4 font-headline text-base font-black uppercase tracking-[0.06em] text-white hover:bg-[#211D1C] disabled:opacity-50"
            >
              {createLead.isPending || getOrCreateSpot.isPending || isRedirecting
                ? "Submitting..."
                : showCustom
                  ? "Submit Business Type"
                  : "Continue to Checkout"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
