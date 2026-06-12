import { notFound } from "next/navigation"
import { db } from "@/server/db"
import crypto from "crypto"
import { headers } from "next/headers"
import Link from "next/link"
import type { Metadata } from "next"

interface BusinessPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ qr?: string; expired?: string }>
}

export async function generateMetadata({ params, searchParams }: BusinessPageProps): Promise<Metadata> {
  const { slug } = await params
  const business = await db.business.findUnique({
    where: { slug },
  })

  if (!business) {
    return {
      title: "Business Not Found | NearHere",
      description: "Business profile not found on NearHere.",
    }
  }

  const category = business.city ? "Local Business" : "Business"
  const cityStr = business.city ? business.city.charAt(0).toUpperCase() + business.city.slice(1) : "your area"

  return {
    title: `${business.name} | ${category} in ${cityStr} | NearHere`,
    description: `Learn about ${business.name}, a ${category.toLowerCase()} serving ${cityStr}. View their NearHere local offer, contact details, and website.`,
  }
}

export default async function BusinessProfilePage({ params, searchParams }: BusinessPageProps) {
  const { slug } = await params
  const { qr: qrSlug, expired } = await searchParams
  const isExpired = expired === "1"

  const business = await db.business.findUnique({
    where: { slug },
    include: {
      links: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  if (!business) {
    notFound()
  }

  // Load campaign and creative details
  let campaignOffer: string | null = null
  let campaignName: string | null = null
  let qrCodeId: string | null = null
  let campaignHeadline: string | null = null

  if (qrSlug) {
    const qrCode = await db.qrCode.findUnique({
      where: { slug: qrSlug },
      include: {
        order: {
          include: {
            creativeSubmission: true,
          },
        },
        campaign: true,
      },
    })

    if (qrCode) {
      qrCodeId = qrCode.id
      campaignName = qrCode.campaign?.name || null
      campaignOffer = qrCode.order?.creativeSubmission?.offerDeal || null
      campaignHeadline = qrCode.order?.creativeSubmission?.headline || null
    }
  }

  // Fallback: If no qr parameter, grab the latest creative submission's offer for this business
  if (!campaignOffer) {
    const latestOrder = await db.order.findFirst({
      where: {
        advertiserId: business.advertiserId || undefined,
        status: "PAID",
      },
      orderBy: { paidAt: "desc" },
      include: {
        creativeSubmission: true,
        campaign: true,
      },
    })

    if (latestOrder) {
      campaignOffer = latestOrder.creativeSubmission?.offerDeal || null
      campaignHeadline = latestOrder.creativeSubmission?.headline || null
      campaignName = latestOrder.campaign?.name || null
    }
  }

  // Log Page View
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || null
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || null
  const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : null

  // Simple bot detection
  const isBot = userAgent ? /bot|googlebot|crawler|spider|robot|crawling|lighthouse|pingdom|uptime|slurp|yahoo|bing|baidu|yandex/i.test(userAgent) : false

  if (!isBot) {
    try {
      await db.businessPageView.create({
        data: {
          businessId: business.id,
          qrCodeId,
          userAgent,
          ipHash,
        },
      })
    } catch (err) {
      console.error("[PAGE VIEW LOG ERROR] Failed to record page view:", err)
    }
  }

  // Helper to generate outbound link tracking urls
  const getClickTrackerUrl = (type: string, target: string, label: string) => {
    const params = new URLSearchParams({
      businessId: business.id,
      type,
      target,
      label,
    })
    if (qrSlug) {
      params.set("qr", qrSlug)
    }
    return `/api/business-click?${params.toString()}`
  }

  // Parse photos/additional images
  let photos: string[] = []
  if (business.advertiserId) {
    const latestOrder = await db.order.findFirst({
      where: { advertiserId: business.advertiserId, status: "PAID" },
      orderBy: { paidAt: "desc" },
      include: { creativeSubmission: true }
    })
    if (latestOrder?.creativeSubmission?.additionalImages) {
      try {
        photos = JSON.parse(latestOrder.creativeSubmission.additionalImages as string)
      } catch {
        photos = []
      }
    }
  }

  // Link icon mapping
  const linkIcons: Record<string, string> = {
    WEBSITE: "🔗",
    PHONE: "📞",
    BOOKING: "📅",
    FACEBOOK: "📘",
    INSTAGRAM: "📸",
    GOOGLE_MAPS: "📍",
    MENU: "🍽️",
    EMAIL: "✉️",
    CUSTOM: "🔗",
  }

  // Core CTA links
  const callCta = business.phone ? getClickTrackerUrl("PHONE", `tel:${business.phone}`, "Call Business") : null
  const websiteCta = business.website ? getClickTrackerUrl("WEBSITE", business.website, "Visit Website") : null
  const hasSocials = business.socialLinks ? typeof business.socialLinks === 'object' : false
  const socials = hasSocials ? (business.socialLinks as any) : null

  return (
    <div className="min-h-screen bg-paper text-press font-sans flex flex-col justify-between selection:bg-nh-red selection:text-paper">
      
      {/* Cover Image Header */}
      <header className="relative h-48 md:h-64 bg-press overflow-hidden shrink-0 select-none">
        {business.coverImageUrl ? (
          <img
            src={business.coverImageUrl}
            alt={business.name}
            className="w-full h-full object-cover opacity-85 filter brightness-90"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#211D1C] to-[#423a38] flex items-center justify-center opacity-90">
            <span className="font-headline font-black text-2xl tracking-widest text-[#FAF8F4]/20 uppercase">
              {business.name}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#211D1C] to-transparent opacity-60" />
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-lg w-full mx-auto px-4 -mt-16 relative z-10 space-y-6">
        
        {/* Profile Card */}
        <section className="bg-[#FAF8F4] border-2 border-press shadow-[0_12px_30px_rgba(33,29,28,0.08)] p-6 rounded-none text-center space-y-4">
          
          {/* Logo */}
          <div className="w-24 h-24 rounded-none border-2 border-press bg-[#FAF8F4] mx-auto -mt-20 flex items-center justify-center overflow-hidden shadow-md">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
            ) : (
              <div className="font-headline font-extrabold text-2xl text-press uppercase">
                {business.name.slice(0, 2)}
              </div>
            )}
          </div>

          {/* Business Details */}
          <div>
            <h1 className="font-headline font-extrabold uppercase text-xl md:text-2xl leading-none tracking-tight text-press">
              {business.name}
            </h1>
            {campaignName && (
              <span className="inline-block mt-3 text-[10px] font-mono font-bold uppercase border border-gold text-gold bg-transparent px-2.5 py-1">
                Featured in the {campaignName} NearHere Mailer
              </span>
            )}
          </div>

          {/* Copy description */}
          <p className="text-xs text-warm leading-relaxed">
            {business.name} is a featured local business in the {campaignName || "NearHere"} mailer. View their local offer, contact details, service area, and website.
          </p>

          <hr className="border-rule" />

          {/* About Section */}
          <div className="text-left space-y-2">
            <h2 className="font-headline font-bold text-sm uppercase tracking-wider text-press">
              About {business.name}
            </h2>
            {business.description ? (
              <p className="text-sm text-warm leading-relaxed font-medium">
                {business.description}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic">No description provided yet.</p>
            )}
          </div>

          {/* Core Call to Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {callCta && (
              <a
                href={callCta}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-nh-red hover:bg-[#B53A1A] text-paper font-bold uppercase tracking-wider text-xs border border-press transition-colors shadow-sm font-headline"
              >
                📞 Call Business
              </a>
            )}
            {websiteCta && (
              <a
                href={websiteCta}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-press hover:bg-[#3D3533] text-paper font-bold uppercase tracking-wider text-xs border border-press transition-colors shadow-sm font-headline"
              >
                🔗 Visit Website
              </a>
            )}
          </div>
        </section>

        {/* Offer Details */}
        {campaignOffer && (
          <section className={`p-5 border-2 rounded-none text-left ${
            isExpired 
              ? "bg-[#FBEBE8] border-[#E85D44] text-[#801B0B]" 
              : "bg-[#FDF9F2] border-gold text-[#5C4212]"
          }`}>
            <h2 className="font-headline font-extrabold text-sm uppercase tracking-wide leading-none text-press">
              NearHere Local Offer
            </h2>
            {campaignHeadline && (
              <p className="text-xs font-mono uppercase tracking-wider text-warm mt-2 font-bold">
                {campaignHeadline}
              </p>
            )}
            <p className="text-xl font-headline font-black uppercase text-nh-red mt-2.5 leading-none tracking-tight">
              {campaignOffer}
            </p>
            
            <p className="text-[11px] font-medium leading-relaxed mt-3 text-press/80">
              {isExpired 
                ? "This postcard offer has expired, but you can still contact the business using the links below."
                : "Mention the NearHere postcard or present this page to claim this local offer."
              }
            </p>

            {!isExpired && (
              <div className="mt-4">
                <button 
                  onClick={() => alert(`Offer Code: NEARHERE-${slug.toUpperCase()}`)}
                  className="px-4 py-2 border border-press bg-press text-paper hover:bg-[#3D3533] text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Claim Offer
                </button>
              </div>
            )}
          </section>
        )}

        {/* Service Area */}
        <section className="bg-white border border-rule p-6 rounded-none text-left space-y-3 shadow-sm">
          <h2 className="font-headline font-bold text-sm uppercase tracking-wider text-press">
            Service Area
          </h2>
          <p className="text-sm text-warm font-medium">
            📍 {business.serviceArea || business.address || "Serving Bexar County & local neighborhoods"}
          </p>
          {business.address && (
            <p className="text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
              Address: {business.address} {business.city && `, ${business.city}`} {business.state && ` ${business.state}`}
            </p>
          )}
        </section>

        {/* Contact & Hours */}
        <section className="bg-white border border-rule p-6 rounded-none text-left space-y-4 shadow-sm">
          <h2 className="font-headline font-bold text-sm uppercase tracking-wider text-press">
            Contact {business.name}
          </h2>
          
          <div className="space-y-3 font-mono text-xs">
            {business.phone && (
              <div className="flex justify-between border-b border-rule pb-1.5">
                <span className="text-warm uppercase">Phone</span>
                <span className="font-sans font-bold text-press">{business.phone}</span>
              </div>
            )}
            {business.email && (
              <div className="flex justify-between border-b border-rule pb-1.5">
                <span className="text-warm uppercase">Email</span>
                <span className="font-sans font-bold text-press">{business.email}</span>
              </div>
            )}
            {business.hours && (
              <div className="flex justify-between border-b border-rule pb-1.5">
                <span className="text-warm uppercase">Hours</span>
                <span className="font-sans font-bold text-press text-right">{business.hours}</span>
              </div>
            )}
          </div>

          {/* Social Links rendering */}
          {socials && (socials.facebook || socials.instagram || socials.twitter) && (
            <div className="pt-2">
              <p className="text-[10px] font-mono font-bold text-warm uppercase tracking-widest mb-2">Connect on Social</p>
              <div className="flex gap-3">
                {socials.facebook && (
                  <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-press text-paper hover:bg-[#3D3533] text-[10px] font-bold uppercase tracking-wider transition-colors border border-press">
                    Facebook
                  </a>
                )}
                {socials.instagram && (
                  <a href={socials.instagram} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-press text-paper hover:bg-[#3D3533] text-[10px] font-bold uppercase tracking-wider transition-colors border border-press">
                    Instagram
                  </a>
                )}
                {socials.twitter && (
                  <a href={socials.twitter} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-press text-paper hover:bg-[#3D3533] text-[10px] font-bold uppercase tracking-wider transition-colors border border-press">
                    Twitter / X
                  </a>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Gallery Section */}
        {photos.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-mono font-bold text-xs uppercase tracking-widest text-warm text-left pl-1">
              Showcase Gallery
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {photos.map((url, idx) => (
                <div key={idx} className="relative aspect-square border border-rule bg-white overflow-hidden shadow-sm">
                  <img src={url} alt={`${business.name} showcase`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Additional Custom Links list */}
        {business.links.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-mono font-bold text-xs uppercase tracking-widest text-warm text-left pl-1">
              Links & Info
            </h2>
            <div className="space-y-2">
              {business.links.map((link) => (
                <a
                  key={link.id}
                  href={getClickTrackerUrl(link.type, link.url, link.label)}
                  className="flex items-center justify-between p-4 bg-[#FAF8F4] border border-rule hover:border-press text-press hover:bg-[#FAF8F4] transition-all group shadow-sm select-none"
                >
                  <span className="flex items-center gap-3 text-sm font-semibold">
                    <span className="text-lg">{linkIcons[link.type] || "🔗"}</span>
                    <span>{link.label}</span>
                  </span>
                  <span className="text-xs text-warm group-hover:text-press transition-colors font-bold">
                    ➔
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="py-8 text-center mt-12 border-t border-rule bg-press/5 select-none shrink-0">
        <Link href="/" className="font-headline font-black text-lg tracking-tighter text-nh-red hover:opacity-95 flex items-center justify-center gap-0.5">
          <span className="text-press">Near</span>Here
        </Link>
        <p className="text-[9px] font-mono tracking-widest uppercase text-warm mt-1.5">
          Powered by NearHere Local Advertising
        </p>
      </footer>

    </div>
  )
}
