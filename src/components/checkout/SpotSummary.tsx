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
  const stateName = state.charAt(0).toUpperCase() + state.slice(1)

  return (
    <div className="bg-stone-bg border border-border rounded-none p-6 space-y-6">
      <div>
        <h3 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
          Selected Ad Space
        </h3>
        <p className="text-2xl font-extrabold text-foreground mt-1 uppercase tracking-tight">
          {spot.label}
        </p>
      </div>

      <hr className="border-border" />

      <div className="space-y-4">
        {/* Category Exclusivity Badge */}
        {!spot.category.allowsMultipleAdvertisers && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary text-primary text-[10px] font-mono font-bold uppercase tracking-wider rounded-none">
            🛡️ Exclusive Industry Category
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Postcard Side</span>
            <span className="font-bold text-foreground uppercase mt-0.5 block">
              {spot.side}
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Size Tier</span>
            <span className="font-bold text-foreground uppercase mt-0.5 block">
              {spot.spotType}
            </span>
          </div>
          <div className="col-span-2">
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Mailing Campaign</span>
            <span className="font-sans font-bold text-foreground mt-0.5 block">
              {campaignName}
            </span>
          </div>
          <div className="col-span-2">
            <span className="block text-[10px] text-muted-foreground uppercase tracking-wider">Target Audience</span>
            <span className="font-sans font-bold text-foreground mt-0.5 block">
              Direct Mail to {new Intl.NumberFormat().format(mailingQuantity)} homes in {cityName}, {stateName}
            </span>
          </div>
        </div>
      </div>

      <hr className="border-border" />

      <div className="flex items-center justify-between">
        <span className="text-sm font-mono font-bold uppercase tracking-wider text-foreground">Total Price</span>
        <span className="text-3xl font-black text-primary font-mono">
          {formatPrice(spot.price)}
        </span>
      </div>

      <div className="text-[9px] text-muted-foreground leading-relaxed text-center bg-card border border-border rounded-none p-3 shadow-inner font-mono uppercase tracking-wider">
        🔒 Exclusivity locks after checkout. Your industry category is guaranteed. No direct competitors on the same mailer.
      </div>
    </div>
  )
}
