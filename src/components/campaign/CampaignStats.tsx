interface CampaignStatsProps {
  spots: Array<{
    status: "OPEN" | "HELD" | "SOLD" | "UNAVAILABLE"
    price: number
  }>
  mailingQuantity: number
  city: string
}

export default function CampaignStats({ spots, mailingQuantity }: CampaignStatsProps) {
  const spotsAvailable = spots.filter((spot) => spot.status === "OPEN").length

  return (
    <section className="border-b border-rule bg-paper">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-rule border-x border-rule px-6 md:grid-cols-4">
        {[
          [`${mailingQuantity.toLocaleString()}`, "Estimated Households"],
          [`${spotsAvailable}`, "Available Placements"],
          ["Limited", "Category Inventory"],
          ["Included", "QR Tracking"],
        ].map(([value, label]) => (
          <div key={label} className="px-6 py-6 text-center">
            <div className="headline-xl text-3xl text-press md:text-4xl">{value}</div>
            <p className="label-mono mt-2">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
