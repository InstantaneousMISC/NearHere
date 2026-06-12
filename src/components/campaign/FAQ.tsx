"use client"

interface FAQProps {
  city?: string
  state?: string
  mailingQuantity?: number
}

export default function FAQ({ city = "", state = "", mailingQuantity = 10000 }: FAQProps) {
  const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1) : "the campaign area"
  const stateName = state ? state.toUpperCase() : ""
  const formattedQuantity = mailingQuantity.toLocaleString()

  const faqs = [
    {
      question: "What is a NearHere campaign?",
      answer: `A NearHere campaign is a shared local advertising postcard organized around a specific service area. This campaign is planned for an estimated ${formattedQuantity} households in ${cityName}${stateName ? `, ${stateName}` : ""}.`,
    },
    {
      question: "What is included with my placement?",
      answer:
        "Every placement includes ad design, postcard placement, a unique QR code, campaign tracking page, public NearHere Business Profile, website backlink, local offer display, printing, and mailing.",
    },
    {
      question: "Do I get a business profile and website backlink?",
      answer:
        "Yes. Every placement includes a public NearHere Business Profile that can feature your business description, offer, contact details, service area, and a link back to your website. This gives postcard recipients an easy place to learn more and gives your business another local online presence. Search rankings are never guaranteed, but the profile creates another relevant local web presence.",
    },
    {
      question: "Do I need to design my own ad?",
      answer:
        "No. Submit your logo, business description, offer, contact details, and preferred call to action. NearHere prepares the placement and coordinates revisions before print approval.",
    },
    {
      question: "Can competitors advertise on the same postcard?",
      answer:
        "Where offered, category exclusivity limits a campaign to one advertiser in a defined business category (e.g. only one Plumber). Some food and dining categories may support multiple advertisers when campaign settings permit.",
    },
    {
      question: "What can I track?",
      answer:
        "NearHere provides basic QR scan and landing-page activity associated with your advertiser destination. Phone calls, website visits, and offline redemptions may not be fully attributable.",
    },
    {
      question: "Are leads or sales guaranteed?",
      answer:
        "No. Direct mail performance varies by market, offer, creative, timing, audience, and other factors. NearHere does not guarantee leads, calls, sales, revenue, or return on investment.",
    },
  ]

  return (
    <section className="border-t border-rule bg-muted/30">
      <div id="faq" className="mx-auto grid max-w-7xl gap-8 px-6 py-20 md:grid-cols-12">
        <div className="md:col-span-4">
          <p className="label-mono">FAQ</p>
          <h2 className="headline-xl mt-4 text-4xl md:text-5xl">Questions, answered.</h2>
          <p className="mt-4 text-sm text-press/70">
            Campaign details and availability are confirmed before checkout.
          </p>
        </div>
        <div className="border-t border-rule md:col-span-8">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-rule py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between">
                <span className="pr-6 font-headline text-lg font-bold uppercase tracking-tight md:text-xl text-left">
                  {faq.question}
                </span>
                <span className="font-headline text-2xl text-nh-red transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-press/75 text-left">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
