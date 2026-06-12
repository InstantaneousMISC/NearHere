import { db } from "@/server/db"
import Link from "next/link"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"

export const metadata = {
  title: "Featured Local Businesses | NearHere",
  description: "Discover local businesses featured in NearHere shared postcard campaigns, including special offers, contact details, service areas, and website backlinks.",
}

export default async function FeaturedBusinessesPage() {
  // Load active businesses that have completed setup or have paid placements
  const businesses = await db.business.findMany({
    where: { status: "ACTIVE" },
    include: {
      advertiser: {
        include: {
          orders: {
            where: { status: "PAID" },
            include: {
              campaign: true,
              campaignSpot: {
                include: { category: true }
              },
              creativeSubmission: true
            }
          }
        }
      }
    }
  })

  // Extract distinct cities and categories for navigation links
  const cities = Array.from(new Set(businesses.map(b => b.city).filter(Boolean) as string[]))
  
  const categories = Array.from(
    new Set(
      businesses.flatMap(b => 
        b.advertiser?.orders.flatMap(o => o.campaignSpot?.category?.name)
      ).filter(Boolean) as string[]
    )
  )

  return (
    <div className="min-h-screen bg-paper text-press font-sans flex flex-col justify-between selection:bg-nh-red selection:text-paper">
      
      <CampaignNav isCheckoutPage={false} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-12">
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4 border-b border-rule pb-10">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-nh-red">
            Verified Advertisers
          </span>
          <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tight text-press leading-none">
            Featured Local Businesses
          </h1>
          <p className="text-base text-warm leading-relaxed font-medium">
            Discover local businesses featured in NearHere postcard campaigns, including special offers, contact details, service areas, and website links.
          </p>
        </div>

        {/* Filters / Browse Sections */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Filters */}
          <aside className="md:col-span-3 space-y-6 bg-[#FAF8F4] border border-rule p-5">
            <div className="space-y-4">
              <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-press border-b border-rule pb-2">
                Browse By City
              </h3>
              {cities.length > 0 ? (
                <div className="flex flex-col gap-1.5 font-mono text-[11px] font-bold uppercase">
                  {cities.map(city => (
                    <Link 
                      key={city} 
                      href={`/businesses/${city.toLowerCase()}`}
                      className="text-warm hover:text-nh-red transition-colors flex items-center justify-between"
                    >
                      <span>📍 {city}</span>
                      <span>➔</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No cities registered yet.</p>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-rule">
              <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-press border-b border-rule pb-2">
                Categories
              </h3>
              {categories.length > 0 ? (
                <div className="flex flex-col gap-1.5 font-mono text-[11px] font-bold uppercase">
                  {categories.map(cat => (
                    <span 
                      key={cat} 
                      className="text-warm flex items-center justify-between"
                    >
                      <span>⭐ {cat}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No categories active.</p>
              )}
            </div>
          </aside>

          {/* Directory Listings Grid */}
          <div className="md:col-span-9 space-y-8">
            {businesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {businesses.map(business => {
                  // Find category name & active offer
                  const latestOrder = business.advertiser?.orders?.[0]
                  const categoryName = latestOrder?.campaignSpot?.category?.name || "Local Services"
                  const offerDeal = latestOrder?.creativeSubmission?.offerDeal || null
                  const cityName = business.city ? business.city.charAt(0).toUpperCase() + business.city.slice(1) : "Local"
                  
                  return (
                    <article 
                      key={business.id}
                      className="bg-white border border-rule hover:border-press transition-all p-6 flex flex-col justify-between h-72 shadow-sm"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          {/* Logo */}
                          <div className="w-12 h-12 border border-rule bg-white flex items-center justify-center overflow-hidden shrink-0">
                            {business.logoUrl ? (
                              <img src={business.logoUrl} alt={business.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-headline font-extrabold text-sm uppercase text-press">
                                {business.name.slice(0, 2)}
                              </span>
                            )}
                          </div>
                          {/* Category Badge */}
                          <span className="inline-block px-2.5 py-0.5 bg-press text-paper text-[9px] font-mono font-bold uppercase tracking-wider">
                            {categoryName}
                          </span>
                        </div>

                        <div className="text-left space-y-1">
                          <h3 className="font-headline font-extrabold text-lg uppercase text-press tracking-tight truncate">
                            {business.name}
                          </h3>
                          <span className="inline-block font-mono text-[9px] font-bold text-warm uppercase tracking-wider">
                            📍 {cityName}{business.state ? `, ${business.state.toUpperCase()}` : ""}
                          </span>
                        </div>

                        {business.description && (
                          <p className="text-xs text-warm line-clamp-3 leading-relaxed text-left">
                            {business.description}
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
                          {business.website ? (
                            <a 
                              href={business.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] font-mono text-press hover:text-nh-red font-bold uppercase tracking-widest flex items-center gap-1"
                            >
                              🔗 Website Link
                            </a>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-300 uppercase">No website</span>
                          )}
                          <Link
                            href={`/business/${business.slug}`}
                            className="bg-press text-paper hover:bg-nh-red text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 transition-colors border border-press"
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
              <div className="py-24 border border-dashed border-rule bg-[#FAF8F4]/30 rounded-none text-center space-y-3">
                <span className="text-3xl">📭</span>
                <h3 className="font-headline font-extrabold text-lg uppercase text-press">No Businesses Featured Yet</h3>
                <p className="text-xs text-warm max-w-sm mx-auto leading-relaxed">
                  Featured businesses will appear here once creative submissions are approved for print.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      <CampaignFooter />

    </div>
  )
}
