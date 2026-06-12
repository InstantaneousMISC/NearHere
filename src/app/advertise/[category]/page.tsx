import { Metadata } from "next"
import Link from "next/link"
import {
  Check,
  Phone,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Globe,
  Sparkles,
} from "lucide-react"
import {
  getAdvertiserCategory,
  getAllAdvertiserCategories,
  AdvertiserCategory
} from "@/data/advertiserCategories"
import { CategoryDirectory } from "@/components/advertise/CategoryDirectory"

interface PageProps {
  params: Promise<{ category: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params
  const category = getAdvertiserCategory(categorySlug)
  if (!category) {
    return {
      title: "Supported Industries | NearHere",
      description: "Discover how NearHere shared postcard campaigns and local visibility packages help your specific industry reach nearby homeowners.",
    }
  }
  return {
    title: category.seoTitle,
    description: category.seoDescription,
  }
}

export default async function CategoryLandingPage({ params }: PageProps) {
  const { category: categorySlug } = await params
  const category = getAdvertiserCategory(categorySlug)

  // Fallback to Category Directory if invalid category slug is provided
  if (!category) {
    const allCategories = getAllAdvertiserCategories()
    return <CategoryDirectory categories={allCategories} />
  }

  return (
    <main className="bg-paper text-press min-h-screen font-sans selection:bg-nh-red selection:text-paper">
      {/* Top Banner */}
      <div className="bg-press text-paper">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-paper/85">
            NearHere Local Visibility Package • Direct Mail + Digital Tracking
          </p>
          <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-gold flex items-center gap-1">
            <Sparkles className="h-3 w-3 inline animate-pulse" /> Exclusive Category Lock Available
          </p>
        </div>
      </div>

      {/* Navigation */}
      <header className="border-b border-rule sticky top-0 bg-paper/95 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-extrabold uppercase italic tracking-tighter select-none">
            <span className="bg-primary px-1.5 py-0.5 text-primary-foreground">Near</span>
            <span className="text-foreground">Here</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-widest">
            <Link href="/#how" className="hover:text-nh-red">
              How It Works
            </Link>
            <Link href="/advertise/directory" className="hover:text-nh-red">
              Industries
            </Link>
            <a href="#why" className="hover:text-nh-red">
              Why It Works
            </a>
            <a href="#offers" className="hover:text-nh-red">
              Offers
            </a>
            <a href="#includes" className="hover:text-nh-red">
              What's Included
            </a>
          </nav>
          <a
            href="#final-cta"
            className="bg-nh-red text-paper px-6 py-3 font-headline font-bold uppercase tracking-wider text-sm hover:bg-press transition-colors cursor-pointer"
          >
            Claim Placement
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-rule relative overflow-hidden bg-muted/10">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <p className="label-mono mb-4">Shared Direct Mail • QR Tracking • Local Profile</p>
            <h1 className="headline-xl text-5xl md:text-6xl lg:text-7xl mt-6">
              {category.headline}
            </h1>
            <p className="mt-6 text-lg text-press/80 max-w-xl leading-relaxed">
              {category.subheadline}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/#coverage"
                className="bg-nh-red text-paper px-6 py-3.5 font-headline font-bold uppercase tracking-wider text-sm hover:bg-press hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                Find a Campaign Near You
              </Link>
              <a
                href="#why"
                className="bg-transparent border border-press text-press px-6 py-3.5 font-headline font-bold uppercase tracking-wider text-sm hover:bg-press hover:text-paper hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                See What’s Included
              </a>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] text-nh-red font-bold">
                ✓ GET MAILED
              </span>
              <span className="text-press/30">•</span>
              <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] text-gold font-bold">
                ✓ GET SCANNED
              </span>
              <span className="text-press/30">•</span>
              <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] text-press font-bold">
                ✓ GET FOUND
              </span>
            </div>
          </div>
          <div className="lg:col-span-5 lg:pl-8">
            <div className="lg:rotate-[-2deg] lg:hover:rotate-0 transition-transform duration-500">
              <PostcardPreviewCard category={category} />
            </div>
          </div>
        </div>
      </section>

      {/* Why NearHere Works */}
      <section id="why" className="border-b border-rule py-20 bg-paper">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4">
              <p className="label-mono">Core Positioning</p>
              <h2 className="headline-xl text-3xl md:text-5xl mt-4">
                Why NearHere Works for {category.label}
              </h2>
              <p className="mt-6 text-press/75 leading-relaxed text-sm">
                NearHere helps {category.label.toLowerCase()} reach nearby homeowners through
                premium shared postcard campaigns. Every placement includes postcard exposure, a
                unique QR code, public business profile, website backlink, local offer display, and
                basic campaign tracking.
              </p>
            </div>
            <div className="md:col-span-8 grid sm:grid-cols-2 gap-6 text-left">
              {category.whyItWorks.map((point, index) => (
                <div
                  key={index}
                  className="border border-rule p-6 hover:bg-muted/20 transition-colors"
                >
                  <div className="font-mono text-nh-red font-bold text-sm mb-4">0{index + 1}</div>
                  <p className="font-headline font-bold text-lg uppercase tracking-wide">
                    {point.split(",")[0] || point}
                  </p>
                  <p className="mt-2 text-press/70 text-sm leading-relaxed">
                    {point.includes(",") ? point.substring(point.indexOf(",") + 1).trim() : point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Ideal Offers */}
      <section id="offers" className="border-b border-rule py-20 bg-muted/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="label-mono">Advertiser Success</p>
            <h2 className="headline-xl text-4xl md:text-5xl mt-4">
              Ideal Offers for {category.label}
            </h2>
            <p className="mt-4 text-press/70 max-w-xl mx-auto text-sm">
              Homeowners love clear, high-value local offers. We recommend featuring one of these
              proven offers on your postcard placement:
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {category.idealOffers.map((offer, index) => (
              <div
                key={index}
                className="bg-paper border border-rule p-6 relative flex flex-col justify-between"
              >
                <div className="absolute top-4 right-4 text-gold">
                  <Sparkles className="h-5 w-5 opacity-45" />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-warm tracking-widest block mb-1">
                    Offer Concept 0{index + 1}
                  </span>
                  <p className="font-headline font-bold text-xl text-press uppercase tracking-wide leading-snug">
                    {offer}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-rule/50 flex items-center justify-between text-xs font-mono text-warm">
                  <span>Mailed Placement</span>
                  <span className="text-nh-red font-bold font-sans">Recommended →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Every Placement Includes */}
      <section id="includes" className="border-b border-rule py-20 bg-paper">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5">
              <p className="label-mono">The Visibility Package</p>
              <h2 className="headline-xl text-4xl md:text-5xl mt-4">
                What Every Placement Includes
              </h2>
              <p className="mt-6 text-press/75 leading-relaxed">
                We don't just print postcards. We sell a bundled local visibility package combining
                offline reach with online search visibility.
              </p>
              <div className="mt-8 border-t border-rule pt-6 space-y-4 font-mono text-xs">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-nh-red" />
                  <span>Done-for-you printing & mail coordination</span>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-gold" />
                  <span>Interactive campaign activity dashboard</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4 text-left">
              {category.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border border-rule">
                  <div className="bg-nh-red/10 text-nh-red rounded-full p-1 mt-0.5">
                    <Check className="h-3 w-3" />
                  </div>
                  <div>
                    <p className="font-headline font-bold text-press text-sm uppercase tracking-wide">
                      {benefit}
                    </p>
                    <p className="text-[11px] font-mono text-warm mt-0.5">
                      {index === 0 && "Shared postcard reaching 10,000 households."}
                      {index === 1 && "Redirects residents directly to your local offer page."}
                      {index === 2 && "A dedicated directory profile page for your services."}
                      {index === 3 && "Valuable local web reference linking back to your URL."}
                      {index > 3 && "Included in the flat-rate local marketing bundle."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Postcard Mockup Card */}
      <section className="border-b border-rule py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <p className="label-mono">Postcard Mockup</p>
            <h2 className="headline-xl text-4xl md:text-5xl mt-4">Your Card Preview</h2>
            <p className="mt-6 text-press/75 leading-relaxed">
              Here is an example of how your advertising space would look on the shared NearHere
              community postcard. Our editorial design puts your message directly in front of
              homeowners in an engaging, uncluttered format.
            </p>
            <div className="mt-8 bg-paper border border-rule p-4 font-mono text-xs text-warm space-y-2">
              <p>✓ 10,000 home circulation</p>
              <p>✓ Exclusive space for your category</p>
              <p>✓ Dynamic scan analytics included</p>
            </div>
          </div>
          <div className="lg:col-span-7 flex justify-center">
            <div className="max-w-md w-full bg-paper border-2 border-press p-6 shadow-xl relative text-left">
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center font-mono text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 bg-gold/10 text-gold border border-gold">
                  VERIFIED LOCAL
                </span>
              </div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-nh-red">
                {category.label}
              </p>
              <h3 className="font-headline font-extrabold text-2xl uppercase tracking-tight text-press mt-2">
                {category.exampleAdCopy.headline}
              </h3>
              <p className="mt-3 text-press/80 text-xs leading-relaxed">
                {category.exampleAdCopy.description}
              </p>

              {/* Offer Box */}
              <div className="my-5 p-4 border border-dashed border-nh-red bg-nh-red/5 text-center">
                <span className="font-mono text-[9px] uppercase tracking-widest text-nh-red block mb-1">
                  EXCLUSIVE OFFER
                </span>
                <p className="font-headline font-bold text-lg text-nh-red uppercase">
                  {category.exampleAdCopy.offer}
                </p>
              </div>

              {/* Scan Bar */}
              <div className="flex items-center justify-between border-t border-rule pt-4">
                <div className="flex items-center gap-3">
                  <div className="bg-press text-paper p-1.5 rounded-none">
                    <QrCode className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="font-headline font-bold text-xs uppercase tracking-wide text-press leading-none">
                      {category.exampleAdCopy.cta}
                    </p>
                    <p className="font-mono text-[8px] text-warm mt-0.5">
                      Scan with smartphone camera
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-headline font-bold text-xs text-press uppercase">
                  <Phone className="h-3.5 w-3.5 text-nh-red animate-bounce" />
                  <span className="font-headline">Call Today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Exclusivity & Backlink details */}
      <section className="border-b border-rule bg-paper">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-rule">
          <div className="py-16 pr-0 md:pr-12 text-left">
            <div className="flex items-center gap-3 text-gold">
              <ShieldCheck className="h-6 w-6" />
              <h3 className="font-headline font-bold text-xl uppercase tracking-wider text-press">
                Category Exclusivity
              </h3>
            </div>
            <p className="mt-4 text-press/75 text-sm leading-relaxed">
              Many NearHere campaigns limit how many businesses from the same category can advertise
              on the same postcard. This helps protect advertiser value and keeps the card useful
              for residents.
            </p>
            <p className="mt-3 font-mono text-[11px] text-warm">
              * Category exclusivity may be available depending on the campaign and placement.
            </p>
          </div>

          <div className="py-16 pl-0 md:pl-12 text-left">
            <div className="flex items-center gap-3 text-nh-red">
              <Globe className="h-6 w-6" />
              <h3 className="font-headline font-bold text-xl uppercase tracking-wider text-press">
                SEO & Online Backlink Benefit
              </h3>
            </div>
            <p className="mt-4 text-press/75 text-sm leading-relaxed">
              Your NearHere Business Profile can include a link back to your website, giving
              customers another path to visit your site and helping support your broader local
              online visibility. Search rankings are never guaranteed, but your profile creates
              another relevant local web presence for your business.
            </p>
          </div>
        </div>
      </section>

      {/* Internal SEO links */}
      <section className="border-b border-rule py-12 bg-muted/10">
        <div className="max-w-7xl mx-auto px-6">
          <p className="label-mono mb-4 text-center">Explore Related Categories</p>
          <div className="flex flex-wrap justify-center gap-2">
            {category.relatedCategories.map((relSlug) => {
              const relCategory = getAdvertiserCategory(relSlug)
              if (!relCategory) return null
              return (
                <Link
                  key={relSlug}
                  href={`/advertise/${relSlug}`}
                  className="px-4 py-2 border border-rule hover:border-nh-red hover:bg-paper font-headline font-bold uppercase tracking-wider text-xs transition-colors"
                >
                  {relCategory.label} →
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="final-cta" className="bg-nh-red text-paper py-20 text-center">
        <div className="max-w-4xl mx-auto px-6 space-y-6">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-paper/70">
            Get Mailed • Get Scanned • Get Found
          </p>
          <h2 className="headline-xl text-4xl md:text-6xl">
            Ready to Get Seen by Nearby Homeowners?
          </h2>
          <p className="mt-6 text-paper/90 text-lg max-w-xl mx-auto leading-relaxed">
            Find an available NearHere campaign and reserve a placement for your{" "}
            {category.label.toLowerCase()} business.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/#coverage"
              className="bg-paper text-press px-8 py-4 font-headline font-bold uppercase tracking-wider hover:bg-press hover:text-paper hover:scale-105 transition-all text-sm shadow"
            >
              Find a Campaign Near You
            </Link>
            <a
              href="mailto:hello@nearhere.co?subject=NearHere placement inquiry"
              className="border border-paper text-paper px-8 py-4 font-headline font-bold uppercase tracking-wider hover:bg-paper hover:text-press hover:scale-105 transition-all text-sm"
            >
              Talk to the Team
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-rule bg-press text-paper">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-12 gap-10 text-left">
          <div className="md:col-span-4">
            <Link href="/" className="font-headline font-bold text-3xl tracking-tight">
              Near<span className="text-nh-red">Here</span>
            </Link>
            <p className="mt-4 text-paper/70 max-w-xs leading-relaxed text-sm">
              A community-first local postcard campaign platform. Support local. Discover nearby.
            </p>
            <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-paper/50 mt-6 animate-pulse">
              Get Mailed, Get Scanned, Get Found.
            </p>
          </div>
          {[
            ["Product", ["NearHere Postcards", "NearHere Drop", "Local Page", "For Business"]],
            ["Company", ["Our Mission", "Communities", "Press Kit", "Contact"]],
            ["Resources", ["How It Works", "Pricing", "FAQ", "Media Kit"]],
          ].map(([title, items]) => (
            <div key={title as string} className="md:col-span-2">
              <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-paper/50">
                {title}
              </p>
              <ul className="mt-4 space-y-2">
                {(items as string[]).map((it) => (
                  <li key={it}>
                    <Link
                      href="/"
                      className="font-headline text-paper/90 hover:text-nh-red text-sm uppercase tracking-wide"
                    >
                      {it}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="md:col-span-2">
            <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-paper/50">
              Contact
            </p>
            <ul className="mt-4 space-y-2 text-sm text-paper/90">
              <li>hello@nearhere.co</li>
              <li>Converse, Texas</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-paper/15">
          <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/50">
              © {new Date().getFullYear()} NearHere — Support Local. Discover Nearby.
            </p>
            <Link
              href="/advertise/directory"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/50 hover:text-nh-red"
            >
              Browse Industries
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

function PostcardPreviewCard({ category }: { category: AdvertiserCategory }) {
  return (
    <div className="relative">
      <div className="absolute -inset-2 bg-press/5 -z-10 translate-x-3 translate-y-3" />
      <div className="bg-paper border border-press/80 shadow-[0_30px_60px_-30px_rgba(33,29,28,0.45)] aspect-[7/5] w-full p-4 flex flex-col justify-between text-left">
        <div className="flex items-start justify-between border-b border-rule pb-2">
          <div>
            <div className="font-headline font-bold text-sm tracking-tight">
              Near<span className="text-nh-red">Here</span>
            </div>
            <p className="font-mono uppercase tracking-[0.14em] text-[7px] text-warm mt-0.5">
              Converse, TX • Drop #001
            </p>
          </div>
          <span className="inline-flex items-center font-mono text-[8px] uppercase tracking-[0.14em] px-2 py-0.5 bg-gold/10 text-gold border border-gold">
            Category Exclusive
          </span>
        </div>

        <div className="my-2 flex-1 flex flex-col justify-center text-center">
          <span className="font-mono text-[7px] uppercase tracking-widest text-nh-red block mb-1">
            Featured Partner ({category.label})
          </span>
          <h3 className="headline-xl text-lg md:text-xl text-press uppercase font-black leading-none">
            {category.exampleAdCopy.headline}
          </h3>
          <p className="text-[9px] text-press/85 italic font-headline mt-1.5 font-bold">
            "{category.exampleAdCopy.offer}"
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-rule pt-2">
          <p className="font-mono uppercase tracking-[0.14em] text-[7px] text-warm flex items-center gap-1">
            <QrCode className="h-3 w-3 inline text-nh-red" /> Scan to explore local page
          </p>
          <div className="w-7 h-7 bg-press grid grid-cols-3 grid-rows-3 gap-[1px] p-[2px]">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className={i % 2 === 0 ? "bg-paper" : "bg-press"} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
