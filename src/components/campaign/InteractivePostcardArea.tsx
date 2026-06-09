"use client"

import { useState } from "react"
import PostcardPreview from "@/components/postcard/PostcardPreview"
import CategoryAvailability from "./CategoryAvailability"
import WaitlistModal from "./WaitlistModal"

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

  const handleOpenWaitlist = (category: { id: string; name: string }) => {
    setSelectedCategory(category)
    setIsWaitlistOpen(true)
  }

  return (
    <>
      <section id="postcard" className="py-24 px-4 bg-stone-bg/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-foreground mb-2 uppercase tracking-tight font-mono">
            Interactive Postcard Preview
          </h2>
          <p className="text-center text-xs font-mono uppercase tracking-wider text-muted-foreground mb-12">
            Click any available spot to reserve, or click sold spots to join the waitlist
          </p>
          <PostcardPreview
            spots={spots}
            state={state}
            city={city}
            slug={slug}
            onWaitlistClick={handleOpenWaitlist}
            cardSize={cardSize}
            cardSkin={cardSkin}
          />
        </div>
      </section>

      <CategoryAvailability
        spots={spots}
        state={state}
        city={city}
        slug={slug}
        onWaitlistClick={handleOpenWaitlist}
        mailingQuantity={mailingQuantity}
      />

      <WaitlistModal
        isOpen={isWaitlistOpen}
        onClose={() => setIsWaitlistOpen(false)}
        category={selectedCategory}
        campaignId={campaignId}
        zipCode={zipCode || ""}
      />
    </>
  )
}
