interface ValuePropsProps {
  city?: string
  state?: string
}

export default function ValueProps({ city = "", state = "" }: ValuePropsProps) {
  const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1) : ""
  const stateName = state ? state.charAt(0).toUpperCase() + state.slice(1) : ""

  const benefits = [
    {
      title: "100% Instant Open Rate",
      description:
        "Postcards are already 'open'. Homeowners see your business branding and special offers immediately when checking their mail—no envelopes to open or ignore.",
    },
    {
      title: "Massive Oversized Cards",
      description:
        "We mail oversized 9\" x 12\" landscape cards. They are the largest layout delivered by the USPS, making them stand out prominently in the mailbox.",
    },
    {
      title: "Category Exclusivity",
      description:
        "Only one business per industry category. Lock out your direct competitors in the target territory. Once your spot is claimed, it's yours exclusively.",
    },
    {
      title: "Shared Cost Efficiency",
      description:
        "Split design, printing, and USPS postage costs with other local merchants. Save over 90% compared to mailing solo advertisements.",
    },
  ]

  return (
    <section className="border-t border-rule bg-paper text-press">
      {/* What NearHere Is */}
      <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-12 gap-8 border-x border-rule">
        <div className="md:col-span-4">
          <p className="label-mono">What NearHere Is</p>
        </div>
        <div className="md:col-span-8">
          <h2 className="headline-xl text-4xl md:text-5xl text-press">A local postcard campaign built to support the community.</h2>
          <p className="mt-6 text-lg text-press/75 leading-relaxed max-w-2xl">
            NearHere turns local postcards into useful discovery tools for nearby households. Each campaign features local businesses, services, venues, offers, and happenings in a clear, curated format residents can quickly understand.
          </p>
        </div>
      </div>

      {/* Benefits grid */}
      <div className="max-w-7xl mx-auto px-6 pb-20 border-x border-rule">
        <div className="grid gap-px bg-rule border border-rule">
          <div className="grid md:grid-cols-4 bg-paper">
            {benefits.map((b, i) => (
              <div
                key={b.title}
                className={`p-8 bg-paper ${i !== benefits.length - 1 ? "md:border-r border-rule" : ""} border-b md:border-b-0 last:border-b-0`}
              >
                <div className="font-mono text-xs text-nh-red tracking-[0.14em]">BENEFIT 0{i+1}</div>
                <h3 className="headline-xl text-2xl mt-4 text-press">{b.title}</h3>
                <p className="mt-3 text-press/70 leading-relaxed text-sm">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Eligibility Section */}
      <div className="max-w-7xl mx-auto px-6 pb-20 border-x border-rule">
        <div className="border border-press bg-paper p-8 rounded-none grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-4">
            <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-nh-red text-nh-red bg-transparent">
              Business Eligibility & Quality Policy
            </span>
            <h3 className="headline-xl text-2xl md:text-3xl text-press">
              Postcard Quality Standards
            </h3>
            <p className="text-sm text-press/75 leading-relaxed">
              To ensure {cityName} homeowners trust and respond to our postcard mailers, we uphold strict advertiser standards. To qualify for a slot on the card, your business must:
            </p>
            <ul className="space-y-2 text-sm text-press font-medium">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-nh-red rounded-none" /> Registered, active business serving the local {cityName} area.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-nh-red rounded-none" /> Overall rating of <span className="text-nh-red font-bold">4.0 stars or higher</span> on public review platforms.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-nh-red rounded-none" /> No safety concerns, licensing violations, or multiple unresolved negative reviews.
              </li>
            </ul>
          </div>
          <div className="md:col-span-4 bg-muted/40 border border-rule p-6 rounded-none space-y-3">
            <h4 className="font-headline font-bold uppercase tracking-wider text-press">
              Zero-Risk Refund Guarantee
            </h4>
            <p className="text-xs text-press/70 leading-relaxed">
              If your business fails our quality review, we will immediately cancel your booking, issue a <span className="font-bold text-press">100% full refund</span> back to your card, and reopen the spot for another vendor. Exclusivity is only locked for verified partners.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

