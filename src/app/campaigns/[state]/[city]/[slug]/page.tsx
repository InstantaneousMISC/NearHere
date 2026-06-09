import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createCaller } from '@/lib/trpc/server'
import { CampaignNav } from '@/components/campaign/CampaignNav'
import CampaignHero from '@/components/campaign/CampaignHero'
import ValueProps from '@/components/campaign/ValueProps'
import CampaignStats from '@/components/campaign/CampaignStats'
import InteractivePostcardArea from '@/components/campaign/InteractivePostcardArea'
import HowItWorks from '@/components/campaign/HowItWorks'
import FAQ from '@/components/campaign/FAQ'
import CampaignFooter from '@/components/campaign/CampaignFooter'
import { TEMPLATE_1_PRICING } from '@/lib/nearHereSharedCard9x12'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string; city: string; slug: string }>
}): Promise<Metadata> {
  const { city, state } = await params
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)
  const stateName = state.charAt(0).toUpperCase() + state.slice(1)
  return {
    title: `NearHere ${cityName}, ${stateName} — Curated Neighborhood Postcard Drop`,
    description: `Reserve your exclusive business category on the ${cityName} neighborhood discovery postcard. Mailed to 10,000 homes. One business per category.`,
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

  const cityName = campaign.city.charAt(0).toUpperCase() + campaign.city.slice(1)
  const stateName = campaign.state.charAt(0).toUpperCase() + campaign.state.slice(1)
  const mailingQuantity = campaign.mailingQuantity
  const isTemplate1 = campaign.cardSize === "9x12"
  const pricingPlans = isTemplate1
    ? [
        {
          name: "Front Standard",
          price: `$${TEMPLATE_1_PRICING.frontStandard.toLocaleString()}`,
          badge: null,
          desc: "230px x 265px front placement in the Premium Grid.",
          items: ["4.9 cents per home", "Unique advertiser QR", "Category exclusivity"],
          cta: "Reserve Front",
          href: "#categories",
        },
        {
          name: "Back Standard",
          price: `$${TEMPLATE_1_PRICING.backStandard.toLocaleString()}`,
          badge: null,
          desc: "Larger 275px back placement above or below the mailing row.",
          items: ["5.9 cents per home", "Larger advertiser area", "Unique advertiser QR"],
          cta: "Reserve Back",
          href: "#categories",
        },
        {
          name: "Front Double",
          price: `$${TEMPLATE_1_PRICING.frontDouble.toLocaleString()}`,
          badge: null,
          desc: "Two adjacent front positions within one advertiser group.",
          items: ["9.5 cents per home", "472px wide creative", "Same-row placement"],
          cta: "Reserve Double",
          href: "#categories",
        },
        {
          name: "Back Double",
          price: `$${TEMPLATE_1_PRICING.backDouble.toLocaleString()}`,
          badge: null,
          desc: "Two adjacent back positions in a valid top or bottom pair.",
          items: ["10.9 cents per home", "562px wide creative", "Same-row placement"],
          cta: "Reserve Double",
          href: "#categories",
        },
        {
          name: "Premium Center Back",
          price: `$${TEMPLATE_1_PRICING.premiumCenterBack.toLocaleString()}`,
          badge: "Best Placement",
          desc: "The largest paid placement centered beside the mailing panel.",
          items: ["14.9 cents per home", "480px x 326px creative", "Highest-value back position"],
          cta: "Reserve Premium",
          href: "#categories",
        },
      ]
    : [
        {
          name: "Standard Feature",
          price: "$295",
          badge: null,
          desc: "One featured card on the next NearHere Drop.",
          items: ["Featured postcard space", "QR to local page", `${mailingQuantity.toLocaleString()} nearby homes`, "Category exclusivity"],
          cta: "Reserve Category",
          href: "#categories",
        },
        {
          name: "Premium Feature",
          price: "$495",
          badge: "Most Popular",
          desc: "Larger placement plus digital follow-up.",
          items: ["2× postcard space", "Priority grid position", "NearHere Local Page", "Engagement reporting"],
          cta: "Reserve Premium",
          href: "#categories",
        },
        {
          name: "Annual Partner",
          price: "$2,400",
          badge: null,
          desc: "Year-round category lock across all drops.",
          items: ["Reserved for 12 months", "All drops included", "Dedicated local page", "Priority on new areas"],
          cta: "Talk to Us",
          href: "#categories",
        },
      ]

  return (
    <main className="min-h-screen bg-paper text-press">
      {/* Announcement Bar */}
      <div className="bg-press text-paper">
        <div className="max-w-7xl mx-auto px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-paper/80">
            Now Reserving • {cityName}, {stateName} Drop • Ships 2026
          </p>
          <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-gold">
            One Spot Per Category Exclusive
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

      {/* Active Campaign Info Header Card */}
      <section className="bg-muted/40 border-b border-rule" id="campaign">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="border border-press bg-paper">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-press px-8 py-5">
              <h3 className="headline-xl text-2xl md:text-3xl text-press">{cityName} 10K NearHere Drop</h3>
              <div className="flex gap-2">
                <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-gold text-gold bg-transparent">
                  Community-First Campaign
                </span>
                <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-press text-press bg-transparent">
                  Drop #001
                </span>
              </div>
            </div>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rule">
              {[
                ["Target Area", `${cityName}, ${stateName}`],
                ["Coverage", `${mailingQuantity.toLocaleString()} nearby homes`],
                ["Format", "Curated discovery postcard"],
                ["Exclusivity", "One business per category"],
                ["Availability", "Limited featured spaces"],
                ["Promise", "Support local. Discover nearby."],
              ].map(([k, v]) => (
                <div key={k} className="px-8 py-6">
                  <p className="label-mono">{k}</p>
                  <p className="mt-2 font-headline font-bold text-xl text-press">{v}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-press px-8 py-5 flex flex-wrap justify-between items-center gap-3 bg-paper">
              <p className="label-mono">Limited positions left • Reservations close soon</p>
              <a href="#categories" className="bg-transparent border border-press text-press px-5 py-2 font-headline font-bold uppercase tracking-wider text-xs hover:bg-press hover:text-paper transition-colors rounded-none">
                View Available Categories
              </a>
            </div>
          </div>
        </div>
      </section>

      <ValueProps
        city={campaign.city}
        state={campaign.state}
      />

      {/* For Businesses / Residents */}
      <section className="border-t border-rule bg-paper text-press">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-0 border-x border-rule">
          <div className="p-10 border-r border-rule flex flex-col justify-between items-start bg-paper">
            <div>
              <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-gold text-gold bg-transparent">
                For Local Businesses
              </span>
              <h3 className="headline-xl text-3xl md:text-4xl mt-6 text-press">Get discovered by nearby households.</h3>
              <p className="mt-5 text-press/75 leading-relaxed text-sm">
                Reserve featured postcard space in a neighborhood drop designed to help residents discover and support businesses around them. Each drop is limited, and only one business per category can be featured.
              </p>
            </div>
            <div className="mt-8">
              <a href="#categories" className="bg-nh-red text-paper px-6 py-3 font-headline font-bold uppercase tracking-wider text-sm hover:bg-press transition-colors rounded-none">
                Reserve Featured Space
              </a>
            </div>
          </div>
          <div className="p-10 bg-press text-paper flex flex-col justify-between items-start">
            <div>
              <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-paper/40 text-paper/85">
                For Residents
              </span>
              <h3 className="headline-xl text-3xl md:text-4xl mt-6 text-paper">A quick snapshot of what's nearby.</h3>
              <p className="mt-5 text-paper/75 leading-relaxed text-sm">
                NearHere postcards help residents discover local services, venues, offers, events, and community happenings right from their mailbox.
              </p>
            </div>
            <div className="mt-8">
              <a href="#preview" className="bg-paper text-press px-6 py-3 font-headline font-bold uppercase tracking-wider text-sm hover:bg-nh-red hover:text-paper transition-colors rounded-none">
                Preview the Postcard
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Works */}
      <section className="border-t border-rule bg-press text-paper border-press">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <p className="font-mono uppercase tracking-[0.14em] text-[11px] text-paper/60">Why It Works</p>
          <h2 className="headline-xl text-4xl md:text-5xl mt-4 max-w-3xl text-paper">A better way to show up in the mailbox.</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-px bg-paper/10 border border-paper/10">
            {[
              ["Curated, not cluttered", "A clean editorial postcard format — never junk mail."],
              ["Delivered nearby", `Mailed directly to households in the target ${cityName} neighborhood.`],
              ["One per category", "Exclusive featured placement keeps every spot valuable."],
              ["Built for discovery", "Designed so residents quickly find local options."],
              ["Made for small business", "Affordable, community-first local visibility."],
              ["QR-ready", "Connects to a digital local page for follow-up and tracking."],
            ].map(([t, d]) => (
              <div key={t} className="bg-press p-8 text-left">
                <h4 className="font-headline font-bold uppercase tracking-wide text-lg text-paper">{t}</h4>
                <p className="mt-3 text-paper/70 leading-relaxed text-sm">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CampaignStats
        spots={campaign.spots}
        mailingQuantity={campaign.mailingQuantity}
        city={campaign.city}
      />

      {/* Testimonial */}
      <section className="border-t border-rule bg-paper text-press">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <p className="label-mono">From a Featured Business</p>
          <blockquote className="headline-xl text-3xl md:text-5xl mt-8 leading-[1.05] text-press">
            "It felt less like advertising and more like being introduced to the neighborhood. We had calls the week the cards landed."
          </blockquote>
          <div className="mt-8 inline-flex flex-col items-center">
            <p className="font-headline font-bold text-lg text-press">Maria Rivera</p>
            <p className="label-mono mt-1">Rivera & Sons Plumbing • {cityName}, {stateName}</p>
          </div>
        </div>
      </section>
      
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
      />

      {/* Pricing / Reservation Section */}
      <section className="border-t border-rule bg-paper text-press" id="pricing">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <p className="label-mono">Reservation</p>
            <h2 className="headline-xl text-4xl md:text-5xl mt-4 font-bold">Simple, transparent featured space.</h2>
            <p className="mt-4 text-press/70 max-w-xl mx-auto text-sm">One price per category, per drop. No hidden fees. No long contracts.</p>
          </div>
          <div className={`grid border border-rule bg-paper ${isTemplate1 ? "gap-px bg-rule md:grid-cols-2 xl:grid-cols-5" : "md:grid-cols-3"}`}>
            {pricingPlans.map((p, i) => (
              <div key={p.name} className={`p-8 bg-paper ${!isTemplate1 && i !== 2 ? "md:border-r border-rule" : ""} ${(!isTemplate1 && i === 1) || (isTemplate1 && i === 4) ? "bg-muted/40" : ""} ${isTemplate1 ? "" : "border-b md:border-b-0 last:border-b-0"} flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="headline-xl text-2xl text-press">{p.name}</h3>
                    {p.badge && (
                      <span className="inline-flex items-center font-mono text-[8px] uppercase tracking-[0.14em] px-2 py-1 bg-gold/15 text-gold border border-gold">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="headline-xl text-5xl text-press">{p.price}</span>
                    <span className="label-mono">per drop</span>
                  </div>
                  <p className="mt-3 text-press/70 text-sm leading-relaxed">{p.desc}</p>
                  <ul className="mt-6 space-y-2 text-sm text-press/80 text-left">
                    {p.items.map((it) => (
                      <li key={it} className="flex gap-3">
                        <span className="text-nh-red font-bold">→</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-8">
                  {(!isTemplate1 && i === 1) || (isTemplate1 && i === 4) ? (
                    <a
                      href={p.href}
                      className="w-full inline-flex items-center justify-center bg-nh-red text-paper px-6 py-3 font-headline font-bold uppercase tracking-wider text-sm hover:bg-press transition-colors rounded-none"
                    >
                      {p.cta}
                    </a>
                  ) : (
                    <a
                      href={p.href}
                      className="w-full inline-flex items-center justify-center border border-press text-press px-6 py-3 font-headline font-bold uppercase tracking-wider text-sm hover:bg-press hover:text-paper transition-colors rounded-none"
                    >
                      {p.cta}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Digital Companion */}
      <section className="border-t border-rule bg-paper text-press">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-12 gap-8 border-x border-rule">
          <div className="md:col-span-5 flex flex-col justify-center text-left">
            <p className="label-mono">Digital Companion</p>
            <h2 className="headline-xl text-4xl md:text-5xl mt-4 font-bold text-press">Postcard first. Digital follow-up ready.</h2>
          </div>
          <div className="md:col-span-7 flex flex-col items-start justify-center text-left">
            <p className="text-lg text-press/75 leading-relaxed">
              Each NearHere Drop can connect to a local digital page where residents can scan, explore featured businesses, view offers, and learn more about what's nearby.
            </p>
            <div className="mt-8">
              <a
                href="#preview"
                className="inline-flex items-center justify-center border border-press text-press px-6 py-3 font-headline font-bold uppercase tracking-wider text-sm hover:bg-press hover:text-paper transition-colors rounded-none"
              >
                Preview Local Page
              </a>
            </div>
          </div>
        </div>
      </section>

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
