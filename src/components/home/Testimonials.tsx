"use client"

const quotes = [
  {
    q: "Phone rang for two weeks straight. Best $695 we've spent on marketing this year.",
    a: "Marco D.",
    r: "Riverside Plumbing — ZIP 90042",
  },
  {
    q: "We tried Facebook ads forever. One postcard drop brought in seven new patients.",
    a: "Dr. Lena K.",
    r: "Oak Leaf Dental — ZIP 80305",
  },
  {
    q: "Locking out the other realtors in my zone alone was worth it. The leads are a bonus.",
    a: "Janelle P.",
    r: "Main St Realty — ZIP 27514",
  },
]

export function Testimonials() {
  return (
    <section className="py-24 font-sans text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Local operators
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Built for businesses that want more calls.
          </h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {quotes.map((q, i) => (
            <figure
              key={i}
              className="flex flex-col justify-between border border-border bg-card p-8"
            >
              <blockquote className="text-lg font-medium leading-snug">
                <span className="text-primary">"</span>
                {q.q}
                <span className="text-primary">"</span>
              </blockquote>
              <figcaption className="mt-8 border-t border-border pt-4">
                <div className="text-sm font-bold">{q.a}</div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {q.r}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
