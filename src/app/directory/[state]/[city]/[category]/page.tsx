import { db } from "@/server/db"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import type { Metadata } from "next"

interface CategoryPageProps {
  params: Promise<{ state: string; city: string; category: string }>
}

// Check index conditions: >= 2 published profiles, or 1 profile + strong category copy
async function getIndexStatus(cityId: string, categoryId: string, categoryDesc: string | null) {
  const count = await db.businessDirectoryCategory.count({
    where: {
      directoryCategoryId: categoryId,
      directoryProfile: {
        status: "PUBLISHED",
        locations: {
          some: {
            cityId: cityId,
            status: "PUBLISHED",
          },
        },
      },
    },
  })

  if (count >= 2) return true
  if (count === 1 && categoryDesc && categoryDesc.trim().length >= 100) return true
  return false
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { state: stateSlug, city: citySlug, category: categorySlug } = await params
  
  const city = await db.city.findFirst({
    where: {
      slug: citySlug,
      state: { slug: stateSlug },
    },
    include: { state: true },
  })

  const category = await db.directoryCategory.findUnique({
    where: { slug: categorySlug },
  })

  if (!city || !category || city.status !== "PUBLISHED" || category.status !== "PUBLISHED" || city.state.status !== "PUBLISHED") {
    return {
      title: "Category Directory Not Found | NearHere",
      description: "The requested category list was not found.",
    }
  }

  const isIndexable = await getIndexStatus(city.id, category.id, category.description)

  return {
    title: `Best ${category.name} in ${city.name}, ${city.state.slug.toUpperCase()} | NearHere`,
    description: `Find top-rated ${category.name.toLowerCase()} in ${city.name}, ${city.state.name}. View contact info, verified business profiles, and postcard specials.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/directory/${city.state.slug}/${city.slug}/${category.slug}`,
    },
    robots: {
      index: isIndexable && city.isIndexed === "INDEX" && category.isIndexed === "INDEX" && city.state.isIndexed === "INDEX",
      follow: true,
    },
  }
}

export default async function CityCategoryDirectoryPage({ params }: CategoryPageProps) {
  const { state: stateSlug, city: citySlug, category: categorySlug } = await params
  const stateSlugUpper = stateSlug.toUpperCase()

  const city = await db.city.findFirst({
    where: {
      slug: citySlug,
      state: { slug: stateSlug },
    },
    include: { state: true },
  })

  const category = await db.directoryCategory.findUnique({
    where: { slug: categorySlug },
  })

  if (!city || !category || city.status !== "PUBLISHED" || category.status !== "PUBLISHED" || city.state.status !== "PUBLISHED") {
    notFound()
  }

  // Fetch all profiles in this city and category
  const profileJoins = await db.businessDirectoryCategory.findMany({
    where: {
      directoryCategoryId: category.id,
      directoryProfile: {
        status: "PUBLISHED",
        locations: {
          some: {
            cityId: city.id,
            status: "PUBLISHED",
          },
        },
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
          locations: {
            where: { cityId: city.id },
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
  })

  const profiles = profileJoins.map((join) => join.directoryProfile)
  const isIndexable = await getIndexStatus(city.id, category.id, category.description)

  // Fetch nearby categories (other categories that have active profiles in this city)
  const otherCategoryJoins = await db.businessDirectoryCategory.findMany({
    where: {
      directoryProfile: {
        status: "PUBLISHED",
        locations: {
          some: {
            cityId: city.id,
            status: "PUBLISHED",
          },
        },
      },
      directoryCategoryId: { not: category.id },
    },
    include: { directoryCategory: true },
  })

  const nearbyCategoryMap: Record<string, { name: string; slug: string }> = {}
  otherCategoryJoins.forEach((join) => {
    const cat = join.directoryCategory
    if (cat.status === "PUBLISHED") {
      nearbyCategoryMap[cat.slug] = { name: cat.name, slug: cat.slug }
    }
  })
  const nearbyCategories = Object.values(nearbyCategoryMap).slice(0, 6)

  // Fetch nearby cities (other cities in the same state)
  const nearbyCities = await db.city.findMany({
    where: {
      stateId: city.stateId,
      status: "PUBLISHED",
      slug: { not: city.slug },
    },
    take: 6,
  })

  // Structure BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Directory",
        "item": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/directory`,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": city.state.name,
        "item": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/directory/${city.state.slug}`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": city.name,
        "item": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/directory/${city.state.slug}/${city.slug}`,
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": category.name,
        "item": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/directory/${city.state.slug}/${city.slug}/${category.slug}`,
      },
    ],
  }

  // Structure ItemList JSON-LD for listed businesses
  const itemListSchema = profiles.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": profiles.map((p, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "url": `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/directory/${city.state.slug}/${city.slug}/businesses/${category.slug}/${p.slug}`,
      "name": p.name,
    })),
  } : null

  // Dynamic FAQs
  const faqs = [
    {
      q: `How do I choose the best ${category.name.toLowerCase()} provider in ${city.name}?`,
      a: `When selecting a ${category.name.toLowerCase()} professional in ${city.name}, check if they have a verified local profile, physical address, direct phone number, and positive reviews. It is recommended to choose merchants featured in local postcard discovery drops who are committed to the community.`,
    },
    {
      q: `What services do ${category.name.toLowerCase()} businesses in ${city.name} offer?`,
      a: `Local ${category.name.toLowerCase()} companies provide a range of services designed for residents in the ${city.name} area. Click on individual business profiles above to view their details, list of services, hours of operation, and direct links.`,
    },
    {
      q: `Are there exclusive deals for ${category.name.toLowerCase()} in ${city.name}?`,
      a: `Yes! Many ${category.name.toLowerCase()} providers featured on NearHere offer local card specials. You can find active postcard deals directly on their business profile pages.`,
    },
  ]

  return (
    <div className="min-h-screen bg-paper text-press font-sans flex flex-col justify-between selection:bg-[#FF4A1C] selection:text-white">
      
      {/* JSON-LD Injection */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {itemListSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
      )}

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
            <Link href={`/directory/${city.state.slug}/${city.slug}`} className="hover:text-[#FF4A1C] transition-colors">{city.name}</Link>
            <span>➔</span>
            <span className="text-white">{category.name}</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#FF4A1C]/35 bg-[#12100F]/90 text-[#FF4A1C] font-mono text-[10px] font-bold uppercase tracking-wider rounded-md shadow-[0_0_15px_rgba(255,74,28,0.1)]">
              🏢 {city.name}, {stateSlugUpper} Directory
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tight text-white leading-none">
              {category.name} in <span className="text-[#FF4A1C]">{city.name}</span>
            </h1>
            {category.description ? (
              <p className="text-base text-stone-400 leading-relaxed font-medium">
                {category.description}
              </p>
            ) : (
              <p className="text-base text-stone-400 leading-relaxed font-medium">
                Explore trusted, verified local {category.name.toLowerCase()} companies serving the {city.name} community. Compare contact details, websites, and exclusive postcard offers.
              </p>
            )}
            {!isIndexable && (
              <div className="inline-block px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 font-mono text-[9px] font-bold uppercase tracking-wider">
                ⚠️ Thin Content Auto-Safeguard: Page set to noindex
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-16 animate-fade-up">

        {/* Listings Grid */}
        <section className="space-y-8">
          {profiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => {
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
                        {/* Location Details */}
                        <span className="inline-block px-2.5 py-0.5 bg-[#FF4A1C]/10 border border-[#FF4A1C]/35 text-[#FF4A1C] text-[9px] font-mono font-bold uppercase tracking-wider rounded-md">
                          {city.name} Location
                        </span>
                      </div>

                      <div className="text-left space-y-1">
                        <h3 className="font-headline font-extrabold text-lg uppercase text-press tracking-tight truncate">
                          {profile.name}
                        </h3>
                        <span className="inline-block font-mono text-[9px] font-bold text-warm uppercase tracking-wider">
                          📍 {profile.locations[0]?.address || `${city.name}, ${stateSlugUpper}`}
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
                          href={`/directory/${city.state.slug}/${city.slug}/businesses/${category.slug}/${profile.slug}`}
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
            <div className="py-24 border border-dashed border-rule bg-white text-center space-y-3 rounded-lg">
              <span className="text-3xl">📭</span>
              <h3 className="font-headline font-extrabold text-lg uppercase text-press">No listings available</h3>
              <p className="text-xs text-warm max-w-sm mx-auto leading-relaxed">
                No active {category.name.toLowerCase()} businesses are registered in {city.name} at this time.
              </p>
            </div>
          )}
        </section>

        {/* Dynamic FAQ section */}
        <section className="border-t border-rule pt-12 text-left max-w-4xl">
          <h2 className="font-headline font-black text-2xl uppercase tracking-tight text-press mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="font-headline font-extrabold text-base uppercase text-press">
                  ❓ {faq.q}
                </h3>
                <p className="text-sm text-warm leading-relaxed font-medium pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Nearby Cities & Categories Footer grid */}
        <section className="border-t border-rule pt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {/* Nearby Categories */}
          {nearbyCategories.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-wider text-press">
                Other Services in {city.name}
              </h3>
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px] font-bold uppercase">
                {nearbyCategories.map((nc) => (
                  <Link
                    key={nc.slug}
                    href={`/directory/${city.state.slug}/${city.slug}/${nc.slug}`}
                    className="text-warm hover:text-[#FF4A1C] transition-colors"
                  >
                    ➔ {nc.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Nearby Cities */}
          {nearbyCities.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-headline font-extrabold text-sm uppercase tracking-wider text-press">
                Nearby {city.state.name} Cities
              </h3>
              <div className="grid grid-cols-2 gap-2 font-mono text-[10px] font-bold uppercase">
                {nearbyCities.map((nc) => (
                  <Link
                    key={nc.slug}
                    href={`/directory/${city.state.slug}/${nc.slug}/${category.slug}`}
                    className="text-warm hover:text-[#FF4A1C] transition-colors"
                  >
                    ➔ {nc.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <div className="directory-dark">
        <CampaignFooter />
      </div>
    </div>
  )
}
