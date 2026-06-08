"use client"

const steps = [
  {
    n: "01",
    title: "Claim your category",
    body: "Tell us your ZIP code and trade. If your category is open, we hold it for you — competitors locked out.",
  },
  {
    n: "02",
    title: "Send your offer",
    body: "Drop in your logo and a coupon or call-to-action. Our in-house designers lay out a card that converts.",
  },
  {
    n: "03",
    title: "Land in mailboxes",
    body: "We print on heavy 16pt stock and ship via USPS to every targeted home in your zone. You get tracking.",
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="border-y border-border bg-stone-bg py-24 font-sans text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
            How it works
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            From signup to mailbox in three steps.
          </h2>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="border-t-2 border-foreground bg-background p-8">
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                Step {s.n}
              </span>
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
