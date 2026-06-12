"use client"

const features = [
  {
    title: "Featured Business Profile Included",
    body: "Every advertiser receives a public NearHere Business Profile featuring their business, offer, contact details, service area, and website link. It gives postcard recipients an easy place to learn more while adding another local online presence for your business.",
  },
  {
    title: "Support Your Local Online Visibility",
    body: "Your NearHere Business Profile can include a link back to your website, giving customers another path to visit your site and helping support your broader local SEO footprint. Search rankings are never guaranteed, but the profile creates another relevant local web presence for your business.",
  },
  {
    title: "Physical Direct Mail Visibility",
    body: "A large-format postcard gives participating businesses a physical presence in the neighborhoods selected for each campaign, paired with print layout design and done-for-you mailing.",
  },
]

export function Testimonials() {
  return (
    <section className="py-24 font-sans text-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Practical local advertising
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            One campaign, several ways to respond.
          </h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="flex flex-col border border-border bg-card p-8"
            >
              <h3 className="text-xl font-extrabold tracking-tight">{feature.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
