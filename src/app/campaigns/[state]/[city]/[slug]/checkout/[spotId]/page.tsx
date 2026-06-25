import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import crypto from "crypto"
import { db } from "@/server/db"
import SpotSummary from "@/components/checkout/SpotSummary"
import CheckoutForm from "@/components/checkout/CheckoutForm"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import { isCampaignOfferRedeemable, calculateOfferDiscount, calculateOfferPrice } from "@/server/helpers/campaignOffers"
import { CampaignOfferDiscountType, CampaignOfferEventType } from "@prisma/client"

interface CheckoutPageProps {
  params: Promise<{
    state: string
    city: string
    slug: string
    spotId: string
  }>
  searchParams: Promise<{
    categoryId?: string | string[]
    offer?: string | string[]
  }>
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { state, city, slug, spotId } = await params
  const resolvedSearchParams = await searchParams
  const rawCategoryId = resolvedSearchParams.categoryId
  const selectedCategoryId = Array.isArray(rawCategoryId)
    ? rawCategoryId[0]
    : rawCategoryId

  const rawOfferToken = resolvedSearchParams.offer
  const offerToken = Array.isArray(rawOfferToken) ? rawOfferToken[0] : rawOfferToken

  // 1. Fetch Campaign
  const campaign = await db.campaign.findUnique({
    where: {
      state_city_slug: {
        state: state.toLowerCase(),
        city: city.toLowerCase(),
        slug: slug.toLowerCase(),
      },
    },
  })

  if (!campaign) {
    return notFound()
  }

  // 2. Fetch Spot
  const spot = await db.campaignSpot.findUnique({
    where: { id: spotId },
    include: { category: true },
  })

  if (!spot || spot.campaignId !== campaign.id) {
    return notFound()
  }

  const selectedCategory = selectedCategoryId
    ? await db.businessCategory.findFirst({
        where: {
          id: selectedCategoryId,
          isActive: true,
        },
      })
    : spot.category

  if (!selectedCategory) {
    redirect(`/campaigns/${state}/${city}/${slug}#categories`)
  }

  // 3. Handle Campaign Offer if present
  let campaignOffer = null
  let discountAmount = 0
  let finalPrice = spot.price
  let promotedBy = ""
  let discountDisplay = ""

  if (offerToken) {
    campaignOffer = await db.campaignOffer.findUnique({
      where: { token: offerToken },
      include: { adminUser: true },
    })

    if (campaignOffer && campaignOffer.campaignId === campaign.id && isCampaignOfferRedeemable(campaignOffer)) {
      discountAmount = calculateOfferDiscount(spot.price, campaignOffer)
      finalPrice = calculateOfferPrice(spot.price, campaignOffer)
      promotedBy = `${campaignOffer.name} / ${campaignOffer.adminUser.name || "NearHere Representative"}`
      discountDisplay =
        campaignOffer.discountType === CampaignOfferDiscountType.AMOUNT_OFF
          ? `$${((campaignOffer.discountAmount || 0) / 100).toFixed(2)} off`
          : `${campaignOffer.discountPercent}% off`

      // Log CHECKOUT_STARTED event and increment counter
      try {
        const headersList = await headers()
        const userAgent = headersList.get("user-agent")
        const ip = (headersList.get("x-forwarded-for") || "").split(",")[0].trim()
        const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16) : null

        await db.$transaction([
          db.campaignOffer.update({
            where: { id: campaignOffer.id },
            data: { checkoutStartCount: { increment: 1 } },
          }),
          db.campaignOfferEvent.create({
            data: {
              campaignOfferId: campaignOffer.id,
              eventType: CampaignOfferEventType.CHECKOUT_STARTED,
              userAgent,
              ipHash,
            },
          }),
        ])
      } catch (err) {
        console.error("Error logging checkout started event:", err)
      }
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <CampaignNav state={state} city={city} slug={slug} isCheckoutPage={true} />
      <div className="py-24 px-4 sm:px-6 lg:px-8 font-sans max-w-5xl mx-auto space-y-8">
        <div className="text-left">
          <span className="mb-2 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Campaign Reservation
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight uppercase">
            Reserve Your Campaign Placement
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">
            Confirm your business and contact details. After secure payment, you can submit your
            offer, logo, and creative preferences for the campaign.
          </p>
        </div>

        {/* Checkout Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Panel */}
          <div className="lg:col-span-2 bg-card border border-border shadow-2xl p-6 sm:p-8 rounded-none">
            <CheckoutForm
              spotId={spot.id}
              categoryId={selectedCategory.id}
              categoryName={selectedCategory.name}
              campaignUrl={`/campaigns/${state}/${city}/${slug}`}
              offerToken={campaignOffer ? offerToken : undefined}
              discountDisplay={campaignOffer ? discountDisplay : undefined}
              promotedBy={campaignOffer ? promotedBy : undefined}
            />
          </div>

          {/* Review Panel */}
          <div className="lg:col-span-1">
            <SpotSummary
              campaignName={campaign.name}
              mailingQuantity={campaign.mailingQuantity}
              city={campaign.city}
              state={campaign.state}
              spot={{
                ...spot,
                category: selectedCategory,
              } as any}
              discountAmount={campaignOffer ? discountAmount : undefined}
              finalPrice={campaignOffer ? finalPrice : undefined}
              promotedBy={campaignOffer ? promotedBy : undefined}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
