import React from "react"
import QRPlaceholder from "./QRPlaceholder"

interface AdvertiserBlockProps {
  category: string
  businessName: string
  subName?: string
  description: string
  offer: string
  phone: string
  qrCodeUrl: string
  qrLabel?: string
  redemptionNote?: string
  accentColor?: string
  variant?: "standard" | "compact" | "premium" | "half" | "double"
  imageUrl?: string
}

export default function AdvertiserBlock({
  category,
  businessName,
  subName,
  description,
  offer,
  phone,
  qrCodeUrl,
  qrLabel = "Scan for offer",
  redemptionNote = "Mention this card.",
  accentColor = "#211D1C",
  variant = "standard",
  imageUrl
}: AdvertiserBlockProps) {
  // Format price helper if offer contains numeric value
  const formatPrice = (val: any) => {
    if (typeof val === "number") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
      }).format(val / 100)
    }
    return val
  }

  const cleanOffer = formatPrice(offer)

  // Standard Advertiser Block
  if (variant === "standard" || variant === "double") {
    return (
      <div 
        className="border-2 border-press bg-paper relative flex flex-col justify-between h-full font-sans select-none overflow-hidden"
        style={{ borderColor: accentColor }}
      >
        {/* Category Ribbon */}
        <div 
          className="text-[6px] md:text-[7px] lg:text-[8px] font-mono font-bold text-paper px-2 py-0.5 uppercase tracking-widest text-left w-fit"
          style={{ backgroundColor: accentColor }}
        >
          {category}
        </div>

        {/* Content Body */}
        <div className="p-1.5 md:p-2.5 flex-1 flex flex-col justify-between space-y-1 md:space-y-2 overflow-hidden">
          {/* Header & Description */}
          <div className="space-y-0.5 text-left overflow-hidden">
            <h4 className="font-headline font-extrabold uppercase text-xs md:text-sm lg:text-base text-press leading-[1.05] tracking-tight line-clamp-1">
              {businessName}
            </h4>
            <p className="text-[7px] md:text-[8px] lg:text-[9px] text-warm leading-tight font-medium line-clamp-2">
              {description}
            </p>
          </div>

          {/* Offer & QR Code split */}
          <div className="flex items-center justify-between gap-2">
            {/* Offer details */}
            <div className="text-left">
              <div className="font-headline font-black uppercase text-xs md:text-sm lg:text-lg text-nh-red leading-none tracking-tight">
                {cleanOffer}
              </div>
              <div className="text-[6px] md:text-[7px] font-mono text-press/80 uppercase font-bold tracking-wider leading-none mt-0.5">
                {qrLabel}
              </div>
              <div className="text-[5px] md:text-[6px] text-warm italic mt-0.5 leading-none font-medium">
                {redemptionNote}
              </div>
            </div>

            {/* Unique QR Code */}
            <div className="shrink-0 scale-65 md:scale-75 origin-right">
              <QRPlaceholder size="sm" label="Scan for offer" accentColor={accentColor} />
            </div>
          </div>
        </div>

        {/* Bottom Phone Bar */}
        <div 
          className="flex items-center justify-center py-0.5 md:py-1 text-paper font-mono text-[7px] md:text-[9px] font-bold uppercase tracking-wider select-all cursor-pointer leading-none"
          style={{ backgroundColor: accentColor }}
        >
          📞 {phone}
        </div>
      </div>
    )
  }

  // Half-Space / Compact Right side ad block (narrower layout)
  if (variant === "half") {
    return (
      <div 
        className="border border-press bg-paper relative flex flex-col justify-between h-full font-sans select-none overflow-hidden"
        style={{ borderColor: accentColor }}
      >
        {/* Category Ribbon */}
        <div 
          className="text-[5px] md:text-[6px] lg:text-[7px] font-mono font-bold text-paper px-1 py-0.5 uppercase tracking-widest text-left w-fit"
          style={{ backgroundColor: accentColor }}
        >
          {category}
        </div>

        {/* Content Body */}
        <div className="p-1 flex-1 flex flex-col justify-between space-y-0.5 overflow-hidden">
          {/* Header & Description */}
          <div className="space-y-0.5 text-left overflow-hidden">
            <h4 className="font-headline font-extrabold uppercase text-[9px] md:text-[10px] lg:text-xs text-press leading-[1.05] tracking-tight truncate">
              {businessName}
            </h4>
            <p className="text-[6px] md:text-[7px] text-warm leading-none font-medium line-clamp-1">
              {description}
            </p>
          </div>

          {/* Offer & QR Code split */}
          <div className="flex items-center justify-between gap-1">
            {/* Offer details */}
            <div className="text-left shrink-0">
              <div className="font-headline font-black uppercase text-[10px] md:text-xs lg:text-sm text-nh-red leading-none tracking-tight">
                {cleanOffer}
              </div>
              <div className="text-[5px] md:text-[6px] font-mono text-press/80 uppercase font-bold tracking-wider leading-none mt-0.5 truncate max-w-[60px]">
                {qrLabel}
              </div>
              <div className="text-[4px] md:text-[5px] text-warm italic mt-0.5 leading-none font-medium">
                {redemptionNote}
              </div>
            </div>

            {/* Unique QR Code */}
            <div className="shrink-0 scale-[0.55] md:scale-65 origin-right">
              <QRPlaceholder size="sm" label="" accentColor={accentColor} />
            </div>
          </div>
        </div>

        {/* Bottom Phone Bar */}
        <div 
          className="flex items-center justify-center py-0.5 text-paper font-mono text-[6px] md:text-[7px] font-bold uppercase tracking-wider select-all cursor-pointer leading-none"
          style={{ backgroundColor: accentColor }}
        >
          📞 {phone}
        </div>
      </div>
    )
  }

  // Premium / Spotlight Layout (for Mama Rosa's)
  if (variant === "premium") {
    return (
      <div 
        className="border-2 border-nh-red bg-paper relative flex flex-col justify-between h-full font-sans select-none overflow-hidden"
      >
        {/* Category Ribbon */}
        <div className="bg-nh-red text-paper text-[7px] md:text-[8px] font-mono font-bold px-2.5 py-0.5 uppercase tracking-widest text-left w-fit">
          {category}
        </div>

        {/* Content Body split in half columns */}
        <div className="p-2 md:p-3 flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 items-center overflow-hidden">
          {/* Left: Merchant Image */}
          {imageUrl ? (
            <div className="relative aspect-[4/3] w-full border border-rule overflow-hidden h-full hidden md:block">
              <img 
                src={imageUrl} 
                alt={businessName} 
                className="absolute inset-0 w-full h-full object-cover filter brightness-[0.98] contrast-[1.02]"
              />
            </div>
          ) : (
            <div className="relative aspect-[4/3] w-full bg-stone-bg border border-dashed border-rule hidden md:flex items-center justify-center">
              <span className="text-[7px] font-mono text-warm">IMAGE AREA</span>
            </div>
          )}

          {/* Right: Advertiser copy and offers */}
          <div className="flex flex-col justify-between h-full space-y-1 text-left overflow-hidden">
            <div>
              <div className="text-[6px] md:text-[7px] font-mono text-warm uppercase tracking-widest leading-none font-semibold">
                LOCAL FAVORITE
              </div>
              <h4 className="font-headline font-extrabold uppercase text-xs md:text-sm lg:text-base text-press leading-[1.05] tracking-tight mt-0.5">
                {businessName}
                {subName && <span className="block text-[8px] md:text-[9px] text-warm mt-0.5 leading-none">{subName}</span>}
              </h4>
              <p className="text-[7px] md:text-[8px] text-warm leading-tight font-medium mt-0.5 line-clamp-2">
                {description}
              </p>
            </div>

            {/* Split Offer & QR */}
            <div className="flex items-end justify-between gap-1.5 pt-1.5 border-t border-dashed border-rule">
              <div>
                <span className="text-[6px] md:text-[7px] font-mono text-warm uppercase tracking-widest font-bold block leading-none">
                  EXCLUSIVE DEAL
                </span>
                <span className="font-headline font-black uppercase text-sm md:text-base lg:text-lg text-nh-red leading-none tracking-tight mt-0.5 block">
                  {cleanOffer}
                </span>
                <span className="text-[5px] md:text-[6px] text-warm block mt-0.5 leading-none">
                  {redemptionNote}
                </span>
              </div>

              {/* Spotlight QR */}
              <div className="shrink-0 scale-65 md:scale-75 origin-right">
                <QRPlaceholder size="sm" label="Scan to order" accentColor="#D13F1F" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Phone Bar */}
        <div className="flex items-center justify-center py-0.5 md:py-1 bg-nh-red text-paper font-mono text-[8px] md:text-[10px] font-extrabold uppercase tracking-widest select-all cursor-pointer leading-none">
          📞 CALL NOW: {phone}
        </div>
      </div>
    )
  }

  // Compact Layout (used in 6x11 standard and back slots)
  // Has side-by-side text, image and QR
  return (
    <div 
      className="border border-rule bg-paper relative flex flex-col justify-between h-full font-sans select-none overflow-hidden hover:border-press transition-colors"
      style={{ borderColor: accentColor }}
    >
      {/* Top ribbon */}
      <div 
        className="text-[5px] md:text-[6px] font-mono font-bold text-paper px-1 py-0.5 uppercase tracking-widest text-left w-fit"
        style={{ backgroundColor: accentColor }}
      >
        {category}
      </div>

      {/* Body */}
      <div className="p-1 flex-1 flex gap-1.5 items-center justify-between overflow-hidden">
        {/* Left: Square thumbnail image if provided */}
        {imageUrl && (
          <div className="w-8 h-8 md:w-10 md:h-10 border border-rule overflow-hidden shrink-0 hidden sm:block">
            <img 
              src={imageUrl} 
              alt={businessName} 
              className="w-full h-full object-cover filter contrast-[1.02]"
            />
          </div>
        )}

        {/* Middle: Details */}
        <div className="flex-1 text-left min-w-0">
          <h4 className="font-headline font-extrabold uppercase text-[9px] md:text-[10px] lg:text-xs text-press leading-[1.05] tracking-tight truncate">
            {businessName}
          </h4>
          <p className="text-[6px] md:text-[7px] text-warm leading-none font-medium truncate mt-0.5">
            {description}
          </p>
          <div className="font-headline font-black text-nh-red text-[10px] md:text-xs lg:text-sm leading-none tracking-tight mt-0.5 truncate">
            {cleanOffer}
          </div>
        </div>

        {/* Right: Tiny QR code */}
        <div className="shrink-0 scale-[0.55] md:scale-65 origin-right">
          <QRPlaceholder size="sm" label="" accentColor={accentColor} />
        </div>
      </div>

      {/* Bottom Phone */}
      <div 
        className="flex items-center justify-center py-0.5 text-paper font-mono text-[6px] md:text-[7px] font-bold uppercase tracking-wider select-all cursor-pointer leading-none"
        style={{ backgroundColor: accentColor }}
      >
        📞 {phone}
      </div>
    </div>
  )
}
