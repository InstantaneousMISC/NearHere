"use client"

const points = [
  { n: "01", text: "One Business Per Category. No competitors on your card.", active: true },
  { n: "02", text: "Managed logistics. We handle design, print, and postage.", active: false },
  { n: "03", text: "Targeted local zones. You pick the neighborhoods that matter.", active: false },
]

export function Comparison() {
  return (
    <section id="why" className="py-24 font-sans text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
              Why share the card?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Direct mail works because it's tangible — but it's traditionally expensive. We solve
              the cost barrier by letting six complementary businesses share one high-quality,
              oversized mailer.
            </p>
            <div className="mt-12 space-y-4">
              {points.map((p) => (
                <div
                  key={p.n}
                  className={`flex items-center gap-4 border-l-2 pl-6 ${
                    p.active ? "border-primary" : "border-border"
                  }`}
                >
                  <div
                    className={`flex size-12 items-center justify-center bg-stone-bg font-bold italic shrink-0 ${
                      p.active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {p.n}
                  </div>
                  <p className="font-medium">{p.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 lg:mt-0">
            <div className="overflow-hidden border border-foreground">
              <div className="bg-foreground p-4 text-background">
                <h3 className="font-mono text-xs font-medium uppercase tracking-widest">
                  Campaign Cost Comparison
                </h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-stone-bg font-mono text-[10px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Feature</th>
                    <th className="px-6 py-3">Solo Direct Mail</th>
                    <th className="px-6 py-3 text-primary">Shared Mail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  <tr>
                    <td className="px-6 py-4 font-medium">Reach</td>
                    <td className="px-6 py-4 text-muted-foreground">5,000 Homes</td>
                    <td className="px-6 py-4 font-bold">5,000 Homes</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Design & Prep</td>
                    <td className="px-6 py-4 text-muted-foreground">$500 – $1,200</td>
                    <td className="px-6 py-4 font-bold italic text-primary">Included</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Postage & Print</td>
                    <td className="px-6 py-4 text-muted-foreground">$3,500+</td>
                    <td className="px-6 py-4 font-bold">$695</td>
                  </tr>
                  <tr className="bg-stone-bg">
                    <td className="px-6 py-6 font-bold">Total Investment</td>
                    <td className="px-6 py-6 text-muted-foreground line-through">$4,000+</td>
                    <td className="px-6 py-6 text-2xl font-extrabold text-primary">$695</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              *Based on average 9x12 oversized campaign costs in suburban markets.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
