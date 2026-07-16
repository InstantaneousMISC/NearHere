import { db } from "@/server/db"
import Link from "next/link"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Local Business Directory | NearHere",
  description: "Browse verified local businesses and exclusive postcard offers in your neighborhood by state, city, and category.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/directory`,
  },
}

export default async function DirectoryHomePage() {
  // Fetch active states with count of active cities
  const states = await db.state.findMany({
    where: { status: "PUBLISHED" },
    include: {
      _count: {
        select: {
          cities: {
            where: { status: "PUBLISHED" },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  })

  // Fetch all active categories
  const categories = await db.directoryCategory.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { name: "asc" },
  })

  // Fetch all active cities directly to display them in a popular city block
  const popularCities = await db.city.findMany({
    where: { status: "PUBLISHED" },
    include: { state: true },
    take: 12,
  })

  return (
    <div className="min-h-screen bg-paper text-press font-sans flex flex-col justify-between selection:bg-[#FF4A1C] selection:text-white">
      <div className="directory-dark">
        <CampaignNav isCheckoutPage={false} />
      </div>

      <header className="directory-dark bg-[#12100F] border-b border-stone-900 py-16 px-6 relative overflow-hidden select-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent z-0 pointer-events-none" />
        <div className="max-w-7xl mx-auto text-center max-w-3xl space-y-5 z-10 relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#FF4A1C]/30 bg-[#12100F]/90 text-[#FF4A1C] font-mono text-[10px] font-bold uppercase tracking-wider rounded-md shadow-[0_0_15px_rgba(255,74,28,0.1)]">
            🌐 NearHere Network
          </div>
          <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tight text-white leading-none">
            Local Business <span className="text-[#FF4A1C]">Directory</span>
          </h1>
          <p className="text-base text-stone-400 leading-relaxed font-medium">
            Explore trusted local businesses, service areas, verified contact details, and exclusive postcard deals across your community.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-16 animate-fade-up">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Left Column - States & Cities */}
          <section className="md:col-span-8 space-y-12">
            {/* Browse By State */}
            <div className="space-y-6">
              <h2 className="font-headline font-black text-2xl uppercase tracking-tight text-press border-b border-rule pb-2 flex items-center gap-2 text-left">
                <span>📍</span> Browse by State
              </h2>
              {states.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {states.map((state) => (
                    <Link
                      key={state.id}
                      href={`/directory/${state.slug}`}
                      className="group bg-white border border-rule hover:border-[#FF4A1C] p-5 flex items-center justify-between transition-all rounded-lg shadow-sm hover:shadow-[0_0_15px_rgba(255,74,28,0.08)]"
                    >
                      <div className="text-left space-y-1">
                        <div className="font-headline font-extrabold text-lg uppercase group-hover:text-[#FF4A1C] transition-colors">
                          {state.name}
                        </div>
                        <div className="font-mono text-[10px] text-warm uppercase font-bold">
                          {state._count.cities} Active {state._count.cities === 1 ? "City" : "Cities"}
                        </div>
                      </div>
                      <span className="text-warm group-hover:text-[#FF4A1C] transition-colors text-lg font-bold">➔</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-12 border border-dashed border-rule bg-white text-center text-warm italic text-sm rounded-lg">
                  No states registered yet.
                </div>
              )}
            </div>

            {/* Popular Cities list */}
            {popularCities.length > 0 && (
              <div className="space-y-6">
                <h2 className="font-headline font-black text-2xl uppercase tracking-tight text-press border-b border-rule pb-2 flex items-center gap-2 text-left">
                  <span>🏢</span> Featured Communities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {popularCities.map((city) => (
                    <Link
                      key={city.id}
                      href={`/directory/${city.state.slug}/${city.slug}`}
                      className="bg-white border border-rule hover:border-[#FF4A1C] px-4 py-3 text-center transition-all group rounded-lg shadow-sm hover:shadow-[0_0_15px_rgba(255,74,28,0.08)]"
                    >
                      <span className="font-headline font-extrabold text-sm uppercase text-press group-hover:text-[#FF4A1C] transition-colors block truncate">
                        {city.name}, {city.state.slug.toUpperCase()}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Right Column - Directory Categories */}
          <aside className="md:col-span-4 space-y-6 bg-white border border-rule p-6 self-start shadow-md rounded-lg">
            <h2 className="font-headline font-black text-xl uppercase tracking-tight text-press border-b border-rule pb-2 flex items-center gap-2">
              <span>🏷️</span> Business Categories
            </h2>
            {categories.length > 0 ? (
              <nav className="flex flex-col divide-y divide-rule font-headline">
                {categories.map((cat) => (
                  <div key={cat.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between text-left">
                    <span className="font-bold text-sm uppercase text-press">
                      {cat.name}
                    </span>
                    <span className="inline-block px-2 py-0.5 bg-[#FAF8F4] border border-rule text-warm font-mono text-[9px] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </div>
                ))}
              </nav>
            ) : (
              <p className="text-xs text-warm italic py-4">No categories registered yet.</p>
            )}
          </aside>
        </div>
      </main>

      <div className="directory-dark">
        <CampaignFooter />
      </div>
    </div>
  )
}
