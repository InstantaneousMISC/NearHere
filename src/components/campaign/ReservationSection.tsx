"use client"

import type {
  ReservationPlan,
  ReservationSpot,
} from "./ReservationModal"
import { TEMPLATE_1_PRICING } from "@/lib/nearHereSharedCard9x12"

interface ReservationSectionProps {
  cardSize: string
  mailingQuantity: number
  spots: ReservationSpot[]
  onSelect: (plan: ReservationPlan, spot: ReservationSpot | null) => void
}

export default function ReservationSection({
  cardSize,
  mailingQuantity,
  spots,
  onSelect,
}: ReservationSectionProps) {
  const isTemplate1 = cardSize === "9x12"
  const plans: ReservationPlan[] = isTemplate1
    ? [
        {
          key: "front-standard",
          name: "Front Standard",
          price: TEMPLATE_1_PRICING.frontStandard,
          costPerHome: "4.9 cents per home",
          description: "High-visibility 230px x 265px placement on the Premium Grid front.",
        },
        {
          key: "back-standard",
          name: "Back Standard",
          price: TEMPLATE_1_PRICING.backStandard,
          costPerHome: "5.9 cents per home",
          description: "Larger 275px placement above or below the protected mailing area.",
        },
        {
          key: "front-double",
          name: "Front Double",
          price: TEMPLATE_1_PRICING.frontDouble,
          costPerHome: "8.9 cents per home",
          description: "Two adjacent front positions for a wider, higher-impact creative.",
        },
        {
          key: "back-double",
          name: "Back Double",
          price: TEMPLATE_1_PRICING.backDouble,
          costPerHome: "9.9 cents per home",
          description: "Two adjacent back positions in a valid top or bottom row.",
        },
        {
          key: "premium-center",
          name: "Premium Center Back",
          price: TEMPLATE_1_PRICING.premiumCenterBack,
          costPerHome: "14.9 cents per home",
          description: "The largest and highest-value placement beside the mailing panel.",
        },
      ]
    : [
        {
          key: "standard",
          name: "Standard Feature",
          price: 450,
          costPerHome: `${((450 * 100) / mailingQuantity).toFixed(1)} cents per home`,
          description: "A standard Community Card placement with trackable QR response.",
        },
        {
          key: "premium",
          name: "Premium Feature",
          price: 1000,
          costPerHome: `${((1000 * 100) / mailingQuantity).toFixed(1)} cents per home`,
          description: "The largest Community Card placement with priority visibility.",
        },
      ]

  const findSpot = (plan: ReservationPlan) =>
    spots.find((spot) => {
      if (spot.status !== "OPEN" && spot.status !== "HELD") return false
      if (plan.key === "front-standard") {
        return spot.side === "FRONT" && spot.spotType === "STANDARD"
      }
      if (plan.key === "back-standard") {
        return spot.side === "BACK" && spot.spotType === "STANDARD"
      }
      if (plan.key === "premium-center" || plan.key === "premium") {
        return spot.spotType === "PREMIUM"
      }
      if (plan.key === "standard") {
        return spot.spotType === "STANDARD" || spot.spotType === "SMALL"
      }
      return false
    }) || null

  return (
    <section id="placements" className="border-t border-rule bg-paper text-press">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="label-mono">Pricing & Placements</p>
          <h2 className="headline-xl mt-4 text-4xl font-bold md:text-5xl">
            Choose Your Placement
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-press/70">
            Select an available postcard placement type to begin. Every spot includes our full print, mailing, and online local search visibility package.
          </p>
        </div>

        {/* Plans Grid */}
        <div
          className={`mt-12 grid gap-px border border-rule bg-rule ${
            isTemplate1 ? "md:grid-cols-2 lg:grid-cols-5" : "md:grid-cols-2"
          }`}
        >
          {plans.map((plan) => {
            const spot = findSpot(plan)
            const isDouble = plan.key === "front-double" || plan.key === "back-double"
            const available = isDouble ? true : Boolean(spot)
            const isSold = isDouble ? false : Boolean(spot) === false

            const buttonLabel = "Reserve This Spot"

            return (
              <article
                key={plan.key}
                className={`flex min-h-[320px] flex-col justify-between bg-paper p-6 ${
                  plan.key === "premium-center" || plan.key === "premium"
                    ? "bg-[#FAF8F4] border-t-2 border-[#C9993E]"
                    : ""
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="headline-xl text-xl leading-none">{plan.name}</h3>
                    <span
                      className={`font-mono text-[8px] font-bold uppercase tracking-[0.1em] ${
                        available ? "text-emerald-700" : isSold ? "text-red-600" : "text-[#C9993E]"
                      }`}
                    >
                      {available ? "Available" : isSold ? "Sold Out" : "Request"}
                    </span>
                  </div>
                  <div className="mt-6">
                    <span className="headline-xl text-4xl">
                      ${plan.price.toLocaleString()}
                    </span>
                    <span className="label-mono ml-1.5">/ campaign</span>
                  </div>
                  <p className="mt-2.5 font-mono text-[9px] font-bold uppercase tracking-[0.08em] text-[#D13F1F]">
                    {plan.costPerHome}
                  </p>
                  <p className="mt-4 text-xs leading-relaxed text-press/70">
                    {plan.description}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelect(plan, spot)}
                  className={`mt-6 w-full px-4 py-2.5 font-headline text-xs font-black uppercase tracking-[0.06em] transition-colors cursor-pointer border ${
                    plan.key === "premium-center" || plan.key === "premium"
                      ? "bg-[#D13F1F] text-white hover:bg-[#211D1C] border-[#D13F1F] hover:border-[#211D1C]"
                      : "border-[#211D1C] hover:bg-[#211D1C] hover:text-white"
                  }`}
                >
                  {buttonLabel}
                </button>
              </article>
            )
          })}
        </div>

        {/* Global Inclusions & Exclusivity Strip */}
        <div className="mt-8 grid md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-8 bg-[#FAF8F4] border border-rule p-5 text-left space-y-3">
            <h4 className="font-mono text-[9px] font-bold text-press uppercase tracking-wider block">
              ✓ Every Placement Includes
            </h4>
            <p className="text-xs text-warm leading-relaxed">
              Postcard ad design, unique QR code, campaign tracking page, public NearHere Business Profile, website backlink, local offer display, phone & website CTA, postcard printing, and coordinated mailing.
            </p>
          </div>

          <div className="md:col-span-4 space-y-3 font-sans text-[11px] leading-relaxed text-left">
            <div>
              <span className="font-bold text-press block">Exclusivity Rules</span>
              <p className="text-warm">
                Category Rules: Most categories are limited to one advertiser per campaign. Food and dining may allow multiple advertisers when campaign settings permit.
              </p>
            </div>
            <div>
              <span className="font-bold text-press block">Campaign Results</span>
              <p className="text-warm">
                NearHere provides campaign placement, direct mail exposure, QR tracking, and business profile visibility. Results vary by offer, business type, timing, and customer demand. Leads and sales are not guaranteed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
