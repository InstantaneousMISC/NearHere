"use client"

export default function CampaignFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-rule bg-press text-paper">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4">
          <div className="font-headline font-bold text-3xl tracking-tight text-paper">
            Near<span className="text-nh-red">Here</span>
          </div>
          <p className="mt-4 text-paper/70 max-w-xs leading-relaxed text-sm">
            A community-first local postcard campaign platform. Support local. Discover nearby.
          </p>
          <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-paper/50 mt-6">Local Discovery, Delivered By Postcard.</p>
        </div>
        {[
          ["Product", ["NearHere Postcards", "NearHere Drop", "Local Page", "For Business"]],
          ["Company", ["Our Mission", "Communities", "Press Kit", "Contact"]],
          ["Resources", ["How It Works", "Pricing", "FAQ", "Media Kit"]],
        ].map(([title, items]) => (
          <div key={title as string} className="md:col-span-2">
            <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-paper/50">{title}</p>
            <ul className="mt-4 space-y-2">
              {(items as string[]).map((it) => (
                <li key={it}><a href="#" className="font-headline text-paper/90 hover:text-nh-red text-sm uppercase tracking-wide">{it}</a></li>
              ))}
            </ul>
          </div>
        ))}
        <div className="md:col-span-2">
          <p className="font-mono uppercase tracking-[0.14em] text-[10px] text-paper/50">Contact</p>
          <ul className="mt-4 space-y-2 text-sm text-paper/90">
            <li>hello@nearhere.co</li>
            <li>Converse, Texas</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-paper/15">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/50">© {year} NearHere — Support Local. Discover Nearby.</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-paper/50">Community-First Campaign</p>
        </div>
      </div>
    </footer>
  )
}

