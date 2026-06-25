import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createCaller } from '@/lib/trpc/server'
import { CampaignNav } from '@/components/campaign/CampaignNav'
import CampaignHero from '@/components/campaign/CampaignHero'
import ValueProps from '@/components/campaign/ValueProps'
import InteractivePostcardArea from '@/components/campaign/InteractivePostcardArea'
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
    title: `NearHere ${cityName}, ${stateName} Shared Postcard Campaign`,
    description: `Reserve a featured placement in the ${cityName} NearHere shared postcard campaign with a unique QR destination and managed mailing.`,
  }
}

export default async function CampaignPage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string; city: string; slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { state, city, slug } = await params
  const { offer: offerToken } = await searchParams
  
  const caller = await createCaller()
  const campaign = await caller.campaign.getByLocation({ state, city, slug })

  if (!campaign) {
    return notFound()
  }

  // Fetch offer if token is provided
  let offer = null
  if (typeof offerToken === "string") {
    const { db } = await import("@/server/db")
    offer = await db.campaignOffer.findUnique({
      where: { token: offerToken },
      include: {
        adminUser: {
          select: { name: true, email: true },
        },
      },
    })
  }

  const cityName = campaign.city.charAt(0).toUpperCase() + campaign.city.slice(1)
  const stateName = campaign.state.charAt(0).toUpperCase() + campaign.state.slice(1)
  const mailingQuantity = campaign.mailingQuantity

  const mailWindow = campaign.estimatedMailDate 
    ? new Date(campaign.estimatedMailDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : "Late 2026"

  return (
    <main className="min-h-screen bg-paper text-press">
      {/* Promo Banner */}
      {offer && (
        <div className="bg-emerald-600 text-white py-3.5 px-6 font-sans border-b border-emerald-700 shadow-inner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="font-bold text-sm tracking-wide uppercase">
                Special Rep Offer Applied: {offer.name}
              </p>
              <p className="text-xs text-white/90 mt-0.5 font-medium">
                Attributed to representative{" "}
                <span className="font-bold underline">
                  {offer.adminUser.name || "NearHere Representative"}
                </span>{" "}
                • Select an available placement below to secure your discount.
              </p>
            </div>
            <div className="bg-white/15 border border-white/25 px-3 py-1 rounded-full text-[10px] font-mono tracking-wider uppercase font-bold text-white shrink-0">
              {offer.discountType === "AMOUNT_OFF"
                ? `$${((offer.discountAmount || 0) / 100).toFixed(0)} Off`
                : `${offer.discountPercent}% Off`}
            </div>
          </div>
        </div>
      )}

      {/* Announcement Bar */}
      <div className="bg-press text-paper">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-paper/85">
            Now reserving spots for the {cityName} local mailer • Limited placements available
          </p>
          <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-gold">
            Postcard placement + QR tracking + business profile + website backlink + printing and mailing included
          </p>
        </div>
      </div>

      <CampaignNav state={state} city={city} slug={slug} />

      <CampaignHero
        name={campaign.name}
        city={campaign.city}
        state={campaign.state}
        mailingQuantity={campaign.mailingQuantity}
        spots={campaign.spots}
      />

      {/* Campaign Snapshot */}
      <section className="bg-muted/40 border-b border-rule" id="campaign">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="border border-press bg-paper">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-press px-8 py-5">
              <h3 className="headline-xl text-2xl md:text-3xl text-press">{cityName} Campaign Snapshot</h3>
              <p className="label-mono">Limited spots remaining</p>
            </div>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rule border-b border-press">
              {[
                ["Target Area", `${cityName}, ${stateName} / selected routes`],
                ["Estimated Reach", `${mailingQuantity.toLocaleString()} households`],
                ["Mail Window", mailWindow],
                ["Format", `Premium ${campaign.cardSize || "9x12"} shared postcard`],
                ["Included Assets", "QR tracking + business profile + website backlink"],
                ["Availability", "Category exclusivity / Limited spots"],
              ].map(([k, v]) => (
                <div key={k} className="px-8 py-6 text-left">
                  <p className="label-mono">{k}</p>
                  <p className="mt-2 font-headline font-bold text-xl text-press">{v}</p>
                </div>
              ))}
            </div>
            <div className="px-8 py-5 flex flex-wrap justify-between items-center gap-3 bg-paper border-b border-press">
              <p className="text-[10px] text-warm font-medium">
                * Final reach may vary based on USPS carrier route availability and campaign setup.
              </p>
              <a href="#placements" className="bg-transparent border border-press text-press px-5 py-2 font-headline font-bold uppercase tracking-wider text-xs hover:bg-press hover:text-paper transition-colors rounded-none">
                Reserve your spot
              </a>
            </div>
            <div className="px-8 py-4 bg-[#F1ECE3]/30 text-left border-t-0">
              <p className="text-xs text-press/80 font-mono uppercase tracking-wider font-semibold">
                Not ready to book online?{" "}
                <Link
                  href={`/campaigns/${state.toLowerCase()}/${city.toLowerCase()}/${slug.toLowerCase()}/contact`}
                  className="underline text-nh-red hover:text-press transition-colors font-bold"
                >
                  Contact us and we’ll help you get set up →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <ValueProps
        city={campaign.city}
        state={campaign.state}
      />

      {/* Interactive Placements & Postcard Preview Area */}
      <InteractivePostcardArea
        spots={campaign.spots as any}
        state={state}
        city={city}
        slug={slug}
        campaignId={campaign.id}
        zipCode={campaign.zipCode || ""}
        cardSize={campaign.cardSize}
        cardSkin={campaign.cardSkin}
        mailingQuantity={campaign.mailingQuantity}
        offer={offer}
      />

      {/* How It Works */}
      <HowItWorks
        city={campaign.city}
        state={campaign.state}
      />

      {/* FAQ */}
      <FAQ
        city={campaign.city}
        state={campaign.state}
        mailingQuantity={campaign.mailingQuantity}
      />

      {/* Final CTA */}
      <section className="bg-press text-paper py-20 text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <h2 className="headline-xl text-3xl md:text-5xl uppercase">Ready to get seen in {cityName}?</h2>
          <p className="max-w-xl mx-auto text-sm md:text-base text-paper/85 leading-relaxed font-medium">
            Get mailed, get scanned, get found. Reserve your placement in the {cityName} campaign before spots close.
          </p>
          <div className="pt-4 flex flex-col items-center gap-4">
            <a href="#placements" className="inline-block bg-[#D13F1F] hover:bg-[#B53A1A] text-paper border border-[#211D1C] font-bold tracking-wider uppercase text-xs px-8 py-4 transition-colors font-headline">
              Reserve a Spot
            </a>
            <p className="text-xs text-paper/70 font-mono uppercase tracking-wider">
              Not ready to book online?{" "}
              <Link
                href={`/campaigns/${state.toLowerCase()}/${city.toLowerCase()}/${slug.toLowerCase()}/contact`}
                className="underline text-gold hover:text-white transition-colors"
              >
                Contact us and we’ll help you get set up
              </Link>
            </p>
          </div>
        </div>
      </section>

      <CampaignFooter />
    </main>
  )
}
