import { formatPrice } from "@/lib/utils"

interface SpotSummaryProps {
  campaignName: string
  mailingQuantity: number
  city: string
  state: string
  spot: {
    label: string
    side: "FRONT" | "BACK"
    spotType: "PREMIUM" | "LARGE" | "STANDARD" | "SMALL"
    price: number
    category: {
      name: string
      allowsMultipleAdvertisers: boolean
    }
  }
}

export default function SpotSummary({
  campaignName,
  mailingQuantity,
  city,
  state,
  spot,
}: SpotSummaryProps) {
  const cityName = city.charAt(0).toUpperCase() + city.slice(1)
  const stateName = state.toUpperCase()

  return (
    <div className="space-y-6 border border-border bg-stone-bg p-6">
      <div>
        <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Selected Campaign Placement
        </h3>
        <p className="mt-1 text-2xl font-extrabold uppercase tracking-tight text-foreground">
          {spot.label}
        </p>
      </div>

      <hr className="border-border" />

      <div className="space-y-4">
        {!spot.category.allowsMultipleAdvertisers && (
          <div className="inline-flex items-center gap-1.5 border border-primary bg-primary/5 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-primary">
            Category Exclusive for This Campaign
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 font-mono text-xs">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Campaign Side
            </span>
            <span className="mt-0.5 block font-bold uppercase text-foreground">{spot.side}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Placement Type
            </span>
            <span className="mt-0.5 block font-bold uppercase text-foreground">
              {spot.spotType}
            </span>
          </div>
          <div className="col-span-2">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Mailing Campaign
            </span>
            <span className="mt-0.5 block font-sans font-bold text-foreground">{campaignName}</span>
          </div>
          <div className="col-span-2">
            <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
              Estimated Distribution
            </span>
            <span className="mt-0.5 block font-sans font-bold text-foreground">
              Approximately {new Intl.NumberFormat().format(mailingQuantity)} households in{" "}
              {cityName}, {stateName}
            </span>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      <div className="flex flex-col items-end space-y-1">
        <div className="flex w-full items-center justify-between">
          <span className="font-mono text-sm font-bold uppercase tracking-wider text-foreground">
            Total Price
          </span>
          <span className="font-mono text-3xl font-black text-primary">{formatPrice(spot.price)}</span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Approx. {(spot.price / mailingQuantity).toFixed(1)} cents per household
        </span>
      </div>

      <div className="border border-border bg-card p-3 text-center font-mono text-[9px] uppercase leading-relaxed tracking-wider text-muted-foreground shadow-inner">
        {spot.category.allowsMultipleAdvertisers
          ? "This category may include multiple advertisers under the campaign settings."
          : "This category is reserved for one advertiser in this campaign after successful checkout."}
      </div>
    </div>
  )
}
