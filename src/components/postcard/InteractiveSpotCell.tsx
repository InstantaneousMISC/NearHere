import React from "react"
import AdvertiserBlock from "./AdvertiserBlock"
import QRPlaceholder from "./QRPlaceholder"
import { formatPrice } from "@/lib/utils"

interface InteractiveSpotCellProps {
  spot: {
    id: string
    label: string
    side: "FRONT" | "BACK"
    spotType: "PREMIUM" | "LARGE" | "STANDARD" | "SMALL"
    price: number
    status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
    category: {
      id: string
      name: string
      slug: string
    }
    orders?: any[]
  }
  variant?: "standard" | "compact" | "premium" | "half" | "double"
  onClick?: (spot: any) => void
}

export default function InteractiveSpotCell({
  spot,
  variant = "standard",
  onClick,
}: InteractiveSpotCellProps) {
  const isSold = spot.status === "SOLD"
  const isHeld = spot.status === "HELD"
  const isOpen = spot.status === "OPEN"
  const isInteractive = (isOpen || isHeld || isSold) && !!onClick

  // Format price helper
  const displayPrice = formatPrice(spot.price)

  // Render SOLD State: advertiser creative assets
  if (isSold) {
    const paidOrder = spot.orders?.find(o => o.status === "PAID")
    const creative = paidOrder?.creativeSubmission

    if (creative) {
      return (
        <div 
          onClick={onClick ? () => onClick(spot) : undefined}
          className={onClick ? "cursor-pointer h-full w-full" : "h-full w-full"}
        >
          <AdvertiserBlock
            category={spot.category.name.toUpperCase()}
            businessName={creative.businessName || spot.label}
            description={creative.description || "Curated local provider."}
            offer={creative.offerDeal || "Exclusive Deal"}
            phone={creative.phone || "Call Merchant"}
            qrCodeUrl={creative.website || ""}
            variant={variant}
            imageUrl={creative.logoUrl || undefined}
          />
        </div>
      )
    }

    // Sold but creative not submitted yet
    return (
      <div 
        onClick={onClick ? () => onClick(spot) : undefined}
        className={`border border-rule bg-muted/20 relative flex flex-col justify-between h-full font-sans select-none overflow-hidden ${
          onClick ? "cursor-pointer" : ""
        }`}
      >
        {/* Category Ribbon */}
        <div className="bg-press text-paper text-[6px] md:text-[7px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-widest text-left w-fit">
          {spot.category.name.toUpperCase()}
        </div>

        {/* Content Body */}
        <div className="p-1.5 md:p-2 flex-1 flex flex-col justify-between space-y-0.5 text-left">
          <div>
            <h4 className="font-headline font-extrabold uppercase text-[10px] md:text-xs text-press leading-[1.05] tracking-tight truncate">
              {spot.label}
            </h4>
            <p className="text-[7px] md:text-[8px] text-warm leading-tight font-medium mt-0.5 line-clamp-2">
              Featured slot reserved. Creative details pending.
            </p>
          </div>
          <div className="font-headline font-black uppercase text-xs md:text-sm text-nh-red leading-none mt-1">
            RESERVED
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-press text-paper py-0.5 text-center font-mono text-[7px] md:text-[8px] uppercase tracking-wider leading-none">
          📍 category exclusive
        </div>
      </div>
    )
  }

  // Render CLOSED State
  if (spot.status === "UNAVAILABLE") {
    return (
      <div className="border border-press/20 bg-muted/20 text-warm opacity-50 relative flex flex-col justify-between h-full font-sans select-none overflow-hidden">
        <div className="bg-press/40 text-paper text-[6px] md:text-[7px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-widest text-left w-fit">
          {spot.category.name.toUpperCase()}
        </div>
        <div className="p-2 flex items-center justify-center">
          <span className="font-headline font-bold text-[9px] md:text-xs uppercase tracking-wider text-warm">
            Closed Slot
          </span>
        </div>
      </div>
    )
  }

  // Render OPEN / HELD Claimable States
  const containerClass = `border-2 border-dashed border-nh-red bg-paper relative flex flex-col justify-between h-full font-sans select-none overflow-hidden transition-all duration-300 ${
    isInteractive 
      ? "cursor-pointer hover:bg-nh-red/5 hover:border-press hover:scale-[1.01] hover:shadow-md" 
      : ""
  }`

  const handleCellClick = (e: React.MouseEvent) => {
    if (isInteractive && onClick) {
      onClick(spot)
    }
  }

  if (variant === "premium") {
    return (
      <div onClick={handleCellClick} className={containerClass}>
        {/* Category Ribbon */}
        <div className="bg-nh-red text-paper text-[7px] md:text-[8px] font-mono font-bold px-2.5 py-0.5 uppercase tracking-widest text-left w-fit">
          {spot.category.name.toUpperCase()}
        </div>

        {/* Premium Available Content */}
        <div className="p-2 md:p-3 flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 items-center text-left">
          <div className="border border-dashed border-rule aspect-[4/3] bg-stone-bg/50 hidden md:flex flex-col items-center justify-center text-center p-1.5">
            <span className="text-xl mb-0.5 text-nh-red/60 font-bold">+</span>
            <span className="text-[7px] font-mono text-warm leading-tight">IMAGE PLACEMENT</span>
          </div>

          <div className="flex flex-col justify-between h-full space-y-1">
            <div>
              <span className="text-[7px] md:text-[8px] font-mono text-[#C9993E] uppercase tracking-widest leading-none font-bold">
                ⭐ SPOTLIGHT AVAILABLE
              </span>
              <h4 className="font-headline font-extrabold uppercase text-xs md:text-sm lg:text-base text-press leading-[1.05] tracking-tight mt-0.5">
                Your Business Here
              </h4>
              <p className="text-[8px] md:text-[9px] text-warm leading-tight font-medium mt-0.5 line-clamp-2">
                Claim our front spotlight ad. Includes logo, photo, priority positioning, and scan coupon.
              </p>
            </div>

            <div className="flex items-end justify-between gap-1.5 pt-1 border-t border-dashed border-rule">
              <div>
                <span className="text-xs md:text-sm font-headline font-black uppercase text-nh-red leading-none">
                  {displayPrice}
                </span>
                <span className="text-[6px] md:text-[7px] text-warm block mt-0.5 font-mono">
                  100% EXCLUSIVE SPOT
                </span>
              </div>
              <div className="shrink-0 scale-75 origin-right">
                <QRPlaceholder size="sm" label="" accentColor="#D13F1F" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-nh-red text-paper py-0.5 md:py-1 text-center font-mono text-[8px] md:text-[10px] font-bold uppercase tracking-widest leading-none">
          {isHeld ? "🔒 RESERVING..." : "⚡ CLICK TO RESERVE NOW"}
        </div>
      </div>
    )
  }

  if (variant === "standard" || variant === "double") {
    return (
      <div onClick={handleCellClick} className={containerClass}>
        {/* Category Ribbon */}
        <div className="bg-nh-red text-paper text-[7px] md:text-[8px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-widest text-left w-fit">
          {spot.category.name.toUpperCase()}
        </div>

        {/* Content Body */}
        <div className="p-1.5 md:p-2 flex-1 flex flex-col justify-between space-y-1 md:space-y-2 text-left">
          <div>
            <h4 className="font-headline font-extrabold uppercase text-[10px] md:text-xs lg:text-sm text-press leading-[1.05] tracking-tight">
              Featured Spot Available
            </h4>
            <p className="text-[7px] md:text-[8px] text-warm leading-tight font-medium mt-0.5 line-clamp-1">
              Category exclusive slot. Mailed directly to nearby homes.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-headline font-black text-xs md:text-sm lg:text-base text-nh-red leading-none">
                {displayPrice}
              </div>
              <span className="text-[6px] md:text-[7px] text-warm italic block mt-0.5 font-mono">
                Category Exclusive
              </span>
            </div>
            <div className="shrink-0 scale-65 md:scale-75 origin-right">
              <QRPlaceholder size="sm" label="" accentColor="#D13F1F" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-nh-red text-paper py-0.5 md:py-1 text-center font-mono text-[7px] md:text-[8px] font-bold uppercase tracking-wider leading-none">
          {isHeld ? "🔒 RESERVED" : "👉 CLAIM CATEGORY"}
        </div>
      </div>
    )
  }

  if (variant === "half") {
    return (
      <div onClick={handleCellClick} className={containerClass}>
        {/* Category Ribbon */}
        <div className="bg-nh-red text-paper text-[6px] md:text-[7px] font-mono font-bold px-1 py-0.5 uppercase tracking-widest text-left w-fit">
          {spot.category.name.toUpperCase()}
        </div>

        {/* Content Body */}
        <div className="p-1 flex-1 flex flex-col justify-between space-y-0.5 text-left">
          <div>
            <h4 className="font-headline font-extrabold uppercase text-[9px] md:text-[10px] lg:text-xs text-press leading-[1.05] tracking-tight truncate">
              Space Available
            </h4>
            <p className="text-[6px] md:text-[7px] text-warm leading-none line-clamp-1 font-medium mt-0.5">
              Category exclusive ad.
            </p>
          </div>

          <div className="flex items-center justify-between gap-1">
            <div>
              <div className="font-headline font-black text-[10px] md:text-xs lg:text-sm text-nh-red leading-none">
                {displayPrice}
              </div>
            </div>
            <div className="shrink-0 scale-[0.55] md:scale-65 origin-right">
              <QRPlaceholder size="sm" label="" accentColor="#D13F1F" />
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="bg-nh-red text-paper py-0.5 text-center font-mono text-[6px] md:text-[7px] font-bold uppercase tracking-wider leading-none">
          {isHeld ? "RESERVED" : "CLAIM"}
        </div>
      </div>
    )
  }

  // compact
  return (
    <div onClick={handleCellClick} className={containerClass}>
      {/* Ribbon */}
      <div className="bg-nh-red text-paper text-[6px] md:text-[7px] font-mono font-bold px-1.5 py-0.5 uppercase tracking-widest text-left w-fit">
        {spot.category.name.toUpperCase()}
      </div>

      {/* Body */}
      <div className="p-1 flex-1 flex items-center justify-between gap-1 text-left">
        <div className="min-w-0">
          <h4 className="font-headline font-extrabold uppercase text-[9px] md:text-[10px] lg:text-xs text-press leading-none truncate">
            Spot Available
          </h4>
          <div className="font-headline font-black text-nh-red text-[10px] md:text-xs lg:text-sm mt-0.5 leading-none">
            {displayPrice}
          </div>
        </div>
        <div className="shrink-0 scale-[0.55] md:scale-65 origin-right">
          <QRPlaceholder size="sm" label="" accentColor="#D13F1F" />
        </div>
      </div>

      {/* Bottom Phone */}
      <div className="bg-nh-red text-paper py-0.5 text-center font-mono text-[6px] md:text-[7px] font-bold uppercase tracking-wider leading-none">
        {isHeld ? "RESERVED" : "CLAIM"}
      </div>
    </div>
  )
}
