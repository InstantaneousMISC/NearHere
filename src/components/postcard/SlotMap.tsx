import React from "react"

interface SlotMapProps {
  type: "9x12" | "6x11"
}

export default function SlotMap({ type }: SlotMapProps) {
  if (type === "9x12") {
    return (
      <div className="space-y-4 font-mono text-[9px] uppercase tracking-wider select-none">
        <h4 className="font-headline font-bold text-xs text-press text-center">Slot Map (9x12 Shared Card)</h4>
        
        {/* Front Blueprint */}
        <div className="space-y-1">
          <div className="text-center font-bold text-warm text-[8px]">Front Side (12/9 Ratio)</div>
          <div
            className="relative grid aspect-[12/9] gap-[3px] border border-rule bg-paper p-1.5"
            style={{ gridTemplateColumns: "472fr 160fr 472fr" }}
          >
            {(["Left", "Right"] as const).map((group, groupIndex) => (
              <div
                key={group}
                className="grid grid-cols-2 grid-rows-3 gap-x-[2px] gap-y-[3px]"
                style={{ gridColumn: groupIndex === 0 ? 1 : 3 }}
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-center border border-press/20 bg-slate-50 p-1 text-center text-[6px] font-bold leading-tight text-warm"
                  >
                    F-{groupIndex === 0 ? "L" : "R"}{index + 1}
                    <br />
                    $490
                  </div>
                ))}
              </div>
            ))}

            <div className="col-start-2 row-start-1 flex flex-col items-center justify-between overflow-hidden border border-press bg-press p-1 text-center text-paper">
              <div className="text-[7px] font-bold">
                Near<span className="text-nh-red">Here</span>
              </div>
              <div className="text-[5px] font-bold leading-tight">
                BRAND SPINE
                <br />
                COMMUNITY SPOTLIGHT
              </div>
              <div className="text-[5px] leading-tight">GENERAL QR</div>
            </div>
          </div>
        </div>

        {/* Back Blueprint */}
        <div className="space-y-1">
          <div className="text-center font-bold text-warm text-[8px]">Back Side (12/9 Ratio)</div>
          <div
            className="relative grid aspect-[12/9] gap-[3px] border border-rule bg-paper p-1.5"
            style={{ gridTemplateRows: "230fr 326fr 240fr" }}
          >
            {/* Top row: 4 ads */}
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-press/20 bg-slate-50 flex items-center justify-center font-bold text-[7px] text-warm text-center p-1">
                  Standard {i + 1}
                </div>
              ))}
            </div>

            {/* Middle row: brand message, premium placement, and mailing panel */}
            <div
              className="grid gap-[3px]"
              style={{ gridTemplateColumns: "280fr 480fr 338fr" }}
            >
              <div className="flex items-center justify-center border border-press bg-press p-1 text-center text-[6px] font-bold text-paper">
                NearHere Message
              </div>
              <div className="flex items-center justify-center border-2 border-[#C9993E] bg-[#C9993E]/5 p-1 text-center text-[7px] font-bold text-[#C9993E]">
                Premium Center Back
                <br />
                $1,490
              </div>
              <div className="flex items-center justify-center border border-dashed border-nh-red/30 bg-nh-red/5 p-1 text-center text-[7px] font-bold text-nh-red">
                Protected Mailing Area
              </div>
            </div>

            {/* Bottom row: 4 ads */}
            <div className="grid grid-cols-4 gap-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-press/20 bg-slate-50 flex items-center justify-center font-bold text-[7px] text-warm text-center p-1">
                  Standard {i + 5}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rule text-[8px] font-bold text-press">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border border-press/20 bg-slate-50 inline-block shrink-0" />
            <span>Front $490 / Back $590</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-nh-red bg-nh-red/5 inline-block shrink-0" />
            <span>Premium Center Back ($1,490)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border-2 border-dashed border-press/40 bg-slate-50 inline-block shrink-0" />
            <span>Doubles stay within valid row pairs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 border border-dashed border-nh-red/30 bg-nh-red/5 inline-block shrink-0" />
            <span>Protected Mailing Area</span>
          </div>
        </div>
      </div>
    )
  }

  // 6x11 Community Card
  return (
    <div className="space-y-4 font-mono text-[9px] uppercase tracking-wider select-none">
      <h4 className="font-headline font-bold text-xs text-press text-center">Slot Map (6x11 Community Card)</h4>

      {/* Front Blueprint */}
      <div className="space-y-1">
        <div className="text-center font-bold text-warm text-[8px]">Front Side (11/6 Ratio)</div>
        <div className="border border-rule bg-paper aspect-[11/6] p-1.5 flex flex-col justify-between gap-1 relative">
          {/* Header Rail */}
          <div className="bg-press text-paper py-0.5 text-center font-bold text-[7px]">
            NearHere Brand Header Rail
          </div>

          {/* Grid body */}
          <div className="flex-1 grid grid-cols-12 gap-1">
            {/* Left spotlight (Col span: 7) */}
            <div className="col-span-7 border-2 border-nh-red bg-nh-red/5 flex items-center justify-center font-bold text-[9px] text-nh-red text-center p-2">
              ⭐ Premium Spotlight Space (Mama Rosa's)
            </div>

            {/* Right ads (Col span: 5) */}
            <div className="col-span-5 grid grid-rows-2 gap-1">
              <div className="border border-press/20 bg-slate-50 flex items-center justify-center font-bold text-[7px] text-warm text-center p-1">
                Standard Space (Coffee)
              </div>
              <div className="border border-press/20 bg-slate-50 flex items-center justify-center font-bold text-[7px] text-warm text-center p-1">
                Standard Space (Bakery)
              </div>
            </div>
          </div>

          {/* Bottom row: 3 half spaces + General QR */}
          <div className="grid grid-cols-4 gap-1 h-[22%] shrink-0">
            <div className="border border-press/20 bg-slate-50 flex items-center justify-center font-bold text-[6px] text-warm text-center leading-tight">
              Compact Ad (Pizza)
            </div>
            <div className="border border-press/20 bg-slate-50 flex items-center justify-center font-bold text-[6px] text-warm text-center leading-tight">
              Compact Ad (Taco)
            </div>
            <div className="border border-press/20 bg-slate-50 flex items-center justify-center font-bold text-[6px] text-warm text-center leading-tight">
              Compact Ad (Dessert)
            </div>
            <div className="bg-press text-paper flex items-center justify-center font-bold text-[6px] text-center leading-tight">
              General QR Explore
            </div>
          </div>
        </div>
      </div>

      {/* Back Blueprint */}
      <div className="space-y-1">
        <div className="text-center font-bold text-warm text-[8px]">Back Side (11/6 Ratio)</div>
        <div className="border border-rule bg-paper aspect-[11/6] p-1.5 grid grid-rows-3 gap-1 relative">
          {/* Top row: 3 standard ads */}
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-press/20 bg-slate-50 flex items-center justify-center font-bold text-[7px] text-warm text-center p-1">
                Standard Ad {i + 1}
              </div>
            ))}
          </div>

          {/* Middle row: Brand text & mailing panel */}
          <div className="grid grid-cols-3 gap-1">
            <div className="col-span-2 border border-dashed border-rule bg-paper flex items-center justify-center font-bold text-[7px] text-warm text-center p-1">
              Brand Message & Explanation
            </div>
            <div className="col-span-1 border border-dashed border-nh-red/30 bg-nh-red/5 flex items-center justify-center font-bold text-[8px] text-nh-red text-center p-1">
              📬 Protected Mailing Area
            </div>
          </div>

          {/* Bottom row: 3 standard ads */}
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-press/20 bg-slate-50 flex items-center justify-center font-bold text-[7px] text-warm text-center p-1">
                Standard Ad {i + 4}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-rule text-[8px] font-bold text-press">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 border border-nh-red bg-nh-red/5 inline-block shrink-0" />
          <span>Premium Spotlight Space</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 border border-press/20 bg-slate-50 inline-block shrink-0" />
          <span>Standard space</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-press inline-block shrink-0" />
          <span>Brand Rail / General QR</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 border border-dashed border-nh-red/30 bg-nh-red/5 inline-block shrink-0" />
          <span>Protected Mailing Area</span>
        </div>
      </div>
    </div>
  )
}
