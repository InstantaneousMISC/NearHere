import { notFound } from "next/navigation"
import { db } from "@/server/db"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignInquiryForm from "@/components/campaign/CampaignInquiryForm"
import type { Metadata } from "next"

interface ContactPageProps {
  params: Promise<{
    state: string
    city: string
    slug: string
  }>
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { city, state } = await params
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)
  const stateName = state.charAt(0).toUpperCase() + state.slice(1)
  return {
    title: `Inquire: ${cityName}, ${stateName} shared postcard campaign`,
    description: `Contact our sales rep for the ${cityName} shared postcard campaign. Let us help you select a spot and get set up manually.`,
  }
}

export default async function CampaignContactPage({
  params,
}: ContactPageProps) {
  const { state, city, slug } = await params

  // 1. Fetch Campaign Details
  const campaign = await db.campaign.findUnique({
    where: {
      state_city_slug: {
        state: state.toLowerCase(),
        city: city.toLowerCase(),
        slug: slug.toLowerCase(),
      },
    },
  })

  if (!campaign) {
    return notFound()
  }

  const cityName = campaign.city.charAt(0).toUpperCase() + campaign.city.slice(1)
  const stateName = campaign.state.charAt(0).toUpperCase() + campaign.state.slice(1)
  const mailingQuantity = campaign.mailingQuantity
  const mailWindow = campaign.estimatedMailDate 
    ? new Date(campaign.estimatedMailDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : "Late 2026"

  // 2. Resolve Facebook/Messenger URL
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || process.env.FACEBOOK_URL || null

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <CampaignNav state={state} city={city} slug={slug} isContactPage={true} />

      <div className="py-20 px-4 sm:px-6 lg:px-8 font-sans max-w-5xl mx-auto space-y-16">
        {/* Sales Hero Section (Inspired by Attachment 1) */}
        <div className="text-center max-w-4xl mx-auto space-y-8 animate-fade-up">
          <div className="space-y-4">
            <span className="inline-block font-mono text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 bg-primary/5 border border-primary/15 rounded-none">
              🔒 Exclusive Category Protection
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight uppercase font-headline leading-none">
              Reach <span className="text-primary">{mailingQuantity.toLocaleString()} Homes</span> in {cityName}
            </h1>
          </div>

          <p className="text-base sm:text-lg md:text-xl font-medium text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            Lock in your business category exclusivity and put your exclusive business spot directly in front of local households.
          </p>

          <p className="text-xs sm:text-sm md:text-base text-muted-foreground/85 max-w-3xl mx-auto leading-relaxed">
            At NearHere, we combine local marketing + tech to grow your business. Our team handles everything—designing, copywriting, printing, postage, and mailing—so you can focus on welcoming new local customers.
          </p>

          <div className="pt-4">
            <a
              href="#inquiry-form"
              className="inline-flex items-center justify-center bg-primary text-primary-foreground border border-primary font-mono text-xs uppercase font-bold tracking-widest px-8 py-5 transition-all hover:bg-foreground hover:border-foreground hover:text-background shadow-lg hover:shadow-xl rounded-none select-none cursor-pointer"
            >
              Reserve Your Category Spot Now &darr;
            </a>
          </div>
        </div>

        {/* Benefits Checklist Section (Inspired by Attachment 2) */}
        <div className="border border-border bg-card p-8 md:p-10 shadow-sm space-y-8 max-w-3xl mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black font-headline uppercase tracking-tight text-foreground">
              What You'll Get in This Campaign:
            </h2>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
              A comprehensive local marketing + tech system
            </p>
          </div>

          <div className="space-y-6 max-w-2xl mx-auto text-left">
            <div className="flex items-start gap-3.5">
              <span className="text-emerald-500 mt-1 text-lg font-bold">✓</span>
              <div>
                <span className="font-bold text-foreground text-sm font-mono uppercase tracking-wider block">Guaranteed Category Exclusivity</span>
                <span className="text-xs sm:text-sm text-muted-foreground">100% competitor lockout—we only allow one business type (e.g. one plumber, one dentist) per postcard campaign.</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="text-emerald-500 mt-1 text-lg font-bold">✓</span>
              <div>
                <span className="font-bold text-foreground text-sm font-mono uppercase tracking-wider block">Direct Mail Reach to {mailingQuantity.toLocaleString()} Homes</span>
                <span className="text-xs sm:text-sm text-muted-foreground">High-impact physical delivery directly into the mailboxes of local households in {cityName}, {stateName}.</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="text-emerald-500 mt-1 text-lg font-bold">✓</span>
              <div>
                <span className="font-bold text-foreground text-sm font-mono uppercase tracking-wider block">Digital Business Profile</span>
                <span className="text-xs sm:text-sm text-muted-foreground">A dedicated, SEO-optimized business profile listing on the NearHere directory to boost your digital presence.</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="text-emerald-500 mt-1 text-lg font-bold">✓</span>
              <div>
                <span className="font-bold text-foreground text-sm font-mono uppercase tracking-wider block">Permanent Authority Backlink</span>
                <span className="text-xs sm:text-sm text-muted-foreground">A high-quality, permanent digital backlink to boost your business website's search engine domain authority.</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="text-emerald-500 mt-1 text-lg font-bold">✓</span>
              <div>
                <span className="font-bold text-foreground text-sm font-mono uppercase tracking-wider block">Print-to-Digital QR Code Tracking</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Custom dynamic QR code printed directly on your postcard spot, enabling simple redirection and scan analytics.</span>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <span className="text-emerald-500 mt-1 text-lg font-bold">✓</span>
              <div>
                <span className="font-bold text-foreground text-sm font-mono uppercase tracking-wider block">Professional Ad Copy & Design</span>
                <span className="text-xs sm:text-sm text-muted-foreground">Complete professional ad typesetting, graphic design layout, and copywriting review to maximize your response rate.</span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-border max-w-4xl mx-auto" />

        {/* Form and Info Columns */}
        <div id="inquiry-form" className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start scroll-mt-24">
          {/* Inquiry Form Card */}
          <div className="lg:col-span-2 bg-card border border-border shadow-2xl p-6 sm:p-8 rounded-none">
            <div className="mb-6 border-b border-border pb-4">
              <h3 className="text-lg font-headline font-black uppercase text-foreground">
                Inquire & Lock Category
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-1">
                Enter your details to verify category availability. No card required.
              </p>
            </div>
            <CampaignInquiryForm
              campaignId={campaign.id}
              campaignUrl={`/campaigns/${state}/${city}/${slug}`}
              facebookUrl={facebookUrl}
            />
          </div>

          {/* What's Included & Campaign Snapshot Card */}
          <div className="lg:col-span-1 border border-border bg-card p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h3 className="font-headline font-black text-lg uppercase tracking-tight text-foreground border-b border-border pb-3">
                Campaign Package
              </h3>
              <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed font-mono uppercase tracking-wider">
                Local marketing + tech package
              </p>
            </div>

            <div className="space-y-4 font-sans text-sm">
              <div className="flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5 text-base">✓</span>
                <div>
                  <span className="font-bold text-foreground block text-xs font-mono uppercase tracking-wider">Direct Mail Reach</span>
                  <span className="text-xs text-muted-foreground">Mailed to <strong className="text-foreground font-semibold">{mailingQuantity.toLocaleString()}</strong> households in {cityName}, {stateName}.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5 text-base">✓</span>
                <div>
                  <span className="font-bold text-foreground block text-xs font-mono uppercase tracking-wider">Category Exclusivity</span>
                  <span className="text-xs text-muted-foreground">100% category protection—only one business category per postcard.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5 text-base">✓</span>
                <div>
                  <span className="font-bold text-foreground block text-xs font-mono uppercase tracking-wider">Digital Business Profile</span>
                  <span className="text-xs text-muted-foreground">A dedicated SEO-optimized online profile on the NearHere directory.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5 text-base">✓</span>
                <div>
                  <span className="font-bold text-foreground block text-xs font-mono uppercase tracking-wider">Permanent Backlink</span>
                  <span className="text-xs text-muted-foreground">High-quality SEO backlink to boost your website's search visibility.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5 text-base">✓</span>
                <div>
                  <span className="font-bold text-foreground block text-xs font-mono uppercase tracking-wider">QR Tracking & Redirection</span>
                  <span className="text-xs text-muted-foreground">Dynamic QR code on your printed ad driving customers to your profile/offer.</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-emerald-500 mt-0.5 text-base">✓</span>
                <div>
                  <span className="font-bold text-foreground block text-xs font-mono uppercase tracking-wider">Professional Design & Copy</span>
                  <span className="text-xs text-muted-foreground">Complete design setup, layout formatting, and expert proofreading.</span>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div className="space-y-3 font-sans text-xs">
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Format Size:</span>
                <span className="font-semibold text-foreground">Premium {campaign.cardSize || "9x12"} Shared Postcard</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Mailing Window:</span>
                <span className="font-semibold text-foreground">{mailWindow}</span>
              </div>
            </div>

            <div className="border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-muted-foreground leading-relaxed">
              <span className="font-bold text-emerald-600 block mb-1">Inquiry is 100% Free:</span>
              Submitting this inquiry reserves your category interest temporarily. No payment details are required, and a campaign representative will contact you to review available spots.
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
