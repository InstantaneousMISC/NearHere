import { notFound } from "next/navigation"
import { db } from "@/server/db"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignInquiryForm from "@/components/campaign/CampaignInquiryForm"
import FAQ from "@/components/campaign/FAQ"
import type { Metadata } from "next"
import {
  Shield,
  Mail,
  QrCode,
  User,
  Link as LinkIcon,
  Pencil,
  Check,
  Star,
  ShieldCheck,
  MessageCircle,
  TrendingUp,
  Target
} from "lucide-react"

function TexasIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="285 328 248 238"
      fill="none"
      stroke="currentColor"
      strokeWidth="16"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M361.4,330.5L384.1,331.6L415.2,332.8L412.9,356.2L412.6,374.4L412.6,376.4L417,380.3L419,381.7L420.1,381.1L420.5,379.3L421.7,381.1L423.8,381.2L423.8,379.7L425.4,380.7L426.6,381.1L426.2,385.1L430.3,385.2L433.2,386.4L437.2,386.9L439.6,389L441.7,386.9L445.4,387.5L447.6,390.7L448.7,391.1L448.6,393L450.8,393.8L453.1,391.8L455.2,392.4L457.5,392.4L458.4,394.8L464.7,397L466.3,396.2L467.8,392L468.1,392L469.1,392.1L470.3,394.2L474.2,394.8L477.5,396L481,397.1L482.8,396.2L483.5,393.7L488,393.7L489.8,394.6L492.6,392.5L493.7,392.6L494.5,394.2L498.6,394.2L500.1,392.1L502,392.6L503.9,395L507.5,397L510.3,397.8L511.8,398.6L514.3,400.6L517.3,399.3L520,400.4L520.6,406.5L520.5,416.2L521.2,425.8L521.9,429.4L524.6,433.8L525.5,438.7L529.7,444.3L529.9,447.4L530.6,448.2L529.9,456.6L527,461.6L528.6,463.7L527.9,466.1L527.3,473.5L525.8,476.8L526.1,480.3L520.4,481.9L510.5,486.4L509.6,488.4L507,490.3L504.9,491.8L503.6,492.6L497.9,497.9L495.2,500L489.9,503.3L484.2,505.7L477.9,509.1L476.1,510.5L470.3,514.1L466.9,514.7L463,520.2L459,520.6L458,522.5L460.3,524.4L458.8,529.9L457.5,534.5L456.4,538.3L455.6,542.9L456.4,545.3L458.2,552.2L459.1,558.4L460.9,561.1L459.9,562.6L456.9,564.5L451.2,560.6L445.7,559.5L444.4,560L441.2,559.4L437,556.3L431.8,555.1L424.2,551.8L422.1,547.9L420.8,541.4L417.6,539.5L416.9,537.2L417.6,536.6L417.9,533.2L416.6,532.5L416,531.5L417.3,527.2L415.6,524.9L412.4,523.6L409,519.3L405.5,512.6L401.3,510L401.4,508.1L396.1,495.8L395.3,491.6L393.5,489.7L393.3,488.2L387.4,482.9L384.8,479.8L384.8,478.7L382.2,476.6L375.4,475.4L368,474.8L364.9,472.5L360.4,474.3L356.8,475.8L354.5,479L353.6,482.7L349.2,488.9L346.8,491.3L344.2,490.3L342.4,489.2L340.5,488.5L336.6,486.3L336.6,485.6L334.8,483.7L329.6,481.6L322.2,473.8L319.9,469.1L319.9,461.1L316.7,454.6L316.2,451.8L314.6,450.9L313.5,448.8L308.5,446.7L307.2,445.1L300.1,437.1L298.8,433.9L294.1,431.6L292.6,427.3L290,424.4L288.1,423.9L287.5,419.2L295.5,419.9L324.5,422.6L353.5,424.2L355.8,404.8L359.6,349.2L361.2,330.5L362.6,330.5M461.6,560.2L461.1,553L458.3,545.9L457.8,538.8L459.3,530.6L462.6,523.7L466.1,518.3L469.2,514.7L469.9,515L465.1,521.6L460.8,528.1L458.7,534.8L458.4,540L459.3,546.1L461.9,553.3L462.4,558.5L462.5,559.9L461.6,560.2z" />
    </svg>
  )
}


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
  const stateName = campaign.state.toUpperCase()
  const mailingQuantity = campaign.mailingQuantity

  // 2. Resolve Facebook/Messenger URL
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || process.env.FACEBOOK_URL || null

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#211D1C] font-sans antialiased">
      <CampaignNav state={state} city={city} slug={slug} isContactPage={true} />
      {/* Hero Section (Dark Theme) */}
      <section id="campaign" className="relative bg-[#12100F] text-white pt-16 pb-16 md:pt-24 md:pb-24 overflow-hidden border-b border-stone-900 min-h-[650px] lg:min-h-[700px] flex items-center scroll-mt-16">
        {/* Background Map Image spanning the entire section */}
        <div className="absolute inset-0 select-none z-0">
          <img
            src="/background-header.png"
            alt="Local Targeting Map"
            className="w-full h-full object-cover object-right opacity-90"
          />
          {/* Gradient overlays to ensure text readability on the left and smooth transition at the bottom */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#12100F] via-[#12100F]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#12100F] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 animate-fade-up text-left z-10">
            <div className="select-none space-y-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-stone-400 font-bold">
                Current Campaign
              </p>
              <div className="inline-flex items-center gap-3 px-4 py-2 border border-[#FF4A1C]/35 bg-[#12100F]/95 text-white font-sans text-xs uppercase tracking-wider rounded-md shadow-[0_0_15px_rgba(255,74,28,0.1)]">
                <TexasIcon className="h-4 w-4 text-[#FF4A1C] animate-pulse" />
                <span className="font-headline font-black text-sm text-[#FF4A1C]">
                  {cityName}, {stateName} and the surrounding areas
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-[54px] lg:text-[62px] font-headline font-black leading-[0.95] tracking-tight uppercase text-white">
              Your Business <br />
              In <span className="text-[#FF4A1C]">Local Mailboxes +</span>
            </h1>

            <p className="text-stone-200 text-xl md:text-2xl font-semibold leading-relaxed max-w-xl font-sans">
              Mailbox marketing meets modern online tech.
            </p>

            <p className="text-stone-300 text-base md:text-lg leading-relaxed max-w-xl font-sans">
              NearHere puts your business in local mailboxes with shared mail marketing postcards and keeps it working online with category exclusivity, QR tracking, a digital business profile, and a permanent backlink to help strengthen your search visibility.
            </p>

            <div className="pt-2">
              <a
                href="#inquiry-form"
                className="inline-flex items-center justify-center bg-[#FF4A1C] hover:bg-[#e03e1a] text-white font-headline text-sm sm:text-base font-black uppercase tracking-wider px-8 py-5 transition-all shadow-[0_4px_20px_rgba(255,74,28,0.3)] hover:shadow-[0_6px_25px_rgba(255,74,28,0.4)] rounded-md cursor-pointer select-none"
              >
                CHECK AVAILABILITY & RESERVE YOUR SPOT ↓
              </a>
            </div>

            {/* Mini Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-stone-800/80 mt-10 max-w-2xl">
              <div className="flex items-center gap-3 text-left">
                <ShieldCheck className="h-7 w-7 text-[#FF4A1C] flex-shrink-0" />
                <div className="font-sans">
                  <p className="text-xs font-bold uppercase tracking-wider text-white">One Business</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">Per Category</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <Target className="h-7 w-7 text-[#FF4A1C] flex-shrink-0" />
                <div className="font-sans">
                  <p className="text-xs font-bold uppercase tracking-wider text-white">{mailingQuantity.toLocaleString()} Local</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">Households</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-left">
                <TrendingUp className="h-7 w-7 text-[#FF4A1C] flex-shrink-0" />
                <div className="font-sans">
                  <p className="text-xs font-bold uppercase tracking-wider text-white">Trackable.</p>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-stone-400">Measurable. Real.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Complete Campaign Package Card) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end items-center z-10">
            <div className="w-full max-w-[420px] bg-[#12100F]/90 backdrop-blur-md border border-[#FF4A1C] p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-lg">
              <h2 className="font-headline font-black text-sm sm:text-base uppercase tracking-widest text-stone-300 border-b border-stone-850 pb-3 mb-5 select-none text-left">
                Complete Campaign Package
              </h2>
              <ul className="space-y-5 text-xs sm:text-sm font-sans font-bold uppercase tracking-wider text-white text-left">
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-[#FF4A1C] flex-shrink-0" />
                  <span>Direct Mail to {mailingQuantity.toLocaleString()} Households</span>
                </li>
                <li className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[#FF4A1C] flex-shrink-0" />
                  <span>Category Exclusivity Protection</span>
                </li>
                <li className="flex items-center gap-3">
                  <QrCode className="h-5 w-5 text-[#FF4A1C] flex-shrink-0" />
                  <span>QR Code Tracking & Analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <User className="h-5 w-5 text-[#FF4A1C] flex-shrink-0" />
                  <span>Digital Business Profile</span>
                </li>
                <li className="flex items-center gap-3">
                  <LinkIcon className="h-5 w-5 text-[#FF4A1C] flex-shrink-0" />
                  <span>Permanent SEO Backlink</span>
                </li>
                <li className="flex items-center gap-3">
                  <Pencil className="h-5 w-5 text-[#FF4A1C] flex-shrink-0" />
                  <span>Done-For-You Ad Design & Copy</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section (Light Theme) */}
      <section id="included" className="bg-[#FAF8F4] text-[#211D1C] py-20 px-6 sm:px-8 border-b border-[#E7E0D8] select-none scroll-mt-16">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-3">
            <h2 className="text-4xl sm:text-5xl md:text-[52px] font-headline font-black uppercase tracking-tight leading-none text-stone-900">
              What <span className="text-[#D13F1F]">You Get</span> With This Campaign
            </h2>
            <p className="text-base sm:text-lg text-stone-500 font-sans max-w-2xl mx-auto leading-relaxed">
              A proven local marketing system built to get you visibility, credibility, and more customers.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-x-6 gap-y-10">
            {/* Benefit 1 */}
            <div className="flex flex-col items-center text-center space-y-3.5">
              <div className="h-12 w-12 flex items-center justify-center text-[#D13F1F]">
                <Shield className="h-10 w-10 stroke-[1.25]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-headline font-black text-sm md:text-base uppercase tracking-wider leading-snug text-stone-900">
                  Exclusive Category <br className="hidden sm:inline" /> Protection
                </h3>
                <p className="text-xs md:text-[13px] text-stone-500 leading-relaxed font-sans max-w-[220px] mx-auto">
                  Only one business per category gets to advertise. You get the market to yourself.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="flex flex-col items-center text-center space-y-3.5">
              <div className="h-12 w-12 flex items-center justify-center text-[#D13F1F]">
                <Mail className="h-10 w-10 stroke-[1.25]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-headline font-black text-sm md:text-base uppercase tracking-wider leading-snug text-stone-900">
                  Mailed to {mailingQuantity.toLocaleString()} <br className="hidden sm:inline" /> Local Homes
                </h3>
                <p className="text-xs md:text-[13px] text-stone-500 leading-relaxed font-sans max-w-[220px] mx-auto">
                  High-impact postcard delivery to {mailingQuantity.toLocaleString()} households in {cityName}, {stateName}.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="flex flex-col items-center text-center space-y-3.5">
              <div className="h-12 w-12 flex items-center justify-center text-[#D13F1F]">
                <QrCode className="h-10 w-10 stroke-[1.25]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-headline font-black text-sm md:text-base uppercase tracking-wider leading-snug text-stone-900">
                  QR Code Tracking <br className="hidden sm:inline" /> & Analytics
                </h3>
                <p className="text-xs md:text-[13px] text-stone-500 leading-relaxed font-sans max-w-[220px] mx-auto">
                  Custom QR code on your postcard so you can track every scan and measure results.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="flex flex-col items-center text-center space-y-3.5">
              <div className="h-12 w-12 flex items-center justify-center text-[#D13F1F]">
                <User className="h-10 w-10 stroke-[1.25]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-headline font-black text-sm md:text-base uppercase tracking-wider leading-snug text-stone-900">
                  Digital Business <br className="hidden sm:inline" /> Profile
                </h3>
                <p className="text-xs md:text-[13px] text-stone-500 leading-relaxed font-sans max-w-[220px] mx-auto">
                  We build an SEO-optimized profile on NearHere to boost your online presence.
                </p>
              </div>
            </div>

            {/* Benefit 5 */}
            <div className="flex flex-col items-center text-center space-y-3.5">
              <div className="h-12 w-12 flex items-center justify-center text-[#D13F1F]">
                <LinkIcon className="h-10 w-10 stroke-[1.25]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-headline font-black text-sm md:text-base uppercase tracking-wider leading-snug text-stone-900">
                  Permanent SEO <br className="hidden sm:inline" /> Backlink
                </h3>
                <p className="text-xs md:text-[13px] text-stone-500 leading-relaxed font-sans max-w-[220px] mx-auto">
                  High-quality backlink to your website to strengthen search visibility.
                </p>
              </div>
            </div>

            {/* Benefit 6 */}
            <div className="flex flex-col items-center text-center space-y-3.5">
              <div className="h-12 w-12 flex items-center justify-center text-[#D13F1F]">
                <Pencil className="h-10 w-10 stroke-[1.25]" />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-headline font-black text-sm md:text-base uppercase tracking-wider leading-snug text-stone-900">
                  Done-For-You <br className="hidden sm:inline" /> Ad Design & Copy
                </h3>
                <p className="text-xs md:text-[13px] text-stone-500 leading-relaxed font-sans max-w-[220px] mx-auto">
                  Professional design, compelling copy, and print-ready postcards — we handle it all.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center font-mono text-xs md:text-sm font-bold uppercase tracking-widest text-stone-500 flex items-center justify-center gap-2 pt-4">
            <Star className="h-3 w-3 fill-[#D13F1F] text-[#D13F1F]" />
            <span>Local Exposure. Modern Results. Zero Guesswork.</span>
            <Star className="h-3 w-3 fill-[#D13F1F] text-[#D13F1F]" />
          </div>
        </div>
      </section>

      {/* Inquiry Form & Package Card Section */}
      <section id="inquiry-form" className="bg-[#1A1716] py-20 px-6 sm:px-8 border-b border-stone-900 scroll-mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">

          {/* Left Column - Dark Form Card */}
          <div className="lg:col-span-7 bg-[#12100F] border border-stone-850 p-6 sm:p-10 shadow-2xl relative">
            <div className="border-b border-stone-850 pb-6 mb-8 text-left">
              <h2 className="text-3xl sm:text-4xl font-headline font-black uppercase text-white leading-none">
                Reserve <span className="text-[#FF4A1C]">your spot</span>
              </h2>
              <p className="text-sm sm:text-base text-stone-400 font-sans mt-3 leading-relaxed max-w-xl">
                Want us to walk you through it? Send your info and we’ll help with pricing, category availability, and setup.
              </p>
            </div>

            <CampaignInquiryForm
              campaignId={campaign.id}
              campaignUrl={`/campaigns/${state}/${city}/${slug}`}
              facebookUrl={facebookUrl}
              source="CAMPAIGN_CONTACT_PAGE"
            />
          </div>

          {/* Right Column - Campaign Package Summary Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E7E0D8] shadow-xl overflow-hidden rounded-none">

              {/* Card Header */}
              <div className="bg-[#D13F1F] px-6 py-8 text-center text-white select-none">
                <h3 className="font-headline font-black text-3xl uppercase tracking-widest leading-none">
                  Campaign Package
                </h3>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/80 mt-2.5">
                  All of this. One simple investment.
                </p>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8 space-y-6 text-left text-stone-800">
                <ul className="space-y-5 text-sm select-none">
                  <li className="flex items-start gap-3">
                    <Check className="h-4.5 w-4.5 text-[#D13F1F] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        Direct Mail Reach
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        Mailed to {mailingQuantity.toLocaleString()} households in {cityName}, {stateName}.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <Check className="h-4.5 w-4.5 text-[#D13F1F] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        Category Exclusivity
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        100% category protection—only one business in your category.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <Check className="h-4.5 w-4.5 text-[#D13F1F] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        Digital Business Profile
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        SEO-optimized profile on NearHere to boost your online presence.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <Check className="h-4.5 w-4.5 text-[#D13F1F] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        Permanent SEO Backlink
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        High-quality backlink to strengthen search visibility.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <Check className="h-4.5 w-4.5 text-[#D13F1F] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        QR Code Tracking
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        Dynamic QR code on your postcard to track scans and engagement.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <Check className="h-4.5 w-4.5 text-[#D13F1F] flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        Professional Ad Design & Copy
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        Done-for-you design, copywriting, and print-ready postcards.
                      </span>
                    </div>
                  </li>
                </ul>

                {/* Bottom Note Box */}
                <div className="border border-stone-200 bg-stone-50 p-4 flex items-start gap-3 mt-4">
                  <ShieldCheck className="h-5.5 w-5.5 text-[#D13F1F] flex-shrink-0 mt-0.5" />
                  <div className="text-left select-none">
                    <h4 className="font-headline font-black text-sm uppercase tracking-wider text-stone-900">
                      Low Risk. High Impact.
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-normal font-sans">
                      Invest in visibility that drives real local results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Facebook Help Bar */}
        {facebookUrl && (
          <div className="max-w-7xl mx-auto mt-12 bg-white border border-[#E7E0D8] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center md:text-left">
              <div className="h-12 w-12 rounded-full bg-[#1877F2]/10 flex items-center justify-center text-[#1877F2] flex-shrink-0">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="text-left select-none">
                <h4 className="font-headline font-black text-lg sm:text-xl uppercase text-stone-900">
                  Prefer to chat first?
                </h4>
                <p className="text-sm text-stone-500 mt-1 font-sans">
                  Message us on Facebook and we’ll answer your questions right away.
                </p>
              </div>
            </div>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-transparent hover:bg-stone-50 border border-stone-300 text-stone-850 font-headline text-sm uppercase font-bold tracking-wider px-6 py-3 transition-colors rounded-none select-none text-center cursor-pointer"
            >
              Message Us On Facebook
            </a>
          </div>
        )}
      </section>

      {/* FAQ Section */}
      <FAQ city={campaign.city} state={campaign.state} mailingQuantity={campaign.mailingQuantity} />

      {/* Footer Strip */}
      <footer className="bg-black text-white/40 text-[10px] sm:text-xs font-mono uppercase tracking-widest py-6 px-6 border-t border-stone-900 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>Local Marketing That Works</div>
          <div className="text-stone-400 text-center sm:text-left">
            More Visibility. More Customers. <span className="text-[#D13F1F]">More Growth.</span>
          </div>
          <div>
            Powered by Near<span className="text-[#D13F1F]">Here</span>
          </div>
        </div>
      </footer>
    </main>
  )
}
