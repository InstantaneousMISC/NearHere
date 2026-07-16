import React from "react"

interface SpineDividerProps {
  className?: string
  children?: React.ReactNode
}

/**
 * Reusable horizontal divider container for card spines.
 * Uses thin solid white lines with low opacity.
 */
export function SpineDivider({ className = "", children }: SpineDividerProps) {
  return (
    <div
      className={`w-full border-y border-[#FAF8F4]/25 ${className}`}
      style={{ boxSizing: "border-box" }}
    >
      {children}
    </div>
  )
}

interface SpineDeliverToProps {
  city: string
  state?: string
  className?: string
}

/**
 * Reusable deliver-to address container for card spines.
 */
export function SpineDeliverTo({ city, state = "TX", className = "" }: SpineDeliverToProps) {
  return (
    <div className={`border-l-4 border-[#D13F1F] py-[4px] pl-[12px] text-left w-full ${className}`}>
      <div className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#FAF8F4]/60 leading-none">
        DELIVER TO
      </div>
      <div className="mt-1 text-[13px] font-black uppercase tracking-[0.04em] text-white font-sans leading-none">
        LOCAL CUSTOMER
      </div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.05em] text-white font-sans leading-none">
        {city.toUpperCase()}, {state.toUpperCase()}
      </div>
    </div>
  )
}

interface USPSPermitBoxProps {
  permitNumber?: string
  className?: string
}

/**
 * Reusable standard USPS postage permit box.
 */
export function USPSPermitBox({ permitNumber = "NEARHERE", className = "" }: USPSPermitBoxProps) {
  return (
    <div className={`border-2 border-[#FAF8F4] p-1.5 text-center text-[7px] font-black uppercase leading-[1.2] text-[#FAF8F4] w-[124px] bg-white/5 ${className}`}>
      <div>PRSRT STD</div>
      <div>ECRWSS</div>
      <div className="mt-1">U.S. POSTAGE</div>
      <div>PAID</div>
      <div>{permitNumber}</div>
    </div>
  )
}

interface ScannerBarcodeProps {
  code: string
  className?: string
}

/**
 * Reusable mock scanner barcode.
 */
export function ScannerBarcode({ code, className = "" }: ScannerBarcodeProps) {
  return (
    <div className={`w-full space-y-2 text-center ${className}`}>
      <div className="flex h-[20px] items-end justify-center gap-[1.5px] opacity-60">
        {Array.from({ length: 35 }).map((_, index) => (
          <span
            key={index}
            className="w-[1.2px] bg-white"
            style={{ height: `${6 + ((index * 5) % 14)}px` }}
          />
        ))}
      </div>
      <div
        className="text-[6px] tracking-[0.15em] text-[#FAF8F4]/60"
        style={{ fontFamily: '"JetBrains Mono", "SF Mono", monospace' }}
      >
        *{code.replace(/\s/g, "").toUpperCase()}*
      </div>
    </div>
  )
}

interface SpineMailingPanelProps {
  city: string
  state?: string
}

/**
 * Reusable mailing panel component adapted for vertical card spines.
 * Mocks the entire mailing / postage divider section.
 */
export function SpineMailingPanel({ city, state = "TX" }: SpineMailingPanelProps) {
  return (
    <div className="w-full flex flex-col items-center gap-[16px] text-center text-[#FAF8F4]">
      {/* Carrier Route Presort Stars */}
      <div className="flex flex-col gap-0.5 items-center">
        <div className="text-[10px] font-bold text-white tracking-[0.15em] font-mono leading-none">
          ★ ★ ★ ★ ★ ★
        </div>
        <div className="text-[6.5px] text-[#FAF8F4]/60 uppercase font-bold tracking-wider font-mono leading-none mt-1">
          CARRIER ROUTE PRESORT
        </div>
      </div>

      {/* USPS Indicia */}
      <USPSPermitBox />

      {/* Deliver To Address */}
      <SpineDeliverTo city={city} state={state} />

      {/* Bottom WSS Details */}
      <div className="w-full border-t border-dashed border-[#FAF8F4]/20 pt-[12px] flex justify-between items-center px-1">
        <div className="text-[6px] text-[#FAF8F4]/60 uppercase font-bold tracking-wider">
          RESIDENTIAL CUSTOMER
        </div>
        <div className="text-[8px] font-bold tracking-widest text-white">
          *CAR-RT WSS*
        </div>
      </div>
    </div>
  )
}
