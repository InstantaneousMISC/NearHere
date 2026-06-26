"use client"

import Link from "next/link"
import { useState } from "react"
import { X } from "lucide-react"

interface CampaignNavProps {
  state?: string
  city?: string
  slug?: string
  isCheckoutPage?: boolean
  isContactPage?: boolean
}

export function CampaignNav({ state, city, slug, isCheckoutPage = false, isContactPage = false }: CampaignNavProps) {
  const campaignPath = state && city && slug 
    ? `/campaigns/${state.toLowerCase()}/${city.toLowerCase()}/${slug.toLowerCase()}`
    : "/"

  const isSubPage = isCheckoutPage || isContactPage
  const linkPrefix = isSubPage ? campaignPath : ""

  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [viewSide, setViewSide] = useState<"front" | "back">("front")

  return (
    <>
      <header className="font-mono text-xs uppercase tracking-widest border-b border-rule sticky top-0 bg-paper/95 backdrop-blur z-40 text-foreground">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-headline font-bold text-2xl tracking-tight select-none text-current">
            Near<span className="text-nh-red">Here</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            {!isContactPage && (
              <Link href={`${linkPrefix}#campaign`} className="hover:text-nh-red transition-colors">Overview</Link>
            )}
            <Link href={isContactPage ? "#included" : `${linkPrefix}#included`} className="hover:text-nh-red transition-colors">What's Included</Link>
            <Link href={isContactPage ? "#inquiry-form" : `${linkPrefix}#placements`} className="hover:text-nh-red transition-colors">Placements</Link>
            {isContactPage ? (
              <button
                onClick={() => {
                  setIsPreviewOpen(true)
                  setViewSide("front")
                }}
                className="hover:text-nh-red transition-colors cursor-pointer text-left bg-transparent border-0 p-0 font-mono text-xs uppercase tracking-widest font-inherit"
              >
                Preview
              </button>
            ) : (
              <Link href={`${linkPrefix}#postcard`} className="hover:text-nh-red transition-colors">Preview</Link>
            )}
            <Link href={isContactPage ? "#faq" : `${linkPrefix}#faq`} className="hover:text-nh-red transition-colors">FAQ</Link>
          </nav>
          {isContactPage ? (
            <div className="w-[130px] hidden md:block" />
          ) : (
            <div className="flex items-center">
              <Link
                href={`${linkPrefix}#placements`}
                className="bg-nh-red text-paper px-5 py-2.5 font-headline font-bold uppercase tracking-wider text-xs hover:bg-press transition-colors"
              >
                Reserve a Spot
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Postcard Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
          <div className="relative max-w-4xl w-full bg-[#FAF8F4] border border-[#E7E0D8] p-6 sm:p-8 shadow-2xl flex flex-col items-center">
            {/* Close Button */}
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 text-stone-500 hover:text-[#FF4A1C] transition-colors p-2 hover:bg-stone-100 rounded-full cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Title */}
            <h3 className="font-headline font-black text-xl sm:text-2xl uppercase tracking-tight text-stone-900 mb-6">
              Example Campaign Postcard ({viewSide === "front" ? "Front" : "Back"})
            </h3>

            {/* Postcard Image Container */}
            <div className="relative w-full aspect-[11/6] border border-[#E7E0D8] bg-white overflow-hidden shadow-inner flex items-center justify-center">
              <img
                src={viewSide === "front" ? "/example-front-1.png" : "/example-back-2.png"}
                alt={`Campaign Postcard ${viewSide}`}
                className="w-full h-full object-contain transition-opacity duration-300"
              />
            </div>

            {/* Disclaimer Note */}
            <p className="text-stone-500 font-sans text-[11px] sm:text-xs italic text-center mt-3 select-none">
              * Representative preview sample only. The final printed card layout, routing details, and ads may vary slightly.
            </p>

            {/* Toggle Button */}
            <button
              onClick={() => setViewSide(prev => prev === "front" ? "back" : "front")}
              className="inline-flex items-center justify-center bg-[#FF4A1C] hover:bg-[#e03e1a] text-white font-headline text-xs sm:text-sm font-black uppercase tracking-wider px-6 py-3 transition-colors mt-6 rounded-md shadow-md cursor-pointer select-none"
            >
              Show {viewSide === "front" ? "Back" : "Front"} Side
            </button>
          </div>
        </div>
      )}
    </>
  )
}
