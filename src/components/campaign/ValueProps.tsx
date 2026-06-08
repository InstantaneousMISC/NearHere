interface ValuePropsProps {
  city?: string
  state?: string
}

export default function ValueProps({ city = "", state = "" }: ValuePropsProps) {
  const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1) : ""
  const stateName = state ? state.charAt(0).toUpperCase() + state.slice(1) : ""

  const benefits = [
    {
      icon: "👀",
      title: "100% Instant Open Rate",
      description:
        "Postcards are already 'open'. Homeowners see your business branding and special offers immediately when checking their mail—no envelopes to open or ignore.",
    },
    {
      icon: "📏",
      title: "Massive Oversized Cards",
      description:
        "We mail oversized 9\" x 12\" landscape cards. They are the largest layout delivered by the USPS, making them stand out prominently in the mailbox.",
    },
    {
      icon: "🛡️",
      title: "Category Exclusivity",
      description:
        "Only one business per industry category. Lock out your direct competitors in the target territory. Once your spot is claimed, it's yours exclusively.",
    },
    {
      icon: "💰",
      title: "Shared Cost Efficiency",
      description:
        "Split design, printing, and USPS postage costs with other local merchants. Save over 90% compared to mailing solo advertisements.",
    },
  ]

  return (
    <section className="py-24 font-sans bg-background text-foreground border-b border-border">
      <div className="mx-auto max-w-7xl px-6 space-y-16">
        {/* Benefits Section */}
        <div>
          <div className="max-w-2xl mb-12">
            <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
              Mailer Advantages
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl uppercase">
              Why Postcard Mailers Work
            </h2>
            <p className="mt-4 text-muted-foreground">
              Direct mail remains the most reliable way to reach households in {cityName}. Our shared format makes it affordable.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="flex flex-col justify-between border border-border bg-card p-6 rounded-none transition-colors hover:border-primary"
              >
                <div>
                  <div className="text-3xl mb-4 select-none">{b.icon}</div>
                  <h3 className="text-lg font-bold font-mono uppercase tracking-tight mb-3 text-foreground">{b.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Eligibility Section */}
        <div className="border border-foreground bg-stone-bg/30 p-8 rounded-none grid md:grid-cols-3 gap-8 items-center">
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xl font-extrabold font-mono uppercase tracking-wider text-primary flex items-center gap-2">
              🛡️ Business Eligibility & Quality Policy
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              To ensure Converse homeowners trust and respond to our postcard mailers, we uphold strict advertiser standards. To qualify for a slot on the card, your business must:
            </p>
            <ul className="space-y-2 text-xs text-foreground font-semibold">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary" /> Be a registered, active business serving the local {cityName} area.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary" /> Maintain an overall rating of <span className="text-primary font-bold">4.0 stars or higher</span> on public review platforms.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary" /> Have no safety concerns, licensing violations, or multiple unresolved negative reviews.
              </li>
            </ul>
          </div>
          <div className="bg-card border border-border p-6 rounded-none space-y-3">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              🤝 Zero-Risk Refund Guarantee
            </h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              If your business fails our quality review, we will immediately cancel your booking, issue a <span className="font-bold text-foreground">100% full refund</span> back to your card, and reopen the spot for another vendor. Exclusivity is only locked for verified partners.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
