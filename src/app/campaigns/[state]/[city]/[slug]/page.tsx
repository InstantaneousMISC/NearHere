import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createCaller } from '@/lib/trpc/server'
import { CampaignNav } from '@/components/campaign/CampaignNav'
import CampaignHero from '@/components/campaign/CampaignHero'
import ValueProps from '@/components/campaign/ValueProps'
import CampaignStats from '@/components/campaign/CampaignStats'
import PostcardPreview from '@/components/postcard/PostcardPreview'
import CategoryAvailability from '@/components/campaign/CategoryAvailability'
import HowItWorks from '@/components/campaign/HowItWorks'
import FAQ from '@/components/campaign/FAQ'
import CampaignFooter from '@/components/campaign/CampaignFooter'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string; slug: string }>
}): Promise<Metadata> {
  const { city, state } = await params
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)
  const stateName = state.charAt(0).toUpperCase() + state.slice(1)
  return {
    title: `${cityName}, ${stateName} Local Business Postcard | LocalSpot Mailers`,
    description: `Reserve your exclusive business category on the ${cityName} local postcard. Mailed to 10,000 homes. One business per category.`,
  }
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ state: string; city: string; slug: string }>
}) {
  const { state, city, slug } = await params
  
  const caller = await createCaller()
  const campaign = await caller.campaign.getByLocation({ state, city, slug })

  if (!campaign) {
    return notFound()
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <CampaignNav state={state} city={city} slug={slug} />
      <CampaignHero
        name={campaign.name}
        city={campaign.city}
        state={campaign.state}
        mailingQuantity={campaign.mailingQuantity}
      />
      <ValueProps
        city={campaign.city}
        state={campaign.state}
      />
      <CampaignStats
        spots={campaign.spots}
        mailingQuantity={campaign.mailingQuantity}
        city={campaign.city}
      />
      <section id="postcard" className="py-24 px-4 bg-stone-bg/30 border-y border-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-extrabold text-center text-foreground mb-2 uppercase tracking-tight font-mono">
            Interactive Postcard Preview
          </h2>
          <p className="text-center text-xs font-mono uppercase tracking-wider text-muted-foreground mb-12">
            Click any available spot to reserve your category
          </p>
          <PostcardPreview
            spots={campaign.spots as any}
            state={state}
            city={city}
            slug={slug}
          />
        </div>
      </section>
      <CategoryAvailability
        spots={campaign.spots as any}
        state={state}
        city={city}
        slug={slug}
      />
      <HowItWorks
        city={campaign.city}
        state={campaign.state}
      />
      <FAQ
        city={campaign.city}
        state={campaign.state}
        mailingQuantity={campaign.mailingQuantity}
      />
      <CampaignFooter />
    </main>
  )
}
