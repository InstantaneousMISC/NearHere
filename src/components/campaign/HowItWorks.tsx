interface HowItWorksProps {
  city?: string
  state?: string
}

export default function HowItWorks({ city = "" }: HowItWorksProps) {
  const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1) : "your area"

  const steps = [
    {
      num: "01",
      title: "Reserve Your Spot",
      desc: "Choose an available placement and business category to lock in your campaign spot.",
    },
    {
      num: "02",
      title: "Submit Business Details",
      desc: "Send your logo, offer, phone number, website, and service area via our simple submission form.",
    },
    {
      num: "03",
      title: "We Build Your Campaign Assets",
      desc: "NearHere prepares your postcard ad, generates your QR code, builds your business profile, and adds your website backlink.",
    },
    {
      num: "04",
      title: "Mail and Track Engagement",
      desc: `The postcard is mailed to the ${cityName} campaign area. Your dashboard shows basic QR activity and profile visits.`,
    },
  ]

  return (
    <section className="border-t border-rule bg-muted/30">
      <div id="how" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-mono">How It Works</p>
            <h2 className="headline-xl mt-4 text-4xl md:text-5xl">
              From reservation to campaign reporting.
            </h2>
          </div>
        </div>
        <div className="grid border border-rule bg-paper md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.num}
              className={`border-b border-rule bg-paper p-8 lg:border-b-0 ${
                index !== steps.length - 1 ? "lg:border-r" : ""
              }`}
            >
              <div className="font-mono text-xs tracking-[0.14em] text-nh-red">STEP {step.num}</div>
              <h3 className="headline-xl mt-4 text-2xl leading-tight text-press">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-press/70">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
