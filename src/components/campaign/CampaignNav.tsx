"use client"

import Link from "next/link"

interface CampaignNavProps {
  state?: string
  city?: string
  slug?: string
  isCheckoutPage?: boolean
}

export function CampaignNav({ state, city, slug, isCheckoutPage = false }: CampaignNavProps) {
  const campaignPath = state && city && slug 
    ? `/campaigns/${state.toLowerCase()}/${city.toLowerCase()}/${slug.toLowerCase()}`
    : "/"

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md font-sans">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold uppercase italic tracking-tighter select-none">
          <span className="bg-primary px-1.5 py-0.5 text-primary-foreground">Shared</span>
          <span className="text-foreground">Mail</span>
        </Link>
        
        {isCheckoutPage ? (
          <div>
            <Link
              href={campaignPath}
              className="inline-flex items-center justify-center bg-stone-bg hover:bg-stone-bg/85 border border-border text-foreground font-mono text-[10px] uppercase font-bold tracking-widest px-4 py-2.5 rounded-none transition-colors"
            >
              ← Back to Campaign
            </Link>
          </div>
        ) : (
          <div className="hidden items-center gap-8 text-sm font-medium md:flex">
            <a href="#postcard" className="transition-colors hover:text-primary">Postcard Preview</a>
            <a href="#categories" className="transition-colors hover:text-primary">Availability</a>
            <a href="#how" className="transition-colors hover:text-primary">How it Works</a>
            <a href="#faq" className="transition-colors hover:text-primary">FAQs</a>
            <a href="#postcard" className="bg-foreground px-5 py-2.5 text-background font-bold transition-all hover:bg-primary hover:text-primary-foreground uppercase tracking-wider text-xs">
              Reserve Spot
            </a>
          </div>
        )}
      </div>
    </nav>
  )
}
