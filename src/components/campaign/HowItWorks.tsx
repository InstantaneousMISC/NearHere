interface HowItWorksProps {
  city?: string
  state?: string
}

export default function HowItWorks({ city = "", state = "" }: HowItWorksProps) {
  const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1) : ""

  const steps = [
    {
      n: "01",
      title: "Pick & Book Spot",
      body: `Select an available industry category on the visual postcard below, fill contact details, and lock in the spot via Stripe.`,
    },
    {
      n: "02",
      title: "Upload Copy & Logo",
      body: "Supply your business logo, choose a special discount coupon deal, and specify any creative instructions for the card.",
    },
    {
      n: "03",
      title: "Verification Review",
      body: `We check that your business is active and has a 4.0+ star rating in ${cityName}. If not approved, you are immediately refunded 100%.`,
    },
    {
      n: "04",
      title: "Finalize Ad Details",
      body: "Our professional graphic designers construct your card slot ad design. We will reach out to you via email to review and confirm the mockup.",
    },
    {
      n: "05",
      title: "Mailing Delivery Stages",
      body: "When the campaign completes, the postcard transitions through DESIGNING, PRINTING, and MAILED. You will receive automated status and tracking emails.",
    },
  ]

  return (
    <section id="how" className="border-y border-border bg-stone-bg py-24 font-sans text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-16">
          <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
            How it works
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl uppercase">
            From Booking to Mailboxes
          </h2>
          <p className="mt-4 text-muted-foreground">
            A step-by-step overview of our self-service onboarding, graphics design review, and campaign scheduling.
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s) => (
            <div key={s.n} className="border-t-2 border-foreground bg-background p-6 flex flex-col justify-between rounded-none">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
                  Step {s.n}
                </span>
                <h3 className="mt-3 text-lg font-bold font-mono uppercase tracking-tight leading-tight">{s.title}</h3>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
