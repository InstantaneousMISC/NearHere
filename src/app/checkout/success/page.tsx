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

  // Fetch the order using the Stripe session ID (polling until paid & business generated)
  const { data: order, error, isLoading } = trpc.order.getByStripeSessionId.useQuery(
    { sessionId },
    {
      refetchInterval: (data) => {
        const resolvedData = (data as any)?.state?.data || data
        return resolvedData?.status === "PAID" && resolvedData?.business ? false : 2000
      },
    }
  )

  if (isLoading) {
    return (
      <>
        <CampaignNav isCheckoutPage={true} />
        <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
          <div className="w-full max-w-lg bg-[#FAF8F4] border-2 border-[#211D1C] p-8 sm:p-10 rounded-none text-center">
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-[#D13F1F] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono uppercase tracking-wider text-[#77706A]">Verifying reservation & payment status...</p>
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
          <div className="w-full max-w-lg bg-[#FAF8F4] border-2 border-[#211D1C] p-8 sm:p-10 rounded-none text-center space-y-4">
            <h2 className="text-xl font-mono font-bold text-red-500 uppercase tracking-wider">Verification Failed</h2>
            <p className="text-xs text-[#77706A] leading-relaxed">
              We couldn't load your order details. A confirmation email was sent to your inbox if payment succeeded.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-[#211D1C] hover:bg-[#FAF8F4] text-[#FAF8F4] hover:text-[#211D1C] border border-[#211D1C] font-bold tracking-wider uppercase text-xs px-5 py-2.5 transition-colors cursor-pointer"
            >
              Return Home
            </Link>
          </div>
        </div>
      </>
    )
  }

  const submitCreativeUrl = `/submit-creative/${order.creativeSubmissionToken}`
  const business = order.business as any
  const claimUrl = business?.ownerUserId 
    ? "/business/dashboard" 
    : `/business/claim/${business?.claimToken}`

  return (
    <>
      <CampaignNav 
        state={order.campaign.state} 
        city={order.campaign.city} 
        slug={order.campaign.slug} 
        isCheckoutPage={true} 
      />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-xl bg-white border-2 border-[#211D1C] p-8 sm:p-10 rounded-none text-center space-y-6 shadow-[0_15px_40px_rgba(33,29,28,0.06)]">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FDF9F2] border border-[#C9993E] text-[#C9993E] text-3xl font-mono">
            ✓
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-headline font-black text-[#211D1C] tracking-tight uppercase leading-none">
              Campaign Placement Reserved
            </h1>
            <p className="text-xs text-[#77706A]">
              Your spot is reserved. Next, submit your business details so we can create your postcard ad, generate your QR code, build your NearHere Business Profile, add your website backlink, and prepare your placement for the campaign.
            </p>
          </div>

          {/* Onboarding Checklist Box */}
          <div className="bg-[#FAF8F4] border border-[#E7E0D8] p-4 text-left space-y-3">
            <h4 className="font-mono text-[9px] font-bold text-[#77706A] uppercase tracking-widest leading-none">
              Campaign Setup Status
            </h4>
            <ul className="text-xs font-medium text-[#211D1C] space-y-2.5">
              <li className="flex items-center gap-2">
                <span className="text-[#C9993E] font-bold">✓</span> 
                <span>Placement reserved ({formatPrice(order.amount)})</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-orange-500 font-bold">⏳</span> 
                <span>Business page and QR destination are being prepared</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#77706A]">○</span> 
                <span>Creative details are ready for your submission</span>
              </li>
            </ul>
          </div>

          {/* Order Summary Card */}
          <div className="bg-[#FAF8F4] border border-[#E7E0D8] p-5 text-left space-y-3 font-mono text-xs">
            <h3 className="text-[9px] font-bold text-[#77706A] uppercase tracking-widest">
              Campaign Placement Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-[#E7E0D8] pb-1">
                <span className="text-[#77706A] uppercase">Business</span>
                <span className="font-sans font-bold text-[#211D1C]">{order.advertiser.businessName}</span>
              </div>
              <div className="flex justify-between border-b border-[#E7E0D8] pb-1">
                <span className="text-[#77706A] uppercase">Campaign</span>
                <span className="font-sans font-bold text-[#211D1C]">{order.campaign.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77706A] uppercase">Category</span>
                <span className="font-bold text-[#D13F1F] uppercase">{order.campaignSpot.category.name}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-4 pt-2">
            <Link
              href={claimUrl}
              className="w-full inline-flex items-center justify-center bg-[#D13F1F] hover:bg-[#B53A1A] text-paper border border-[#211D1C] font-bold tracking-wider uppercase text-xs px-5 py-4 transition-colors cursor-pointer rounded-none font-headline text-sm"
            >
              Claim Account & Set Up Profile
            </Link>
            <div className="text-center">
              <Link
                href={submitCreativeUrl}
                className="inline-block text-[10px] font-mono font-bold uppercase tracking-widest text-[#77706A] underline hover:text-[#D13F1F] transition-colors"
              >
                Or submit creative details without an account
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
