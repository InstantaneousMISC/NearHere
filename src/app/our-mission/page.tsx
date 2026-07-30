import { Metadata } from "next"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import { Sparkles, ShieldCheck, Heart, MailOpen } from "lucide-react"

export const metadata: Metadata = {
  title: "Our Mission — Rebuilding Local Direct Mail | NearHere",
  description: "Discover NearHere's story. We are on a mission to build a curated, design-forward local postcard campaign that supports small businesses and local communities.",
}

export default function OurMissionPage() {
  return (
    <main className="bg-paper text-press min-h-screen flex flex-col font-sans">
      <CampaignNav />

      {/* Hero */}
      <section className="border-b border-rule py-20 bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-press/30 text-press mb-6">
            Company Story
          </span>
          <h1 className="headline-xl text-5xl md:text-7xl leading-tight">
            Direct mail that residents <br className="hidden md:inline" />
            <span className="text-nh-red">actually want to read.</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-press/80 leading-relaxed max-w-2xl mx-auto">
            NearHere was founded on a simple premise: your mailbox deserves better than cluttered coupon packets, and local business owners deserve advertising that actually builds brand equity.
          </p>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="border-b border-rule py-20 bg-paper">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-rule">
            <div className="p-8 text-center md:text-left">
              <div className="text-nh-red mb-4 flex justify-center md:justify-start">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="font-headline font-bold text-2xl uppercase tracking-tight">Community First</h3>
              <p className="text-press/70 text-sm mt-3 leading-relaxed">
                We believe that supporting local businesses is what makes neighborhoods thrive. NearHere keeps it local by focusing exclusively on local services, venues, and operators.
              </p>
            </div>
            
            <div className="p-8 text-center md:text-left">
              <div className="text-gold mb-4 flex justify-center md:justify-start">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="font-headline font-bold text-2xl uppercase tracking-tight">Curation Over Clutter</h3>
              <p className="text-press/70 text-sm mt-3 leading-relaxed">
                Junk mail envelopes bundle 50+ businesses in a race-to-the-bottom stack. We feature only one hand-picked business per category, giving your business undivided attention.
              </p>
            </div>

            <div className="p-8 text-center md:text-left">
              <div className="text-press mb-4 flex justify-center md:justify-start">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="font-headline font-bold text-2xl uppercase tracking-tight">Design Integrity</h3>
              <p className="text-press/70 text-sm mt-3 leading-relaxed">
                We design premium editorial cards that residents appreciate. Utilizing minimalist aesthetics, solid typography, and rich layouts, we ensure your brand looks professional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Detail Story Section */}
      <section className="border-b border-rule py-20 bg-muted/10">
        <div className="max-w-4xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-4">
            <p className="label-mono">The Opportunity</p>
            <h2 className="headline-xl text-3xl mt-4">Why Mail? Why Now?</h2>
          </div>
          <div className="md:col-span-8 space-y-6 text-press/80 leading-relaxed text-sm md:text-base">
            <p>
              Digital feeds are noisier than ever, and local organic reach has effectively dropped to zero. Small businesses are left buying expensive, highly competitive search ads, or sending cheap paper flyers that end up in the bin.
            </p>
            <p>
              We saw an opportunity to bring direct mail back in a premium, curated format. By printing one beautiful postcard containing a directory of verified local services, we offer residents a useful household reference while keeping costs incredibly affordable for merchants.
            </p>
            <div className="border-l-4 border-nh-red pl-4 py-2 italic font-headline text-lg text-press font-bold">
              &ldquo;We aren&apos;t making more advertising. We&apos;re creating neighborhood discovery tools.&rdquo;
            </div>
          </div>
        </div>
      </section>

      {/* Waste Reduction */}
      <section className="py-20 bg-press text-paper border-b border-press">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-paper/60 flex justify-center mb-6">
            <MailOpen className="h-10 w-10 text-nh-red" />
          </div>
          <h2 className="headline-xl text-3xl md:text-5xl leading-tight">Reducing Mailbox Waste</h2>
          <p className="mt-6 text-paper/70 leading-relaxed text-sm md:text-base max-w-2xl mx-auto">
            Traditional direct mail packages weigh down mailboxes with heavy plastic envelopes and redundant ads. NearHere combines 24 local categories into a single high-quality card, using FSC-certified paper and vegetable-based inks. We reach the entire neighborhood with 90% less paper footprint.
          </p>
        </div>
      </section>

      <CampaignFooter />
    </main>
  )
}
