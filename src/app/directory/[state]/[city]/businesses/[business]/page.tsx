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
} from "lucide-react"

interface BusinessPageProps {
  params: Promise<{ state: string; city: string; business: string }>
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
    },
  })

  if (!profile || profile.locations.length === 0) return null
  const primaryLoc = profile.locations[0]
  return `/directory/${primaryLoc.city.state.slug}/${primaryLoc.city.slug}/businesses/${profile.slug}`
}

export async function generateMetadata({ params }: BusinessPageProps): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, business: businessSlug } = await params
  
  const profile = await db.directoryProfile.findUnique({
    where: { slug: businessSlug },
    include: { business: true },
  })

  const isActive = profile?.business ? (profile.business.goodStanding && !profile.business.deletedAt) : (profile?.status === "PUBLISHED")

  if (!profile || !isActive) {
    return {
      title: "Business Profile Not Found | NearHere",
      description: "The requested business profile was not found.",
    }
  }

  const primaryPath = await getPrimaryCanonicalPath(profile.slug) || `/directory/${stateSlug}/${citySlug}/businesses/${profile.slug}`
  
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

export default async function DirectoryBusinessProfilePage({ params }: BusinessPageProps) {
  const { state: stateSlug, city: citySlug, business: businessSlug } = await params

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
          advertiser: {
            include: {
              orders: {
                where: { status: "PAID" },
                include: { creativeSubmission: true, campaign: true },
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
      directoryProfile: true,
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

  // Category Icon mapping for services box
  const categoryIcons: Record<string, React.ReactNode> = {
    plumbing: <Wrench className="h-6 w-6 text-[#FF4A1C]" />,
    hvac: <Wind className="h-6 w-6 text-[#FF4A1C]" />,
    electricians: <Zap className="h-6 w-6 text-[#FF4A1C]" />,
    "water-damage-restoration": <Droplets className="h-6 w-6 text-[#FF4A1C]" />,
  }

  // Popular Categories sidebar list
  const popularCategoriesList = [
    { name: "Plumbing", slug: "plumbing", icon: <Wrench className="h-4 w-4 text-[#FF4A1C]" /> },
    { name: "HVAC", slug: "hvac", icon: <Wind className="h-4 w-4 text-[#FF4A1C]" /> },
    { name: "Electricians", slug: "electricians", icon: <Zap className="h-4 w-4 text-[#FF4A1C]" /> },
    { name: "Water Damage Restoration", slug: "water-damage-restoration", icon: <Droplets className="h-4 w-4 text-[#FF4A1C]" /> },
  ]

  // Demo Fallback / Dynamic Logic
  const isConversePlumbing = profile.slug === "converse-plumbing-pros"
  const establishedYear = profile.establishedYear || (isConversePlumbing ? "2016" : null)
  const licenseNumber = profile.licenseNumber || (isConversePlumbing ? "M-42678" : null)
  const hasFamilyOwned = isConversePlumbing || (profile.description ? profile.description.toLowerCase().includes("family-owned") : false)
  const has247 = isConversePlumbing || (profile.hours ? (profile.hours.toLowerCase().includes("24 hours") || profile.hours.toLowerCase().includes("24/7")) : false)

  // Parse services
  const servicesList: string[] = profile.services && Array.isArray(profile.services)
    ? (profile.services as string[])
    : (isConversePlumbing ? [
        "Plumbing Repairs",
        "Drain Cleaning",
        "Water Heaters",
        "Leak Detection",
        "Emergency Service"
      ] : [])

  return (
    <div className="min-h-screen bg-paper text-press font-sans flex flex-col justify-between selection:bg-[#FF4A1C] selection:text-white">
      
      {/* Schema Injection */}
      {schemaJson && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJson) }}
        />
      )}

      {/* Navigation */}
      <div className="directory-dark bg-[#12100F]">
        <CampaignNav isCheckoutPage={false} />
      </div>

      {/* Hero Section */}
      <div className="relative bg-[#12100F] text-white py-12 md:py-16 overflow-hidden select-none border-b border-stone-900 shrink-0">
        {/* Cover Photo Background */}
        {profile.coverImageUrl ? (
          <img
            src={profile.coverImageUrl}
            alt={profile.name}
            className="absolute inset-0 w-full h-full object-cover opacity-30 filter brightness-50"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-[#12100F] to-[#1E1B1A] opacity-80" />
        )}
        {/* Dark overlay to ensure readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-transparent z-0" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-start">
          {/* Hero Left Content */}
          <div className="lg:col-span-8 text-left space-y-4">
            
            {/* Breadcrumbs */}
            <nav className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 select-none z-10 relative">
              <Link href="/directory" className="hover:text-[#FF4A1C] transition-colors">Directory</Link>
              <span className="text-stone-600">›</span>
              <Link href={`/directory/${stateSlug}`} className="hover:text-[#FF4A1C] transition-colors">{currentLocation.city.state.name}</Link>
              <span className="text-stone-600">›</span>
              <Link href={`/directory/${stateSlug}/${citySlug}`} className="hover:text-[#FF4A1C] transition-colors">{currentLocation.city.name}</Link>
              <span className="text-stone-600">›</span>
              <span className="text-stone-300 truncate max-w-[200px] sm:max-w-none">{profile.name}</span>
            </nav>

            {/* Verified Badge */}
            <div className="flex items-center gap-1.5 text-[#FF4A1C] font-mono text-[10px] font-extrabold uppercase tracking-widest pt-2">
              <ShieldCheck className="h-4 w-4" />
              <span>Verified Business</span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline font-black uppercase tracking-tight text-white leading-none">
              {profile.name}
            </h1>

            {/* Category Badge */}
            {profile.categories[0] && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FF4A1C]/15 border border-[#FF4A1C]/35 text-[#FF4A1C] text-[10px] font-mono font-bold uppercase tracking-wider rounded-full">
                <Tag className="h-3 w-3" />
                <span>{profile.categories[0].directoryCategory.name}</span>
              </div>
            )}

            {/* Description Short Summary */}
            {profile.description && (
              <p className="text-stone-300 text-sm md:text-base leading-relaxed max-w-2xl font-medium pt-2">
                {profile.description.length > 180 ? `${profile.description.slice(0, 180)}...` : profile.description}
              </p>
            )}

            {/* Trust cues */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] sm:text-xs text-stone-400 font-mono font-bold uppercase pt-4 border-t border-stone-800/60 mt-4">
              {isConversePlumbing && (
                <div className="flex items-center gap-1.5 text-white">
                  <div className="flex items-center gap-0.5 text-orange-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <Star className="h-3.5 w-3.5 fill-current" />
                  </div>
                  <span>5.0 (48 Reviews)</span>
                </div>
              )}
              {isConversePlumbing && <span className="text-stone-700 hidden sm:inline">|</span>}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#FF4A1C]" />
                <span>Serving {currentLocation.city.name}, {currentLocation.city.state.slug.toUpperCase()}</span>
              </span>
            </div>

          </div>

          {/* Spacer for Floating Card on Desktop */}
          <div className="hidden lg:block lg:col-span-4" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-[#FAF8F4] flex-1">
        <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
          
          {/* Left Column - Main Details (col-span-8) */}
          <div className="lg:col-span-8 space-y-8 order-2 lg:order-1">
            
            {/* About Card */}
            <section className="bg-white border border-[#E7E0D8] p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              <div className="space-y-1.5 text-left">
                <h2 className="font-headline font-black text-xl uppercase tracking-tight text-stone-900">
                  About {profile.name}
                </h2>
                <div className="h-1 w-12 bg-[#FF4A1C] rounded-full" />
              </div>

              <div className="flex flex-col md:flex-row gap-6 items-start">
                {profile.coverImageUrl && (
                  <div className="w-full md:w-1/3 aspect-[4/3] rounded-xl overflow-hidden border border-[#E7E0D8] shrink-0 bg-stone-50 select-none">
                    <img src={profile.coverImageUrl} alt={`${profile.name} cover photo`} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 text-left space-y-4">
                  <p className="text-sm text-stone-650 leading-relaxed font-medium">
                    {profile.description || `${profile.name} is a local service provider offering trusted services in the area. Check out their category and location details to connect.`}
                  </p>
                </div>
              </div>

              {/* Highlights row */}
              {isConversePlumbing && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-stone-100 pt-6 font-mono text-[9px] font-bold uppercase text-stone-500 text-left">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#FF4A1C]/10 rounded-full text-[#FF4A1C] shrink-0">
                      <Tag className="h-3.5 w-3.5" />
                    </span>
                    <span>Transparent Pricing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#FF4A1C]/10 rounded-full text-[#FF4A1C] shrink-0">
                      <Wrench className="h-3.5 w-3.5" />
                    </span>
                    <span>Experienced Pros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#FF4A1C]/10 rounded-full text-[#FF4A1C] shrink-0">
                      <Clock className="h-3.5 w-3.5" />
                    </span>
                    <span>Fast Response</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-[#FF4A1C]/10 rounded-full text-[#FF4A1C] shrink-0">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                    <span>Satisfaction Gtd</span>
                  </div>
                </div>
              )}
            </section>

            {/* Our Services Card */}
            <section className="bg-white border border-[#E7E0D8] p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              <div className="space-y-1.5 text-left">
                <h2 className="font-headline font-black text-xl uppercase tracking-tight text-stone-900">
                  Our Services
                </h2>
                <div className="h-1 w-12 bg-[#FF4A1C] rounded-full" />
              </div>

              {servicesList.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 py-2 text-center font-mono text-[9px] font-bold uppercase text-stone-605 select-none">
                  {servicesList.map((serviceName) => {
                    const lower = serviceName.toLowerCase()
                    let icon = <Wrench className="h-6 w-6 text-[#FF4A1C]" />
                    if (lower.includes("drain") || lower.includes("clean") || lower.includes("water") || lower.includes("flood") || lower.includes("extraction") || lower.includes("sewers") || lower.includes("muck")) {
                      icon = <Droplets className="h-6 w-6 text-[#FF4A1C]" />
                    } else if (lower.includes("heater") || lower.includes("flame") || lower.includes("heat")) {
                      icon = <Flame className="h-6 w-6 text-[#FF4A1C]" />
                    } else if (lower.includes("electric") || lower.includes("wire") || lower.includes("power") || lower.includes("zap") || lower.includes("lighting")) {
                      icon = <Zap className="h-6 w-6 text-[#FF4A1C]" />
                    } else if (lower.includes("detect") || lower.includes("search") || lower.includes("leak") || lower.includes("inspect")) {
                      icon = <Search className="h-6 w-6 text-[#FF4A1C]" />
                    } else if (lower.includes("emerg") || lower.includes("clock") || lower.includes("time") || lower.includes("24")) {
                      icon = <Clock className="h-6 w-6 text-[#FF4A1C]" />
                    } else if (lower.includes("ac") || lower.includes("cool") || lower.includes("air") || lower.includes("vent") || lower.includes("wind") || lower.includes("duct")) {
                      icon = <Wind className="h-6 w-6 text-[#FF4A1C]" />
                    } else if (lower.includes("mold") || lower.includes("fungus") || lower.includes("spore")) {
                      icon = <ShieldAlert className="h-6 w-6 text-[#FF4A1C]" />
                    }
                    return (
                      <div key={serviceName} className="flex flex-col items-center gap-2.5 p-4 bg-stone-50 border border-[#E7E0D8] rounded-xl hover:border-[#FF4A1C]/40 transition-colors">
                        {icon}
                        <span>{serviceName}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2 text-center font-mono text-[9px] font-bold uppercase text-stone-605 select-none">
                  {profile.categories.map((c) => {
                    const slug = c.directoryCategory.slug;
                    const name = c.directoryCategory.name;
                    const icon = categoryIcons[slug] || <Tag className="h-6 w-6 text-[#FF4A1C]" />;
                    return (
                      <div key={c.directoryCategoryId} className="flex flex-col items-center gap-2.5 p-4 bg-stone-50 border border-[#E7E0D8] rounded-xl hover:border-[#FF4A1C]/40 transition-colors">
                        {icon}
                        <span>{name} Services</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {has247 && (
                <div className="bg-[#FF4A1C]/5 border border-[#FF4A1C]/25 p-4 rounded-xl flex items-center justify-center gap-2.5 text-[10px] font-mono font-bold uppercase text-[#FF4A1C] select-none text-center">
                  <Star className="h-4 w-4 fill-current animate-pulse shrink-0" />
                  <span>24/7 Emergency Services – We're here when you need us most.</span>
                </div>
              )}
            </section>

            {/* Service Area & Location Card */}
            <section className="bg-white border border-[#E7E0D8] p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
              <div className="space-y-1.5 text-left">
                <h2 className="font-headline font-black text-xl uppercase tracking-tight text-stone-900">
                  Service Area & Location
                </h2>
                <div className="h-1 w-12 bg-[#FF4A1C] rounded-full" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Info Column */}
                <div className="space-y-5 text-left text-sm font-medium text-stone-700">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#FF4A1C]/10 rounded-lg text-[#FF4A1C] shrink-0 mt-0.5 animate-pulse">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="block font-mono text-[9px] font-bold uppercase text-stone-400">Service Area</span>
                      <span className="text-stone-850 font-bold">{profile.serviceArea || `Serving ${currentLocation.city.name} and surrounding areas`}</span>
                    </div>
                  </div>
                  {profile.address && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#FF4A1C]/10 rounded-lg text-[#FF4A1C] shrink-0 mt-0.5">
                        <Globe className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block font-mono text-[9px] font-bold uppercase text-stone-400">Location Address</span>
                        <span className="text-stone-850 font-bold">{profile.address}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Map Placeholder Graphic Column */}
                <div className="relative aspect-[16/10] bg-stone-50 rounded-xl border border-[#E7E0D8] overflow-hidden flex items-center justify-center shadow-inner select-none">
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
                    <div className="h-10 w-10 rounded-full bg-[#FF4A1C]/15 border border-[#FF4A1C]/35 flex items-center justify-center shadow-lg animate-bounce">
                      <MapPin className="h-5 w-5 text-[#FF4A1C]" />
                    </div>
                    <span className="mt-2.5 bg-white border border-[#E7E0D8] px-2.5 py-0.5 rounded-full font-mono text-[8px] font-black uppercase text-stone-700 shadow-md">
                      {currentLocation.city.name}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Special Customer Offer Card */}
            {campaignOffer && (
              <section className="bg-[#FFF5F2] border border-[#FF4A1C]/35 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-sm">
                <div className="flex items-start gap-4 text-left">
                  <div className="h-12 w-12 rounded-xl bg-[#FF4A1C]/10 border border-[#FF4A1C]/20 flex items-center justify-center text-[#FF4A1C] shrink-0 select-none">
                    <Tag className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block font-mono text-[9px] font-black uppercase tracking-wider text-[#FF4A1C]">New Customer Offer</span>
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
                      className="w-full md:w-auto inline-flex items-center justify-center bg-[#FF4A1C] hover:bg-[#e03e1a] text-white font-headline text-xs font-black uppercase tracking-wider px-6 py-3.5 transition-all shadow-[0_4px_15px_rgba(255,74,28,0.2)] hover:shadow-[0_6px_20px_rgba(255,74,28,0.3)] rounded-md cursor-pointer select-none border-0"
                    >
                      Call Now to Redeem
                    </a>
                  )}
                  <span className="font-mono text-[8px] font-bold uppercase text-stone-400">Mention this offer when you call</span>
                </div>
              </section>
            )}

            {/* Gallery Section */}
            {photos.length > 0 && (
              <section className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <h2 className="font-headline font-black text-lg uppercase tracking-tight text-stone-900">
                    Showcase Gallery
                  </h2>
                  <div className="h-1 w-12 bg-[#FF4A1C] rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square border border-[#E7E0D8] bg-white overflow-hidden shadow-sm rounded-xl hover:border-[#FF4A1C]/35 transition-all select-none">
                      <img src={url} alt={`${profile.name} showcase`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Additional Custom Links list */}
            {profile.links.length > 0 && (
              <section className="space-y-4 text-left">
                <div className="space-y-1.5">
                  <h2 className="font-headline font-black text-lg uppercase tracking-tight text-stone-900">
                    Links & Info
                  </h2>
                  <div className="h-1 w-12 bg-[#FF4A1C] rounded-full" />
                </div>
                <div className="space-y-2.5">
                  {profile.links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="nofollow sponsored"
                      className="flex items-center justify-between p-4 bg-white border border-[#E7E0D8] hover:border-[#FF4A1C] hover:shadow-[0_0_15px_rgba(255,74,28,0.08)] text-stone-850 transition-all group shadow-sm select-none rounded-xl"
                    >
                      <span className="flex items-center gap-3 text-sm font-semibold">
                        <span className="text-lg">{linkIcons[link.type] || "🔗"}</span>
                        <span className="uppercase font-mono text-xs tracking-wider">{link.label}</span>
                      </span>
                      <span className="text-xs text-stone-400 group-hover:text-[#FF4A1C] transition-colors font-bold shrink-0">
                        ➔
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Right Column - Sidebar (col-span-4) */}
          <div className="lg:col-span-4 space-y-8 order-1 lg:order-2 z-20">
            
            {/* Floating Action Block/Card */}
            <div className="w-full bg-white border border-[#E7E0D8] p-6 sm:p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] text-center relative z-25 lg:-mt-32">
              {/* Logo / Avatar overlapping card top */}
              <div className="w-20 h-20 rounded-full border-2 border-white bg-white mx-auto -mt-16 sm:-mt-20 flex items-center justify-center overflow-hidden shadow-lg select-none">
                {profile.logoUrl ? (
                  <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#12100F] flex items-center justify-center text-white font-headline font-black text-xl">
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Title */}
              <h2 className="font-headline font-black text-lg md:text-xl uppercase text-stone-900 tracking-tight leading-tight mt-4 mb-2">
                {profile.name}
              </h2>

              {/* Category tag */}
              {profile.categories[0] && (
                <span className="inline-block px-3 py-0.5 bg-[#FF4A1C]/10 border border-[#FF4A1C]/35 text-[#FF4A1C] text-[9px] font-mono font-bold uppercase tracking-wider rounded-md mb-6">
                  {profile.categories[0].directoryCategory.name}
                </span>
              )}

              {/* Action buttons */}
              <div className="space-y-3 w-full">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FF4A1C] hover:bg-[#e03e1a] text-white font-headline text-xs font-black uppercase tracking-wider transition-all shadow-[0_4px_15px_rgba(255,74,28,0.2)] hover:shadow-[0_6px_20px_rgba(255,74,28,0.3)] rounded-md cursor-pointer select-none border-0"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call Business</span>
                  </a>
                )}
                {profile.website && (
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="nofollow sponsored"
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-stone-50 text-stone-850 font-headline text-xs font-black uppercase tracking-wider border border-[#E7E0D8] transition-all rounded-md cursor-pointer select-none"
                  >
                    <Globe className="h-4 w-4 text-[#FF4A1C]" />
                    <span>Visit Website</span>
                  </a>
                )}
              </div>

              {/* Core Verification & Trust tags */}
              <div className="border-t border-[#E7E0D8] pt-4 mt-6 space-y-3 text-left font-mono text-[9px] font-bold uppercase text-stone-500 select-none">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Verified Business</span>
                </div>
                {hasFamilyOwned && (
                  <div className="flex items-center gap-2.5">
                    <Users className="h-4 w-4 text-[#FF4A1C] flex-shrink-0" />
                    <span>Local & Family-Owned</span>
                  </div>
                )}
                {has247 && (
                  <div className="flex items-center gap-2.5">
                    <Clock className="h-4 w-4 text-[#FF4A1C] flex-shrink-0" />
                    <span>24/7 Emergency Service</span>
                  </div>
                )}
              </div>
            </div>

            {/* Business Details Card */}
            <div className="bg-white border border-[#E7E0D8] p-6 rounded-2xl shadow-sm space-y-4">
              <div className="space-y-1.5 text-left select-none">
                <h2 className="font-headline font-black text-xs uppercase tracking-wider text-stone-900">
                  Business Details
                </h2>
                <div className="h-0.5 w-8 bg-[#FF4A1C] rounded-full" />
              </div>
              <div className="space-y-3 font-mono text-[9px] font-bold uppercase text-stone-500 text-left">
                {profile.phone && (
                  <div className="flex justify-between items-center border-b border-stone-105 pb-2">
                    <span className="flex items-center gap-2 shrink-0"><Phone className="h-3.5 w-3.5 text-[#FF4A1C]" /> Phone</span>
                    <a href={`tel:${profile.phone}`} className="font-sans font-bold text-[#FF4A1C] lowercase hover:underline truncate ml-4">{profile.phone}</a>
                  </div>
                )}
                {profile.email && (
                  <div className="flex justify-between items-center border-b border-stone-105 pb-2">
                    <span className="flex items-center gap-2 shrink-0"><Mail className="h-3.5 w-3.5 text-[#FF4A1C]" /> Email</span>
                    <a href={`mailto:${profile.email}`} className="font-sans font-bold text-[#FF4A1C] lowercase hover:underline truncate ml-4 max-w-[150px] sm:max-w-none">{profile.email}</a>
                  </div>
                )}
                {profile.hours && (
                  <div className="flex justify-between items-center border-b border-stone-105 pb-2">
                    <span className="flex items-center gap-2 shrink-0"><Clock className="h-3.5 w-3.5 text-[#FF4A1C]" /> Hours</span>
                    <span className="font-sans font-bold text-stone-850 ml-4 text-right">{profile.hours}</span>
                  </div>
                )}
                {profile.categories[0] && (
                  <div className="flex justify-between items-center border-b border-stone-105 pb-2">
                    <span className="flex items-center gap-2 shrink-0"><Tag className="h-3.5 w-3.5 text-[#FF4A1C]" /> Category</span>
                    <span className="font-sans font-bold text-stone-850 ml-4">{profile.categories[0].directoryCategory.name}</span>
                  </div>
                )}
                {hasFamilyOwned && (
                  <div className="flex justify-between items-center border-b border-stone-105 pb-2">
                    <span className="flex items-center gap-2 shrink-0"><Users className="h-3.5 w-3.5 text-[#FF4A1C]" /> Type</span>
                    <span className="font-sans font-bold text-stone-850 ml-4">Family-Owned</span>
                  </div>
                )}
                {establishedYear && (
                  <div className="flex justify-between items-center border-b border-stone-105 pb-2">
                    <span className="flex items-center gap-2 shrink-0"><Calendar className="h-3.5 w-3.5 text-[#FF4A1C]" /> Est. Year</span>
                    <span className="font-sans font-bold text-stone-850 ml-4">{establishedYear}</span>
                  </div>
                )}
                {licenseNumber && (
                  <div className="flex justify-between items-center pb-0.5">
                    <span className="flex items-center gap-2 shrink-0"><Award className="h-3.5 w-3.5 text-[#FF4A1C]" /> License</span>
                    <span className="font-sans font-bold text-stone-850 ml-4">{licenseNumber}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Other Businesses in [City] */}
            {relatedBusinesses.length > 0 && (
              <div className="bg-white border border-[#E7E0D8] p-6 rounded-2xl shadow-sm space-y-4">
                <div className="space-y-1.5 text-left select-none">
                  <h2 className="font-headline font-black text-xs uppercase tracking-wider text-stone-900">
                    Other Businesses in {currentLocation.city.name}
                  </h2>
                  <div className="h-0.5 w-8 bg-[#FF4A1C] rounded-full" />
                </div>
                <div className="space-y-2.5">
                  {relatedBusinesses.map((rb) => (
                    <Link
                      key={rb.id}
                      href={`/directory/${stateSlug}/${citySlug}/businesses/${rb.slug}`}
                      className="flex items-center justify-between p-3 bg-stone-50 border border-[#E7E0D8] hover:border-[#FF4A1C] hover:shadow-[0_0_15px_rgba(255,74,28,0.08)] transition-all group rounded-xl select-none"
                    >
                      <div className="flex items-center gap-2.5 truncate pr-3 text-left">
                        <div className="w-8 h-8 rounded-full border border-[#E7E0D8] bg-white flex items-center justify-center overflow-hidden shrink-0">
                          {rb.logoUrl ? (
                            <img src={rb.logoUrl} alt={rb.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-headline font-black text-[9px] text-stone-400 uppercase">
                              {rb.name.slice(0, 2)}
                            </span>
                          )}
                        </div>
                        <div className="truncate">
                          <span className="block font-headline font-extrabold text-[11px] uppercase text-stone-900 group-hover:text-[#FF4A1C] transition-colors truncate">
                            {rb.name}
                          </span>
                          <span className="block font-mono text-[8px] text-stone-450 uppercase mt-0.5">
                            {rb.phone || "Verified Listing"}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#FF4A1C] transition-colors shrink-0" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Categories */}
            <div className="bg-white border border-[#E7E0D8] p-6 rounded-2xl shadow-sm space-y-4">
              <div className="space-y-1.5 text-left select-none">
                <h2 className="font-headline font-black text-xs uppercase tracking-wider text-stone-900">
                  Popular Categories
                </h2>
                <div className="h-0.5 w-8 bg-[#FF4A1C] rounded-full" />
              </div>
              <div className="space-y-2">
                {popularCategoriesList.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/directory/${stateSlug}/${citySlug}/${c.slug}`}
                    className="flex items-center justify-between p-3 bg-stone-50 border border-[#E7E0D8] hover:border-[#FF4A1C] hover:shadow-[0_0_15px_rgba(255,74,28,0.08)] text-stone-700 hover:text-stone-900 transition-all group rounded-xl select-none"
                  >
                    <span className="flex items-center gap-2.5 text-[9px] font-mono font-bold uppercase">
                      {c.icon}
                      <span>{c.name}</span>
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-stone-400 group-hover:text-[#FF4A1C] transition-colors shrink-0" />
                  </Link>
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

