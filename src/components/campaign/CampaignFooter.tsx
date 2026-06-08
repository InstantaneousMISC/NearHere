"use client"

export default function CampaignFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border font-sans bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:flex-row">
        <p>© {year} Neighborhood Shared Mail LLC</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Merchant Agreement</a>
          <a href="#" className="hover:text-primary">Contact Sales</a>
        </div>
      </div>
    </footer>
  )
}
