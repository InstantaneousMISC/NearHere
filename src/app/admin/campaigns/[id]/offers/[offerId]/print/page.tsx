import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/server/db"
import { CampaignOfferDiscountType } from "@prisma/client"
import QRCodeImage from "@/components/postcard/QRCodeImage"

interface PrintOfferPageProps {
  params: Promise<{
    id: string
    offerId: string
  }>
}

export async function generateMetadata({
  params,
}: PrintOfferPageProps): Promise<Metadata> {
  const { offerId } = await params
  const offer = await db.campaignOffer.findUnique({
    where: { id: offerId },
    select: { name: true },
  })

  return {
    title: offer ? `Print Card - ${offer.name}` : "Print Offer Card",
  }
}

export default async function PrintOfferPage({ params }: PrintOfferPageProps) {
  const { id: campaignId, offerId } = await params

  const offer = await db.campaignOffer.findUnique({
    where: { id: offerId },
    include: {
      campaign: true,
      adminUser: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  })

  if (!offer || offer.campaignId !== campaignId) {
    return notFound()
  }

  const campaign = offer.campaign
  const repName = offer.adminUser.name || "NearHere Representative"
  const discountDisplay =
    offer.discountType === CampaignOfferDiscountType.AMOUNT_OFF
      ? `$${((offer.discountAmount || 0) / 100).toFixed(0)} OFF`
      : `${offer.discountPercent}% OFF`

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  const qrUrl = `${appUrl}/o/${offer.token}`

  return (
    <main className="min-h-screen bg-slate-100 py-12 px-6 flex flex-col items-center justify-center font-sans print:bg-white print:p-0 print:m-0">
      {/* Print Controls (no-print) */}
      <div className="w-full max-w-xl mb-6 flex justify-between items-center bg-white border border-slate-200 rounded-xl p-4 shadow-sm print:hidden">
        <div className="text-sm">
          <span className="font-bold text-slate-700 block">Print Representative Card</span>
          <span className="text-slate-400 block text-xs">For best results, print on cardstock or heavy paper.</span>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/campaigns/${campaignId}`}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg uppercase tracking-wider transition-all"
          >
            Back to Campaign
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg uppercase tracking-wider shadow-sm transition-all"
          >
            Print Flyer
          </button>
        </div>
      </div>

      {/* The Printable Card Container */}
      <div className="w-full max-w-xl bg-white border-4 border-slate-900 p-12 text-slate-900 shadow-2xl relative flex flex-col justify-between items-center text-center select-none print:shadow-none print:border-slate-950 print:my-0 print:mx-auto print:w-[6in] print:h-[9in] print:max-w-none print:p-8">
        
        {/* Top Header Section */}
        <div className="w-full space-y-4">
          <div className="flex flex-col items-center space-y-1">
            <span className="font-headline font-black text-3xl uppercase tracking-tighter text-slate-950">
              LocalSpot Mailers
            </span>
            <div className="h-[3px] w-12 bg-[#D13F1F]"></div>
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#77706A]">
              Exclusive Partner Invitation
            </span>
          </div>

          <div className="h-px bg-slate-200"></div>
        </div>

        {/* Middle Core Offer Section */}
        <div className="my-8 w-full space-y-6">
          <div className="space-y-1">
            <span className="font-mono uppercase tracking-[0.15em] text-[10px] text-[#77706A] font-bold">
              Special Promotion
            </span>
            <h2 className="font-headline font-extrabold text-2xl uppercase text-slate-950 max-w-sm mx-auto leading-none">
              {offer.name}
            </h2>
          </div>

          <div className="bg-[#FAF8F4] border-2 border-dashed border-[#FAF8F4] py-6 px-4 rounded-xl flex flex-col justify-center items-center shadow-inner print:bg-white print:border-slate-300">
            <span className="font-headline font-black text-6xl text-[#D13F1F] tracking-tight leading-none">
              {discountDisplay}
            </span>
            <span className="font-headline font-bold text-slate-950 text-sm tracking-widest uppercase mt-2">
              postcard ad placement
            </span>
          </div>

          {/* QR Code Container */}
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-white p-2 border-2 border-slate-900 shadow-[4px_4px_0px_#211D1C] print:shadow-none">
              <QRCodeImage value={qrUrl} size={192} className="print:border-none" />
            </div>
            <div className="space-y-1 max-w-xs">
              <span className="font-headline font-bold text-xs uppercase tracking-wider text-slate-900">
                Scan to Claim Discount
              </span>
              <p className="text-[10px] text-slate-500 leading-normal font-mono">
                Scan the QR code to view available spaces in the target mailer. Offer expires when campaign sells out.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Campaign & Rep Section */}
        <div className="w-full space-y-4">
          <div className="h-px bg-slate-200"></div>

          <div className="grid grid-cols-2 gap-4 text-left text-xs font-mono">
            <div className="space-y-0.5">
              <span className="text-[9px] text-[#77706A] uppercase tracking-wider block">Target Mailer</span>
              <span className="font-headline font-bold text-sm text-slate-900 uppercase">
                {campaign.city}, {campaign.state}
              </span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[9px] text-[#77706A] uppercase tracking-wider block">Representative</span>
              <span className="font-headline font-bold text-sm text-slate-900 uppercase">
                {repName}
              </span>
            </div>
          </div>

          <div className="text-[9px] font-mono leading-relaxed text-[#77706A] uppercase max-w-md mx-auto">
            * Placements are subject to category availability and US Postal Service route guidelines. Placements are reserved on a first-come, first-served basis. NearHere (c) 2026.
          </div>
        </div>

      </div>
    </main>
  )
}
