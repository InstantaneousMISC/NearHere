import { getFriendlyApprovalStatusLabel, getFriendlyApprovalStatusBadgeClass } from "@/lib/statusHelper"
import { notFound } from "next/navigation"
import { db } from "@/server/db"
import CreativeForm from "@/components/creative/CreativeForm"
import { CampaignNav } from "@/components/campaign/CampaignNav"

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
  const statusText = order.creativeSubmission 
    ? getFriendlyApprovalStatusLabel(order.creativeSubmission.approvalStatus)
    : "Not Submitted"

  const statusColor = order.creativeSubmission
    ? getFriendlyApprovalStatusBadgeClass(order.creativeSubmission.approvalStatus)
    : "bg-stone-bg border-border text-muted-foreground"


  return (
    <main className="min-h-screen bg-background text-foreground">
      <CampaignNav 
        state={order.campaign.state} 
        city={order.campaign.city} 
        slug={order.campaign.slug} 
        isCheckoutPage={true} 
      />
      <div className="py-12 px-4 sm:px-6 lg:px-8 font-sans max-w-5xl mx-auto space-y-8">
        {/* Title Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-border">
          <div className="space-y-1.5">
            <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest block">
              Campaign Creative
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight uppercase font-mono">
              Submit Your Ad Details
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground font-sans">
              Provide the business details, offer, and contact information you want residents to
              see. NearHere will prepare the placement and coordinate any revisions before print.
              Campaign: <span className="font-semibold text-foreground">{order.campaign.name}</span>
            </p>
          </div>
          
          {/* Status Indicator */}
          <div className="flex flex-col items-start md:items-end gap-1.5 font-mono">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Submission Status</span>
            <div className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-wider border ${statusColor}`}>
              {statusText}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Form Panel */}
          <div className="lg:col-span-2 bg-card border border-border shadow-2xl p-6 sm:p-8 rounded-none">
            <CreativeForm
              token={token}
              order={order as any}
              initialData={order.creativeSubmission as any}
            />
          </div>

          {/* Guidelines Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            {/* Industry Space Lock */}
            <div className="bg-stone-bg border border-foreground text-foreground p-6 space-y-4 rounded-none">
              <h3 className="text-base font-bold font-mono uppercase tracking-wider text-primary flex items-center gap-2">
                Placement Reserved
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                Payment is complete and the <strong>{order.campaignSpot.category.name}</strong>{" "}
                placement is reserved for <strong>{order.advertiser.businessName}</strong>.
                Category exclusivity applies where campaign settings provide it.
              </p>
              <div className="text-[9px] text-muted-foreground font-mono border-t border-border pt-3 uppercase tracking-wider">
                Order ID: {order.id.substring(0, 12)}...
              </div>
            </div>

            {/* Design Guidelines */}
            <div className="bg-card border border-border p-6 space-y-4 shadow-2xl rounded-none">
              <h3 className="text-base font-bold font-mono uppercase tracking-wider text-foreground">
                📐 Asset Guidelines
              </h3>
              
              <div className="space-y-3.5 text-xs text-muted-foreground">
                <div className="space-y-1">
                  <span className="font-bold text-foreground block font-mono uppercase tracking-wide text-[10px]">Logo Files</span>
                  <p className="leading-relaxed">Provide transparent PNG, vector SVG, or high-res JPG. Clean backgrounds produce the best print results.</p>
                </div>
                <hr className="border-border" />
                <div className="space-y-1">
                  <span className="font-bold text-foreground block font-mono uppercase tracking-wide text-[10px]">Clear, Readable Copy</span>
                  <p className="leading-relaxed">Use a short description, a specific offer, and a direct next step. NearHere may shorten copy to fit the approved layout.</p>
                </div>
                <hr className="border-border" />
                <div className="space-y-1">
                  <span className="font-bold text-foreground block font-mono uppercase tracking-wide text-[10px]">Optional Business Images</span>
                  <p className="leading-relaxed">Upload clear work, team, or product photos if they support your placement. Maximum 5 images, up to 8MB each.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
