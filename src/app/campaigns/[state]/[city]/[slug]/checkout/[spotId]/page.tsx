import { notFound, redirect } from "next/navigation"
import { db } from "@/server/db"
import SpotSummary from "@/components/checkout/SpotSummary"
import CheckoutForm from "@/components/checkout/CheckoutForm"
import { CampaignNav } from "@/components/campaign/CampaignNav"

interface CheckoutPageProps {
  params: Promise<{
    state: string
    city: string
    slug: string
    spotId: string
  }>
  searchParams: Promise<{
    categoryId?: string | string[]
  }>
}

export default async function CheckoutPage({
  params,
  searchParams,
}: CheckoutPageProps) {
  const { state, city, slug, spotId } = await params
  const rawCategoryId = (await searchParams).categoryId
  const selectedCategoryId = Array.isArray(rawCategoryId)
    ? rawCategoryId[0]
    : rawCategoryId

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

  // If the spot is already sold, redirect back to the campaign page
  // if (spot.status === "SOLD" || spot.status === "UNAVAILABLE") {
  //   redirect(`/campaigns/${state}/${city}/${slug}`)
  // }

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

  // if (!selectedCategory.allowsMultipleAdvertisers) {
  //   const conflictingReservation = await db.campaignSpot.findFirst({
  //     where: {
  //       campaignId: campaign.id,
  //       categoryId: selectedCategory.id,
  //       id: { not: spot.id },
  //       OR: [
  //         { status: "SOLD" },
  //         {
  //           orders: {
  //             some: {
  //               status: { in: ["PENDING", "PAID"] },
  //             },
  //           },
  //         },
  //       ],
  //     },
  //     select: { id: true },
  //   })
  // 
  //   if (conflictingReservation) {
  //     redirect(`/campaigns/${state}/${city}/${slug}#categories`)
  //   }
  // }

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
            />
          </div>
        </div>
      </div>
    </main>
  )
}
