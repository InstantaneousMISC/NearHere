"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import SpotOverlay from "./SpotOverlay"

interface PostcardSpot {
  id: string
  label: string
  side: "FRONT" | "BACK"
  spotType: "PREMIUM" | "LARGE" | "STANDARD" | "SMALL"
  price: number // cents
  x: number
  y: number
  width: number
  height: number
  status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
}

interface PostcardPreviewProps {
  spots: PostcardSpot[]
  state: string
  city: string
  slug: string
}

export default function PostcardPreview({ spots, state, city, slug }: PostcardPreviewProps) {
  const router = useRouter()
  const [activeSide, setActiveSide] = useState<"FRONT" | "BACK">("FRONT")

  const activeSpots = spots.filter(s => s.side === activeSide)

  const handleSpotClick = (spotId: string) => {
    router.push(`/campaigns/${state.toLowerCase()}/${city.toLowerCase()}/${slug.toLowerCase()}/checkout/${spotId}`)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Side Selector Tabs */}
      <div className="flex justify-center">
        <div className="border border-foreground bg-card p-1 flex gap-1 font-mono text-[10px] uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setActiveSide("FRONT")}
            className={`px-5 py-2 font-bold transition-all cursor-pointer ${
              activeSide === "FRONT"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            }`}
          >
            Front Side (Premium)
          </button>
          <button
            type="button"
            onClick={() => setActiveSide("BACK")}
            className={`px-5 py-2 font-bold transition-all cursor-pointer ${
              activeSide === "BACK"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground bg-transparent"
            }`}
          >
            Back Side (Standard)
          </button>
        </div>
      </div>

      {/* 12:9 aspect ratio postcard mock */}
      <div className="relative w-full aspect-[12/9] bg-card border border-border shadow-2xl overflow-hidden p-[2%]">
        {/* Postcard Background Mock Design */}
        <div className="absolute inset-0 bg-background -z-10" />

        {/* Header section (only occupying top ~12% of the card) */}
        <div className="h-[12%] flex items-center justify-between px-3 border-b border-dashed border-border pb-2 mb-2 select-none">
          <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold uppercase italic tracking-tighter">
            <span className="bg-primary px-1.5 py-0.5 text-primary-foreground text-[10px] md:text-xs">Shared</span>
            <span className="text-foreground text-[10px] md:text-xs">Mail</span>
            <span className="font-mono text-[9px] md:text-[10px] text-muted-foreground not-italic tracking-normal uppercase pl-2">
              {activeSide === "FRONT" ? "Front Side" : "Back Side"}
            </span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest">
            <span>USPS EDDM Delivery</span>
            <span className="hidden sm:inline">•</span>
            <span>10,000 Mailings</span>
          </div>
        </div>

        {/* Spots grid wrapper */}
        <div className="relative w-full h-[84%] bg-background rounded-none border border-dashed border-border p-1">
          {activeSpots.map(spot => (
            <SpotOverlay
              key={spot.id}
              label={spot.label}
              price={spot.price}
              status={spot.status}
              spotType={spot.spotType}
              x={spot.x}
              y={spot.y}
              width={spot.width}
              height={spot.height}
              onClick={() => handleSpotClick(spot.id)}
            />
          ))}
        </div>

        {/* Footer info (subtle small stamp indicator) */}
        <div className="absolute bottom-2 right-4 flex items-center gap-2 text-[8px] md:text-[9px] text-muted-foreground font-mono uppercase tracking-widest select-none">
          <span>Powered by LocalSpot Mailers</span>
          <div className="w-4 h-4 border border-dashed border-border flex items-center justify-center font-normal">
            📬
          </div>
        </div>
      </div>
    </div>
  )
}
