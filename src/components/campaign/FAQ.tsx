"use client"

interface FAQProps {
  city?: string
  state?: string
  mailingQuantity?: number
}

export default function FAQ({ city = "", state = "", mailingQuantity = 10000 }: FAQProps) {
  const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1) : ""
  const stateName = state ? state.charAt(0).toUpperCase() + state.slice(1) : ""
  const formattedQuantity = mailingQuantity ? mailingQuantity.toLocaleString() : "10,000"

  const faqs = [
    {
      question: "What is a NearHere Drop?",
      answer: `A NearHere Drop is a curated postcard campaign mailed directly to nearby households. Each card features local businesses, offers, and happenings in a clean, editorial format. We will deliver to ${formattedQuantity} local households in the ${cityName} area.`,
    },
    {
      question: "How is this different from junk mail?",
      answer: "Every drop is curated — one business per category, designed as a useful local discovery tool, not a coupon book or flyer pile.",
    },
    {
      question: "What does 'one business per category' mean?",
      answer: `Only one plumber, one cafe, one dentist, etc. can be featured per drop. Your category is exclusive once reserved. We lock out your direct competitors in the local area.`,
    },
    {
      question: "Do I need to design my own ad?",
      answer: "No! After purchase, you'll submit your logo, headline, offer, and contact details through a simple form. Our design team handles the rest, and someone will reach out to finalize ad details.",
    },
    {
      question: "Where will my postcard be delivered?",
      answer: `Drop #001 covers ${formattedQuantity} households across the ${cityName}, ${stateName} area. Future drops expand to new neighborhoods.`,
    },
    {
      question: "Can residents follow up digitally?",
      answer: "Yes. Each postcard includes a QR code linking to the NearHere Local Page where residents can explore featured businesses, see details, and redeem offers.",
    },
  ]

  return (
    <section className="bg-muted/30 border-t border-rule">
      <div id="faq" className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-12 gap-8">
        <div className="md:col-span-4">
          <p className="label-mono">FAQ</p>
          <h2 className="headline-xl text-4xl md:text-5xl mt-4">Questions, answered.</h2>
          <p className="mt-4 text-press/70 text-sm">Don't see yours? Reach out — we reply within a day.</p>
        </div>
        <div className="md:col-span-8 border-t border-rule">
          {faqs.map((faq, index) => (
            <details key={index} className="group border-b border-rule py-5">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="font-headline font-bold text-lg md:text-xl uppercase tracking-tight pr-6">{faq.question}</span>
                <span className="font-headline text-nh-red text-2xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-3 text-press/75 leading-relaxed text-sm">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

