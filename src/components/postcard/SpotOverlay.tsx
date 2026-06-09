"use client"

import { formatPrice } from "@/lib/utils"

interface SpotOverlayProps {
  label: string
  price: number
  status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
  spotType: "PREMIUM" | "LARGE" | "STANDARD" | "SMALL"
  x: number
  y: number
  width: number
  height: number
  onClick?: () => void
}

export default function SpotOverlay({
  label,
  price,
  status,
  spotType,
  x,
  y,
  width,
  height,
  onClick,
}: SpotOverlayProps) {
  const isInteractive = (status === "OPEN" || status === "HELD" || status === "SOLD") && !!onClick

  let overlayClass = ""
  if (status === "OPEN" || status === "HELD") {
    overlayClass = "border border-nh-red bg-transparent text-nh-red hover:bg-nh-red/5"
  } else if (status === "SOLD") {
    overlayClass = "bg-press border border-press text-paper"
  } else {
    overlayClass = "border border-press/30 text-press bg-transparent opacity-60"
  }

  return (
    <button
      type="button"
      disabled={status === "UNAVAILABLE"}
      onClick={isInteractive ? onClick : undefined}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
      className={`absolute rounded-none flex flex-col items-center justify-center p-1 text-center select-none transition-all duration-300 ${overlayClass} ${
        isInteractive
          ? "cursor-pointer hover:scale-[1.02] hover:shadow-md hover:z-20 group"
          : "cursor-default"
      }`}
    >
      {/* Category Label */}
      <span
        className={`font-headline font-bold uppercase tracking-tight text-xs md:text-sm lg:text-base leading-none truncate w-full`}
      >
        {label}
      </span>

      {/* Spot Type Badge (Premium, etc.) */}
      {spotType === "PREMIUM" && (status === "OPEN" || status === "HELD") && (
        <span className="mt-0.5 text-[8px] md:text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 bg-nh-red text-paper border border-nh-red scale-90">
          Premium
        </span>
      )}
      {spotType === "LARGE" && (status === "OPEN" || status === "HELD") && (
        <span className="mt-0.5 text-[8px] md:text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 bg-paper text-press border border-rule scale-90">
          Large
        </span>
      )}

      {/* Price or Status Indicator */}
      <span className="mt-1 font-mono text-[9px] md:text-xs">
        {(status === "OPEN" || status === "HELD") && (
          <span className="font-bold">
            {formatPrice(price)}
          </span>
        )}
        {status === "SOLD" && (
          <span className="font-bold uppercase tracking-wider text-[8px] md:text-[9px]">
            Reserved
          </span>
        )}
        {status === "UNAVAILABLE" && (
          <span className="font-bold uppercase tracking-wider text-[8px] md:text-[9px]">
            Closed
          </span>
        )}
      </span>

      {/* Hover action indicator */}
      {isInteractive && (status === "OPEN" || status === "HELD") && (
        <span className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[8px] font-mono font-bold text-nh-red uppercase tracking-widest">
          Claim →
        </span>
      )}
      {isInteractive && status === "SOLD" && (
        <span className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[8px] font-mono font-bold text-gold uppercase tracking-widest">
          Waitlist →
        </span>
      )}
    </button>
  )
}
