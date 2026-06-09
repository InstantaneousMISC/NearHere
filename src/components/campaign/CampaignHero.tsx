"use client"

import { useMemo } from "react"

interface CampaignHeroProps {
  name: string
  city: string
  state: string
  mailingQuantity: number
  spots: any[]
}

export default function CampaignHero({ name, city, state, mailingQuantity, spots }: CampaignHeroProps) {
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)
  const stateName = state.charAt(0).toUpperCase() + state.slice(1)

  // Filter FRONT side spots for the preview grid (take up to 6)
  const previewSpots = useMemo(() => {
    const frontSpots = spots.filter(s => s.side === "FRONT")
    if (frontSpots.length > 0) {
      return frontSpots.slice(0, 6)
    }
    // Fallback if no spots
    return Array.from({ length: 6 }).map((_, i) => ({
      id: `fallback-${i}`,
      category: { name: ["Plumbing", "Cafe", "Dental", "Lawn Care", "Fitness", "Real Estate"][i] },
      status: "OPEN"
    }))
  }, [spots])

  return (
    <section className="border-b border-rule relative overflow-hidden bg-paper text-press">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          <p className="label-mono">{cityName}, {stateName} • {mailingQuantity.toLocaleString()} Homes • Drop #001</p>
          <h1 className="headline-xl text-5xl md:text-6xl lg:text-7xl mt-6 text-press">
            Support local.<br/>
            <span className="text-nh-red">Discover nearby.</span>
          </h1>
          <p className="mt-8 text-lg text-press/80 max-w-xl leading-relaxed">
            NearHere helps local businesses get discovered in {cityName} through curated neighborhood postcard campaigns featuring services, venues, events, offers, and happenings nearby.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <a 
              href="#categories" 
              className="bg-nh-red text-paper px-6 py-3 font-headline font-bold uppercase tracking-wider text-sm hover:bg-press transition-colors rounded-none"
            >
              Reserve Featured Space
            </a>
            <a 
              href="#preview" 
              className="bg-transparent border border-press text-press px-6 py-3 font-headline font-bold uppercase tracking-wider text-sm hover:bg-press hover:text-paper transition-colors rounded-none"
            >
              Preview the Postcard
            </a>
          </div>
          <p className="label-mono mt-6">Limited Featured Spaces • One Business Per Category</p>
        </div>

        <div className="lg:col-span-5 lg:pl-8">
          <div className="lg:rotate-[-2deg] lg:hover:rotate-0 transition-transform duration-500">
            {/* Miniature Postcard Front Mock */}
            <div className="relative">
              <div className="absolute -inset-2 bg-press/5 -z-10 translate-x-3 translate-y-3" />
              <div className="bg-paper border border-press/80 shadow-[0_30px_60px_-30px_rgba(33,29,28,0.45)] aspect-[7/5] w-full p-5 flex flex-col">
                <div className="flex items-start justify-between border-b border-rule pb-3">
                  <div>
                    <div className="font-headline font-bold text-lg tracking-tight text-press">
                      Near<span className="text-nh-red">Here</span>
                    </div>
                    <p className="font-mono uppercase tracking-[0.14em] text-[8px] text-warm mt-1">{cityName}, {stateName} • {mailingQuantity.toLocaleString()} Homes</p>
                  </div>
                  <span className="inline-flex items-center font-mono text-[9px] uppercase tracking-[0.12em] px-2 py-1 bg-gold/15 text-gold border border-gold">Drop #001</span>
                </div>

                <h3 className="headline-xl text-2xl md:text-3xl mt-3 leading-[0.9] text-press">
                  What's nearby,<br/>on one postcard.
                </h3>

                <div className="grid grid-cols-3 gap-1.5 mt-3 flex-1">
                  {previewSpots.map((spot: any) => (
                    <div key={spot.id} className="border border-rule p-1.5 flex flex-col justify-between bg-paper select-none">
                      <p className="font-mono text-[7px] uppercase tracking-widest text-warm truncate">{spot.category.name}</p>
                      <p className="font-headline font-bold text-[10px] leading-tight mt-1 text-press truncate">
                        {spot.status === "SOLD" ? "Reserved" : "Available"}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-rule pt-3 mt-3">
                  <p className="font-mono uppercase tracking-[0.14em] text-[8px] text-warm">Scan to explore local page</p>
                  <div className="w-9 h-9 bg-press grid grid-cols-3 grid-rows-3 gap-[2px] p-[3px]">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className={i % 2 === 0 ? "bg-paper" : "bg-press"} />
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

