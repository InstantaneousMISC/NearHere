"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function BusinessAccessDeniedPage() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace("/auth/business/login")
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-background px-4 flex items-center justify-center">
      <section className="max-w-md w-full border border-border bg-card p-8 text-center space-y-4">
        <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-warm">
          Business portal access
        </p>
        <h1 className="font-headline font-black text-2xl uppercase text-press">
          No active paid placement
        </h1>
        <p className="text-sm text-warm leading-relaxed">
          This account has not claimed a business with a completed campaign placement. Use the claim link in your payment email, or contact us for help.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild variant="outline">
            <Link href="/">Return home</Link>
          </Button>
          <Button type="button" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? "Signing out..." : "Use another account"}
          </Button>
        </div>
      </section>
    </main>
  )
}
