"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { trpc } from "@/components/providers"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import Link from "next/link"

function CancelContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return (
      <>
        <CampaignNav isCheckoutPage={true} />
        <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
          <div className="w-full max-w-md bg-card border border-border shadow-2xl p-8 sm:p-10 text-center space-y-6 rounded-none">
            <h2 className="text-xl font-mono font-bold text-red-500 uppercase tracking-wider">Error</h2>
            <p className="text-muted-foreground text-sm font-sans">Missing checkout session ID.</p>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center bg-foreground text-background border border-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary font-bold tracking-wider uppercase text-sm px-6 py-3.5 transition-colors cursor-pointer rounded-none"
            >
              Return Home
            </Link>
          </div>
        </div>
      </>
    )
  }

  const { data: order, error, isLoading } = trpc.order.getByStripeSessionId.useQuery({
    sessionId,
  })

  if (isLoading) {
    return (
      <>
        <CampaignNav isCheckoutPage={true} />
        <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
          <div className="w-full max-w-md bg-card border border-border shadow-2xl p-8 sm:p-10 text-center space-y-6 rounded-none">
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground font-mono uppercase tracking-wider text-xs">Loading details...</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (error || !order) {
    return (
      <>
        <CampaignNav isCheckoutPage={true} />
        <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
          <div className="w-full max-w-md bg-card border border-border shadow-2xl p-8 sm:p-10 text-center space-y-6 rounded-none">
            <h2 className="text-xl font-mono font-bold text-red-500 uppercase tracking-wider">Failed</h2>
            <p className="text-muted-foreground text-sm font-sans">Could not load details.</p>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center bg-foreground text-background border border-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary font-bold tracking-wider uppercase text-sm px-6 py-3.5 transition-colors cursor-pointer rounded-none"
            >
              Return Home
            </Link>
          </div>
        </div>
      </>
    )
  }

  const campaignUrl = `/campaigns/${order.campaign.state.toLowerCase()}/${order.campaign.city.toLowerCase()}/${order.campaign.slug.toLowerCase()}`

  return (
    <>
      <CampaignNav
        state={order.campaign.state}
        city={order.campaign.city}
        slug={order.campaign.slug}
        isCheckoutPage={true}
      />
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
            Your payment was cancelled. The spot remains open and can be claimed by anyone. If you still want to purchase this exclusive ad space, you can return to the campaign page and try again.
          </p>

          <div>
            <Link
              href={campaignUrl}
              className="w-full inline-flex items-center justify-center bg-foreground text-background border border-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary font-bold tracking-wider uppercase text-sm px-6 py-3.5 transition-colors cursor-pointer rounded-none"
            >
              Return to Campaign Page
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Suspense
        fallback={
          <>
            <CampaignNav isCheckoutPage={true} />
            <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
              <div className="w-full max-w-md bg-card border border-border shadow-2xl p-8 sm:p-10 text-center space-y-6 rounded-none">
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground font-mono uppercase tracking-wider text-xs">Loading details...</p>
                </div>
              </div>
            </div>
          </>
        }
      >
        <CancelContent />
      </Suspense>
    </main>
  )
}
