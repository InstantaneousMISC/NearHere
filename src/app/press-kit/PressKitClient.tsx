"use client"

import { Download, FileText, Image, Newspaper, Mail } from "lucide-react"

export default function PressKitClient() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-rule py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-press/30 text-press mb-4">
            Press Room
          </span>
          <h1 className="headline-xl text-5xl md:text-6xl">
            Brand assets & press kit.
          </h1>
          <p className="mt-6 text-lg text-press/80 max-w-xl mx-auto leading-relaxed">
            Resources, guidelines, and media files for journalists covering the NearHere local discovery platform.
          </p>
        </div>
      </section>

      {/* Quick Facts Section */}
      <section className="border-b border-rule py-16 bg-paper">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <p className="label-mono">Company Overview</p>
            <h2 className="headline-xl text-3xl mt-4">NearHere at a Glance</h2>
          </div>
          <div className="md:col-span-8 grid sm:grid-cols-2 gap-6">
            {[
              ["Founded", "2026 in Converse, Texas"],
              ["Mission", "Help residents support local and discover nearby services."],
              ["Method", "Premium shared postcard direct-mail drops backed by mobile-first local web portals."],
              ["Scale", "Mailing directly to 10,000 households per campaign drop."],
            ].map(([k, v]) => (
              <div key={k} className="border border-rule/75 p-5">
                <span className="font-mono text-xs text-nh-red font-bold uppercase">{k}</span>
                <p className="font-headline font-bold text-lg mt-1 text-press uppercase tracking-wide">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assets Grid */}
      <section className="border-b border-rule py-20 bg-muted/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-10 text-center md:text-left">
            <p className="label-mono">Media Assets</p>
            <h2 className="headline-xl text-3xl md:text-4xl mt-2">Brand Assets & Downloads</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Primary Logo Set",
                type: "SVG / PNG",
                desc: "Charcoal & Red logos for light and dark backgrounds.",
                icon: FileText,
              },
              {
                title: "Postcard Photos",
                type: "High-Res JPEG",
                desc: "Photography of physical Drop #001 postcards, front and back.",
                icon: Image,
              },
              {
                title: "Founder Bios",
                type: "PDF Document",
                desc: "Background info and headshots of the founding team.",
                icon: FileText,
              },
              {
                title: "Company Fact Sheet",
                type: "PDF Document",
                desc: "One-page sheet summarizing business model, coverage, and details.",
                icon: Newspaper,
              },
            ].map((asset, i) => (
              <div key={i} className="bg-paper border border-rule p-6 flex flex-col justify-between hover:border-press transition-colors">
                <div>
                  <div className="text-nh-red mb-4">
                    <asset.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-headline font-bold text-lg uppercase tracking-wide">{asset.title}</h3>
                  <p className="font-mono text-[10px] text-warm uppercase mt-1">{asset.type}</p>
                  <p className="text-xs text-press/70 mt-3 leading-relaxed">{asset.desc}</p>
                </div>
                
                <button
                  onClick={() => alert(`Asset download package queued. (Demo Only)`)}
                  className="mt-8 w-full border border-press text-press py-2 font-mono text-[10px] uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 hover:bg-press hover:text-paper transition-all cursor-pointer"
                >
                  <Download className="h-3 w-3" /> Download Asset
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Press Contact section */}
      <section className="py-20 bg-press text-paper border-b border-press">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-paper/60 flex justify-center mb-6">
            <Mail className="h-10 w-10 text-nh-red" />
          </div>
          <h2 className="headline-xl text-3xl md:text-5xl leading-tight">Media Contact</h2>
          <p className="mt-4 text-paper/70 leading-relaxed text-sm md:text-base max-w-xl mx-auto">
            Are you a journalist or editor writing about local marketing, direct-mail disruption, or small businesses in Texas? We would love to chat.
          </p>
          <div className="mt-8">
            <a
              href="mailto:press@nearhere.co"
              className="inline-block bg-paper text-press px-8 py-3.5 font-headline font-bold uppercase tracking-wider text-xs hover:bg-nh-red hover:text-paper transition-all"
            >
              press@nearhere.co
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
