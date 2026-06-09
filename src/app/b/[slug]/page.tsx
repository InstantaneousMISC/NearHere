import { notFound } from "next/navigation"
import { db } from "@/server/db"
import crypto from "crypto"
import { headers } from "next/headers"
import Link from "next/link"

interface BusinessPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ qr?: string; expired?: string }>
}

export default async function BusinessLandingPage({ params, searchParams }: BusinessPageProps) {
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

  // Load campaign offer if qr code slug context exists
  let campaignOffer: string | null = null
  let campaignName: string | null = null
  let qrCodeId: string | null = null

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
      campaignName = latestOrder.campaign?.name || null
    }
  }

  // Log Page View
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || null
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || headersList.get("x-real-ip") || null
  const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : null

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
  const callCta = business.phone ? getClickTrackerUrl("PHONE", `tel:${business.phone}`, "Call Now") : null
  const websiteCta = business.website ? getClickTrackerUrl("WEBSITE", business.website, "Website") : null
  
  // Find booking link or maps link from custom links list
  const bookingLink = business.links.find((l) => l.type === "BOOKING")
  const bookingCta = bookingLink ? getClickTrackerUrl("BOOKING", bookingLink.url, bookingLink.label) : null

  const mapLink = business.links.find((l) => l.type === "GOOGLE_MAPS")
  const mapCta = mapLink ? getClickTrackerUrl("GOOGLE_MAPS", mapLink.url, mapLink.label) : null

  // Rest of links
  const otherLinks = business.links.filter(
    (l) => l.id !== bookingLink?.id && l.id !== mapLink?.id
  )

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
            {business.address && (
              <p className="text-[10px] font-mono font-bold text-warm uppercase tracking-wider mt-1.5">
                📍 {business.address} {business.city && `, ${business.city}`} {business.state && ` ${business.state}`}
              </p>
            )}
          </div>

          {business.description && (
            <p className="text-sm text-warm leading-relaxed font-medium">
              {business.description}
            </p>
          )}

          {/* Core Call to Actions */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {callCta && (
              <a
                href={callCta}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-nh-red hover:bg-[#B53A1A] text-paper font-bold uppercase tracking-wider text-xs border border-press transition-colors shadow-sm"
              >
                📞 Call Now
              </a>
            )}
            {websiteCta && (
              <a
                href={websiteCta}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-press hover:bg-[#3D3533] text-paper font-bold uppercase tracking-wider text-xs border border-press transition-colors shadow-sm"
              >
                🌐 Website
              </a>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {bookingCta && (
              <a
                href={bookingCta}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FAF8F4] hover:bg-[#E7E0D8] text-press font-bold uppercase tracking-wider text-[11px] border border-press transition-colors"
              >
                📅 Book Appointment
              </a>
            )}
            {mapCta && (
              <a
                href={mapCta}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#FAF8F4] hover:bg-[#E7E0D8] text-press font-bold uppercase tracking-wider text-[11px] border border-press transition-colors"
              >
                🗺️ Get Directions
              </a>
            )}
          </div>

        </section>

        {/* Postcard Expiry Banner / Offer details */}
        {campaignOffer && (
          <section className={`p-5 border-2 rounded-none ${
            isExpired 
              ? "bg-[#FBEBE8] border-[#E85D44] text-[#801B0B]" 
              : "bg-[#FDF9F2] border-gold text-[#5C4212]"
          }`}>
            <h3 className="font-headline font-extrabold text-sm uppercase tracking-wide leading-none">
              {isExpired ? "⚠️ Postcard Offer Expired" : "📬 Exclusive Postcard Offer"}
            </h3>
            
            <p className="text-xl font-headline font-black uppercase text-nh-red mt-2 leading-none tracking-tight">
              {campaignOffer}
            </p>
            
            <p className="text-[11px] font-medium leading-relaxed mt-2 text-press/80">
              {isExpired 
                ? "This postcard offer has expired, but you can still contact the business using the links below."
                : `Mention this postcard when contacting ${business.name}.`
              }
            </p>
            {campaignName && (
              <span className="inline-block mt-3 text-[9px] font-mono font-bold uppercase bg-press/5 px-2 py-0.5 text-warm">
                Campaign: {campaignName}
              </span>
            )}
          </section>
        )}

        {/* Custom Outbound Links Section */}
        {otherLinks.length > 0 && (
          <section className="space-y-3">
            <h2 className="font-mono font-bold text-xs uppercase tracking-widest text-warm text-left pl-1">
              Links & Info
            </h2>
            <div className="space-y-2">
              {otherLinks.map((link) => (
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
          Powered by NearHere Neighborhood Mailers
        </p>
      </footer>

    </div>
  )
}
