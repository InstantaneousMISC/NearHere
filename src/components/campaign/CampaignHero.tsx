"use client"

import { useMemo } from "react"

interface CampaignHeroProps {
  name: string
  city: string
  state: string
  mailingQuantity: number
  spots: any[]
}

export default function CampaignHero({ city, state, mailingQuantity, spots }: CampaignHeroProps) {
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)
  const stateName = state.toUpperCase()

  const previewSpots = useMemo(() => {
    const frontSpots = spots.filter((spot) => spot.side === "FRONT")
    if (frontSpots.length > 0) return frontSpots.slice(0, 6)

    return Array.from({ length: 6 }).map((_, index) => ({
      id: `fallback-${index}`,
      category: {
        name: ["Plumbing", "Cafe", "Dental", "Lawn Care", "Fitness", "Real Estate"][index],
      },
      status: "OPEN",
    }))
  }, [spots])

  return (
    <section className="relative overflow-hidden border-b border-rule bg-paper text-press">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 md:py-24 lg:grid-cols-12">
        <div className="flex flex-col items-start text-left lg:col-span-7">
          <p className="label-mono">
            {cityName}, {stateName} / Estimated {mailingQuantity.toLocaleString()} Households
          </p>
          <h1 className="headline-xl mt-6 text-4xl text-press md:text-5xl lg:text-6xl leading-tight">
            Put Your Business in Front of
            <br />
            <span className="text-nh-red">{cityName} Homeowners.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-press/80">
            Reserve a spot in a premium shared postcard campaign mailed to nearby households. Every placement includes postcard exposure, a public business profile, a website backlink, a unique QR code, and basic campaign tracking.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#placements"
              className="bg-nh-red px-6 py-3 font-headline text-sm font-bold uppercase tracking-wider text-paper transition-colors hover:bg-press"
            >
              Reserve a Spot
            </a>
            <a
              href="#how"
              className="border border-press bg-transparent px-6 py-3 font-headline text-sm font-bold uppercase tracking-wider text-press transition-colors hover:bg-press hover:text-paper"
            >
              See How It Works
            </a>
          </div>
          <p className="label-mono mt-6">
            Limited Campaign Placements / Category Exclusivity Where Offered
          </p>
        </div>

        <div className="lg:col-span-5 lg:pl-8">
          <div className="transition-transform duration-500 lg:rotate-[-2deg] lg:hover:rotate-0">
            <div className="relative">
              <div className="absolute -inset-2 -z-10 translate-x-3 translate-y-3 bg-press/5" />
              <div className="flex aspect-[7/5] w-full flex-col border border-press/80 bg-paper p-5 shadow-[0_30px_60px_-30px_rgba(33,29,28,0.45)]">
                <div className="flex items-start justify-between border-b border-rule pb-3">
                  <div>
                    <div className="font-headline text-lg font-bold tracking-tight text-press">
                      Near<span className="text-nh-red">Here</span>
                    </div>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.14em] text-warm">
                      {cityName}, {stateName} / {mailingQuantity.toLocaleString()} Households
                    </p>
                  </div>
                  <span className="inline-flex border border-gold bg-gold/15 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-gold">
                    Local Campaign
                  </span>
                </div>

                <h3 className="headline-xl mt-3 text-2xl leading-[0.9] text-press md:text-3xl">
                  Local businesses,
                  <br />
                  one useful postcard.
                </h3>

                <div className="mt-3 grid flex-1 grid-cols-3 gap-1.5">
                  {previewSpots.map((spot: any) => (
                    <div
                      key={spot.id}
                      className="flex select-none flex-col justify-between border border-rule bg-paper p-1.5"
                    >
                      <p className="truncate font-mono text-[7px] uppercase tracking-widest text-warm">
                        {spot.category.name}
                      </p>
                      <p className="mt-1 truncate font-headline text-[10px] font-bold leading-tight text-press">
                        {spot.status === "SOLD" ? "Reserved" : "Available"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-rule pt-3">
                  <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-warm">
                    Scan to explore local offers
                  </p>
                  <div className="grid h-9 w-9 grid-cols-3 grid-rows-3 gap-[2px] bg-press p-[3px]">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <div key={index} className={index % 2 === 0 ? "bg-paper" : "bg-press"} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
