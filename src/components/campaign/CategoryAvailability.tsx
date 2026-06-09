"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"

interface CategoryDisplay {
  id: string
  categoryId: string
  name: string
  slug: string
  price: number // cents
  spotType: "PREMIUM" | "LARGE" | "STANDARD" | "SMALL"
  status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
}

interface CategoryAvailabilityProps {
  spots: Array<{
    id: string
    label: string
    price: number
    spotType: "PREMIUM" | "LARGE" | "STANDARD" | "SMALL"
    status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
    category: {
      id: string
      name: string
      slug: string
    }
  }>
  state: string
  city: string
  slug: string
  onWaitlistClick: (category: { id: string; name: string }) => void
  mailingQuantity?: number
}

export default function CategoryAvailability({
  spots,
  state,
  city,
  slug,
  onWaitlistClick,
  mailingQuantity = 10000,
}: CategoryAvailabilityProps) {
  const router = useRouter()
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  return (
    <section id="categories" className="bg-paper text-press border-t border-rule">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <p className="label-mono">Category Availability • {cityName} Drop</p>
            <h2 className="headline-xl text-4xl md:text-5xl mt-4 font-bold">Reserve your category.</h2>
          </div>
          <p className="label-mono max-w-xs text-right hidden md:block">
            One Business Per Category • First Reserved, First Featured
          </p>
        </div>

        <div className="border border-rule bg-paper">
          {/* Header row */}
          <div className="hidden md:grid grid-cols-12 px-6 py-3 border-b border-rule bg-muted/40 label-mono">
            <div className="col-span-1">#</div>
            <div className="col-span-7">Category</div>
            <div className="col-span-2">Starting</div>
            <div className="col-span-2 text-right">Status</div>
          </div>

          {/* Table rows */}
          {spots.map((spot, i) => (
            <div 
              key={spot.id} 
              className={`grid grid-cols-12 items-center px-6 py-5 ${
                i !== spots.length - 1 ? "border-b border-rule" : ""
              } hover:bg-muted/30 transition-colors`}
            >
              {/* Number */}
              <span className="label-mono col-span-1">
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Category Name & Badge */}
              <div className="col-span-6 md:col-span-7 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-headline font-bold text-xl text-press">
                    {spot.label}
                  </span>
                  {spot.spotType === "PREMIUM" && (
                    <span className="inline-flex items-center font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 border border-gold text-gold bg-transparent font-bold">
                      Premium
                    </span>
                  )}
                  {spot.spotType === "LARGE" && (
                    <span className="inline-flex items-center font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 border border-rule text-warm bg-transparent font-bold">
                      Large
                    </span>
                  )}
                </div>
                {/* Mobile price / cost per home */}
                <div className="md:hidden font-mono text-[10px] text-warm">
                  {formatPrice(spot.price)}/drop • {(spot.price / mailingQuantity).toFixed(1)}¢ per home
                </div>
              </div>

              {/* Starting Price */}
              <div className="hidden md:flex flex-col col-span-2 text-left font-mono">
                <span className="text-sm font-bold text-press">
                  {formatPrice(spot.price)}/drop
                </span>
                <span className="text-[10px] text-warm leading-none mt-0.5">
                  {(spot.price / mailingQuantity).toFixed(1)}¢ per home
                </span>
              </div>

              {/* Action Button/Badge */}
              <div className="col-span-5 md:col-span-2 flex justify-end">
                {spot.status === "OPEN" || spot.status === "HELD" ? (
                  <Link
                    href={`/campaigns/${state.toLowerCase()}/${city.toLowerCase()}/${slug.toLowerCase()}/checkout/${spot.id}`}
                    className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-3 py-1.5 border border-nh-red text-nh-red bg-transparent hover:bg-nh-red hover:text-paper transition-colors rounded-none font-bold"
                  >
                    Claim Spot
                  </Link>
                ) : spot.status === "SOLD" ? (
                  <button
                    onClick={() => onWaitlistClick({ id: spot.category.id, name: spot.label })}
                    className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-3 py-1.5 bg-press text-paper border border-press hover:bg-nh-red hover:border-nh-red transition-colors rounded-none cursor-pointer font-bold"
                  >
                    Sold (Waitlist)
                  </button>
                ) : (
                  <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-3 py-1.5 border border-press/30 text-press/30 bg-transparent rounded-none">
                    Closed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Restaurant Exclusivity Info */}
        <div className="mt-8 border border-press bg-paper p-6 space-y-4">
          <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-nh-red text-nh-red bg-transparent">
            🍽️ Restaurant & Food Exception
          </span>
          <p className="text-sm text-press/75 leading-relaxed">
            Food and dining categories (restaurants, bakeries, and coffee shops) are the one exception to our single-business category exclusivity rule. Postcard recipients respond best to a choice of dining options, which increases overall engagement and coupon usage for all advertisers on the card.
          </p>
        </div>
      </div>
    </section>
  )
}

