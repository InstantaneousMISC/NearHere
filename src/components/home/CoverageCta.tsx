"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function CoverageCta() {
  const router = useRouter()
  const [zip, setZip] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanZip = zip.trim()
    if (!cleanZip) return

    if (cleanZip === "78109") {
      router.push("/campaigns/tx/converse/local-business-postcard")
    } else {
      setError(`ZIP code "${cleanZip}" is currently on our waitlist. Enter "78109" (Converse, TX) to view a live booking campaign.`)
    }
  }

  return (
    <section id="coverage" className="border-t border-border py-24 font-sans text-foreground">
      <div className="mx-auto max-w-7xl px-6 text-center">
        <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
          Check availability
        </span>
        <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl">
          Ready to be the local name?
        </h2>
        <p className="mt-4 text-muted-foreground">
          See if your business category is still open in your ZIP code.
        </p>
        
        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 flex max-w-md overflow-hidden border border-foreground bg-background"
        >
          <input
            type="text"
            required
            placeholder="ZIP Code (e.g. 78109)"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            className="w-full bg-transparent px-4 py-4 text-sm outline-none text-foreground"
          />
          <button type="submit" className="bg-primary px-8 py-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-foreground hover:text-background shrink-0 cursor-pointer">
            CHECK
          </button>
        </form>

        {error && (
          <p className="mx-auto mt-4 text-xs text-primary font-semibold max-w-md bg-primary/5 border border-primary/25 rounded p-2.5">
            ⚠️ {error}
          </p>
        )}
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="border-t border-border font-sans">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 font-mono text-[10px] uppercase tracking-widest text-muted-foreground md:flex-row">
        <p>© 2026 Neighborhood Shared Mail LLC</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Merchant Agreement</a>
          <a href="#" className="hover:text-primary">Contact Sales</a>
        </div>
      </div>
    </footer>
  )
}
