import React from "react"
import AdvertiserBlock from "./AdvertiserBlock"
import InteractiveSpotCell from "./InteractiveSpotCell"
import MailingPanel from "./MailingPanel"
import QRPlaceholder from "./QRPlaceholder"
import { mock9x12AdvertisersFront, mock9x12AdvertisersBack, MockAdvertiser } from "@/lib/mockPostcardData"

interface SharedCard9x12Props {
  view?: "front" | "back"
  campaignName?: string
  locationLabel?: string
  homesCount?: string
  headline?: string
  advertisersFront?: {
    left: MockAdvertiser[]
    right: MockAdvertiser[]
    divider?: MockAdvertiser
  }
  advertisersBack?: {
    top: MockAdvertiser[]
    bottom: MockAdvertiser[]
    premium?: MockAdvertiser
  }
  generalQrCodeUrl?: string
  brandMessage?: string
  spots?: any[]
  onSpotClick?: (spot: any) => void
  cardSkin?: string
}

export default function SharedCard9x12({
  view = "front",
  campaignName = "NearHere shared postcard",
  locationLabel = "CONVERSE, TEXAS",
  homesCount = "10,000 HOMES",
  headline = "TRUSTED LOCAL SERVICES NEAR YOU",
  advertisersFront = mock9x12AdvertisersFront,
  advertisersBack = mock9x12AdvertisersBack,
  generalQrCodeUrl = "/qr/general-converse",
  brandMessage = "Support local. Discover nearby.",
  spots,
  onSpotClick,
  cardSkin = "cream"
}: SharedCard9x12Props) {
  const isFront = view === "front"

  // Partition database spots by physical coordinate filters (robust against sorting/shifts)
  const hasDbSpots = spots && spots.length > 0
  const frontSpots = hasDbSpots ? spots.filter(s => s.side === "FRONT").sort((a, b) => a.sortOrder - b.sortOrder) : []
  const backSpots = hasDbSpots ? spots.filter(s => s.side === "BACK").sort((a, b) => a.sortOrder - b.sortOrder) : []

  // Front layout columns filtered by X coordinates
  const col1Spots = hasDbSpots ? frontSpots.filter(s => s.x < 10) : []
  const col2Spots = hasDbSpots ? frontSpots.filter(s => s.x >= 10 && s.x < 30) : []
  const dividerSpot = hasDbSpots ? frontSpots.find(s => s.x >= 30 && s.x < 50) : undefined
  const col4Spots = hasDbSpots ? frontSpots.filter(s => s.x >= 50 && s.x < 70) : []
  const col5Spots = hasDbSpots ? frontSpots.filter(s => s.x >= 70) : []

  // Back layout rows and premium spot filtered by Y and type
  const topSpots = hasDbSpots ? backSpots.filter(s => s.y < 20) : []
  const bottomSpots = hasDbSpots ? backSpots.filter(s => s.y > 50) : []
  const premiumSpot = hasDbSpots ? backSpots.find(s => s.spotType === "PREMIUM") : undefined

  // Helper to resolve slot container height dynamically (handles Double spots)
  const getSpotHeightClass = (spot: any) => {
    if (spot.spotType === "LARGE") return "h-[66%] min-h-0"
    return "h-[32%] min-h-0"
  }

  const getSpotVariant = (spot: any) => {
    if (spot.spotType === "LARGE") return "double"
    return "standard"
  }

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
      className="relative w-full aspect-[12/9] bg-paper border border-press/80 shadow-[0_20px_50px_-20px_rgba(33,29,28,0.3)] p-[1.5%] rounded-none select-none flex flex-col justify-between"
      style={activeStyles}
    >
      {isFront ? (
        // ================= FRONT SIDE =================
        <div className="w-full h-full grid gap-2 overflow-hidden" style={{ gridTemplateColumns: "1fr 1fr 0.8fr 1fr 1fr" }}>
          {/* Column 1 (Left Standard Stack 1) */}
          <div className="flex flex-col justify-between h-full gap-2">
            {hasDbSpots ? (
              col1Spots.map((spot) => (
                <div key={spot.id} className={getSpotHeightClass(spot)}>
                  <InteractiveSpotCell spot={spot} variant={getSpotVariant(spot)} onClick={onSpotClick} />
                </div>
              ))
            ) : (
              advertisersFront.left.slice(0, 3).map((ad) => (
                <div key={ad.id} className="h-[32%] min-h-0">
                  <AdvertiserBlock {...ad} variant="standard" />
                </div>
              ))
            )}
          </div>

          {/* Column 2 (Left Standard Stack 2) */}
          <div className="flex flex-col justify-between h-full gap-2">
            {hasDbSpots ? (
              col2Spots.map((spot) => (
                <div key={spot.id} className={getSpotHeightClass(spot)}>
                  <InteractiveSpotCell spot={spot} variant={getSpotVariant(spot)} onClick={onSpotClick} />
                </div>
              ))
            ) : (
              advertisersFront.left.slice(3, 6).map((ad) => (
                <div key={ad.id} className="h-[32%] min-h-0">
                  <AdvertiserBlock {...ad} variant="standard" />
                </div>
              ))
            )}
          </div>

          {/* Branded Center Spine */}
          <div className="bg-press text-paper p-1.5 flex flex-col justify-between items-center text-center h-full border border-press relative select-none overflow-hidden">
            {/* Top Brand Block */}
            <div className="w-full flex flex-col items-center">
              <div className="font-headline font-black text-xl tracking-tighter text-nh-red flex items-center gap-0.5">
                <span className="text-paper">Near</span>Here
              </div>
              <div className="text-[5px] md:text-[6px] font-mono tracking-widest text-rule uppercase mt-0.5 leading-none truncate max-w-full">
                {locationLabel}
              </div>
              <div className="text-[5px] md:text-[6px] font-mono text-gold uppercase font-bold tracking-widest leading-none mt-1">
                {homesCount}
              </div>
            </div>

            {/* Middle: Divider Event/Venue slot or Brand Message */}
            {dividerSpot ? (
              <div className="w-full my-1 min-h-[90px] shrink-0 text-press">
                <InteractiveSpotCell spot={dividerSpot} variant="half" onClick={onSpotClick} />
              </div>
            ) : (advertisersFront as any).divider ? (
              <div className="w-full my-1 min-h-[90px] shrink-0 text-press">
                <AdvertiserBlock {...(advertisersFront as any).divider} variant="half" />
              </div>
            ) : (
              <div className="my-2 space-y-1">
                <div className="bg-nh-red text-paper font-mono text-[6px] md:text-[7px] uppercase tracking-wider px-1 py-0.5 font-bold leading-none select-none inline-block">
                  ONE MERCHANT PER CATEGORY
                </div>
                <h3 className="font-headline font-black text-sm md:text-base leading-none tracking-tight uppercase text-paper mt-1">
                  {headline}
                </h3>
                <p className="text-[7px] md:text-[8px] text-warm leading-tight mt-1 italic">
                  {brandMessage}
                </p>
              </div>
            )}

            {/* Bottom General QR Explorer */}
            <div className="w-full flex flex-col items-center space-y-1 mt-auto">
              <div className="scale-75 md:scale-90 origin-bottom">
                <QRPlaceholder size="sm" label="" accentColor="var(--nh-paper-white)" />
              </div>
              <span className="text-[5px] md:text-[7px] font-mono uppercase tracking-widest text-warm leading-tight font-bold">
                EXPLORE ONLINE
              </span>
              <span className="text-[4px] md:text-[6px] text-rule leading-none uppercase text-center max-w-[80px]">
                Scan for full category list & details
              </span>
            </div>
          </div>

          {/* Column 4 (Right Standard Stack 1) */}
          <div className="flex flex-col justify-between h-full gap-2">
            {hasDbSpots ? (
              col4Spots.map((spot) => (
                <div key={spot.id} className={getSpotHeightClass(spot)}>
                  <InteractiveSpotCell spot={spot} variant={getSpotVariant(spot)} onClick={onSpotClick} />
                </div>
              ))
            ) : (
              advertisersFront.right.slice(0, 3).map((ad) => (
                <div key={ad.id} className="h-[32%] min-h-0">
                  <AdvertiserBlock {...ad} variant="standard" />
                </div>
              ))
            )}
          </div>

          {/* Column 5 (Right Standard Stack 2) */}
          <div className="flex flex-col justify-between h-full gap-2">
            {hasDbSpots ? (
              col5Spots.map((spot) => (
                <div key={spot.id} className={getSpotHeightClass(spot)}>
                  <InteractiveSpotCell spot={spot} variant={getSpotVariant(spot)} onClick={onSpotClick} />
                </div>
              ))
            ) : (
              advertisersFront.right.slice(3, 6).map((ad) => (
                <div key={ad.id} className="h-[32%] min-h-0">
                  <AdvertiserBlock {...ad} variant="standard" />
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        // ================= BACK SIDE =================
        <div className="w-full h-full flex flex-col justify-between gap-2 overflow-hidden">
          {/* Top row - 4 standard ads (Height: 37%) */}
          <div className="h-[37%] grid grid-cols-4 gap-2 min-h-0">
            {hasDbSpots ? (
              topSpots.map((spot) => (
                <div key={spot.id} className="h-full">
                  <InteractiveSpotCell spot={spot} variant={getSpotVariant(spot)} onClick={onSpotClick} />
                </div>
              ))
            ) : (
              advertisersBack.top.slice(0, 4).map((ad) => (
                <div key={ad.id} className="h-full">
                  <AdvertiserBlock {...ad} variant="standard" />
                </div>
              ))
            )}
          </div>

          {/* Middle row - info block + protected address (Height: 26%) */}
          <div className="h-[26%] grid grid-cols-4 gap-2 min-h-0">
            {/* Branded info block or Premium Center Back Spot */}
            {hasDbSpots && premiumSpot ? (
              <div className="col-span-2 h-full">
                <InteractiveSpotCell spot={premiumSpot} variant="premium" onClick={onSpotClick} />
              </div>
            ) : (advertisersBack as any).premium ? (
              <div className="col-span-2 h-full">
                <AdvertiserBlock {...(advertisersBack as any).premium} variant="premium" />
              </div>
            ) : (
              <div className="col-span-2 border border-rule bg-paper p-3 flex flex-col justify-between text-left font-sans select-none overflow-hidden h-full">
                <div>
                  <h4 className="font-headline font-extrabold uppercase text-[10px] md:text-xs text-nh-red tracking-wider leading-none">
                    THANK YOU FOR SUPPORTING LOCAL BUSINESSES!
                  </h4>
                  <p className="text-[8px] md:text-[9px] text-warm leading-tight mt-1 font-medium max-w-md line-clamp-3">
                    NearHere delivers curated local offers, trusted merchant services, and exclusive savings directly to {locationLabel.split(',')[0]} homes.
                  </p>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-rule mt-1 text-[7px] md:text-[8px] font-mono text-press uppercase font-bold leading-none">
                  <span>FOLLOW NEARHERE • nearhere.com</span>
                  <span className="text-nh-red">📍 local support</span>
                </div>
              </div>
            )}

            {/* Mailing Panel */}
            <div className="col-span-2 h-full">
              <MailingPanel cityStateZip={locationLabel} />
            </div>
          </div>

          {/* Bottom row - 4 standard ads (Height: 37%) */}
          <div className="h-[37%] grid grid-cols-4 gap-2 min-h-0">
            {hasDbSpots ? (
              bottomSpots.map((spot) => (
                <div key={spot.id} className="h-full">
                  <InteractiveSpotCell spot={spot} variant={getSpotVariant(spot)} onClick={onSpotClick} />
                </div>
              ))
            ) : (
              advertisersBack.bottom.slice(0, 4).map((ad) => (
                <div key={ad.id} className="h-full">
                  <AdvertiserBlock {...ad} variant="standard" />
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
