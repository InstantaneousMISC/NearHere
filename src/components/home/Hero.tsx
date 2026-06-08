"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PostcardMockup } from "./PostcardMockup"

export function Hero() {
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
      setError(`We are expanding! ZIP code "${cleanZip}" is not active yet. Try searching for "78109" (Converse, TX) to test our live demo zone.`)
    }
  }

  return (
    <header className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-32 font-sans bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-up">
            <span className="mb-4 block font-mono text-xs font-medium uppercase tracking-widest text-primary">
              Physical Presence / Local Reach
            </span>
            <h1 className="max-w-xl text-balance text-5xl font-extrabold leading-[1.1] tracking-tight md:text-7xl text-foreground">
              Own the mailbox in your neighborhood.
            </h1>
            <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
              Shared direct mail for local experts. Reach thousands of households for a fraction of
              the cost. One plumber, one realtor, one dentist per zone.
            </p>
            
            <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4 sm:flex-row">
              <div className="flex flex-1 overflow-hidden border border-foreground bg-background">
                <input
                  type="text"
                  required
                  placeholder="Enter your ZIP code (e.g. 78109)"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  className="w-full bg-transparent px-4 py-4 text-sm outline-none placeholder:text-muted-foreground/50 text-foreground"
                />
                <button type="submit" className="bg-foreground px-8 py-4 text-sm font-bold text-background transition-colors hover:bg-primary hover:text-primary-foreground shrink-0 cursor-pointer">
                  RESERVE SLOT
                </button>
              </div>
            </form>

            {error && (
              <p className="mt-3 text-xs text-primary font-semibold max-w-md bg-primary/5 border border-primary/25 rounded p-2.5">
                ⚠️ {error}
              </p>
            )}

            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Currently booking for the next neighborhood drop.
            </p>
          </div>
          
          <div className="animate-fade-up [animation-delay:200ms]">
            <PostcardMockup />
          </div>
        </div>
      </div>
    </header>
  )
}
