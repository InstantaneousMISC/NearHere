"use client"

import Link from "next/link"
import { Target, PenTool, Layout, ArrowRight, Download, FileText, Image, Newspaper } from "lucide-react"

export default function MediaKitClient() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-rule py-16 bg-muted/20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 border border-press/30 text-press mb-4">
            Advertiser Assets
          </span>
          <h1 className="headline-xl text-5xl md:text-6xl">
            Advertiser media kit.
          </h1>
          <p className="mt-6 text-lg text-press/80 max-w-xl mx-auto leading-relaxed">
            All the details, technical specifications, and distribution metrics you need to reserve space in our upcoming neighborhood drops.
          </p>
        </div>
      </section>

      {/* Postcard Specifications */}
      <section className="border-b border-rule py-20 bg-paper">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <p className="label-mono">The Physical Product</p>
            <h2 className="headline-xl text-4xl mt-4">Premium Postcard Specifications</h2>
            <p className="mt-6 text-press/75 text-sm md:text-base leading-relaxed">
              We don&apos;t print flimsy flyers. NearHere postcards are designed to feel like premium local guides, ensuring they get kept on kitchen counters and coffee tables, not thrown in the bin.
            </p>
            
            <div className="mt-8 space-y-4 font-mono text-xs text-warm">
              <div className="flex items-center gap-3 border-b border-rule/50 pb-2">
                <Layout className="h-4 w-4 text-nh-red" />
                <span>Oversized Format: 10.5&quot; x 6&quot; (stands out in the stack)</span>
              </div>
              <div className="flex items-center gap-3 border-b border-rule/50 pb-2">
                <Target className="h-4 w-4 text-nh-red" />
                <span>Premium Stock: 16pt heavy cardstock</span>
              </div>
              <div className="flex items-center gap-3 border-b border-rule/50 pb-2">
                <PenTool className="h-4 w-4 text-nh-red" />
                <span>Finish: Silk matte coating with spot gloss options</span>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7 flex justify-center">
            {/* Visual representation of dimensions */}
            <div className="w-full max-w-md bg-paper border-2 border-press p-6 shadow-xl relative aspect-[10.5/6] flex flex-col justify-between">
              <div className="absolute top-2 left-2 font-mono text-[8px] text-warm">10.5 Inches Wide</div>
              <div className="absolute right-2 top-1/2 -rotate-90 origin-right font-mono text-[8px] text-warm">6 Inches High</div>
              
              <div className="flex justify-between border-b border-rule pb-3">
                <div>
                  <h3 className="font-headline font-bold text-lg">Near<span className="text-nh-red">Here</span></h3>
                  <p className="font-mono text-[6px] uppercase tracking-wider text-warm mt-0.5">Converse Drop #001</p>
                </div>
                <span className="font-mono text-[8px] border border-press/30 px-2 py-0.5 self-start">POSTAL ROUTE SATURATION</span>
              </div>

              {/* Grid Mockup lines */}
              <div className="grid grid-cols-3 gap-2 flex-1 my-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-dashed border-rule p-2 flex flex-col justify-between">
                    <span className="font-mono text-[5px] text-warm">CATEGORY 0{i+1}</span>
                    <span className="font-headline font-bold text-[8px] uppercase tracking-tight leading-none text-press">Exclusive Advertiser</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center border-t border-rule pt-2 font-mono text-[6px] text-warm">
                <span>Vegetable Ink Printing</span>
                <span>FSC® Certified Heavy Stock</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reader Demographics & Saturation */}
      <section className="border-b border-rule py-20 bg-muted/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="label-mono">Audience Profile</p>
            <h2 className="headline-xl text-3xl md:text-4xl mt-2">Circulation & Readership</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-paper border border-rule p-6">
              <span className="font-mono text-xs text-nh-red font-bold uppercase">Target Size</span>
              <h4 className="font-headline font-bold text-3xl mt-2">10,000 Homes</h4>
              <p className="text-xs text-press/70 mt-3 leading-relaxed">
                Mailed directly to 10,000 single-family households on high-income postal routes in Converse, Texas.
              </p>
            </div>
            
            <div className="bg-paper border border-rule p-6">
              <span className="font-mono text-xs text-gold font-bold uppercase">Audience</span>
              <h4 className="font-headline font-bold text-3xl mt-2">Homeowners</h4>
              <p className="text-xs text-press/70 mt-3 leading-relaxed">
                We select routes targeting residential property owners, giving home services (plumbers, dentists, HVAC, lawn care) the perfect audience.
              </p>
            </div>

            <div className="bg-paper border border-rule p-6">
              <span className="font-mono text-xs text-press font-bold uppercase">Exclusivity</span>
              <h4 className="font-headline font-bold text-3xl mt-2">1 Per Category</h4>
              <p className="text-xs text-press/70 mt-3 leading-relaxed">
                We guarantee 100% exclusivity. Once a dentist reserves space, no other dental services are allowed on that drop.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Design Specifications & Artwork Guidelines */}
      <section className="border-b border-rule py-20 bg-paper">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="label-mono">Artwork Guidelines</p>
            <h2 className="headline-xl text-3xl md:text-4xl mt-2">Design Specs & Submissions</h2>
            <p className="text-sm text-press/70 mt-2">
              We handle the layout design to maintain the clean editorial postcard style. All you need to supply is:
            </p>
          </div>

          <div className="space-y-4">
            {[
              ["High-Resolution Logo", "Vector file format (SVG, AI, or high-res transparent PNG)."],
              ["Your Offer", "A clear, compelling local promotion (e.g. &apos;$50 Off&apos; or &apos;Buy One, Get One&apos;)."],
              ["Business Info", "Accurate phone number, physical address, and domain name for the QR destination link."],
              ["High-Res Product/Venue Photo", "Optional. Essential for restaurants and cafes. We handle final cropping and formatting."],
            ].map(([title, desc], index) => (
              <div key={title} className="flex gap-4 border border-rule p-4 items-start bg-muted/10">
                <div className="bg-press text-paper font-mono text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-headline font-bold text-sm uppercase tracking-wide">{title}</h4>
                  <p className="text-xs text-press/75 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/#why"
              className="inline-flex items-center gap-2 bg-press text-paper px-8 py-3.5 font-headline font-bold uppercase tracking-wider text-xs hover:bg-nh-red hover:scale-105 transition-all animate-none"
            >
              View Advertising Rates <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
