"use client"

const steps = [
  {
    n: "01",
    title: "Choose a campaign",
    body: "Find an active NearHere postcard campaign serving the neighborhoods that matter to your business.",
  },
  {
    n: "02",
    title: "Reserve a placement",
    body: "Select an available front, back, double, or premium placement and choose your business category.",
  },
  {
    n: "03",
    title: "Submit your details",
    body: "Provide your business details, logo, offer, and website URL. NearHere uses these to build your postcard ad and your public business profile.",
  },
  {
    n: "04",
    title: "Review your creative",
    body: "NearHere prepares the shared postcard layout and coordinates any revisions before print approval.",
  },
  {
    n: "05",
    title: "Get found online & offline",
    body: "Postcard recipients scan your QR code to view your NearHere Business Profile, including your offer, contacts, and website link.",
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
            From reservation to mailbox.
          </h2>
        </div>
        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {steps.map((step) => (
            <div key={step.n} className="border-t-2 border-foreground bg-background p-8">
              <span className="font-mono text-xs uppercase tracking-widest text-primary">
                Step {step.n}
              </span>
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
