import Link from "next/link"
import { Nav } from "@/components/home/Nav"

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Nav />
      <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-md bg-card border border-border shadow-2xl p-8 sm:p-10 text-center space-y-6 rounded-none">
          {/* Cancel Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/5 border border-primary text-primary text-4xl mb-4 font-mono rounded-none">
            ✕
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight uppercase">
              Checkout Cancelled
            </h1>
            <p className="text-sm text-muted-foreground font-sans leading-relaxed">
              Your payment was not completed, and the ad space was not purchased.
            </p>
          </div>

          <p className="text-xs text-muted-foreground font-mono leading-relaxed bg-stone-bg border border-border rounded-none p-4 uppercase tracking-wider">
            ⏱️ **Temporary Hold Notice:** The spot you selected remains held for you for up to **15 minutes** from when you clicked it, after which the hold will expire and it will be available to others.
          </p>

          <div>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center bg-foreground text-background border border-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary font-bold tracking-wider uppercase text-sm px-6 py-3.5 transition-colors cursor-pointer rounded-none"
            >
              Return to Campaign Page
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
