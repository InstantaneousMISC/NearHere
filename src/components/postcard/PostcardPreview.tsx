"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import SharedCard9x12 from "./SharedCard9x12"
import CommunityCard6x11 from "./CommunityCard6x11"

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
  sortOrder: number
  status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
  categoryId: string
  category: {
    id: string
    name: string
  }
}

interface PostcardPreviewProps {
  spots: PostcardSpot[]
  state: string
  city: string
  slug: string
  onWaitlistClick: (category: { id: string; name: string }) => void
  onReserveSpot?: (spot: PostcardSpot) => void
  cardSize?: string
  cardSkin?: string
}

export default function PostcardPreview({
  spots,
  state,
  city,
  slug,
  onWaitlistClick,
  onReserveSpot,
  cardSize = "9x12",
  cardSkin = "cream"
}: PostcardPreviewProps) {
  const router = useRouter()
  const [activeSide, setActiveSide] = useState<"FRONT" | "BACK">("FRONT")
  const sharedCardFrameRef = useRef<HTMLDivElement>(null)
  const [sharedCardScale, setSharedCardScale] = useState(1)

  const cityName = city.charAt(0).toUpperCase() + city.slice(1)
  const stateName = state.charAt(0).toUpperCase() + state.slice(1)

  // Extract mailing quantity if available
  const campaignRecord = spots.length > 0 ? (spots[0] as any).campaign : null
  const quantity = campaignRecord?.mailingQuantity ?? 10000
  const homesCount = `${new Intl.NumberFormat().format(quantity)} HOMES`

  useEffect(() => {
    if (cardSize === "6x11") return

    const frame = sharedCardFrameRef.current
    if (!frame) return

    const updateScale = () => {
      setSharedCardScale(Math.min(frame.clientWidth / 1200, 1))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(frame)

    return () => observer.disconnect()
  }, [cardSize])

  const handleSpotClick = (spot: PostcardSpot) => {
    if (spot.status === "SOLD") {
      onWaitlistClick({ id: spot.category.id, name: spot.category.name })
    } else if (spot.status === "OPEN" || spot.status === "HELD") {
      if (onReserveSpot) {
        onReserveSpot(spot)
      } else {
        router.push(`/campaigns/${state.toLowerCase()}/${city.toLowerCase()}/${slug.toLowerCase()}/checkout/${spot.id}`)
      }
    }
  }

  return (
    <div
      id="preview"
      className={`mx-auto w-full space-y-6 ${
        cardSize === "6x11" ? "max-w-4xl" : "max-w-[1200px]"
      }`}
    >
      {/* Side Selector Tabs */}
      <div className="flex justify-center">
        <div className="border border-press bg-paper p-1 flex gap-1 font-mono text-[10px] uppercase tracking-wider font-bold">
          <button
            type="button"
            onClick={() => setActiveSide("FRONT")}
            className={`px-5 py-2 transition-all cursor-pointer rounded-none ${
              activeSide === "FRONT"
                ? "bg-press text-paper"
                : "text-warm hover:text-press bg-transparent"
            }`}
          >
            Front Side (Premium)
          </button>
          <button
            type="button"
            onClick={() => setActiveSide("BACK")}
            className={`px-5 py-2 transition-all cursor-pointer rounded-none ${
              activeSide === "BACK"
                ? "bg-press text-paper"
                : "text-warm hover:text-press bg-transparent"
            }`}
          >
            Back Side (Mailing & Standard)
          </button>
        </div>
      </div>

      {cardSize === "6x11" ? (
        <div className="w-full overflow-x-auto pb-4 md:overflow-x-visible">
          <div className="min-w-[700px] md:min-w-0">
            <CommunityCard6x11
              view={activeSide === "FRONT" ? "front" : "back"}
              locationLabel={`${cityName.toUpperCase()}, ${stateName.toUpperCase()}`}
              homesCount={homesCount}
              spots={spots}
              onSpotClick={handleSpotClick}
              cardSkin={cardSkin}
            />
          </div>
        </div>
      ) : (
        <div
          ref={sharedCardFrameRef}
          className="relative w-full overflow-hidden"
          style={{ height: `${900 * sharedCardScale}px` }}
        >
          <div
            className="absolute left-0 top-0 h-[900px] w-[1200px] origin-top-left"
            style={{ transform: `scale(${sharedCardScale})` }}
          >
            <SharedCard9x12
              view={activeSide === "FRONT" ? "front" : "back"}
              locationLabel={`${cityName.toUpperCase()}, ${stateName.toUpperCase()}`}
              homesCount={homesCount}
              spots={spots}
              onSpotClick={handleSpotClick}
              cardSkin={cardSkin}
            />
          </div>
        </div>
      )}
    </div>
  )
}
