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
    <header className="border-b border-rule sticky top-0 bg-paper/95 backdrop-blur z-40 font-mono text-xs uppercase tracking-widest">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-headline font-bold text-2xl tracking-tight select-none">
          Near<span className="text-nh-red">Here</span>
        </Link>
        
        {isCheckoutPage ? (
          <div>
            <Link
              href={campaignPath}
              className="inline-flex items-center justify-center bg-transparent border border-press text-press font-headline text-xs uppercase font-bold tracking-wider px-4 py-2.5 rounded-none transition-colors hover:bg-press hover:text-paper"
            >
              ← Back to Campaign
            </Link>
          </div>
        ) : (
          <>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#campaign" className="hover:text-nh-red transition-colors">Current Drop</a>
              <a href="#how" className="hover:text-nh-red transition-colors">How It Works</a>
              <a href="#categories" className="hover:text-nh-red transition-colors">Categories</a>
              <a href="#pricing" className="hover:text-nh-red transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-nh-red transition-colors">FAQ</a>
            </nav>
            <div className="flex items-center">
              <a href="#categories" className="bg-nh-red text-paper px-5 py-2.5 font-headline font-bold uppercase tracking-wider text-xs hover:bg-press transition-colors">
                Reserve Spot
              </a>
            </div>
          </>
        )}
      </div>
    </header>
  )
}

