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
  const spotsAvailable = spots.filter(s => s.status === "OPEN").length

  return (
    <section className="border-b border-rule bg-paper">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 divide-x divide-rule border-x border-rule">
        {[
          [`${mailingQuantity.toLocaleString()}`, "Homes Reached"],
          ["1", "Business Per Category"],
          [`${spotsTotal}`, "Curated Categories"],
          [`${spotsAvailable}`, "Categories Available"],
        ].map(([n, l]) => (
          <div key={l} className="px-6 py-6 text-center">
            <div className="headline-xl text-3xl md:text-4xl text-press">{n}</div>
            <p className="label-mono mt-2">{l}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

