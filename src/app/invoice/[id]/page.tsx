"use client"

import { useState, use } from "react"
import { trpc } from "@/components/providers"
import { formatPrice } from "@/lib/utils"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import Link from "next/link"

interface InvoicePageProps {
  params: Promise<{
    id: string
  }>
}

export default function InvoicePage({ params }: InvoicePageProps) {
  const { id } = use(params)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const { data: order, isLoading, error } = trpc.order.getInvoice.useQuery({ id })
  const payInvoiceMutation = trpc.order.getOrRenewStripeSession.useMutation()
  // Hooks must be declared before loading/error returns because this query
  // resolves after the component's first render.
  const [resendStatus, setResendStatus] = useState<string | null>(null)
  const [resending, setResending] = useState(false)
  const resendClaimEmailMutation = trpc.business.resendClaimEmail.useMutation()
  const business = order ? (order as any).business : null

  const handlePay = async () => {
    if (order?.status !== "PENDING") {
      setPayError("This invoice is no longer awaiting payment.")
      return
    }

    setPaying(true)
    setPayError(null)
    try {
      const result = await payInvoiceMutation.mutateAsync({ orderId: id })
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl
      } else {
        throw new Error("No Stripe checkout URL returned.")
      }
    } catch (err: any) {
      console.error(err)
      setPayError(err.message || "Failed to initiate checkout. Please try again.")
      setPaying(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FAF8F4] text-[#211D1C]">
        <CampaignNav isCheckoutPage={true} />
        <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
          <div className="w-full max-w-lg bg-[#FAF8F4] border-2 border-[#211D1C] p-8 sm:p-10 rounded-none text-center">
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-[#D13F1F] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono uppercase tracking-wider text-[#77706A]">Loading invoice details...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-[#FAF8F4] text-[#211D1C]">
        <CampaignNav isCheckoutPage={true} />
        <div className="flex items-center justify-center py-24 px-4 sm:px-6 lg:px-8 font-sans">
          <div className="w-full max-w-lg bg-[#FAF8F4] border-2 border-[#211D1C] p-8 sm:p-10 rounded-none text-center space-y-4">
            <h2 className="text-xl font-mono font-bold text-red-500 uppercase tracking-wider">Invoice Not Found</h2>
            <p className="text-xs text-[#77706A] leading-relaxed">
              We couldn't retrieve the requested invoice. Please double check the link or contact our support team.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-[#211D1C] hover:bg-[#FAF8F4] text-[#FAF8F4] hover:text-[#211D1C] border border-[#211D1C] font-bold tracking-wider uppercase text-xs px-5 py-2.5 transition-colors cursor-pointer"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const isPaid = order.status === "PAID"
  const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED"
  const isExpired = order.status === "EXPIRED"

  const handleResendEmail = async () => {
    if (!business?.id) return
    setResending(true)
    setResendStatus(null)
    try {
      const res = await resendClaimEmailMutation.mutateAsync({ businessId: business.id })
      setResendStatus(res.message || "Verification email sent!")
    } catch (err: any) {
      setResendStatus(`Error: ${err.message || "Failed to resend email."}`)
    } finally {
      setResending(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] text-[#211D1C] font-sans">
      <CampaignNav 
        state={order.campaign.state} 
        city={order.campaign.city} 
        slug={order.campaign.slug} 
        isCheckoutPage={true} 
      />
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl bg-white border-2 border-[#211D1C] p-8 sm:p-10 rounded-none space-y-6 shadow-[0_15px_40px_rgba(33,29,28,0.06)] text-left font-sans">
          {/* Header section */}
          <div className="border-b border-[#E7E0D8] pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <h1 className="text-2xl font-headline font-black text-[#211D1C] tracking-tight uppercase leading-none">
                Invoice
              </h1>
              <p className="text-xs font-mono text-[#77706A]">Order Ref: {order.id.slice(0, 12)}</p>
            </div>
            <div>
              {isPaid ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-250 font-mono text-xs font-bold uppercase tracking-wider px-3 py-1">
                  Paid
                </span>
              ) : isCancelled ? (
                <span className="bg-red-50 text-red-700 border border-red-250 font-mono text-xs font-bold uppercase tracking-wider px-3 py-1">
                  Cancelled
                </span>
              ) : isExpired ? (
                <span className="bg-red-50 text-red-700 border border-red-250 font-mono text-xs font-bold uppercase tracking-wider px-3 py-1">
                  Expired
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-700 border border-amber-250 font-mono text-xs font-bold uppercase tracking-wider px-3 py-1">
                  Payment Due
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-[#77706A] leading-relaxed">
            {isPaid
              ? "This invoice has already been paid. No further payment is needed."
              : "Please review the campaign details and placement specifications below. To finalize your booking and secure your industry-exclusive slot on the postcard, click the payment button to proceed to our secure checkout powered by Stripe."}
          </p>

          {/* Advertiser Info */}
          <div className="bg-[#FAF8F4] border border-[#E7E0D8] p-4 space-y-2.5">
            <h4 className="font-mono text-[9px] font-bold text-[#77706A] uppercase tracking-widest leading-none border-b border-[#E7E0D8] pb-1.5">
              Advertiser Information
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-[#77706A] block font-mono text-[10px] uppercase">Business Name</span>
                <span className="font-bold text-[#211D1C]">{order.advertiser.businessName}</span>
              </div>
              <div>
                <span className="text-[#77706A] block font-mono text-[10px] uppercase">Contact Name</span>
                <span className="font-semibold text-[#211D1C]">{order.advertiser.contactName}</span>
              </div>
              <div>
                <span className="text-[#77706A] block font-mono text-[10px] uppercase">Email</span>
                <span className="text-[#211D1C]">{order.advertiser.email}</span>
              </div>
              <div>
                <span className="text-[#77706A] block font-mono text-[10px] uppercase">Phone</span>
                <span className="text-[#211D1C]">{order.advertiser.phone}</span>
              </div>
            </div>
          </div>

          {/* Campaign & Spot Specs */}
          <div className="bg-[#FAF8F4] border border-[#E7E0D8] p-4 space-y-2.5">
            <h4 className="font-mono text-[9px] font-bold text-[#77706A] uppercase tracking-widest leading-none border-b border-[#E7E0D8] pb-1.5">
              Placement Specifications
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <div>
                <span className="text-[#77706A] block font-mono text-[10px] uppercase">Campaign Name</span>
                <span className="font-bold text-[#211D1C]">{order.campaign.name}</span>
              </div>
              <div>
                <span className="text-[#77706A] block font-mono text-[10px] uppercase">Placement Category</span>
                <span className="font-bold text-[#D13F1F] uppercase">{order.campaignSpot.category.name}</span>
              </div>
              <div>
                <span className="text-[#77706A] block font-mono text-[10px] uppercase">Location Area</span>
                <span className="text-[#211D1C] capitalize">{order.campaign.city}, {order.campaign.state.toUpperCase()}</span>
              </div>
              <div>
                <span className="text-[#77706A] block font-mono text-[10px] uppercase">Spot Label</span>
                <span className="text-[#211D1C] uppercase font-mono">{order.campaignSpot.label} ({order.campaignSpot.spotType})</span>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-[#FAF8F4] border border-[#E7E0D8] p-5 font-mono text-xs">
            <h3 className="text-[9px] font-bold text-[#77706A] uppercase tracking-widest border-b border-[#E7E0D8] pb-1.5">
              Invoice Pricing Breakdown
            </h3>
            <div className="space-y-2 pt-2">
              <div className="flex justify-between border-b border-[#E7E0D8] pb-1 text-[#4A4542]">
                <span>Placement Reservation Subtotal</span>
                <span>{formatPrice(order.originalAmount || order.amount)}</span>
              </div>
              {order.discountAmount && order.discountAmount > 0 && (
                <div className="flex justify-between border-b border-[#E7E0D8] pb-1 text-emerald-600">
                  <span>Applied Discounts</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#211D1C] pt-1">
                <span>Total Amount Due</span>
                <span>{formatPrice(order.amount)}</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-4 pt-2">
            {isPaid ? (
              <div className="space-y-3">
                <div className="text-center py-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
                  ✓ This invoice has already been paid. Please check the purchaser&apos;s email to verify and claim the business account.
                </div>
                {!business?.isClaimed && (
                  <div className="border border-[#E7E0D8] bg-[#FAF8F4] p-4 space-y-3 text-left">
                    {resendStatus && (
                      <div className={`p-3 text-xs font-mono border ${resendStatus.startsWith("Error") ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-800 border-emerald-200"}`}>
                        {resendStatus}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleResendEmail}
                      disabled={resending || !business?.id}
                      className="w-full py-2.5 bg-white hover:bg-[#FAF8F4] text-[#211D1C] border border-[#211D1C] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {resending ? "Resending Email..." : "📩 Resend Verification Email"}
                    </button>
                    {process.env.NODE_ENV !== "production" && business?.claimToken && (
                      <Link
                        href={`/business/claim/${business.claimToken}`}
                        className="w-full py-2.5 text-center bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer block"
                      >
                        🛠️ Claim & Verify Account Now (Dev Mode)
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : isCancelled ? (
              <div className="text-center py-4 bg-red-50 border border-red-200 text-red-800 text-sm font-semibold">
                This invoice has been cancelled or refunded.
              </div>
            ) : isExpired ? (
              <div className="text-center py-4 bg-red-50 border border-red-200 text-red-800 text-sm font-semibold">
                This invoice has expired. The ad spot reservation has been released. Please contact NearHere or request a new invoice.
              </div>
            ) : (
              <>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full inline-flex items-center justify-center bg-[#D13F1F] hover:bg-[#B53A1A] disabled:bg-gray-400 text-white border border-[#211D1C] font-bold tracking-wider uppercase text-xs px-5 py-4 transition-colors cursor-pointer rounded-none font-headline text-sm shadow-[4px_4px_0px_#211D1C]"
                >
                  {paying ? "Redirecting to Secure Checkout..." : "Pay Invoice via Stripe"}
                </button>
                {payError && (
                  <p className="text-xs text-red-600 font-medium text-center">{payError}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
