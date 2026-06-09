interface HowItWorksProps {
  city?: string
  state?: string
}

export default function HowItWorks({ city = "", state = "" }: HowItWorksProps) {
  const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1) : ""

  const steps = [
    {
      num: "01",
      title: "Reserve Your Category",
      desc: "Claim the only featured spot in your category for the next drop. First reserved, first featured."
    },
    {
      num: "02",
      title: "We Design Together",
      desc: "Upload your logo & coupon deal. Our designers craft a clean editorial slot that fits the postcard. Someone will reach out to finalize mockups."
    },
    {
      num: "03",
      title: "Quality Review",
      desc: `We verify you're an active business with 4.0+ rating in ${cityName}. If review fails, you get 100% refunded immediately and the spot opens.`
    },
    {
      num: "04",
      title: "Mail & Track Drops",
      desc: "Mailed to 10,000 homes. The campaign moves to DESIGNING, PRINTING, and MAILED. You will be notified over email at each stage with tracking."
    }
  ]

  return (
    <section className="bg-muted/30 border-t border-rule">
      <div id="how" className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div>
            <p className="label-mono">How It Works</p>
            <h2 className="headline-xl text-4xl md:text-5xl mt-4">Four steps to your neighborhood.</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-4 border border-rule bg-paper">
          {steps.map((s, i) => (
            <div key={s.num} className={`p-8 bg-paper ${i !== 3 ? "md:border-r border-rule" : ""} border-b md:border-b-0 last:border-b-0`}>
              <div className="font-mono text-xs text-nh-red tracking-[0.14em]">STEP {s.num}</div>
              <h3 className="headline-xl text-2xl mt-4 text-press leading-tight">{s.title}</h3>
              <p className="mt-3 text-press/70 leading-relaxed text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

