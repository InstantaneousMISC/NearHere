import { notFound } from "next/navigation"
import { db } from "@/server/db"
import CreativeForm from "@/components/creative/CreativeForm"

interface CreativeSubmissionPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function CreativeSubmissionPage({ params }: CreativeSubmissionPageProps) {
  const { token } = await params

  // Fetch the order and creative submission details
  const order = await db.order.findUnique({
    where: { creativeSubmissionToken: token },
    include: {
      campaign: true,
      campaignSpot: {
        include: { category: true },
      },
      advertiser: true,
      creativeSubmission: true,
    },
  })

  if (!order) {
    return notFound()
  }

  // Determine current status label
  let statusText = "Not Submitted"
  let statusColor = "bg-slate-100 text-slate-700"

  if (order.creativeSubmission) {
    const status = order.creativeSubmission.approvalStatus
    if (status === "APPROVED") {
      statusText = "Approved"
      statusColor = "bg-emerald-50 text-emerald-700 border border-emerald-100"
    } else if (status === "NEEDS_REVIEW") {
      statusText = "Needs Review / Revision"
      statusColor = "bg-amber-50 text-amber-700 border border-amber-100"
    } else if (status === "REJECTED") {
      statusText = "Rejected"
      statusColor = "bg-red-50 text-red-700 border border-red-100"
    } else {
      statusText = "Submitted & Pending Review"
      statusColor = "bg-blue-50 text-blue-700 border border-blue-100"
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Block */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">
              LocalSpot Mailers Partner Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Ad Creative Assets & Details
            </h1>
            <p className="text-slate-500 text-sm">
              Campaign: <span className="font-semibold text-slate-800">{order.campaign.name}</span>
            </p>
          </div>
          
          {/* Status Indicator */}
          <div className="flex flex-col items-start md:items-end gap-1.5">
            <span className="text-xs font-semibold text-slate-400">Submission Status</span>
            <div className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm ${statusColor}`}>
              {statusText}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Panel */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <CreativeForm
              token={token}
              order={order as any}
              initialData={order.creativeSubmission as any}
            />
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            {/* Industry Space Lock */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                🔒 Spot Secured
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your payment succeeded. The <strong>{order.campaignSpot.category.name}</strong> category is locked exclusively for <strong>{order.advertiser.businessName}</strong>. No competitors will be placed on this card.
              </p>
              <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-3">
                Order ID: {order.id.substring(0, 12)}...
              </div>
            </div>

            {/* Design Guidelines */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <h3 className="text-base font-bold text-slate-900">
                📐 Asset Guidelines
              </h3>
              
              <div className="space-y-3.5 text-xs text-slate-600">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">Logo Files</span>
                  <p className="leading-relaxed">Provide transparent PNG, vector SVG, or high-res JPG. Clean backgrounds produce the best print results.</p>
                </div>
                <hr className="border-slate-100" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">Copy Constraints</span>
                  <p className="leading-relaxed">Keep descriptions brief and promo offers clear. Homeowners scan postcards quickly, so big bold text performs best.</p>
                </div>
                <hr className="border-slate-100" />
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 block">Showcase Images</span>
                  <p className="leading-relaxed">Upload clear photos of completed work projects or key products. Max 5 images, up to 8MB each.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
