"use client"

import Link from "next/link"
import { useState } from "react"
import { X, Image, Mail, Info, Search } from "lucide-react"

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
      <header
        className={
          isContactPage
            ? "font-mono text-xs uppercase tracking-widest sticky top-0 z-40 bg-[#12100F] border-b border-stone-850 text-white py-4 shadow-lg transition-all duration-300"
            : "font-mono text-xs uppercase tracking-widest border-b border-rule sticky top-0 bg-paper/95 backdrop-blur z-40 text-foreground py-4"
        }
      >
        <div className={`max-w-7xl mx-auto px-6 flex items-center justify-between ${isContactPage ? "w-full" : ""}`}>
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
          {!isContactPage && (
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="relative w-full max-w-[960px] bg-gradient-to-b from-[#171513] to-[#0a0a09] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-500/10 via-[#0d0d0c] to-[#0d0d0c] border border-orange-500/35 rounded-xl shadow-[0_0_50px_rgba(255,80,20,0.16)] flex flex-col items-center p-5 md:py-6 md:px-8 text-white max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 h-10 w-10 sm:h-11 sm:w-11 rounded-full border border-orange-500/40 bg-black/40 text-stone-400 hover:text-orange-500 hover:border-orange-500 hover:shadow-[0_0_15px_rgba(255,80,20,0.3)] transition flex items-center justify-center cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Top Badge */}
            {/* <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-orange-950/30 px-4 py-1.5 text-xs font-extrabold tracking-wide uppercase text-orange-500 mb-2 select-none">
              <Image className="h-3.5 w-3.5" />
              <span>POSTCARD PREVIEW</span>
            </div> */}

            {/* Title */}
            <h3 className="text-center text-2xl sm:text-3xl md:text-4xl font-black tracking-tight uppercase text-white mb-1.5 font-headline leading-none">
              EXAMPLE CAMPAIGN POSTCARD
            </h3>

            {/* Helper Text */}
            <p className="text-center text-xs sm:text-sm text-stone-400 max-w-md mx-auto mb-4 font-sans">
              This is a preview of your campaign postcard. Review the front and back before printing.
            </p>

            {/* Segmented Control (Toggle) */}
            <div className="inline-flex rounded-full border border-white/15 bg-black/40 p-1 mb-4">
              <button
                onClick={() => setViewSide("front")}
                className={`rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${viewSide === "front"
                  ? "bg-orange-600 text-white shadow-[0_0_20px_rgba(255,80,20,0.25)]"
                  : "bg-transparent text-stone-400 hover:text-white"
                  }`}
                aria-label="View front side of postcard"
                aria-selected={viewSide === "front"}
              >
                <Image className="h-3 w-3" />
                <span>FRONT</span>
              </button>
              <button
                onClick={() => setViewSide("back")}
                className={`rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${viewSide === "back"
                  ? "bg-orange-600 text-white shadow-[0_0_20px_rgba(255,80,20,0.25)]"
                  : "bg-transparent text-stone-400 hover:text-white"
                  }`}
                aria-label="View back side of postcard"
                aria-selected={viewSide === "back"}
              >
                <Mail className="h-3 w-3" />
                <span>BACK</span>
              </button>
            </div>

            {/* Postcard Preview Frame */}
            <div className="mx-auto max-w-[680px] w-full rounded-md border border-orange-500/30 bg-black p-1 shadow-[0_20px_60px_rgba(0,0,0,0.55)] mb-3">
              <img
                src={viewSide === "front" ? "/example-front-1.png" : "/example-back-2.png"}
                alt={`Campaign Postcard ${viewSide === "front" ? "Front" : "Back"}`}
                className="w-full h-auto max-h-[280px] sm:max-h-[340px] md:max-h-[380px] object-contain rounded-sm"
              />
            </div>

            {/* Disclaimer */}
            <div className="flex items-center justify-center gap-2 text-[10px] sm:text-xs text-stone-400 mb-4 select-none max-w-xl text-center mx-auto">
              <Info className="h-4 w-4 text-orange-500 flex-shrink-0" />
              <span>
                Representative preview sample only. The final printed card layout, routing details, and ads may vary slightly.
              </span>
            </div>

            {/* Primary Toggle CTA Button */}
            {/* <button
              onClick={() => setViewSide(prev => prev === "front" ? "back" : "front")}
              className="inline-flex items-center justify-center gap-3 rounded-md bg-orange-600 px-8 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-[0_12px_28px_rgba(255,80,20,0.35)] hover:bg-orange-500 hover:shadow-[0_12px_32px_rgba(255,80,20,0.45)] transition-all cursor-pointer select-none"
              aria-label={viewSide === "front" ? "Switch to view back side" : "Switch to view front side"}
            >
              {viewSide === "front" ? (
                <>
                  <Mail className="h-4 w-4" />
                  <span>VIEW BACK SIDE →</span>
                </>
              ) : (
                <>
                  <Image className="h-4 w-4" />
                  <span>VIEW FRONT SIDE →</span>
                </>
              )}
            </button> */}

            {/* Zoom Button (Hidden on Mobile, absolute in bottom-left for desktop) */}
            <button
              onClick={() => window.open(viewSide === "front" ? "/example-front-1.png" : "/example-back-2.png", '_blank')}
              className="hidden sm:flex absolute bottom-6 left-6 h-10 w-10 rounded-md border border-neutral-800 bg-black/60 text-stone-400 hover:text-orange-500 hover:border-orange-500/50 hover:bg-black transition flex items-center justify-center cursor-pointer shadow-lg"
              aria-label="Open postcard image in new tab to zoom"
              title="Open full resolution"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
