"use client"

const stats = [
  { v: "5,000", l: "Households Per Zone" },
  { v: "100%", l: "Category Exclusivity" },
  { v: "14¢", l: "Cost Per Delivery" },
  { v: "$0", l: "Setup or Design Fees" },
]

export function Stats() {
  return (
    <section className="border-y border-border bg-stone-bg py-12 font-sans">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l} className="flex flex-col">
            <span className="font-mono text-2xl font-bold text-primary select-none">{s.v}</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground select-none">{s.l}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
