"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { trpc } from "@/components/providers"
import { formatPrice } from "@/lib/utils"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import Link from "next/link"

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return (
      <>
        <CampaignNav isCheckoutPage={true} />
        <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
          <div className="w-full max-w-lg bg-card border border-border shadow-2xl p-8 sm:p-10 rounded-none text-center space-y-4">
            <h2 className="text-xl font-mono font-bold text-red-500 uppercase tracking-wider">Error</h2>
            <p className="text-muted-foreground text-sm font-sans">Missing Stripe session ID. Please check your purchase confirmation email.</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-foreground text-background border border-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary font-bold tracking-wider uppercase text-xs px-5 py-2.5 transition-colors cursor-pointer rounded-none"
            >
              Return Home
            </Link>
          </div>
        </div>
      </>
    )
  }

  // Fetch the order using the Stripe session ID
  const { data: order, error, isLoading } = trpc.order.getByStripeSessionId.useQuery({
    sessionId,
  })

  if (isLoading) {
    return (
      <>
        <CampaignNav isCheckoutPage={true} />
        <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
          <div className="w-full max-w-lg bg-card border border-border shadow-2xl p-8 sm:p-10 rounded-none">
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground font-mono uppercase tracking-wider text-xs">Verifying payment status...</p>
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
          <div className="w-full max-w-lg bg-card border border-border shadow-2xl p-8 sm:p-10 rounded-none text-center space-y-4">
            <h2 className="text-xl font-mono font-bold text-red-500 uppercase tracking-wider">Verification Failed</h2>
            <p className="text-muted-foreground text-sm font-sans">
              We couldn't load your order details. A confirmation email was sent to your inbox if payment succeeded.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-foreground text-background border border-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary font-bold tracking-wider uppercase text-xs px-5 py-2.5 transition-colors cursor-pointer rounded-none"
            >
              Return Home
            </Link>
          </div>
        </div>
      </>
    )
  }

  const submitCreativeUrl = `/submit-creative/${order.creativeSubmissionToken}`

  return (
    <>
      <CampaignNav 
        state={order.campaign.state} 
        city={order.campaign.city} 
        slug={order.campaign.slug} 
        isCheckoutPage={true} 
      />
      <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-lg bg-card border border-border shadow-2xl p-8 sm:p-10 rounded-none text-center space-y-6">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/5 border border-primary text-primary text-4xl mb-4 font-mono rounded-none">
            ✓
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight uppercase">
              Space Reserved!
            </h1>
            <p className="text-sm text-muted-foreground font-sans">
              Thank you. Your payment was processed successfully.
            </p>
          </div>

          {/* Order Summary Card */}
          <div className="max-w-md mx-auto bg-stone-bg border border-border rounded-none p-6 text-left space-y-4 font-sans">
            <h3 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
              Reservation Details
            </h3>
            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase tracking-wider">Business</span>
                <span className="font-sans font-bold text-foreground">{order.advertiser.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase tracking-wider">Campaign</span>
                <span className="font-sans font-bold text-foreground">{order.campaign.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground uppercase tracking-wider">Industry</span>
                <span className="font-bold text-primary bg-primary/5 border border-primary px-2 py-0.5 rounded-none text-xs">
                  {order.campaignSpot.label}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 mt-2">
                <span className="text-muted-foreground font-bold uppercase tracking-wider">Amount Paid</span>
                <span className="font-extrabold text-foreground text-sm font-sans">{formatPrice(order.amount)}</span>
              </div>
            </div>
          </div>

          {/* Call to Action Box */}
          <div className="max-w-md mx-auto bg-stone-bg border border-foreground rounded-none p-6 space-y-4 text-center">
            <h3 className="text-base font-mono font-bold text-primary uppercase tracking-wider flex items-center justify-center gap-2">
              🎨 Next: Submit Creative
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-sans">
              Your industry category is locked, but we need your ad assets (logo, copy, offers) to design the postcard. Submit your assets now to avoid delays.
            </p>
            <div>
              <Link
                href={submitCreativeUrl}
                className="w-full inline-flex items-center justify-center bg-foreground text-background border border-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary font-bold tracking-wider uppercase text-sm px-6 py-3.5 transition-colors cursor-pointer rounded-none"
              >
                Submit Ad Details Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Suspense
        fallback={
          <>
            <CampaignNav isCheckoutPage={true} />
            <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
              <div className="w-full max-w-lg bg-card border border-border shadow-2xl p-8 sm:p-10 rounded-none">
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground font-mono uppercase tracking-wider text-xs">Loading details...</p>
                </div>
              </div>
            </div>
          </>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  )
}
