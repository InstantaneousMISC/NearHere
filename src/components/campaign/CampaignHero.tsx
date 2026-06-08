"use client"

import { PostcardMockup } from "../home/PostcardMockup"

interface CampaignHeroProps {
  name: string
  city: string
  state: string
  mailingQuantity: number
}

export default function CampaignHero({ name, city, state, mailingQuantity }: CampaignHeroProps) {
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)
  const stateName = state.charAt(0).toUpperCase() + state.slice(1)

  return (
    <header className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 font-sans bg-background border-b border-border text-center">
      <div className="mx-auto max-w-3xl px-6">
        <div className="animate-fade-up flex flex-col items-center">
          <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
            {cityName}, {stateName} • {mailingQuantity.toLocaleString()} Mailings
          </span>
          <h1 className="max-w-xl text-balance text-4xl font-extrabold leading-[1.15] tracking-tight md:text-6xl text-foreground uppercase">
            {name}
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-base leading-relaxed text-muted-foreground">
            Reach {mailingQuantity.toLocaleString()} nearby households for a fraction of Solo Mail costs. One business per category. Claim your exclusive industry slot.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#postcard"
              className="inline-flex items-center justify-center bg-foreground text-background border border-foreground px-8 py-4 text-xs font-bold tracking-widest transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary cursor-pointer uppercase"
            >
              Reserve Your Category
            </a>
            <a
              href="#categories"
              className="inline-flex items-center justify-center bg-background text-foreground border border-foreground px-8 py-4 text-xs font-bold tracking-widest transition-colors hover:bg-foreground hover:text-background cursor-pointer uppercase"
            >
              View Availability
            </a>
          </div>

          <p className="mt-4 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
            ⚡ Category exclusivity — once your industry is taken, it's gone for this mailing.
          </p>
        </div>
      </div>
    </header>
  )
}
