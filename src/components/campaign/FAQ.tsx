"use client"

import { useState } from "react"

interface FAQProps {
  city?: string
  state?: string
  mailingQuantity?: number
}

export default function FAQ({ city = "", state = "", mailingQuantity = 10000 }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const cityName = city ? city.charAt(0).toUpperCase() + city.slice(1) : ""
  const stateName = state ? state.charAt(0).toUpperCase() + state.slice(1) : ""
  const formattedQuantity = mailingQuantity ? mailingQuantity.toLocaleString() : "10,000"

  const faqs = [
    {
      question: "What am I buying?",
      answer: `You're purchasing an exclusive advertising spot on a shared local postcard that will be mailed to ${formattedQuantity} homes in the ${cityName}, ${stateName} area. Your business will be the only one in your category on the card.`,
    },
    {
      question: "Do I need to design my own ad?",
      answer: "No! After purchase, you'll submit your logo, headline, offer, and contact details through a simple form. Our design team handles the rest.",
    },
    {
      question: "Can my competitor also be on the card?",
      answer: "No. Each business category is exclusive — only one plumber, one roofer, one dentist, etc. Once your category is claimed, no competitor can purchase a spot on the same campaign.",
    },
    {
      question: "When will the card be mailed?",
      answer: "The card will be mailed once all spots are filled or by the campaign deadline. You'll be notified of the expected mail date.",
    },
    {
      question: "What happens if the campaign doesn't fill?",
      answer: "We're committed to mailing every campaign. If spots remain open, we may extend the deadline or offer promotional pricing to fill them.",
    },
    {
      question: "Do you guarantee calls or sales?",
      answer: `We guarantee delivery to ${formattedQuantity} local mailboxes. Results vary by offer, business type, and market conditions. Direct mail consistently delivers strong ROI for local businesses.`,
    },
    {
      question: "Can restaurants participate if other restaurants are already listed?",
      answer: "Yes! Restaurants, bakeries, and coffee shops are the one exception to our exclusivity rule. Food businesses complement each other and consumers respond well to multiple dining options.",
    },
  ]

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section id="faq" className="py-24 font-sans bg-stone-bg text-foreground border-t border-border">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Got questions? We got answers.
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={index}
                className="bg-card border border-border overflow-hidden transition-all duration-200 hover:border-foreground"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-extrabold text-slate-900 focus:outline-none cursor-pointer"
                >
                  <span>{faq.question}</span>
                  <span className="ml-4 flex-shrink-0 font-mono text-primary font-bold text-lg select-none">
                    {isOpen ? "−" : "＋"}
                  </span>
                </button>
                <div
                  className={`transition-all duration-350 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[300px] border-t border-border" : "max-h-0"
                  }`}
                >
                  <p className="px-6 py-5 text-muted-foreground leading-relaxed text-sm">
                    {faq.answer}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
