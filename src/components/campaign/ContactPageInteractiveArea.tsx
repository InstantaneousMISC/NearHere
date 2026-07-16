"use client"

import { useState } from "react"
import PostcardPreview from "@/components/postcard/PostcardPreview"
import CampaignInquiryForm from "./CampaignInquiryForm"

interface ContactPageInteractiveAreaProps {
  campaignId: string
  campaignUrl: string
  facebookUrl?: string | null
  spots: any[]
  state: string
  city: string
  slug: string
  cardSize: string
  cardSkin: string
  mailingQuantity: number
  cityName: string
  stateName: string
}

export default function ContactPageInteractiveArea({
  campaignId,
  campaignUrl,
  facebookUrl,
  spots,
  state,
  city,
  slug,
  cardSize,
  cardSkin,
  mailingQuantity,
  cityName,
  stateName,
}: ContactPageInteractiveAreaProps) {
  const [initialCategory, setInitialCategory] = useState("")
  const [initialSpotLabel, setInitialSpotLabel] = useState("")
  const [formSubmitted, setFormSubmitted] = useState(false)

  const handleSpotClick = (spot: any) => {
    if (formSubmitted) return // Disable spot selection after form submission

    if (spot.category?.name) {
      setInitialCategory(spot.category.name)
    } else {
      setInitialCategory("")
    }
    setInitialSpotLabel(spot.label)

    // Scroll to form smoothly
    const formElement = document.getElementById("inquiry-form")
    if (formElement) {
      formElement.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      {/* Interactive Postcard Preview Section */}
      <section id="postcard" className="py-20 px-4 bg-stone-bg/20 border-b border-[#E7E0D8] scroll-mt-16 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-3 mb-12 select-none">
            <h2 className="text-3xl sm:text-4xl font-headline font-black uppercase tracking-tight leading-none text-stone-900">
              Interactive <span className="text-[#D13F1F]">Postcard Preview</span>
            </h2>
            <p className="text-sm text-stone-500 font-sans max-w-2xl mx-auto leading-relaxed">
              Click any available spot on the template to select it and pre-fill your inquiry form.
            </p>
          </div>
          <PostcardPreview
            spots={spots}
            state={state}
            city={city}
            slug={slug}
            onWaitlistClick={handleSpotClick}
            onReserveSpot={handleSpotClick}
            hoveredDoubleKeys={[]}
            cardSize={cardSize}
            cardSkin={cardSkin}
          />
        </div>
      </section>

      {/* Inquiry Form & Package Card Section */}
      <section id="inquiry-form" className="bg-[#1A1716] py-20 px-6 sm:px-8 border-b border-stone-900 scroll-mt-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column - Dark Form Card */}
          <div className="lg:col-span-7 bg-[#12100F] border border-stone-850 p-6 sm:p-10 shadow-2xl relative">
            {!formSubmitted && (
              <div className="border-b border-stone-850 pb-6 mb-8 text-left">
                <h2 className="text-3xl sm:text-4xl font-headline font-black uppercase text-white leading-none">
                  Reserve <span className="text-[#FF4A1C]">your spot</span>
                </h2>
                {initialSpotLabel && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-nh-red/10 border border-nh-red/30 text-[#FF4A1C] text-xs font-mono rounded uppercase">
                    ✓ Selected: {initialSpotLabel.replace("_", " ")}
                  </div>
                )}
                <p className="text-sm sm:text-base text-stone-400 font-sans mt-3 leading-relaxed max-w-xl">
                  Want us to walk you through it? Send your info and we’ll help with pricing, category availability, and setup.
                </p>
              </div>
            )}

            <CampaignInquiryForm
              campaignId={campaignId}
              campaignUrl={campaignUrl}
              facebookUrl={facebookUrl}
              source="CAMPAIGN_CONTACT_PAGE"
              initialCategory={initialCategory}
              initialSpotLabel={initialSpotLabel}
              onSuccess={() => setFormSubmitted(true)}
            />
          </div>

          {/* Right Column - Campaign Package Summary Card */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-[#E7E0D8] shadow-xl overflow-hidden rounded-none">
              {/* Card Header */}
              <div className="bg-[#D13F1F] px-6 py-8 text-center text-white select-none">
                <h3 className="font-headline font-black text-3xl uppercase tracking-widest leading-none">
                  Campaign Package
                </h3>
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-white/80 mt-2.5">
                  All of this. One simple investment.
                </p>
              </div>

              {/* Card Body */}
              <div className="p-6 sm:p-8 space-y-6 text-left text-stone-800">
                <ul className="space-y-5 text-sm select-none">
                  <li className="flex items-start gap-3">
                    <span className="text-[#D13F1F] font-bold text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        Direct Mail Reach
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        Mailed to {mailingQuantity.toLocaleString()} households in {cityName}, {stateName}.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-[#D13F1F] font-bold text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        Category Exclusivity
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        100% category protection—only one business in your category.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-[#D13F1F] font-bold text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        Digital Business Profile
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        SEO-optimized profile on NearHere to boost your online presence.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-[#D13F1F] font-bold text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        Permanent SEO Backlink
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        High-quality backlink to strengthen search visibility.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-[#D13F1F] font-bold text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        QR Code Tracking
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        Dynamic QR code on your postcard to track scans and engagement.
                      </span>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="text-[#D13F1F] font-bold text-lg leading-none mt-0.5">✓</span>
                    <div>
                      <strong className="font-mono text-sm font-bold uppercase tracking-wider text-stone-900 block leading-tight">
                        Professional Ad Design & Copy
                      </strong>
                      <span className="text-xs sm:text-sm text-stone-500 leading-relaxed block mt-1 font-sans">
                        Done-for-you design, copywriting, and print-ready postcards.
                      </span>
                    </div>
                  </li>
                </ul>

                {/* Bottom Note Box */}
                <div className="border border-stone-200 bg-stone-50 p-4 flex items-start gap-3 mt-4">
                  <span className="text-[#D13F1F] font-bold text-lg leading-none mt-0.5">✓</span>
                  <div className="text-left select-none">
                    <h4 className="font-headline font-black text-sm uppercase tracking-wider text-stone-900">
                      Low Risk. High Impact.
                    </h4>
                    <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-normal font-sans">
                      Invest in visibility that drives real local results.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
