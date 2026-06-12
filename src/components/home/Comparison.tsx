"use client"

const points = [
  { n: "01", text: "Premium shared postcard mailing + campaign QR tracking.", active: true },
  { n: "02", text: "Public NearHere Business Profile + website backlink included.", active: false },
  { n: "03", text: "Done-for-you layout design, print coordination, and mailing.", active: false },
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
              NearHere combines complementary local advertisers on one premium oversized postcard.
              Shared production gives each business a clear placement, offer, contact paths, and a
              trackable QR destination without managing a full solo mailing.
            </p>
            <div className="mt-12 space-y-4">
              {points.map((point) => (
                <div
                  key={point.n}
                  className={`flex items-center gap-4 border-l-2 pl-6 ${
                    point.active ? "border-primary" : "border-border"
                  }`}
                >
                  <div
                    className={`flex size-12 shrink-0 items-center justify-center bg-stone-bg font-bold italic ${
                      point.active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {point.n}
                  </div>
                  <p className="font-medium">{point.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 lg:mt-0">
            <div className="overflow-hidden border border-foreground">
              <div className="bg-foreground p-4 text-background">
                <h3 className="font-mono text-xs font-medium uppercase tracking-widest">
                  Campaign Model
                </h3>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-stone-bg font-mono text-[10px] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3">Included</th>
                    <th className="px-6 py-3">Self-Managed Mail</th>
                    <th className="px-6 py-3 text-primary">NearHere</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  <tr>
                    <td className="px-6 py-4 font-medium">Creative layout</td>
                    <td className="px-6 py-4 text-muted-foreground">Coordinate separately</td>
                    <td className="px-6 py-4 font-bold">Included</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Print and mailing</td>
                    <td className="px-6 py-4 text-muted-foreground">Manage vendors</td>
                    <td className="px-6 py-4 font-bold italic text-primary">Coordinated</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">QR tracking destination</td>
                    <td className="px-6 py-4 text-muted-foreground">Set up separately</td>
                    <td className="px-6 py-4 font-bold">Included</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Public Business Profile</td>
                    <td className="px-6 py-4 text-muted-foreground">Build own site</td>
                    <td className="px-6 py-4 font-bold">Included</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 font-medium">Website backlink</td>
                    <td className="px-6 py-4 text-muted-foreground">Not included</td>
                    <td className="px-6 py-4 font-bold text-primary italic">Included</td>
                  </tr>
                  <tr className="bg-stone-bg">
                    <td className="px-6 py-6 font-bold">Campaign placement</td>
                    <td className="px-6 py-6 text-muted-foreground">Full-mailer budget</td>
                    <td className="px-6 py-6 text-2xl font-extrabold text-primary">From $490</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Placement availability and estimated household distribution vary by campaign.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
