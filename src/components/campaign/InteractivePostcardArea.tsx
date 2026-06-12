"use client"

import { useState } from "react"
import PostcardPreview from "@/components/postcard/PostcardPreview"
import WaitlistModal from "./WaitlistModal"
import ReservationModal, {
  type ReservationPlan,
  type ReservationSpot,
} from "./ReservationModal"
import ReservationSection from "./ReservationSection"

interface InteractivePostcardAreaProps {
  spots: any[]
  state: string
  city: string
  slug: string
  campaignId: string
  zipCode: string
  cardSize: string
  cardSkin: string
  mailingQuantity?: number
}

export default function InteractivePostcardArea({
  spots,
  state,
  city,
  slug,
  campaignId,
  zipCode,
  cardSize,
  cardSkin,
  mailingQuantity = 10000,
}: InteractivePostcardAreaProps) {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<{ id: string; name: string } | null>(null)
  const [reservationPlan, setReservationPlan] =
    useState<ReservationPlan | null>(null)
  const [reservationSpot, setReservationSpot] =
    useState<ReservationSpot | null>(null)

  const handleOpenWaitlist = (category: { id: string; name: string }) => {
    setSelectedCategory(category)
    setIsWaitlistOpen(true)
  }

  const handleOpenReservation = (
    plan: ReservationPlan,
    spot: ReservationSpot | null
  ) => {
    setReservationPlan(plan)
    setReservationSpot(spot)
  }

  const handleSpotReservation = (spot: ReservationSpot) => {
    const price = spot.price / 100
    const plan: ReservationPlan = {
      key: `spot-${spot.id}`,
      name:
        spot.spotType === "PREMIUM"
          ? "Premium Center Back"
          : `${spot.side === "FRONT" ? "Front" : "Back"} ${
              spot.spotType === "LARGE" ? "Double" : "Standard"
            }`,
      price,
      description: spot.label,
      costPerHome: `${((price * 100) / mailingQuantity).toFixed(
        1
      )} cents per home`,
    }
    handleOpenReservation(plan, spot)
  }

  return (
    <>
      <ReservationSection
        cardSize={cardSize}
        mailingQuantity={mailingQuantity}
        spots={spots}
        onSelect={handleOpenReservation}
      />

      <section id="postcard" className="py-24 px-4 bg-stone-bg/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-foreground mb-2 uppercase tracking-tight font-mono">
            Interactive Postcard Preview
          </h2>
          <p className="text-center text-xs font-mono uppercase tracking-wider text-muted-foreground mb-12">
            Preview available postcard placements. Choose a spot above or click an available placement to reserve.
          </p>
          <PostcardPreview
            spots={spots}
            state={state}
            city={city}
            slug={slug}
            onWaitlistClick={handleOpenWaitlist}
            onReserveSpot={handleSpotReservation}
            cardSize={cardSize}
            cardSkin={cardSkin}
          />
        </div>
      </section>

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        category={selectedCategory}
        campaignId={campaignId}
        zipCode={zipCode || ""}
      />

      <ReservationModal
        isOpen={Boolean(reservationPlan)}
        onClose={() => {
          setReservationPlan(null)
          setReservationSpot(null)
        }}
        plan={reservationPlan}
        spot={reservationSpot}
        spots={spots}
        campaignId={campaignId}
        zipCode={zipCode || ""}
        checkoutBaseUrl={`/campaigns/${state.toLowerCase()}/${city.toLowerCase()}/${slug.toLowerCase()}/checkout`}
      />
    </>
  )
}
