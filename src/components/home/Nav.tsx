"use client"

import Link from "next/link"

export function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md font-sans">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold uppercase italic tracking-tighter select-none">
          <span className="bg-primary px-1.5 py-0.5 text-primary-foreground">Near</span>
          <span className="text-foreground">Here</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="#how" className="transition-colors hover:text-primary">How it Works</a>
          <a href="#why" className="transition-colors hover:text-primary">Pricing</a>
          <Link href="/advertise/directory" className="transition-colors hover:text-primary">
            Industries
          </Link>
          <a href="#coverage" className="transition-colors hover:text-primary">Coverage</a>
          <a href="#coverage" className="bg-foreground px-5 py-2.5 text-background font-bold transition-all hover:bg-primary hover:text-primary-foreground">
            Find a Campaign
          </a>
        </div>
      </div>
    </nav>
  )
}
