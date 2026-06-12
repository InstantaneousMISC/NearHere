"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, ChevronRight, Sparkles } from "lucide-react"
import { AdvertiserCategory, ParentCategory } from "@/data/advertiserCategories"

interface CategoryDirectoryProps {
  categories: AdvertiserCategory[]
}

const parentLabels: Record<ParentCategory, string> = {
  "home-services": "Home Services",
  "real-estate-financial": "Real Estate & Financial",
  "health-wellness-beauty": "Health, Wellness & Beauty",
  "food-beverage-hospitality": "Food, Beverage & Hospitality",
  automotive: "Automotive & Vehicle",
  "family-kids-education": "Family, Kids & Education",
  pets: "Pets & Animal Care",
  "professional-local-services": "Professional & Business Services",
  "retail-specialty": "Retail & Specialty Shops",
  "senior-community-services": "Senior & Community Services",
}

export function CategoryDirectory({ categories }: CategoryDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCategories = categories.filter(
    (c) =>
      c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parentLabels[c.parentCategory].toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group by parent category
  const categoriesByParent = {} as Record<ParentCategory, AdvertiserCategory[]>
  Object.keys(parentLabels).forEach((parent) => {
    categoriesByParent[parent as ParentCategory] = []
  })

  filteredCategories.forEach((c) => {
    if (categoriesByParent[c.parentCategory]) {
      categoriesByParent[c.parentCategory].push(c)
    }
  })

  return (
    <div className="bg-[#FAF8F4] text-[#211D1C] min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-[#E7E0D8] sticky top-0 bg-[#FAF8F4]/95 backdrop-blur z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-extrabold uppercase italic tracking-tighter select-none">
            <span className="bg-primary px-1.5 py-0.5 text-primary-foreground">Near</span>
            <span className="text-foreground">Here</span>
          </Link>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-widest hover:text-primary transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      {/* Directory Hero */}
      <section className="border-b border-[#E7E0D8] py-16 bg-[#F1ECE3]/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 border border-primary/20 bg-primary/10 text-primary font-bold">
            Supported Industries
          </span>
          <h1 className="font-headline font-black text-4xl md:text-6xl mt-4 uppercase leading-none tracking-tight">
            Find Your Industry
          </h1>
          <p className="mt-4 text-muted-foreground text-base max-w-xl mx-auto">
            Discover how NearHere shared postcard campaigns and local visibility packages help your
            specific industry reach nearby homeowners.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-md mx-auto relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="text"
              placeholder="Search your industry (e.g., HVAC, Dentist, Realtor)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#FAF8F4] border border-[#211D1C]/50 rounded-none focus:outline-none focus:border-primary font-body text-sm placeholder:text-muted-foreground/70"
            />
          </div>
        </div>
      </section>

      {/* Directory Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground font-mono">
              No categories found matching "{searchTerm}"
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-4 text-primary hover:underline text-sm font-mono uppercase tracking-wider cursor-pointer"
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(parentLabels).map(([parentKey, parentLabel]) => {
              const list = categoriesByParent[parentKey as ParentCategory] || []
              if (list.length === 0) return null

              return (
                <div key={parentKey} className="border border-[#E7E0D8] bg-[#FAF8F4] p-6 md:p-8">
                  <div className="border-b border-[#E7E0D8] pb-4 mb-6 flex items-center justify-between">
                    <h2 className="font-headline font-extrabold text-2xl uppercase tracking-tight">
                      {parentLabel}
                    </h2>
                    <span className="font-mono text-[10px] text-muted-foreground bg-[#F1ECE3] px-2.5 py-1">
                      {list.length} {list.length === 1 ? "Category" : "Categories"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {list.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/advertise/${cat.slug}`}
                        className="p-3 border border-[#E7E0D8] hover:border-primary hover:bg-[#F1ECE3]/30 group flex items-center justify-between transition-all"
                      >
                        <span className="font-headline font-bold text-base text-foreground group-hover:text-primary transition-colors uppercase">
                          {cat.label}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E7E0D8] bg-[#211D1C] text-[#FAF8F4] py-8 text-center mt-12">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/50">
          © {new Date().getFullYear()} NearHere — Get Mailed, Get Scanned, Get Found.
        </p>
      </footer>
    </div>
  )
}
