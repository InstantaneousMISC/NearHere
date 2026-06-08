"use client"

import { SPOT_TYPE_COLORS, SPOT_STATUS_COLORS } from "@/lib/constants"
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
  const isInteractive = status === "OPEN" && onClick

  const typeColor = SPOT_TYPE_COLORS[spotType]
  const statusColor = SPOT_STATUS_COLORS[status]

  return (
    <button
      type="button"
      disabled={status !== "OPEN"}
      onClick={isInteractive ? onClick : undefined}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `${width}%`,
        height: `${height}%`,
      }}
      className={`absolute rounded-lg border-2 flex flex-col items-center justify-center p-1 text-center select-none transition-all duration-300 ${statusColor.border} ${statusColor.bg} ${
        isInteractive
          ? "cursor-pointer hover:scale-[1.02] hover:shadow-md hover:z-20 group"
          : "cursor-default"
      }`}
    >
      {/* Category Label */}
      <span
        className={`font-extrabold tracking-tight text-xs md:text-sm lg:text-base leading-tight truncate w-full uppercase ${
          status === "SOLD" ? "text-muted-foreground line-through opacity-50" : "text-foreground"
        }`}
      >
        {label}
      </span>

      {/* Spot Type Badge (Premium, etc.) */}
      {spotType === "PREMIUM" && status === "OPEN" && (
        <span className="mt-0.5 text-[8px] md:text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 bg-primary text-primary-foreground border border-primary scale-90">
          Premium
        </span>
      )}
      {spotType === "LARGE" && status === "OPEN" && (
        <span className="mt-0.5 text-[8px] md:text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 bg-stone-bg text-foreground border border-border scale-90">
          Large
        </span>
      )}

      {/* Price or Status Indicator */}
      <span className="mt-1 font-mono text-[9px] md:text-xs">
        {status === "OPEN" && (
          <span className="text-primary font-bold group-hover:text-foreground transition-colors">
            {formatPrice(price)}
          </span>
        )}
        {status === "HELD" && (
          <span className="text-amber-700 flex items-center gap-0.5 font-bold uppercase tracking-wider text-[8px] md:text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
            Held
          </span>
        )}
        {status === "SOLD" && (
          <span className="text-muted-foreground font-bold uppercase tracking-wider text-[8px] md:text-[9px]">
            Reserved
          </span>
        )}
        {status === "UNAVAILABLE" && (
          <span className="text-muted-foreground font-bold uppercase tracking-wider text-[8px] md:text-[9px]">
            Closed
          </span>
        )}
      </span>

      {/* Hover action indicator */}
      {isInteractive && (
        <span className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[8px] font-mono font-bold text-primary uppercase tracking-widest">
          Claim →
        </span>
      )}
    </button>
  )
}
