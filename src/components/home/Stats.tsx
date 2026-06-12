"use client"

const stats = [
  { v: "9x12", l: "Premium Postcard Format" },
  { v: "Profile", l: "Business Page & Backlink" },
  { v: "QR", l: "Scan Tracking Included" },
  { v: "Full", l: "Print & Mail Management" },
]

export function Stats() {
  return (
    <section className="border-y border-border bg-stone-bg py-12 font-sans">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.l} className="flex flex-col">
            <span className="font-mono text-2xl font-bold text-primary select-none">{stat.v}</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground select-none">
              {stat.l}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
