import { db } from "@/server/db"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import { getAdvertiserCategory, getAllAdvertiserCategories } from "@/data/advertiserCategories"
import type { Metadata } from "next"

interface CityPageProps {
  params: Promise<{ state: string; city: string }>
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { state: stateSlug, city: citySlug } = await params
  const city = await db.city.findFirst({
    where: {
      slug: citySlug,
      state: { slug: stateSlug },
    },
    include: { state: true },
  })

  if (!city || city.status !== "PUBLISHED" || city.state.status !== "PUBLISHED") {
    return {
      title: "City Not Found | NearHere",
      description: "The requested city directory was not found.",
    }
  }

  const cityName = city.name
  const stateName = city.state.name

  return {
    title: `Local Businesses in ${cityName}, ${city.state.slug.toUpperCase()} | NearHere`,
    description: `Discover verified local businesses, services, contact details, and exclusive postcard deals in ${cityName}, ${stateName}.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/directory/${city.state.slug}/${city.slug}`,
    },
    robots: {
      index: city.isIndexed === "INDEX" && city.state.isIndexed === "INDEX",
      follow: true,
    },
  }
}

export default async function CityDirectoryPage({ params }: CityPageProps) {
  const { state: stateSlug, city: citySlug } = await params

  const city = await db.city.findFirst({
    where: {
      slug: citySlug,
      state: { slug: stateSlug },
    },
    include: {
      state: true,
      locations: {
        where: {
          status: "PUBLISHED",
          directoryProfile: {
            status: "PUBLISHED",
            OR: [
              { businessId: null },
              {
                business: {
                  deletedAt: null,
                  goodStanding: true,
                  isDirectoryVisible: true,
                }
              }
            ]
          },
        },
        include: {
          directoryProfile: {
            include: {
              categories: {
                include: { directoryCategory: true },
              },
              business: {
                include: {
                  advertiser: {
                    include: {
                      orders: {
                        where: { status: "PAID" },
                        include: { creativeSubmission: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!city || city.status !== "PUBLISHED" || city.state.status !== "PUBLISHED") {
    notFound()
  }

  const cityName = city.name
  const stateSlugUpper = city.state.slug.toUpperCase()

  // Extract all businesses linked to locations in this city
  const activeLocations = city.locations
  const allProfiles = activeLocations.map((loc) => loc.directoryProfile)

  // Category counts are joined to the advertiser dataset below so the browse
  // list stays in sync with buyer-selectable business types.
  const categoryCounts: Record<string, number> = {}
  allProfiles.forEach((profile) => {
    profile.categories.forEach((pCat) => {
      const cat = pCat.directoryCategory
      if (cat.status === "PUBLISHED" && getAdvertiserCategory(cat.slug)) {
        categoryCounts[cat.slug] = (categoryCounts[cat.slug] || 0) + 1
      }
    })
  })
  const browseCategories = getAllAdvertiserCategories()
    .map((category) => ({
      name: category.label,
      slug: category.slug,
      count: categoryCounts[category.slug] || 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  // Split profiles into Featured (has active advertiser paid order) and Recently Added
  const featuredProfiles = allProfiles.filter((profile) => {
    const orders = profile.business?.advertiser?.orders || []
    return orders.length > 0
  })

  const recentlyAddedProfiles = allProfiles
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  return (
    <div className="min-h-screen bg-paper text-press font-sans flex flex-col justify-between selection:bg-[#FF4A1C] selection:text-white">
      <div className="directory-dark">
        <CampaignNav isCheckoutPage={false} />
      </div>

      <header className="directory-dark bg-[#12100F] border-b border-stone-900 py-16 px-6 relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent z-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto space-y-6 z-10 relative">
          {/* Editorial Breadcrumbs */}
          <nav className="font-mono text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2 text-left">
            <Link href="/directory" className="hover:text-[#FF4A1C] transition-colors">Directory</Link>
            <span>➔</span>
            <Link href={`/directory/${city.state.slug}`} className="hover:text-[#FF4A1C] transition-colors">{city.state.name}</Link>
            <span>➔</span>
            <span className="text-white">{cityName}</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#FF4A1C]/35 bg-[#12100F]/90 text-[#FF4A1C] font-mono text-[10px] font-bold uppercase tracking-wider rounded-md shadow-[0_0_15px_rgba(255,74,28,0.1)]">
              🏢 {cityName}, {stateSlugUpper} Directory
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tight text-white leading-none">
              Explore <span className="text-[#FF4A1C]">{cityName}</span>
            </h1>
            {city.introCopy ? (
              <p className="text-base text-stone-400 leading-relaxed font-medium">
                {city.introCopy}
              </p>
            ) : (
              <p className="text-base text-stone-400 leading-relaxed font-medium">
                Browse verified local listings, discover neighborhood businesses, and find exclusive postcard offers delivered directly to {cityName} residents.
              </p>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-16 animate-fade-up">
        {/* Filters/Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Sidebar - Supported business types in this city */}
          <aside className="lg:col-span-3 space-y-6 bg-[#FAF8F4] border border-rule p-5 rounded-lg shadow-md">
            <div className="space-y-4">
              <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-press border-b border-rule pb-2 text-left">
                Browse By Business Type
              </h3>
              {browseCategories.length > 0 ? (
                <div className="max-h-[32rem] overflow-y-auto pr-2 flex flex-col gap-1.5 font-mono text-[11px] font-bold uppercase text-left">
                  {browseCategories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/directory/${city.state.slug}/${city.slug}/${cat.slug}`}
                      className="text-warm hover:text-[#FF4A1C] transition-colors flex items-center justify-between"
                    >
                      <span>🏷️ {cat.name}</span>
                      <span className={cat.count > 0 ? "text-press" : "text-warm/55"}>({cat.count})</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-warm italic text-left">No supported business types configured.</p>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-9 space-y-12">
            {/* Featured Section */}
            <div className="space-y-6">
              <h2 className="font-headline font-black text-2xl uppercase tracking-tight text-press border-b border-rule pb-2 text-left flex items-center gap-2">
                <span>⭐</span> Featured Local Businesses
              </h2>
              {featuredProfiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredProfiles.map((profile) => {
                    const primaryCat = profile.categories[0]?.directoryCategory?.slug || "general"
                    const latestOrder = profile.business?.advertiser?.orders?.[0]
                    const offerDeal = latestOrder?.creativeSubmission?.offerDeal || null

                    return (
                      <article
                        key={profile.id}
                        className="bg-white border border-rule hover:border-[#FF4A1C] hover:shadow-[0_0_15px_rgba(255,74,28,0.08)] transition-all p-6 flex flex-col justify-between h-72 shadow-sm rounded-lg"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            {/* Logo */}
                            <div className="w-12 h-12 border border-rule bg-white flex items-center justify-center overflow-hidden shrink-0 rounded-md">
                              {profile.logoUrl ? (
                                <img src={profile.logoUrl} alt={profile.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-headline font-extrabold text-sm uppercase text-press">
                                  {profile.name.slice(0, 2)}
                                </span>
                              )}
                            </div>
                            {/* Category Badge */}
                            <span className="inline-block px-2.5 py-0.5 bg-[#FF4A1C]/10 border border-[#FF4A1C]/35 text-[#FF4A1C] text-[9px] font-mono font-bold uppercase tracking-wider rounded-md">
                              {profile.categories[0]?.directoryCategory?.name || "Local Services"}
                            </span>
                          </div>

                          <div className="text-left space-y-1">
                            <h3 className="font-headline font-extrabold text-lg uppercase text-press tracking-tight truncate">
                              {profile.name}
                            </h3>
                            <span className="inline-block font-mono text-[9px] font-bold text-warm uppercase tracking-wider">
                              📍 {cityName}, {stateSlugUpper}
                            </span>
                          </div>

                          {profile.description && (
                            <p className="text-xs text-warm line-clamp-3 leading-relaxed text-left">
                              {profile.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-4 pt-4 border-t border-rule text-left">
                          {offerDeal && (
                            <div className="text-[10px] font-mono uppercase tracking-wider text-nh-red font-bold flex items-center gap-1.5">
                              <span className="bg-nh-red/10 px-1 py-0.5 rounded-none text-[8px] font-extrabold">SPECIAL OFFER</span>
                              <span className="truncate">{offerDeal}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center select-none">
                            {profile.website ? (
                              <span className="text-[10px] font-mono text-press font-bold uppercase tracking-widest flex items-center gap-1">
                                🔗 Verified Website
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-slate-300 uppercase">No website</span>
                            )}
                            <Link
                              href={`/directory/${city.state.slug}/${city.slug}/businesses/${primaryCat}/${profile.slug}`}
                              className="bg-[#FF4A1C] hover:bg-[#e03e1a] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-2 transition-all shadow-[0_2px_10px_rgba(255,74,28,0.2)] hover:shadow-[0_4px_15px_rgba(255,74,28,0.3)] rounded-md text-center border-0"
                            >
                              View Profile
                            </Link>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 border border-dashed border-rule bg-white text-center text-warm italic text-sm rounded-lg">
                  No featured businesses registered in {cityName} yet.
                </div>
              )}
            </div>

            {/* Recently Added Section */}
            {recentlyAddedProfiles.length > 0 && (
              <div className="space-y-6">
                <h2 className="font-headline font-black text-2xl uppercase tracking-tight text-press border-b border-rule pb-2 text-left flex items-center gap-2">
                  <span>🆕</span> Recently Added
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentlyAddedProfiles.map((profile) => {
                    const primaryCat = profile.categories[0]?.directoryCategory?.slug || "general"
                    return (
                      <Link
                        key={profile.id}
                        href={`/directory/${city.state.slug}/${city.slug}/businesses/${primaryCat}/${profile.slug}`}
                        className="bg-white border border-rule hover:border-[#FF4A1C] hover:shadow-[0_0_15px_rgba(255,74,28,0.08)] p-4 flex items-center justify-between transition-all group rounded-lg"
                      >
                        <div className="text-left space-y-1.5 truncate pr-4">
                          <h4 className="font-headline font-extrabold text-base uppercase text-press group-hover:text-[#FF4A1C] transition-colors truncate">
                            {profile.name}
                          </h4>
                          <div className="flex gap-2 items-center text-[10px] font-mono text-warm uppercase">
                            <span>{profile.categories[0]?.directoryCategory?.name || "Local Business"}</span>
                            <span>•</span>
                            <span>Added {new Date(profile.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <span className="text-warm group-hover:text-[#FF4A1C] transition-colors font-bold shrink-0">➔</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="directory-dark">
        <CampaignFooter />
      </div>
    </div>
  )
}
