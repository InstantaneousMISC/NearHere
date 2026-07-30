import { db } from "@/server/db"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import type { Metadata } from "next"
import { normalizeCity, normalizeState } from "@/server/helpers/directorySync"
import {
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Phone,
  Mail,
  Clock,
  Globe,
  Tag,
  Wrench,
  Droplets,
  Wind,
  Zap,
  Flame,
  Search,
  Calendar,
  Award,
  Star,
  Users,
  ChevronRight,
  Store,
} from "lucide-react"

interface BusinessPageProps {
  params: Promise<{ state: string; city: string; category: string; business: string }>
}

// Helper to find the primary canonical path for a directory profile
async function getPrimaryCanonicalPath(slug: string) {
  const profile = await db.directoryProfile.findUnique({
    where: { slug },
    include: {
      locations: {
        where: { status: "PUBLISHED" },
        include: { city: { include: { state: true } } },
        orderBy: { createdAt: "asc" },
      },
      categories: {
        include: { directoryCategory: true },
      },
    },
  })

  if (!profile || profile.locations.length === 0) return null
  const primaryLoc = profile.locations[0]
  const catSlug = profile.categories?.[0]?.directoryCategory?.slug || "general"
  return `/directory/${primaryLoc.city.state.slug}/${primaryLoc.city.slug}/businesses/${catSlug}/${profile.slug}`
}

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, category: categorySlug, business: businessSlug } = await params
  
  const profile = await db.directoryProfile.findUnique({
    where: { slug: businessSlug },
    include: { 
      business: true,
      categories: {
        include: { directoryCategory: true },
      },
    },
  })

  const isActive = profile?.business ? (profile.business.goodStanding && !profile.business.deletedAt) : (profile?.status === "PUBLISHED")

  if (!profile || !isActive) {
    return {
      title: "Business Profile Not Found | NearHere",
      description: "The requested business profile was not found.",
    }
  }

  const catSlug = profile.categories?.[0]?.directoryCategory?.slug || "general"
  const primaryPath = await getPrimaryCanonicalPath(profile.slug) || `/directory/${stateSlug}/${citySlug}/businesses/${catSlug}/${profile.slug}`
  
  return {
    title: `${profile.name} | Verified Business Profile | NearHere`,
    description: profile.description 
      ? profile.description.substring(0, 155) 
      : `View verified details, service areas, contact information, and postcard specials for ${profile.name} on NearHere.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${primaryPath}`,
    },
    robots: {
      index: profile.isIndexed === "INDEX",
      follow: true,
    },
  }
}

// ─── Reusable Components ──────────────────────────────────────────────────────

interface SectionHeadingProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
}

function SectionHeading({ icon, title, subtitle }: SectionHeadingProps) {
  return (
    <div className="space-y-1.5 text-left">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-[#ff431f]">
            {icon}
          </div>
        )}
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 font-sans">
          {title}
        </h2>
      </div>
      <div className="mt-3 h-1 w-10 rounded-full bg-[#ff431f]" />
      {subtitle && <p className="text-xs text-neutral-500 mt-1 font-medium">{subtitle}</p>}
    </div>
  )
}

interface ProfileSectionProps {
  children: React.ReactNode
  className?: string
}

function ProfileSection({ children, className = "" }: ProfileSectionProps) {
  return (
    <section className={`rounded-2xl border border-[#e5e0d8] bg-white p-6 sm:p-8 shadow-[0_5px_20px_rgba(20,20,20,0.04)] text-left space-y-6 ${className}`}>
      {children}
    </section>
  )
}

interface BusinessActionCardProps {
  profile: any
  businessType: string
  className?: string
  isMobile?: boolean
}

function BusinessActionCard({ profile, businessType, className = "", isMobile = false }: BusinessActionCardProps) {
  const nameInitials = profile.name.slice(0, 2).toUpperCase()
  
  return (
    <div className={`w-full bg-white border border-neutral-200 p-6 sm:p-8 rounded-2xl shadow-[0_18px_50px_rgba(0,0,0,0.12)] text-center relative overflow-visible ${isMobile ? "mt-0" : "lg:-mt-20"} ${className}`}>
      {/* Logo / Avatar overlapping card top */}
      <div className="w-20 h-20 rounded-full border-4 border-white bg-white mx-auto -mt-16 sm:-mt-20 flex items-center justify-center overflow-hidden shadow-lg select-none">
        {profile.logoUrl ? (
          <img src={profile.logoUrl} alt={`${profile.name} logo`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#12100F] flex items-center justify-center text-white font-headline font-black text-xl">
            {nameInitials}
          </div>
        )}
      </div>

      {/* Title */}
      <h2 className="font-headline font-black text-lg md:text-xl uppercase text-neutral-900 tracking-tight leading-tight mt-4 mb-2">
        {profile.name}
      </h2>

      {/* Category tag */}
      <span className="inline-block px-3 py-0.5 bg-orange-500/10 border border-orange-500/20 text-[#ff431f] text-[9px] font-mono font-bold uppercase tracking-wider rounded-md mb-6">
        {businessType}
      </span>

      {/* Action buttons */}
      <div className="space-y-3 w-full">
        {profile.phone && (
          <a
            href={`tel:${profile.phone}`}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#ff431f] hover:bg-[#e93616] active:translate-y-0 text-white font-bold text-sm rounded-xl transition hover:-translate-y-0.5 shadow-sm cursor-pointer select-none border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 min-h-[44px]"
          >
            <Phone className="h-4 w-4 shrink-0" />
            <span>Call Business</span>
          </a>
        )}
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="nofollow sponsored"
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-white hover:bg-orange-50 text-neutral-900 font-semibold text-sm border border-neutral-300 hover:border-orange-400 transition-all rounded-xl cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 min-h-[44px]"
          >
            <Globe className="h-4 w-4 text-[#ff431f] shrink-0" />
            <span>Visit Website</span>
          </a>
        )}
      </div>

      {/* Verification footer */}
      <div className="border-t border-neutral-100 pt-4 mt-6 flex items-center justify-center gap-2 text-[10px] font-mono font-bold uppercase text-neutral-500 select-none">
        <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
        <span>Verified Business</span>
      </div>
    </div>
  )
}

interface BusinessDetailRowProps {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

function BusinessDetailRow({ icon, label, value }: BusinessDetailRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-100 last:border-0 text-left">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 shrink-0 mt-0.5">
        <span className="text-orange-500">{icon}</span>
        <span>{label}</span>
      </span>
      <span className="text-sm font-semibold text-neutral-900 text-right break-all ml-4">
        {value}
      </span>
    </div>
  )
}

interface ServiceCardProps {
  name: string
  icon: React.ReactNode
  description?: string
}

function ServiceCard({ name, icon, description }: ServiceCardProps) {
  return (
    <div className="group rounded-2xl border border-[#F0E6DD] bg-white p-5 flex flex-col items-center text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-300 hover:bg-orange-50/20 hover:shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#ff431f] transition-colors group-hover:bg-[#ff431f] group-hover:text-white shrink-0">
        {icon}
      </div>
      <h3 className="mt-4 text-xs sm:text-sm font-bold text-neutral-950 font-sans leading-tight">
        {name}
      </h3>
      {description && (
        <p className="mt-2 text-[10px] sm:text-[11px] leading-normal text-neutral-500 font-medium max-w-[150px]">
          {description}
        </p>
      )}
    </div>
  )
}

interface DirectoryCategoryRowProps {
  name: string
  icon: React.ReactNode
  href: string
}

function DirectoryCategoryRow({ name, icon, href }: DirectoryCategoryRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between p-3 bg-[#fbfaf8] border border-neutral-200 hover:border-orange-300 hover:bg-orange-50/40 text-neutral-700 hover:text-neutral-950 transition-all group rounded-xl select-none"
    >
      <span className="flex items-center gap-2.5 text-xs font-semibold text-neutral-800">
        <span className="text-neutral-400 group-hover:text-[#ff431f] transition-colors">
          {icon}
        </span>
        <span>{name}</span>
      </span>
      <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-[#ff431f] transition-colors shrink-0" />
    </Link>
  )
}

// Common service description helper
function getServiceDescription(name: string): string {
  const lower = name.toLowerCase()
  
  // Emergency
  if (lower.includes("emerg") || lower.includes("24/7") || lower.includes("24 hour")) {
    return "Around-the-clock rapid response to resolve urgent issues before damage spreads."
  }
  // Plumbing
  if (lower.includes("drain") || lower.includes("sewer")) {
    return "Clear blockages and restore optimal flow to your drains and sewer lines."
  }
  if (lower.includes("leak detect")) {
    return "Non-invasive electronic leak detection to locate and fix hidden water leaks."
  }
  if (lower.includes("water heater")) {
    return "Professional installation, repair, and maintenance for tank and tankless systems."
  }
  if (lower.includes("plumbing repair")) {
    return "Fast and reliable repairs for toilets, faucets, pipes, and fixtures."
  }
  // HVAC
  if (lower.includes("ac install") || lower.includes("cooling install")) {
    return "Energy-efficient cooling system upgrades tailored to your home or office."
  }
  if (lower.includes("ac repair") || lower.includes("cooling repair")) {
    return "Diagnostic and repairs to restore your air conditioning quickly."
  }
  if (lower.includes("heating repair") || lower.includes("furnace repair")) {
    return "Expert troubleshooting and repairs for furnaces, heat pumps, and boilers."
  }
  if (lower.includes("duct clean")) {
    return "Improve indoor air quality by removing dust, debris, and allergens from ducts."
  }
  if (lower.includes("thermostat")) {
    return "Smart thermostat installation and calibration to optimize energy efficiency."
  }
  // Electricians
  if (lower.includes("wiring") || lower.includes("rewiring")) {
    return "Safe and code-compliant electrical wiring for renovations and upgrades."
  }
  if (lower.includes("panel upgrade") || lower.includes("electrical panel")) {
    return "Enhance capacity and safety with modern service panel replacements."
  }
  if (lower.includes("lighting")) {
    return "Installation of energy-efficient interior, exterior, and landscape lighting."
  }
  // Water Restoration
  if (lower.includes("water extract")) {
    return "Immediate removal of standing water to minimize flood and water damage."
  }
  if (lower.includes("mold remed")) {
    return "Safe identification, containment, and removal of mold and spores."
  }
  if (lower.includes("dehumid")) {
    return "Moisture control and drying solutions to prevent structural issues."
  }
  if (lower.includes("flood cleanup")) {
    return "Comprehensive cleanup, sanitization, and restoration after flooding."
  }
  // General Service Action keywords
  if (lower.includes("install")) {
    return `Professional installation of ${lower.replace("installation", "").replace("install", "").trim() || "systems"} for lasting results.`
  }
  if (lower.includes("repair")) {
    return `Expert troubleshooting and repair services to restore optimal performance.`
  }
  if (lower.includes("clean") || lower.includes("washing")) {
    return `Thorough cleaning and sanitization services using professional grade tools.`
  }
  if (lower.includes("inspect") || lower.includes("audit") || lower.includes("diagnos")) {
    return "Comprehensive inspection and diagnostics to identify potential issues."
  }
  if (lower.includes("estimat")) {
    return "No-obligation detailed cost estimates and consultation for your project."
  }
  if (lower.includes("consult")) {
    return "Expert guidance and personalized recommendations tailored to your goals."
  }
  if (lower.includes("delivery")) {
    return "Fast, secure, and reliable delivery services directly to your door."
  }
  if (lower.includes("maintenance") || lower.includes("prevent")) {
    return "Scheduled tune-ups and preventative care to prolong system lifespan."
  }
  if (lower.includes("support")) {
    return "Dedicated assistance and troubleshooting to address your needs."
  }
  if (lower.includes("orders")) {
    return "Customized orders and specialized solutions made just for you."
  }
  
  // Category specific fallbacks
  if (lower.includes("pest") || lower.includes("termite") || lower.includes("rodent")) {
    return "Eco-friendly treatments to eliminate pests and protect your property."
  }
  if (lower.includes("lawn") || lower.includes("mow") || lower.includes("sod") || lower.includes("garden")) {
    return "Professional lawn care and landscaping services to beautify your yard."
  }
  if (lower.includes("paint")) {
    return "Premium interior and exterior painting with immaculate preparation and finish."
  }
  if (lower.includes("dent")) {
    return "Gentle and comprehensive dental care to maintain your healthy smile."
  }
  if (lower.includes("chiro")) {
    return "Chiropractic adjustments and wellness plans to relieve pain and improve mobility."
  }
  if (lower.includes("auto")) {
    return "Complete automotive diagnostics, repair, and scheduled maintenance."
  }
  if (lower.includes("tree")) {
    return "Safe tree trimming, removal, and stump grinding by experienced crews."
  }
  if (lower.includes("lock") || lower.includes("key")) {
    return "Secure residential and commercial locksmithing and emergency lockout help."
  }
  if (lower.includes("gym") || lower.includes("fit") || lower.includes("train")) {
    return "Customized personal training and fitness plans to reach your wellness goals."
  }
  if (lower.includes("salon") || lower.includes("hair") || lower.includes("styl")) {
    return "Professional haircuts, styling, coloring, and grooming services."
  }
  if (lower.includes("spa") || lower.includes("massag")) {
    return "Relaxing massage therapy and skin treatments to rejuvenate mind and body."
  }
  if (lower.includes("catering") || lower.includes("dining") || lower.includes("dine")) {
    return "Delicious food preparation, dine-in service, or catering for any occasion."
  }
  if (lower.includes("real estate") || lower.includes("home")) {
    return "Trusted listing, buying, and property management representation."
  }
  if (lower.includes("tax") || lower.includes("account") || lower.includes("payroll")) {
    return "Accurate bookkeeping, tax preparation, and accounting consultations."
  }
  if (lower.includes("legal") || lower.includes("law") || lower.includes("will")) {
    return "Professional legal counsel and contract drafting for personal or business issues."
  }
  if (lower.includes("child") || lower.includes("daycare") || lower.includes("school")) {
    return "Safe, nurturing, and educational child care programs for early development."
  }
  
  // Generic fallback
  return "High-quality, professional service customized to meet your specific needs."
}

// Service icon helper
function getServiceIcon(name: string) {
  const lower = name.toLowerCase()
  if (lower.includes("drain") || lower.includes("clean") || lower.includes("water") || lower.includes("flood") || lower.includes("extraction") || lower.includes("sewers") || lower.includes("muck")) {
    return <Droplets className="h-6 w-6" />
  }
  if (lower.includes("heater") || lower.includes("flame") || lower.includes("heat")) {
    return <Flame className="h-6 w-6" />
  }
  if (lower.includes("electric") || lower.includes("wire") || lower.includes("power") || lower.includes("zap") || lower.includes("lighting")) {
    return <Zap className="h-6 w-6" />
  }
  if (lower.includes("detect") || lower.includes("search") || lower.includes("leak") || lower.includes("inspect")) {
    return <Search className="h-6 w-6" />
  }
  if (lower.includes("emerg") || lower.includes("clock") || lower.includes("time") || lower.includes("24")) {
    return <Clock className="h-6 w-6" />
  }
  if (lower.includes("ac") || lower.includes("cool") || lower.includes("air") || lower.includes("vent") || lower.includes("wind") || lower.includes("duct")) {
    return <Wind className="h-6 w-6" />
  }
  if (lower.includes("mold") || lower.includes("fungus") || lower.includes("spore")) {
    return <ShieldAlert className="h-6 w-6" />
  }
  return <Wrench className="h-6 w-6" />
}

export default async function DirectoryBusinessProfilePage({ params }: BusinessPageProps) {
  const { state: stateSlug, city: citySlug, category: categorySlug, business: businessSlug } = await params

  // Load the directory profile
  const profile = await db.directoryProfile.findUnique({
    where: { slug: businessSlug },
    include: {
      locations: {
        where: { status: "PUBLISHED" },
        include: { city: { include: { state: true } } },
      },
      categories: {
        include: { directoryCategory: true },
      },
      links: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
      business: {
        include: {
          offers: {
            where: {
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
            orderBy: [{ expiresAt: "asc" }, { createdAt: "desc" }],
          },
          advertiser: {
            include: {
              orders: {
                where: { status: "PAID" },
                orderBy: { paidAt: "desc" },
                include: { 
                  creativeSubmission: true, 
                  campaign: true,
                  campaignSpot: {
                    include: { category: true }
                  }
                },
              },
            },
          },
        },
      },
    },
  })

  const isActive = profile?.business ? (profile.business.goodStanding && !profile.business.deletedAt) : (profile?.status === "PUBLISHED")

  if (!profile || !isActive) {
    notFound()
  }

  // Ensure current path location matches a registered location or falls back to business city/state
  let currentLocation = profile.locations.find(
    (loc) => loc.city.slug === citySlug && loc.city.state.slug === stateSlug
  )

  if (!currentLocation) {
    const bState = profile.business?.state?.trim().toLowerCase() || "tx"
    const bCity = profile.business?.city?.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "converse"
    if (stateSlug === bState && citySlug === bCity) {
      currentLocation = {
        id: "virtual-location",
        directoryProfileId: profile.id,
        cityId: "virtual-city",
        address: profile.address,
        phone: profile.phone,
        hours: profile.hours,
        status: "PUBLISHED" as any,
        isIndexed: "INDEX" as any,
        createdAt: new Date(),
        updatedAt: new Date(),
        city: {
          id: "virtual-city",
          name: profile.business?.city || "Converse",
          slug: bCity,
          stateId: "virtual-state",
          status: "PUBLISHED" as any,
          isIndexed: "INDEX" as any,
          metaTitle: null,
          metaDescription: null,
          introCopy: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          state: {
            id: "virtual-state",
            name: profile.business?.state || "Texas",
            slug: bState,
            status: "PUBLISHED" as any,
            isIndexed: "INDEX" as any,
            metaTitle: null,
            metaDescription: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }
      }
    } else {
      notFound()
    }
  }

  // Load offer from creative submission or check legacy business offer
  const latestOrder = profile.business?.advertiser?.orders?.[0]
  const creative = latestOrder?.creativeSubmission
  const campaignOffer = creative?.offerDeal || null
  const campaignHeadline = creative?.headline || null
  const campaignName = latestOrder?.campaign?.name || null
  const customOffers = profile.business?.offers || []
  const campaignHistory = Array.from(
    new Map(
      (profile.business?.advertiser?.orders || []).map((order) => [
        order.campaignId,
        {
          id: order.campaignId,
          name: order.campaign.name,
          city: order.campaign.city,
          state: order.campaign.state,
          date: order.campaign.estimatedMailDate || order.paidAt || order.createdAt,
          category: order.campaignSpot.category.name,
        },
      ])
    ).values()
  )

  // Parse photos/additional images from creative submission
  let photos: string[] = []
  if (creative?.additionalImages) {
    try {
      photos = JSON.parse(creative.additionalImages as string)
    } catch {
      photos = []
    }
  }

  // Fetch related businesses in the same city & category
  const relatedJoins = await db.businessDirectoryCategory.findMany({
    where: {
      directoryCategoryId: { in: profile.categories.map((c) => c.directoryCategoryId) },
      directoryProfileId: { not: profile.id },
      directoryProfile: {
        status: "PUBLISHED",
        locations: {
          some: {
            cityId: currentLocation.cityId,
            status: "PUBLISHED",
          },
        },
      },
    },
    include: {
      directoryProfile: {
        include: {
          categories: {
            include: { directoryCategory: true }
          }
        }
      },
    },
    take: 3,
  })
  const relatedBusinesses = relatedJoins.map((rj) => rj.directoryProfile)

  // Structured LocalBusiness Schema
  const hasAddress = !!profile.address || (!!currentLocation.city.name && !!currentLocation.city.state.slug)
  const schemaJson = (profile.phone || profile.website) && hasAddress ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": profile.name,
    "image": profile.logoUrl || undefined,
    "telephone": profile.phone || undefined,
    "url": profile.website || undefined,
    "description": profile.description || undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": profile.address || undefined,
      "addressLocality": currentLocation.city.name,
      "addressRegion": currentLocation.city.state.slug.toUpperCase(),
    },
  } : null

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

  // Popular Categories sidebar list
  const popularCategoriesList = [
    { name: "Plumbing", slug: "plumbing", icon: <Wrench className="h-4 w-4" /> },
    { name: "HVAC", slug: "hvac", icon: <Wind className="h-4 w-4" /> },
    { name: "Electricians", slug: "electricians", icon: <Zap className="h-4 w-4" /> },
    { name: "Water Damage Restoration", slug: "water-damage-restoration", icon: <Droplets className="h-4 w-4" /> },
  ]

  // Resolve category name and slug
  const businessType = profile.categories?.[0]?.directoryCategory?.name 
    || (profile.business as any)?.advertiser?.orders?.[0]?.campaignSpot?.category?.name 
    || "Local Services"

  const currentCategorySlug = profile.categories?.[0]?.directoryCategory?.slug 
    || (profile.business as any)?.advertiser?.orders?.[0]?.campaignSpot?.category?.slug 
    || "general"

  // Demo Fallback / Dynamic Logic
  const isConversePlumbing = profile.slug === "converse-plumbing-pros"
  const establishedYear = profile.establishedYear || (isConversePlumbing ? "2016" : null)
  const licenseNumber = profile.licenseNumber || (isConversePlumbing ? "M-42678" : null)
  const hasFamilyOwned = isConversePlumbing || (profile.description ? profile.description.toLowerCase().includes("family-owned") : false)
  const has247 = isConversePlumbing || (profile.hours ? (profile.hours.toLowerCase().includes("24 hours") || profile.hours.toLowerCase().includes("24/7")) : false)

  // Parse & filter services list to ensure quality
  const rawServices: any[] = profile.services && Array.isArray(profile.services)
    ? (profile.services as any[])
    : (isConversePlumbing ? [
        "Plumbing Repairs",
        "Drain Cleaning",
        "Water Heaters",
        "Leak Detection",
        "Emergency Service"
      ] : [])

  const cleanedServicesList = rawServices
    .map((item) => {
      const name = (typeof item === "string" ? item : item?.name || "").trim()
      const customDesc = typeof item === "string" ? undefined : item?.description || undefined
      return { name, customDesc }
    })
    .filter((s) => {
      const lower = s.name.toLowerCase()
      return s.name.length > 2 && !/^[a-z0-9]{15,}$/i.test(s.name) && !lower.includes("nonsense")
    })

  // Deduplicate by name
  const seenNames = new Set<string>()
  const finalServicesList: { name: string; description: string }[] = []
  
  for (const s of cleanedServicesList) {
    if (!seenNames.has(s.name.toLowerCase())) {
      seenNames.add(s.name.toLowerCase())
      // Use custom description if supplied, otherwise lookup prepopulated description
      const description = s.customDesc || getServiceDescription(s.name)
      finalServicesList.push({ name: s.name, description })
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f5f1] text-press font-sans flex flex-col justify-between selection:bg-[#ff431f] selection:text-white">
      
      {/* Schema Injection */}
      {schemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
        />
      )}

      {/* Navigation */}
      <div className="directory-dark bg-[#12100F]">
        <CampaignNav
          state={profile.business?.advertiser?.orders?.[0]?.campaign?.state}
          city={profile.business?.advertiser?.orders?.[0]?.campaign?.city}
          slug={profile.business?.advertiser?.orders?.[0]?.campaign?.slug}
          isSubPage={true}
        />
      </div>

      {/* Hero Section */}
      <div className="relative bg-[#12100F] text-white py-10 lg:py-14 overflow-hidden select-none border-b border-stone-900 shrink-0">
        {/* Cover Photo Background */}
        {profile.coverImageUrl ? (
          <img
            src={profile.coverImageUrl}
            alt={profile.name}
            className="absolute inset-0 w-full h-full object-cover opacity-25 filter brightness-50"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#12100F] to-[#1E1B1A] opacity-80" />
        )}
        {/* Dark overlay to ensure readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-transparent z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 relative z-10 items-start">
          {/* Hero Left Content */}
          <div className="text-left space-y-4">
            
            {/* Breadcrumbs */}
            <nav className="text-[10px] font-semibold uppercase tracking-widest text-[#8a847e] font-sans flex flex-wrap items-center gap-1.5 select-none z-10 relative">
              <Link href="/directory" className="hover:text-[#ff431f] transition-colors">Directory</Link>
              <span className="text-[#55504c] font-normal">/</span>
              <Link href={`/directory/${stateSlug}`} className="hover:text-[#ff431f] transition-colors">{currentLocation.city.state.name}</Link>
              <span className="text-[#55504c] font-normal">/</span>
              <Link href={`/directory/${stateSlug}/${citySlug}`} className="hover:text-[#ff431f] transition-colors">{currentLocation.city.name}</Link>
              <span className="text-[#55504c] font-normal">/</span>
              <Link href={`/directory/${stateSlug}/${citySlug}/${currentCategorySlug}`} className="hover:text-[#ff431f] transition-colors">{businessType}</Link>
              <span className="text-[#55504c] font-normal">/</span>
              <span className="text-neutral-350 truncate max-w-[200px] sm:max-w-none">{profile.name}</span>
            </nav>

            {/* Verified Badge */}
            <div className="flex pt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-400">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Verified Business</span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                {profile.name}
              </h1>
              <p className="text-xl sm:text-2xl font-mono uppercase tracking-wider text-orange-400 font-extrabold flex items-center gap-2">
                <span>⚡</span>
                <span>{businessType}</span>
              </p>
            </div>

            {/* Description Short Summary */}
            {profile.description && (
              <p className="max-w-2xl text-base sm:text-lg leading-8 text-neutral-300 pt-2">
                {profile.description.length > 180 ? `${profile.description.slice(0, 180)}...` : profile.description}
              </p>
            )}

            {/* Service Area Pill */}
            <div className="flex pt-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-neutral-300">
                <MapPin className="h-4 w-4 text-[#ff431f] shrink-0" />
                <span>Serving {currentLocation.city.name}, {currentLocation.city.state.slug.toUpperCase()}</span>
              </div>
            </div>

          </div>

          {/* Spacer for Floating Card on Desktop */}
          <div className="hidden lg:block w-[340px]" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#f7f5f1] flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start relative">
          
          {/* Left Column - Main Details */}
          <div className="space-y-7 text-left order-2 lg:order-1">
            
            {/* Mobile Action Card */}
            <div className="block lg:hidden">
              <BusinessActionCard profile={profile} businessType={businessType} isMobile={true} />
            </div>

            {/* About Card */}
            {profile.description && (
              <ProfileSection>
                <SectionHeading icon={<Store className="h-5 w-5" />} title={`About ${profile.name}`} />
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {profile.coverImageUrl && (
                    <div className="w-full md:w-1/3 aspect-[4/3] rounded-xl overflow-hidden border border-neutral-200 shrink-0 bg-stone-50 select-none">
                      <img src={profile.coverImageUrl} alt={`${profile.name} cover photo`} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 space-y-4">
                    <p className="text-[15px] sm:text-base leading-7 text-neutral-700 max-w-[70ch]">
                      {profile.description}
                    </p>
                  </div>
                </div>

                {/* Highlights row */}
                {isConversePlumbing && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-100 font-mono text-[9px] font-bold uppercase text-neutral-500">
                    <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-[#ff431f] rounded-md">Transparent Pricing</span>
                    <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-[#ff431f] rounded-md">Experienced Pros</span>
                    <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-[#ff431f] rounded-md">Fast Response</span>
                    <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-[#ff431f] rounded-md">Satisfaction Gtd</span>
                  </div>
                )}
              </ProfileSection>
            )}

            {/* Showcase Gallery */}
            {profile.photos && Array.isArray(profile.photos) && (profile.photos as string[]).length > 0 && (
              <ProfileSection>
                <SectionHeading icon={<Award className="h-5 w-5" />} title="Our Work" />
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(profile.photos as string[]).map((photoUrl, idx) => (
                    <div key={photoUrl} className="overflow-hidden rounded-xl border border-[#e5e0d8] aspect-[4/3] bg-neutral-100 relative group">
                      <img
                        src={photoUrl}
                        alt={`${profile.name} project showcase ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Our Services Card */}
            {finalServicesList.length > 0 && (
              <ProfileSection>
                <SectionHeading icon={<Wrench className="h-5 w-5" />} title="Our Services" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 py-2 text-center select-none">
                  {finalServicesList.map((service) => (
                    <ServiceCard
                      key={service.name}
                      name={service.name}
                      icon={getServiceIcon(service.name)}
                      description={service.description}
                    />
                  ))}
                </div>

                {has247 && (
                  <div className="bg-[#ff431f]/5 border border-[#ff431f]/25 p-4 rounded-xl flex items-center justify-center gap-2.5 text-[10px] font-mono font-bold uppercase text-[#ff431f] select-none text-center">
                    <Star className="h-4 w-4 fill-current animate-pulse shrink-0" />
                    <span>24/7 Emergency Services – We're here when you need us most.</span>
                  </div>
                )}
              </ProfileSection>
            )}

            {/* Service Area & Location Card */}
            <ProfileSection>
              <SectionHeading icon={<MapPin className="h-5 w-5" />} title="Service Area & Location" />
              <div className="grid grid-cols-1 md:grid-cols-[0.85fr_1.15fr] gap-6">
                
                {/* Location details left side */}
                <div className="space-y-6 text-left">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-[#ff431f] shrink-0 mt-0.5">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400">Service Area</span>
                      <span className="text-neutral-900 font-extrabold text-base leading-snug">
                        {profile.serviceArea || `Serving ${currentLocation.city.name} and surrounding areas`}
                      </span>
                    </div>
                  </div>

                  {profile.address ? (
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-[#ff431f] shrink-0 mt-0.5">
                        <Globe className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400">Location Address</span>
                        <span className="text-neutral-900 font-extrabold text-base leading-snug">
                          {profile.address}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-[#ff431f] shrink-0 mt-0.5">
                        <Globe className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400">Location Address</span>
                        <span className="text-neutral-900 font-extrabold text-base leading-snug">
                          {currentLocation.city.name}, {currentLocation.city.state.slug.toUpperCase()}
                        </span>
                        <span className="block text-xs text-neutral-500 font-medium">
                          Full street address kept private by business choice.
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-[#ff431f] shrink-0 mt-0.5">
                      <Users className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs font-bold uppercase tracking-wider text-neutral-400">Service Model</span>
                      <span className="text-neutral-900 font-extrabold text-base leading-snug">
                        Mobile Service Available
                      </span>
                    </div>
                  </div>
                </div>

                {/* Map placeholder right side */}
                <div className="relative h-[260px] min-h-[260px] bg-stone-50 rounded-2xl border border-neutral-200 overflow-hidden flex items-center justify-center shadow-inner select-none">
                  {/* Styled SVG Map Placeholder */}
                  <svg className="absolute inset-0 w-full h-full text-stone-200 opacity-80" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="3,3" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" />
                    {/* Roads */}
                    <line x1="10" y1="20" x2="90" y2="80" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="90" y1="10" x2="10" y2="90" stroke="currentColor" strokeWidth="1" />
                    <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.75" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.75" />
                  </svg>
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-100/40 to-transparent" />
                  {/* Map Pin */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="h-12 w-12 rounded-full bg-[#ff431f]/15 border border-[#ff431f]/30 flex items-center justify-center shadow-lg animate-bounce">
                      <MapPin className="h-6 w-6 text-[#ff431f]" />
                    </div>
                    <span className="mt-2.5 bg-white border border-neutral-200 px-3.5 py-1 rounded-full font-mono text-[9px] font-black uppercase text-neutral-700 shadow-md">
                      {currentLocation.city.name}
                    </span>
                  </div>
                </div>

              </div>
            </ProfileSection>

            {/* Special Customer Offer Card */}
            {campaignOffer && (
              <section className="bg-[#FFF5F2] border border-[#ff431f]/30 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm text-left">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-[#ff431f]/10 border border-[#ff431f]/20 flex items-center justify-center text-[#ff431f] shrink-0 select-none">
                    <Tag className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block font-mono text-[9px] font-black uppercase tracking-wider text-[#ff431f]">New Customer Offer</span>
                    <h3 className="font-headline font-black text-xl uppercase tracking-tight text-stone-900 mt-0.5">
                      {campaignOffer}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium mt-1">
                      For first-time customers in {currentLocation.city.name} and surrounding areas.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-center md:items-end gap-1.5 w-full md:w-auto">
                  {profile.phone && (
                    <a
                      href={`tel:${profile.phone}`}
                      className="w-full md:w-auto inline-flex items-center justify-center bg-[#ff431f] hover:bg-[#e93616] text-white font-headline text-xs font-black uppercase tracking-wider px-6 py-3.5 transition-all shadow-[0_4px_15px_rgba(255,67,31,0.2)] rounded-xl cursor-pointer select-none border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 min-h-[44px]"
                    >
                      Call Now to Redeem
                    </a>
                  )}
                  <span className="font-mono text-[8px] font-bold uppercase text-stone-400">Mention this offer when you call</span>
                </div>
              </section>
            )}

            {/* Business-managed offers */}
            {customOffers.length > 0 && (
              <ProfileSection>
                <SectionHeading icon={<Tag className="h-5 w-5" />} title="Current Offers" subtitle="Deals provided directly by this business." />
                <div className="space-y-3">
                  {customOffers.map((offer) => (
                    <div key={offer.id} className="border border-orange-200 bg-[#fff8f5] p-5 sm:p-6 rounded-xl">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-headline text-lg font-black uppercase tracking-tight text-stone-900">{offer.title}</h3>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-600">{offer.details}</p>
                        </div>
                        {offer.expiresAt && (
                          <span className="shrink-0 font-mono text-[9px] font-bold uppercase tracking-wider text-stone-500">
                            Ends {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(offer.expiresAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Campaign participation history */}
            {campaignHistory.length > 0 && (
              <ProfileSection>
                <SectionHeading icon={<Calendar className="h-5 w-5" />} title="NearHere Campaigns" subtitle="Campaigns this business has participated in with NearHere." />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {campaignHistory.map((campaign) => (
                    <div key={campaign.id} className="border border-neutral-200 bg-stone-50 p-4 rounded-xl">
                      <p className="font-headline text-base font-black uppercase tracking-tight text-neutral-900">{campaign.name}</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-600">{campaign.city}, {campaign.state}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                        <span>{campaign.category}</span>
                        <span aria-hidden="true">•</span>
                        <span>Participated {new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(campaign.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Gallery Section */}
            {photos.length > 0 && (
              <ProfileSection>
                <SectionHeading icon={<Globe className="h-5 w-5" />} title="Showcase Gallery" />
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square border border-neutral-200 bg-white overflow-hidden shadow-sm rounded-xl hover:border-[#ff431f]/45 transition-all select-none">
                      <img src={url} alt={`${profile.name} showcase`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Additional Custom Links list */}
            {profile.links.length > 0 && (
              <ProfileSection>
                <SectionHeading icon={<Globe className="h-5 w-5" />} title="Links & Info" />
                <div className="space-y-2.5">
                  {profile.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="nofollow sponsored"
                      className="flex items-center justify-between p-4 bg-white border border-[#e5e0d8] hover:border-orange-305 hover:shadow-[0_5px_20px_rgba(255,67,31,0.04)] text-neutral-800 transition-all group shadow-sm select-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 min-h-[44px]"
                    >
                      <span className="flex items-center gap-3 text-sm font-semibold">
                        <span className="text-lg">{linkIcons[link.type] || "🔗"}</span>
                        <span className="uppercase font-mono text-xs tracking-wider">{link.label}</span>
                      </span>
                      <span className="text-xs text-neutral-400 group-hover:text-[#ff431f] transition-colors font-bold shrink-0">
                        ➔
                      </span>
                    </a>
                  ))}
                </div>
              </ProfileSection>
            )}

            {/* Bottom Conversion Section */}
            <div className="rounded-2xl bg-[#11100f] p-7 sm:p-9 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border-l-4 border-[#ff431f] shadow-lg">
              <div className="space-y-1 text-left">
                <h3 className="text-xl font-bold tracking-tight text-white font-sans">
                  Ready to connect with {profile.name}?
                </h3>
                <p className="text-sm text-neutral-400 max-w-xl">
                  Contact the business directly to ask questions, request pricing, or learn more about its services.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0 w-full md:w-auto">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="w-full md:w-auto inline-flex items-center justify-center bg-[#ff431f] hover:bg-[#e93616] text-white font-bold text-sm px-6 py-3.5 transition-all rounded-xl cursor-pointer select-none border-0 min-h-[44px]"
                  >
                    Call Business
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="nofollow sponsored"
                    className="w-full md:w-auto inline-flex items-center justify-center bg-transparent hover:bg-white/10 text-white font-semibold text-sm px-6 py-3.5 border border-white/20 transition-all rounded-xl cursor-pointer select-none min-h-[44px]"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>

          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-7 lg:sticky lg:top-24 self-start order-1 lg:order-2">
            
            {/* Desktop Action Card */}
            <div className="hidden lg:block">
              <BusinessActionCard profile={profile} businessType={businessType} isMobile={false} />
            </div>

            {/* Business Details Card */}
            <div className="bg-white border border-[#e5e0d8] p-6 rounded-2xl shadow-[0_5px_20px_rgba(20,20,20,0.04)] space-y-4">
              <div className="space-y-1.5 text-left select-none">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Business Details
                </h2>
                <div className="h-0.5 w-8 bg-[#ff431f] rounded-full" />
              </div>
              <div className="divide-y divide-neutral-100">
                {profile.phone && (
                  <BusinessDetailRow
                    icon={<Phone className="h-3.5 w-3.5" />}
                    label="Phone"
                    value={
                      <a href={`tel:${profile.phone}`} className="text-[#ff431f] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500">
                        {profile.phone}
                      </a>
                    }
                  />
                )}
                {profile.email && (
                  <BusinessDetailRow
                    icon={<Mail className="h-3.5 w-3.5" />}
                    label="Email"
                    value={
                      <a href={`mailto:${profile.email}`} className="text-[#ff431f] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500">
                        {profile.email}
                      </a>
                    }
                  />
                )}
                {profile.website && (
                  <BusinessDetailRow
                    icon={<Globe className="h-3.5 w-3.5" />}
                    label="Website"
                    value={
                      <a href={profile.website} target="_blank" rel="nofollow" className="text-[#ff431f] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-500">
                        {profile.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                      </a>
                    }
                  />
                )}
                {profile.hours && (
                  <BusinessDetailRow
                    icon={<Clock className="h-3.5 w-3.5" />}
                    label="Hours"
                    value={profile.hours}
                  />
                )}
                {profile.serviceArea && (
                  <BusinessDetailRow
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label="Service Area"
                    value={profile.serviceArea}
                  />
                )}
                {establishedYear && (
                  <BusinessDetailRow
                    icon={<Calendar className="h-3.5 w-3.5" />}
                    label="Est. Year"
                    value={establishedYear}
                  />
                )}
                {licenseNumber && (
                  <BusinessDetailRow
                    icon={<Award className="h-3.5 w-3.5" />}
                    label="License"
                    value={licenseNumber}
                  />
                )}
              </div>
            </div>

            {/* Other Businesses in [City] */}
            {relatedBusinesses.length > 0 && (
              <div className="bg-white border border-[#e5e0d8] p-6 rounded-2xl shadow-[0_5px_20px_rgba(20,20,20,0.04)] space-y-4">
                <div className="space-y-1.5 text-left select-none">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                    Other Businesses in {currentLocation.city.name}
                  </h2>
                  <div className="h-0.5 w-8 bg-[#ff431f] rounded-full" />
                </div>
                <div className="space-y-2.5">
                  {relatedBusinesses.map((rb) => {
                    const rbCatSlug = rb.categories?.[0]?.directoryCategory?.slug || "general"
                    return (
                      <Link
                        key={rb.id}
                        href={`/directory/${stateSlug}/${citySlug}/businesses/${rbCatSlug}/${rb.slug}`}
                      className="flex items-center justify-between p-3 bg-[#fbfaf8] border border-neutral-200 hover:border-orange-300 hover:shadow-[0_5px_20px_rgba(255,67,31,0.04)] transition-all group rounded-xl select-none"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-3 text-left">
                        <div className="w-8 h-8 rounded-full border border-neutral-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                          {rb.logoUrl ? (
                            <img src={rb.logoUrl} alt={`${rb.name} logo`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-headline font-black text-[9px] text-stone-400 uppercase">
                              {rb.name.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="truncate">
                          <span className="block font-headline font-extrabold text-[11px] uppercase text-stone-900 group-hover:text-[#ff431f] transition-colors truncate">
                            {rb.name}
                          </span>
                          <span className="block font-mono text-[8px] text-stone-450 uppercase mt-0.5">
                            {rb.phone || "Verified Listing"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#ff431f] transition-colors shrink-0" />
                    </Link>
                  )})}
                </div>
              </div>
            )}

            {/* Explore More Near You */}
            <div className="bg-white border border-[#e5e0d8] p-6 rounded-2xl shadow-[0_5px_20px_rgba(20,20,20,0.04)] space-y-4">
              <div className="space-y-1.5 text-left select-none">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Explore More Near You
                </h2>
                <div className="h-0.5 w-8 bg-[#ff431f] rounded-full" />
              </div>
              <div className="space-y-2">
                {popularCategoriesList.map((c) => (
                  <DirectoryCategoryRow
                    key={c.slug}
                    name={c.name}
                    icon={c.icon}
                    href={`/directory/${stateSlug}/${citySlug}/${c.slug}`}
                  />
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Global Footer */}
      <div className="directory-dark">
        <CampaignFooter />
      </div>

    </div>
  )
}
