import { db } from "@/server/db"
import InquiriesList from "@/components/admin/InquiriesList"
import { CampaignInquiryStatus } from "@prisma/client"

export const revalidate = 0 // Disable cache for live updates

interface InquiriesPageProps {
  searchParams: Promise<{
    status?: string
    campaignId?: string
    search?: string
  }>
}

export default async function AdminInquiriesPage({
  searchParams,
}: InquiriesPageProps) {
  const resolvedParams = await searchParams
  const { status, campaignId, search } = resolvedParams

  const where: any = {}

  // 1. Enforce Status Filter
  if (status && Object.values(CampaignInquiryStatus).includes(status as CampaignInquiryStatus)) {
    where.status = status as CampaignInquiryStatus
  }

  // 2. Enforce Campaign Filter
  if (campaignId && campaignId !== "all") {
    where.campaignId = campaignId
  }

  // 3. Enforce Search Filter
  if (search) {
    where.OR = [
      { businessName: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ]
  }

  // 4. Fetch Inquiries, Campaigns, and Admin Users in parallel
  const [inquiries, campaigns, admins] = await Promise.all([
    db.campaignInquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
        assignedToAdmin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    db.campaign.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    }),
    db.adminUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="space-y-8 font-sans">
      <div className="space-y-1">
        <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-press leading-none">
          Campaign Inquiries
        </h1>
        <p className="text-xs text-warm font-medium">
          Manage advertiser setup requests, contact submissions, and manual booking leads.
        </p>
      </div>

      <InquiriesList
        inquiries={inquiries}
        campaigns={campaigns}
        admins={admins}
        initialFilters={{
          search,
          status,
          campaignId,
        }}
      />
    </div>
  )
}
