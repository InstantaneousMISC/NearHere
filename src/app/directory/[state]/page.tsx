import { db } from "@/server/db"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import type { Metadata } from "next"

interface StatePageProps {
  params: Promise<{ state: string }>
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: stateSlug } = await params
  const state = await db.state.findUnique({
    where: { slug: stateSlug },
  })

  if (!state || state.status !== "PUBLISHED") {
    return {
      title: "State Not Found | NearHere",
      description: "The requested state directory was not found.",
    }
  }

  return {
    title: `Local Businesses in ${state.name} | NearHere`,
    description: `Browse verified local businesses, services, contact details, and exclusive postcard deals in ${state.name} by city.`,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/directory/${state.slug}`,
    },
    robots: {
      index: state.isIndexed === "INDEX",
      follow: true,
    },
  }
}

export default async function StateDirectoryPage({ params }: StatePageProps) {
  const { state: stateSlug } = await params
  
  const state = await db.state.findUnique({
    where: { slug: stateSlug },
    include: {
      cities: {
        where: { status: "PUBLISHED" },
        include: {
          locations: {
            where: { status: "PUBLISHED", directoryProfile: { status: "PUBLISHED" } },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  })

  if (!state || state.status !== "PUBLISHED") {
    notFound()
  }

  // Count active businesses in each city to show count
  const citiesWithCounts = state.cities.map((city) => ({
    ...city,
    businessCount: city.locations.length,
  }))

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
            <span className="text-white">{state.name}</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#FF4A1C]/35 bg-[#12100F]/90 text-[#FF4A1C] font-mono text-[10px] font-bold uppercase tracking-wider rounded-md shadow-[0_0_15px_rgba(255,74,28,0.1)]">
              🏢 {state.name} Directory
            </div>
            <h1 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tight text-white leading-none">
              {state.name} <span className="text-[#FF4A1C]">Communities</span>
            </h1>
            <p className="text-base text-stone-400 leading-relaxed font-medium">
              Browse local business lists, neighborhood offers, and verified service providers in {state.name} by community.
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 space-y-16 animate-fade-up">
        {/* Cities Grid */}
        <section className="space-y-6">
          <h2 className="font-headline font-black text-2xl uppercase tracking-tight text-press border-b border-rule pb-2 text-left flex items-center gap-2">
            <span>🏢</span> Cities in {state.name}
          </h2>
          {citiesWithCounts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {citiesWithCounts.map((city) => (
                <Link
                  key={city.id}
                  href={`/directory/${state.slug}/${city.slug}`}
                  className="group bg-white border border-rule hover:border-[#FF4A1C] p-6 flex flex-col justify-between h-36 transition-all shadow-md rounded-lg hover:shadow-[0_0_15px_rgba(255,74,28,0.08)]"
                >
                  <div className="text-left space-y-1">
                    <h3 className="font-headline font-extrabold text-xl uppercase group-hover:text-[#FF4A1C] transition-colors">
                      {city.name}
                    </h3>
                    <p className="font-mono text-[9px] text-warm uppercase font-bold">
                      {state.name}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-t border-rule pt-3">
                    <span className="font-mono text-[10px] text-warm uppercase font-bold">
                      {city.businessCount} {city.businessCount === 1 ? "Profile" : "Profiles"}
                    </span>
                    <span className="text-warm group-hover:text-[#FF4A1C] transition-colors text-sm">➔</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-24 border border-dashed border-rule bg-white text-center space-y-3 rounded-lg">
              <span className="text-3xl">📭</span>
              <h3 className="font-headline font-extrabold text-lg uppercase text-press">No Cities Active</h3>
              <p className="text-xs text-warm max-w-sm mx-auto leading-relaxed">
                Directory listings for {state.name} will appear here once local postcard campaigns are active.
              </p>
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
