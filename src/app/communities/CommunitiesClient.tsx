"use client"

import { useState } from "react"
import { MapPin, Sparkles, Send, Home, Info } from "lucide-react"

type CampaignArea = {
  city: string
  state: string
  status: "active" | "upcoming"
  homes: string
  launchDate: string
  dropNumber: string
}

const CAMPAIGNS: CampaignArea[] = [
  {
    city: "Converse",
    state: "TX",
    status: "active",
    homes: "10,000",
    launchDate: "March 2026",
    dropNumber: "Drop #001",
  },
  {
    city: "Live Oak",
    state: "TX",
    status: "upcoming",
    homes: "12,000",
    launchDate: "Summer 2026",
    dropNumber: "Drop #001",
  },
  {
    city: "Universal City",
    state: "TX",
    status: "upcoming",
    homes: "10,000",
    launchDate: "Summer 2026",
    dropNumber: "Drop #001",
  },
  {
    city: "Windcrest",
    state: "TX",
    status: "upcoming",
    homes: "8,000",
    launchDate: "Fall 2026",
    dropNumber: "Drop #001",
  },
  {
    city: "Schertz",
    state: "TX",
    status: "upcoming",
    homes: "15,000",
    launchDate: "Fall 2026",
    dropNumber: "Drop #001",
  },
]

export default function CommunitiesClient() {
  const [zipCode, setZipCode] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("resident")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && zipCode) {
      setSubmitted(true)
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="border-b border-rule py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-press/30 text-press mb-4">
            Campaign Zones
          </span>
          <h1 className="headline-xl text-5xl md:text-6xl">
            Where we&apos;re drops mailing.
          </h1>
          <p className="mt-6 text-lg text-press/80 max-w-xl mx-auto leading-relaxed">
            NearHere targets specific neighborhood drops, mailing physical postcards to local postal routes. Here are our active and upcoming service areas.
          </p>
        </div>
      </section>

      {/* Grid of Communities */}
      <section className="border-b border-rule py-20 bg-paper">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAMPAIGNS.map((c) => (
              <div
                key={`${c.city}-${c.status}`}
                className={`border p-6 flex flex-col justify-between relative ${
                  c.status === "active"
                    ? "border-nh-red bg-nh-red/5"
                    : "border-rule bg-paper"
                }`}
              >
                {/* Status indicator */}
                <div className="absolute top-4 right-4">
                  {c.status === "active" ? (
                    <span className="inline-flex items-center font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-nh-red text-paper">
                      ACTIVE DROP
                    </span>
                  ) : (
                    <span className="inline-flex items-center font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 border border-rule text-warm">
                      UPCOMING
                    </span>
                  )}
                </div>

                <div>
                  <p className="font-mono text-xs text-warm mb-1">{c.dropNumber}</p>
                  <h3 className="font-headline font-bold text-2xl uppercase tracking-tight flex items-center gap-1.5">
                    <MapPin className="h-5 w-5 text-press" /> {c.city}, {c.state}
                  </h3>
                  
                  <div className="mt-6 space-y-2 text-sm">
                    <div className="flex justify-between border-b border-rule/50 pb-1.5 font-mono text-xs text-warm">
                      <span>Household Count</span>
                      <span className="font-bold text-press">{c.homes} homes</span>
                    </div>
                    <div className="flex justify-between border-b border-rule/50 pb-1.5 font-mono text-xs text-warm">
                      <span>Delivery Target</span>
                      <span className="font-bold text-press">{c.launchDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-rule/50 flex justify-between items-center text-xs font-mono text-warm">
                  <span>Community Campaign</span>
                  {c.status === "active" ? (
                    <span className="text-nh-red font-bold flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Reserving Now
                    </span>
                  ) : (
                    <span className="text-press font-bold">Priority List Open</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request a Drop form */}
      <section className="py-20 bg-muted/20 border-b border-rule">
        <div className="max-w-3xl mx-auto px-6">
          <div className="border border-press bg-paper p-8 md:p-12">
            <div className="text-center mb-8">
              <Home className="h-8 w-8 text-nh-red mx-auto mb-3" />
              <h2 className="headline-xl text-3xl">Bring NearHere to Your Town</h2>
              <p className="text-sm text-press/70 mt-2">
                Don&apos;t see your neighborhood listed? Join our priority waitlist. When we receive enough requests in a zip code, we prepare a drop.
              </p>
            </div>

            {submitted ? (
              <div className="bg-nh-red/5 border border-nh-red p-6 text-center">
                <Info className="h-6 w-6 text-nh-red mx-auto mb-2" />
                <h3 className="font-headline font-bold text-lg uppercase">Request Registered!</h3>
                <p className="text-xs text-press/80 mt-1">
                  Thank you for voting for your community. We will alert you once we queue up a campaign near {zipCode}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-warm mb-1.5">
                      Your Email Address
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-press/40 rounded-none bg-paper px-3 py-2 text-sm focus:outline-none focus:border-nh-red"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-warm mb-1.5">
                      Target Zip Code
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={5}
                      placeholder="e.g. 78109"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ""))}
                      className="w-full border border-press/40 rounded-none bg-paper px-3 py-2 text-sm focus:outline-none focus:border-nh-red"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-warm mb-1.5">
                    I am a...
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer font-headline font-bold text-sm uppercase">
                      <input
                        type="radio"
                        name="role"
                        value="resident"
                        checked={role === "resident"}
                        onChange={() => setRole("resident")}
                        className="accent-nh-red"
                      />
                      Resident
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer font-headline font-bold text-sm uppercase">
                      <input
                        type="radio"
                        name="role"
                        value="business"
                        checked={role === "business"}
                        onChange={() => setRole("business")}
                        className="accent-nh-red"
                      />
                      Local Business Owner
                    </label>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-press text-paper py-3 font-headline font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 hover:bg-nh-red transition-all cursor-pointer"
                  >
                    <Send className="h-4 w-4" /> Submit Zip Code Vote
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
