"use client"

import React, { useState } from "react"
import SharedCard9x12 from "./SharedCard9x12"
import CommunityCard6x11 from "./CommunityCard6x11"
import SlotMap from "./SlotMap"
import Badge from "./Badge"
import AdvertiserBlock from "./AdvertiserBlock"
import { SharedCard9x12Ad } from "./SharedCard9x12Ad"
import {
  TEMPLATE_1_PRICING,
  template1FrontSlots,
  template1PremiumAdvertiser,
} from "@/lib/nearHereSharedCard9x12"

type CardSize = "9x12" | "6x11"
type ViewMode = "front" | "back" | "both" | "anatomy"

export default function PostcardTemplateBoard() {
  const [activeSize, setActiveSize] = useState<CardSize>("9x12")
  const [activeView, setActiveView] = useState<ViewMode>("both")
  const [zoomScale, setZoomScale] = useState<number>(1)
  const [cardSkin, setCardSkin] = useState<string>("cream")
  const [premiumDemoSold, setPremiumDemoSold] = useState(false)

  const handleZoom = (direction: "in" | "out" | "reset") => {
    if (direction === "in" && zoomScale < 1.3) setZoomScale(s => s + 0.1)
    if (direction === "out" && zoomScale > 0.7) setZoomScale(s => s - 0.1)
    if (direction === "reset") setZoomScale(1)
  }

  const skinStyles: Record<string, React.CSSProperties & { [key: string]: string }> = {
    cream: {
      "--nh-paper-white": "#FAF8F4",
      "--nh-press-gray": "#211D1C",
      "--nh-border-gray": "#E7E0D8",
    },
    dark: {
      "--nh-paper-white": "#211D1C",
      "--nh-press-gray": "#FAF8F4",
      "--nh-border-gray": "#3D3533",
    },
    minimalist: {
      "--nh-paper-white": "#FFFFFF",
      "--nh-press-gray": "#1A1A1A",
      "--nh-border-gray": "#E2E8F0",
    }
  }

  const activeStyles = skinStyles[cardSkin] || skinStyles.cream

  return (
    <div className="space-y-8 font-sans pb-16">
      {/* Top Banner and Navigation bar */}
      <div className="border border-rule bg-paper p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 select-none">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-headline font-black text-2xl tracking-tighter text-nh-red flex items-center">
              Near<span className="text-press">Here</span>
            </span>
            <span className="inline-flex items-center font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-gold text-gold">
              Templates Engine
            </span>
          </div>
          <h1 className="font-headline font-extrabold text-3xl text-press uppercase tracking-tight leading-none">
            2 Standard Postcard Templates
          </h1>
          <p className="text-warm text-sm leading-tight font-medium max-w-xl">
            Built for local discovery. Designed for results. Toggle card sizes, inspect front/back print grids, and view ad placement mappings below.
          </p>
        </div>

        {/* Global badges */}
        <div className="flex flex-wrap gap-2">
          <Badge text="ONE BUSINESS PER CATEGORY" variant="press" />
          <Badge text="PREMIUM PLACEMENTS" variant="gold" />
          <Badge text="TRACKABLE QR CODES" variant="red" />
        </div>
      </div>

      {/* Control panel and Tabs row */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 border border-rule bg-paper">
        {/* Toggle size */}
        <div className="flex gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider">
          <button
            onClick={() => setActiveSize("9x12")}
            className={`px-4 py-2 border transition-all cursor-pointer rounded-none ${
              activeSize === "9x12"
                ? "bg-press text-[#FAF8F4] border-press"
                : "text-warm border-rule hover:border-press/50"
            }`}
          >
            Template 1: 9x12 Shared Card
          </button>
          <button
            onClick={() => setActiveSize("6x11")}
            className={`px-4 py-2 border transition-all cursor-pointer rounded-none ${
              activeSize === "6x11"
                ? "bg-press text-[#FAF8F4] border-press"
                : "text-warm border-rule hover:border-press/50"
            }`}
          >
            Template 2: 6x11 Community Card
          </button>
        </div>

        {activeSize === "6x11" ? (
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider">
            <span className="text-warm pr-1">Skin:</span>
            {["cream", "dark", "minimalist"].map((skin) => (
              <button
                key={skin}
                onClick={() => setCardSkin(skin)}
                className={`px-3 py-2 border transition-all cursor-pointer rounded-none ${
                  cardSkin === skin
                    ? "bg-press text-[#FAF8F4] border-press"
                    : "text-warm border-rule hover:border-press/50"
                }`}
              >
                {skin === "cream"
                  ? "Cream"
                  : skin === "dark"
                    ? "Slate Dark"
                    : "Modern White"}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider">
            <span className="text-warm pr-1">Premium Center:</span>
            <button
              onClick={() => setPremiumDemoSold(false)}
              className={`px-3 py-2 border transition-all cursor-pointer rounded-none ${
                !premiumDemoSold
                  ? "bg-press text-[#FAF8F4] border-press"
                  : "text-warm border-rule hover:border-press/50"
              }`}
            >
              NearHere Default
            </button>
            <button
              onClick={() => setPremiumDemoSold(true)}
              className={`px-3 py-2 border transition-all cursor-pointer rounded-none ${
                premiumDemoSold
                  ? "bg-press text-[#FAF8F4] border-press"
                  : "text-warm border-rule hover:border-press/50"
              }`}
            >
              Sold Advertiser
            </button>
          </div>
        )}

        {/* Toggle view mode */}
        <div className="flex gap-1.5 font-mono text-[10px] uppercase font-bold tracking-wider">
          <button
            onClick={() => setActiveView("both")}
            className={`px-3 py-2 border transition-all cursor-pointer rounded-none ${
              activeView === "both"
                ? "bg-press text-[#FAF8F4] border-press"
                : "text-warm border-rule hover:border-press/50"
            }`}
          >
            Side-By-Side (Both)
          </button>
          <button
            onClick={() => setActiveView("front")}
            className={`px-3 py-2 border transition-all cursor-pointer rounded-none ${
              activeView === "front"
                ? "bg-press text-[#FAF8F4] border-press"
                : "text-warm border-rule hover:border-press/50"
            }`}
          >
            Front Side Only
          </button>
          <button
            onClick={() => setActiveView("back")}
            className={`px-3 py-2 border transition-all cursor-pointer rounded-none ${
              activeView === "back"
                ? "bg-press text-[#FAF8F4] border-press"
                : "text-warm border-rule hover:border-press/50"
            }`}
          >
            Back Side Only
          </button>
          <button
            onClick={() => setActiveView("anatomy")}
            className={`px-3 py-2 border transition-all cursor-pointer rounded-none ${
              activeView === "anatomy"
                ? "bg-press text-[#FAF8F4] border-press"
                : "text-warm border-rule hover:border-press/50"
            }`}
          >
            Anatomy & Slot Map
          </button>
        </div>

        {/* Zoom scale controls */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-warm uppercase font-bold">
          <span>Zoom:</span>
          <button 
            onClick={() => handleZoom("out")} 
            className="w-7 h-7 border border-rule flex items-center justify-center hover:bg-muted font-bold transition-all cursor-pointer"
          >
            －
          </button>
          <span className="w-12 text-center text-press">{Math.round(zoomScale * 100)}%</span>
          <button 
            onClick={() => handleZoom("in")} 
            className="w-7 h-7 border border-rule flex items-center justify-center hover:bg-muted font-bold transition-all cursor-pointer"
          >
            ＋
          </button>
          <button 
            onClick={() => handleZoom("reset")} 
            className="px-2 py-1.5 border border-rule hover:bg-muted transition-all text-[8px] cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Showcase Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        {/* Left Side: Active post card displays */}
        <div className="xl:col-span-3 space-y-8 min-w-0">
          <div 
            className="w-full transition-transform duration-300 origin-top"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {activeView === "both" && (
              <div className="grid grid-cols-1 gap-8">
                {/* Front */}
                <div className="space-y-2">
                  <div className="text-left font-mono text-[10px] uppercase font-black text-warm flex justify-between">
                    <span>FRONT SIDE</span>
                    <span>Landscape aspect-ratio preview</span>
                  </div>
                  {activeSize === "9x12" ? (
                    <div className="overflow-x-auto pb-4">
                      <SharedCard9x12 view="front" />
                    </div>
                  ) : (
                    <CommunityCard6x11 view="front" cardSkin={cardSkin} />
                  )}
                </div>

                {/* Back */}
                <div className="space-y-2 mt-4">
                  <div className="text-left font-mono text-[10px] uppercase font-black text-warm flex justify-between">
                    <span>BACK SIDE (Mailing panel & ads)</span>
                    <span>Landscape aspect-ratio preview</span>
                  </div>
                  {activeSize === "9x12" ? (
                    <div className="overflow-x-auto pb-4">
                      <SharedCard9x12
                        view="back"
                        premiumAdvertiser={
                          premiumDemoSold ? template1PremiumAdvertiser : null
                        }
                      />
                    </div>
                  ) : (
                    <CommunityCard6x11 view="back" cardSkin={cardSkin} />
                  )}
                </div>
              </div>
            )}

            {activeView === "front" && (
              <div className="space-y-2">
                <div className="text-left font-mono text-[10px] uppercase font-black text-warm">
                  {activeSize === "9x12" ? "9x12 Shared Card Front (Style A: Premium Grid)" : "6x11 Community Card Front (Style B: Spotlight)"}
                </div>
                {activeSize === "9x12" ? (
                  <div className="overflow-x-auto pb-4">
                    <SharedCard9x12 view="front" />
                  </div>
                ) : (
                  <CommunityCard6x11 view="front" cardSkin={cardSkin} />
                )}
              </div>
            )}

            {activeView === "back" && (
              <div className="space-y-2">
                <div className="text-left font-mono text-[10px] uppercase font-black text-warm">
                  {activeSize === "9x12" ? "9x12 Shared Card Back" : "6x11 Community Card Back"}
                </div>
                {activeSize === "9x12" ? (
                  <div className="overflow-x-auto pb-4">
                    <SharedCard9x12
                      view="back"
                      premiumAdvertiser={
                        premiumDemoSold ? template1PremiumAdvertiser : null
                      }
                    />
                  </div>
                ) : (
                  <CommunityCard6x11 view="back" cardSkin={cardSkin} />
                )}
              </div>
            )}

            {activeView === "anatomy" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="border border-rule bg-paper p-6 shadow-sm">
                  <SlotMap type="9x12" />
                </div>
                <div className="border border-rule bg-paper p-6 shadow-sm">
                  <SlotMap type="6x11" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Advertiser block anatomy & details info panel */}
        <div className="xl:col-span-1 space-y-6">
          {/* Ad block anatomy */}
          <div className="border border-rule bg-paper p-6 space-y-6 shadow-sm">
            <h3 className="font-headline font-extrabold text-base text-press uppercase tracking-wider text-center border-b border-rule pb-2">
              Ad Block Anatomy
            </h3>
            
            <div
              className={`relative border border-dashed border-nh-red/40 bg-paper p-2 text-press animate-fade-up ${
                activeSize === "9x12" ? "overflow-x-auto" : ""
              }`}
              style={activeSize === "6x11" ? activeStyles : undefined}
            >
              {activeSize === "9x12" ? (
                <div className="h-[265px] w-[230px]">
                  <SharedCard9x12Ad advertiser={template1FrontSlots[0]!} />
                </div>
              ) : (
                <AdvertiserBlock
                  category="PLUMBING"
                  businessName="RIVERDALE PLUMBING"
                  description="Fast, reliable plumbing when you need it most."
                  offer="$50 OFF"
                  qrLabel="ANY SERVICE CALL"
                  phone="(210) 555-1001"
                  qrCodeUrl="/qr/riverdale"
                  redemptionNote="Mention this card to redeem."
                  accentColor="#0B2F4A"
                  variant="standard"
                />
              )}
            </div>

            {/* Explanations List */}
            <ol className="text-left font-mono text-[9px] text-warm space-y-2 select-none">
              <li className="flex gap-2">
                <span className="bg-press text-paper w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold">1</span>
                <div>
                  <span className="text-press font-bold">Category Ribbon:</span> At the top of every ad block to ensure category visibility.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-press text-paper w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold">2</span>
                <div>
                  <span className="text-press font-bold">Business Name:</span> Rendered in bold, uppercase condensed font-headline.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-press text-paper w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold">3</span>
                <div>
                  <span className="text-press font-bold">Description Copy:</span> Service value statement or benefits description.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-press text-paper w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold">4</span>
                <div>
                  <span className="text-press font-bold">Offer / Discount Box:</span> Rendered in high contrast Terracotta red.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-press text-paper w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold">5</span>
                <div>
                  <span className="text-press font-bold">Unique QR Code:</span> Individual tracking QR code for response path monitoring.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-press text-paper w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold">6</span>
                <div>
                  <span className="text-press font-bold">Phone Number Bar:</span> Call response action bar along the bottom.
                </div>
              </li>
              <li className="flex gap-2">
                <span className="bg-press text-paper w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold">7</span>
                <div>
                  <span className="text-press font-bold">Redemption Note:</span>{" "}
                  {activeSize === "9x12"
                    ? "Mention-card instruction outside the phone bar."
                    : "Small instruction at the bottom of the card block."}
                </div>
              </li>
              {activeSize === "9x12" && (
                <li className="flex gap-2">
                  <span className="bg-press text-paper w-4 h-4 rounded-full flex items-center justify-center shrink-0 font-bold">8</span>
                  <div>
                    <span className="text-press font-bold">Website:</span> One-line domain above the phone-only response bar.
                  </div>
                </li>
              )}
            </ol>
          </div>

          {/* Pricing Info Sheet */}
          <div className="border border-rule bg-paper p-6 space-y-4 shadow-sm text-left">
            <h3 className="font-headline font-extrabold text-base text-press uppercase tracking-wider text-center border-b border-rule pb-2">
              {activeSize === "9x12" ? "Template 1 Pricing" : "Pricing Guide (Est.)"}
            </h3>
            
            <div className="space-y-3 font-mono text-[9px] text-warm select-none">
              {activeSize === "9x12" ? (
                [
                  ["Front Standard", TEMPLATE_1_PRICING.frontStandard, "4.9 cents / home"],
                  ["Back Standard", TEMPLATE_1_PRICING.backStandard, "5.9 cents / home"],
                  ["Front Double", TEMPLATE_1_PRICING.frontDouble, "8.9 cents / home"],
                  ["Back Double", TEMPLATE_1_PRICING.backDouble, "9.9 cents / home"],
                  ["Premium Center Back", TEMPLATE_1_PRICING.premiumCenterBack, "14.9 cents / home"],
                ].map(([label, price, perHome]) => (
                  <div key={label} className="flex justify-between items-baseline gap-3">
                    <span className={`font-bold ${label === "Premium Center Back" ? "text-[#C9993E]" : "text-press"}`}>
                      {label}
                    </span>
                    <span className="text-right">
                      <span className="font-bold">${Number(price).toLocaleString()}</span>
                      <span className="block text-[7px]">{perHome}</span>
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-press">Half Space (1.5" x 3")</span>
                    <span>$250/drop</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-press">Standard Space (3" x 4")</span>
                    <span>$450–$500/drop</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-press">Double Space (3" x 8")</span>
                    <span>$899/drop</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold text-[#C9993E]">Premium Spotlight Space</span>
                    <span className="text-[#C9993E] font-bold">$1,000–$1,100</span>
                  </div>
                </>
              )}
              
              <div className="pt-2 border-t border-rule space-y-1">
                <div className="font-bold text-press uppercase text-[8px]">Three-Way Deal Action:</div>
                <div className="text-[8px] leading-tight">
                  Homeowners scan unique QR code, call the featured phone number, or present/mention this postcard to redeem.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
