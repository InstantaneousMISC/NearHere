import React from "react"
import AdvertiserBlock from "./AdvertiserBlock"
import InteractiveSpotCell from "./InteractiveSpotCell"
import MailingPanel from "./MailingPanel"
import QRPlaceholder from "./QRPlaceholder"
import { mock6x11AdvertisersFront, mock6x11AdvertisersBack, MockAdvertiser } from "@/lib/mockPostcardData"

interface CommunityCard6x11Props {
  view?: "front" | "back"
  campaignName?: string
  locationLabel?: string
  homesCount?: string
  headline?: string
  advertisersFront?: {
    spotlight: MockAdvertiser
    right: MockAdvertiser[]
    bottom: MockAdvertiser[]
  }
  advertisersBack?: {
    top: MockAdvertiser[]
    bottom: MockAdvertiser[]
  }
  generalQrCodeUrl?: string
  brandMessage?: string
  spots?: any[]
  onSpotClick?: (spot: any) => void
  cardSkin?: string
}

export default function CommunityCard6x11({
  view = "front",
  campaignName = "NearHere community postcard",
  locationLabel = "CONVERSE, TEXAS",
  homesCount = "2,500 HOMES",
  headline = "EAT LOCAL THIS WEEK",
  advertisersFront = mock6x11AdvertisersFront,
  advertisersBack = mock6x11AdvertisersBack,
  generalQrCodeUrl = "/qr/general-converse",
  brandMessage = "Support local. Discover nearby.",
  spots,
  onSpotClick,
  cardSkin = "cream"
}: CommunityCard6x11Props) {
  const isFront = view === "front"

  // Partition database spots if provided
  const hasDbSpots = spots && spots.length > 0
  const frontSpots = hasDbSpots ? spots.filter(s => s.side === "FRONT").sort((a, b) => a.sortOrder - b.sortOrder) : []
  const backSpots = hasDbSpots ? spots.filter(s => s.side === "BACK").sort((a, b) => a.sortOrder - b.sortOrder) : []

  // Skin styling overrides mapped to local CSS variables
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
    <div 
      className="relative w-full aspect-[11/6] bg-paper border border-press/80 shadow-[0_20px_50px_-20px_rgba(33,29,28,0.3)] p-[1.5%] rounded-none select-none flex flex-col justify-between"
      style={activeStyles}
    >
      {isFront ? (
        // ================= FRONT SIDE =================
        <div className="w-full h-full flex flex-col justify-between">
          {/* Header Rail (Height: 12%) */}
          <div className="h-[12%] flex items-center justify-between border-b-2 border-press pb-1 select-none">
            <div className="flex items-baseline gap-2">
              <div className="font-headline font-black text-base md:text-lg tracking-tight text-nh-red flex items-center gap-0.5">
                Near<span className="text-press">Here</span>
              </div>
              <span className="text-[6px] md:text-[7px] font-mono text-warm uppercase font-bold tracking-wider">
                {locationLabel} • {homesCount}
              </span>
            </div>
            <h3 className="font-headline font-extrabold text-sm md:text-base text-press uppercase tracking-tight leading-none text-center">
              {headline}
            </h3>
            <div className="text-[6px] md:text-[8px] text-warm font-mono uppercase tracking-widest font-bold hidden sm:block">
              {brandMessage}
            </div>
          </div>

          {/* Body Row (Height: 63%) */}
          <div className="h-[63%] grid grid-cols-12 gap-2 mt-2">
            {/* Left: Premium Spotlight ad slot - Col span: 7 */}
            <div className="col-span-7 h-full">
              {hasDbSpots && frontSpots[0] ? (
                <InteractiveSpotCell spot={frontSpots[0]} variant="premium" onClick={onSpotClick} />
              ) : (
                <AdvertiserBlock {...advertisersFront.spotlight} variant="premium" />
              )}
            </div>

            {/* Right: 2 compact vertical ads - Col span: 5 */}
            <div className="col-span-5 grid grid-rows-2 gap-2 h-full">
              {hasDbSpots ? (
                frontSpots.slice(1, 3).map((spot) => (
                  <div key={spot.id} className="h-full">
                    <InteractiveSpotCell spot={spot} variant="compact" onClick={onSpotClick} />
                  </div>
                ))
              ) : (
                advertisersFront.right.slice(0, 2).map((ad) => (
                  <div key={ad.id} className="h-full">
                    <AdvertiserBlock {...ad} variant="compact" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer Row: 3 compact horizontal ads + General QR - Height: 21% */}
          <div className="h-[21%] grid grid-cols-12 gap-2 mt-2">
            {hasDbSpots ? (
              frontSpots.slice(3, 6).map((spot) => (
                <div key={spot.id} className="col-span-3 h-full">
                  <InteractiveSpotCell spot={spot} variant="compact" onClick={onSpotClick} />
                </div>
              ))
            ) : (
              advertisersFront.bottom.slice(0, 3).map((ad) => (
                <div key={ad.id} className="col-span-3 h-full">
                  <AdvertiserBlock {...ad} variant="compact" />
                </div>
              ))
            )}

            {/* General QR Explorer box - Col span: 3 */}
            <div className="col-span-3 border border-press bg-press text-paper p-1.5 flex items-center justify-between gap-1.5 select-none h-full">
              <div className="text-left leading-none min-w-0">
                <span className="text-[6px] font-mono text-warm uppercase tracking-widest font-bold block">
                  EXPLORE
                </span>
                <span className="font-headline font-extrabold uppercase text-[7px] md:text-[9px] text-paper tracking-tight block mt-0.5 truncate">
                  FULL LOCAL PAGE
                </span>
                <span className="text-[5px] text-warm block mt-0.5 truncate">
                  Scan to unlock all deals
                </span>
              </div>
              <div className="shrink-0 scale-[0.65] md:scale-[0.8] origin-right">
                <QRPlaceholder size="sm" label="" accentColor="var(--nh-paper-white)" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // ================= BACK SIDE =================
        <div className="w-full h-full flex flex-col justify-between">
          {/* Top Row: 3 standard/compact ads (Height: 37%) */}
          <div className="h-[37%] grid grid-cols-3 gap-2">
            {hasDbSpots ? (
              backSpots.slice(0, 3).map((spot) => (
                <div key={spot.id} className="h-full">
                  <InteractiveSpotCell spot={spot} variant="compact" onClick={onSpotClick} />
                </div>
              ))
            ) : (
              advertisersBack.top.slice(0, 3).map((ad) => (
                <div key={ad.id} className="h-full">
                  <AdvertiserBlock {...ad} variant="compact" />
                </div>
              ))
            )}
          </div>

          {/* Middle Row: Branded text + Protected address block (Height: 22%) */}
          <div className="h-[22%] grid grid-cols-3 gap-2 my-2">
            {/* Branded info block */}
            <div className="col-span-2 border border-rule bg-paper p-2.5 flex flex-col justify-between text-left select-none h-full">
              <div>
                <h4 className="font-headline font-extrabold uppercase text-[9px] md:text-xs text-nh-red tracking-wider leading-none">
                  SUPPORT LOCAL. DISCOVER NEARBY.
                </h4>
                <p className="text-[8px] md:text-[9px] text-warm leading-tight mt-1 font-medium">
                  NearHere brings {locationLabel.split(',')[0]}'s best local dining, shopping, and neighborly services directly to your doorstep. Call, scan, or mention this card to redeem.
                </p>
              </div>
              <div className="text-[6px] md:text-[8px] font-mono text-press uppercase font-bold pt-1 border-t border-dashed border-rule mt-0.5">
                📍 nearhere.com • local community guide
              </div>
            </div>

            {/* Mailing Panel */}
            <div className="col-span-1 h-full">
              <MailingPanel cityStateZip={locationLabel} />
            </div>
          </div>

          {/* Bottom Row: 3 standard/compact ads (Height: 37%) */}
          <div className="h-[37%] grid grid-cols-3 gap-2">
            {hasDbSpots ? (
              backSpots.slice(3, 6).map((spot) => (
                <div key={spot.id} className="h-full">
                  <InteractiveSpotCell spot={spot} variant="compact" onClick={onSpotClick} />
                </div>
              ))
            ) : (
              advertisersBack.bottom.slice(0, 3).map((ad) => (
                <div key={ad.id} className="h-full">
                  <AdvertiserBlock {...ad} variant="compact" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
