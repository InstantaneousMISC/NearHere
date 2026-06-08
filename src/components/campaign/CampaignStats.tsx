interface CampaignStatsProps {
  spots: Array<{
    status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
    price: number
  }>
  mailingQuantity: number
  city: string
}

export default function CampaignStats({ spots, mailingQuantity, city }: CampaignStatsProps) {
  const spotsTotal = spots.length
  const spotsSold = spots.filter(s => s.status === "SOLD").length
  const spotsAvailable = spots.filter(s => s.status === "OPEN").length
  const percentSold = spotsTotal > 0 ? Math.round((spotsSold / spotsTotal) * 100) : 0

  const prices = spots.map(s => s.price / 100)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 299
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 899
  const priceDisplay = minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} – $${maxPrice}`

  const cityName = city.charAt(0).toUpperCase() + city.slice(1)

  return (
    <section className="border-y border-border bg-stone-bg py-16 font-sans text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        {/* Stats grid */}
        <div className="grid gap-8 md:grid-cols-3 mb-12">
          {/* Homes Mailed */}
          <div className="flex flex-col border border-border bg-card p-6">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Audience / Reach
            </span>
            <span className="font-mono text-3xl font-extrabold text-primary">
              {mailingQuantity.toLocaleString()}
            </span>
            <span className="text-sm font-bold text-slate-800 mt-1">
              {cityName} Households Mailed
            </span>
          </div>

          {/* Spots Available */}
          <div className="flex flex-col border border-border bg-card p-6">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Inventory status
            </span>
            <span className="font-mono text-3xl font-extrabold text-emerald-600">
              {spotsAvailable} <span className="text-sm text-muted-foreground font-normal">/ {spotsTotal} Open</span>
            </span>
            <span className="text-sm font-bold text-slate-800 mt-1">Industry Spots Remaining</span>
          </div>

          {/* Price Range */}
          <div className="flex flex-col border border-border bg-card p-6">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
              Booking rates
            </span>
            <span className="font-mono text-3xl font-extrabold text-primary">
              {priceDisplay}
            </span>
            <span className="text-sm font-bold text-slate-800 mt-1">Pricing per exclusive Category</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-xl mx-auto border border-border bg-card p-8 text-center">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="font-mono uppercase tracking-wider text-muted-foreground text-xs">
              Mailing Progress
            </span>
            <span className="font-bold text-slate-900">
              {spotsSold} of {spotsTotal} slots booked ({percentSold}%)
            </span>
          </div>
          
          {/* Simple flat progress bar with a black border wrapper */}
          <div className="w-full bg-stone-bg border border-foreground h-3 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${Math.max(percentSold, 2)}%` }}
            />
          </div>

          <p className="mt-4 text-xs font-mono text-emerald-600 uppercase tracking-widest font-bold">
            {spotsAvailable === 0
              ? "🎉 All spots have been booked! This campaign is fully reserved."
              : `🎉 ${spotsAvailable} industry slots are currently open — claim yours today!`}
          </p>
        </div>
      </div>
    </section>
  )
}
