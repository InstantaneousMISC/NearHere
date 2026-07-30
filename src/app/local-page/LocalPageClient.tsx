"use client"

import { useState } from "react"
import {
  QrCode,
  Globe,
  MapPin,
  Clock,
  Phone,
  Sparkles,
} from "lucide-react"

type SampleBusiness = {
  name: string
  category: string
  tagline: string
  offer: string
  address: string
  hours: string
  phone: string
  website: string
  description: string
  rating: string
}

const SAMPLE_BUSINESSES: Record<string, SampleBusiness> = {
  coffee: {
    name: "Mesa Coffee",
    category: "Local Cafe & Roastery",
    tagline: "Gather around good coffee.",
    offer: "Buy One, Get One Free Espresso Drinks",
    address: "102 Main St, Converse, TX",
    hours: "7:00 AM - 4:00 PM",
    phone: "(210) 555-0143",
    website: "mesacoffeeconverse.com",
    description: "Mesa Coffee is a family-owned neighborhood hub dedicated to roasting organic, ethically sourced beans and bringing people together over the perfect pour.",
    rating: "4.9 (124 reviews)",
  },
  plumbing: {
    name: "Rivera & Sons Plumbing",
    category: "Plumbing Services",
    tagline: "Honest work, clear pricing.",
    offer: "$50 Off Your First Service Call",
    address: "Servicing Converse & Greater Area",
    hours: "24/7 Emergency Services",
    phone: "(210) 555-0199",
    website: "riveraplumbingtx.com",
    description: "With over 15 years in Converse, Rivera & Sons provides reliable, high-quality residential plumbing, water heater service, and emergency repairs.",
    rating: "4.8 (210 reviews)",
  },
  fitness: {
    name: "Pulse Gym",
    category: "Fitness & Wellness Studio",
    tagline: "Find your tempo.",
    offer: "Free 3-Day Pass + 1 Personal Training Session",
    address: "408 Heights Blvd, Converse, TX",
    hours: "5:00 AM - 10:00 PM",
    phone: "(210) 555-0164",
    website: "pulse-gym-tx.com",
    description: "A community fitness studio offering custom group training, state-of-the-art strength equipment, and a welcoming environment for all fitness levels.",
    rating: "5.0 (98 reviews)",
  },
}

export default function LocalPageClient() {
  const [selectedBiz, setSelectedBiz] = useState<keyof typeof SAMPLE_BUSINESSES>("coffee")
  const biz = SAMPLE_BUSINESSES[selectedBiz]

  return (
    <>
      {/* Hero */}
      <section className="border-b border-rule py-16 bg-muted/20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-press/30 text-press mb-4">
              Digital Companion
            </span>
            <h1 className="headline-xl text-5xl md:text-6xl lg:text-7xl">
              Postcard first.<br />
              <span className="text-nh-red">Digital companion ready.</span>
            </h1>
            <p className="mt-6 text-lg text-press/80 max-w-xl leading-relaxed">
              Every NearHere postcard features a unique QR code. When residents scan the card, they land on a mobile-optimized profile designed to convert readers into customers.
            </p>
            <div className="mt-8 flex items-center gap-4 text-xs font-mono">
              <span className="text-nh-red font-bold">✓ Zero Ads</span>
              <span className="text-press/30">•</span>
              <span className="text-gold font-bold">✓ 100% Mobile-First</span>
              <span className="text-press/30">•</span>
              <span className="text-press font-bold">✓ Action-Oriented Layout</span>
            </div>
          </div>
          <div className="lg:col-span-5 flex justify-center">
            <div className="border border-rule bg-paper p-8 flex flex-col items-center text-center max-w-sm">
              <div className="bg-press text-paper p-4 mb-4">
                <QrCode className="h-16 w-16" />
              </div>
              <h3 className="font-headline font-bold text-lg uppercase tracking-wide">The QR Bridge</h3>
              <p className="text-xs text-press/70 mt-2 leading-relaxed">
                We print a unique QR code for each category placement. No searching online, no typos. Just point, scan, and view the offer instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mockup section */}
      <section className="border-b border-rule py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="font-mono uppercase tracking-[0.14em] text-[11px] text-warm">Live Preview</p>
            <h2 className="headline-xl text-4xl md:text-5xl mt-4">Interactive Profile Demo</h2>
            <p className="mt-4 text-press/70 max-w-xl mx-auto text-sm">
              Select a category to see how a business&apos;s local digital page displays on a resident&apos;s phone:
            </p>
            
            {/* Category Select Buttons */}
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              {Object.keys(SAMPLE_BUSINESSES).map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedBiz(key as keyof typeof SAMPLE_BUSINESSES)}
                  className={`px-5 py-2.5 font-headline font-bold uppercase tracking-wider text-xs border transition-all cursor-pointer ${
                    selectedBiz === key
                      ? "bg-press text-paper border-press"
                      : "bg-transparent text-press border-rule hover:border-press"
                  }`}
                >
                  {SAMPLE_BUSINESSES[key].name} ({SAMPLE_BUSINESSES[key].category})
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Features Info Column */}
            <div className="lg:col-span-6 space-y-8">
              <div>
                <span className="font-mono text-xs text-nh-red tracking-widest font-bold uppercase">01 / Pure Conversion</span>
                <h3 className="font-headline font-extrabold text-2xl uppercase tracking-tight text-press mt-2">Zero Distractions</h3>
                <p className="text-press/75 text-sm leading-relaxed mt-2">
                  Unlike traditional review websites, our local pages have no competing ads, no competitor recommendations, and no algorithms. It is 100% focused on your business.
                </p>
              </div>

              <div>
                <span className="font-mono text-xs text-gold tracking-widest font-bold uppercase">02 / High-Value Local Offers</span>
                <h3 className="font-headline font-extrabold text-2xl uppercase tracking-tight text-press mt-2">Redeemable Promotions</h3>
                <p className="text-press/75 text-sm leading-relaxed mt-2">
                  Showcase your exclusive postcard promo prominently. Residents can easily reference the offer on their phones when calling or checking out.
                </p>
              </div>

              <div>
                <span className="font-mono text-xs text-press tracking-widest font-bold uppercase">03 / SEO Backlink & Socials</span>
                <h3 className="font-headline font-extrabold text-2xl uppercase tracking-tight text-press mt-2">Boost Domain Authority</h3>
                <p className="text-press/75 text-sm leading-relaxed mt-2">
                  Includes direct, clean links to your website, google reviews, and social channels, giving customers multiple ways to engage and improving your local online rankings.
                </p>
              </div>
            </div>

            {/* Mobile Mockup Column */}
            <div className="lg:col-span-6 flex justify-center">
              {/* Phone Frame */}
              <div className="w-full max-w-[340px] border-4 border-press rounded-[32px] overflow-hidden bg-muted/40 shadow-2xl relative">
                {/* Speaker/Camera notch */}
                <div className="absolute top-0 inset-x-0 h-4 bg-press flex justify-center items-center">
                  <div className="w-16 h-1.5 bg-paper/20 rounded-full" />
                </div>
                
                {/* Screen Content */}
                <div className="pt-8 pb-6 px-4 bg-paper font-sans text-press flex flex-col min-h-[500px]">
                  {/* Top Header */}
                  <div className="flex items-center justify-between border-b border-rule pb-2 mb-4">
                    <span className="font-headline font-bold text-sm tracking-tight">
                      Near<span className="text-nh-red">Here</span> Local
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-warm">Converse Drop #001</span>
                  </div>

                  {/* Category & Badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] uppercase tracking-widest bg-press text-paper px-2 py-0.5">
                      {biz.category}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-gold font-bold flex items-center gap-1">
                      <Sparkles className="h-2 w-2" /> Verified Partner
                    </span>
                  </div>

                  {/* Business Name & Tagline */}
                  <h4 className="font-headline font-extrabold text-2xl uppercase tracking-tight text-press mt-2">
                    {biz.name}
                  </h4>
                  <p className="text-xs text-press/70 italic mt-0.5">
                    &ldquo;{biz.tagline}&rdquo;
                  </p>

                  {/* Promo Box */}
                  <div className="my-4 p-4 border border-dashed border-nh-red bg-nh-red/5 text-center">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-nh-red block mb-1">
                      EXCLUSIVELY BY POSTCARD
                    </span>
                    <p className="font-headline font-bold text-sm text-nh-red uppercase">
                      {biz.offer}
                    </p>
                  </div>

                  {/* Business Description */}
                  <p className="text-[11px] text-press/80 leading-relaxed">
                    {biz.description}
                  </p>

                  {/* Business Details */}
                  <div className="mt-4 space-y-2 pt-3 border-t border-rule/50 text-[11px] font-mono text-warm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-press" />
                      <span>{biz.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3 text-press" />
                      <span>{biz.hours}</span>
                    </div>
                  </div>

                  {/* Call to Actions */}
                  <div className="mt-6 space-y-2">
                    <a
                      href={`tel:${biz.phone}`}
                      className="w-full bg-press text-paper py-2.5 font-headline font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-nh-red transition-colors text-center"
                    >
                      <Phone className="h-3.5 w-3.5" /> Call {biz.phone}
                    </a>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      className="w-full border border-press text-press py-2.5 font-headline font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-muted transition-colors text-center"
                    >
                      <Globe className="h-3.5 w-3.5" /> Visit Website
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campaign Statistics section */}
      <section className="bg-muted/30 border-b border-rule py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rule">
            <div className="p-6 text-center md:text-left">
              <h4 className="font-headline font-bold text-3xl">Instant Insights</h4>
              <p className="text-press/70 text-sm mt-2 leading-relaxed">
                See exactly how many residents scan your postcard code. Transparent metrics help you measure actual campaigns ROI.
              </p>
            </div>
            <div className="p-6 text-center md:text-left">
              <h4 className="font-headline font-bold text-3xl">Fast Loading</h4>
              <p className="text-press/70 text-sm mt-2 leading-relaxed">
                Our pages are optimized for speed, loading in under 1 second on mobile networks to keep conversion rates high.
              </p>
            </div>
            <div className="p-6 text-center md:text-left">
              <h4 className="font-headline font-bold text-3xl">Dynamic Editing</h4>
              <p className="text-press/70 text-sm mt-2 leading-relaxed">
                Need to change your promo? Adjust hours? Update your phone? Edit your profile details dynamically anytime.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
