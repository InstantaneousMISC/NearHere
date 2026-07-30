import Link from "next/link"
import { Bell, CircleDollarSign, CircleGauge, CreditCard, ExternalLink, Layers3, MailCheck, Megaphone, PackageCheck, Plus, ReceiptText, WalletCards } from "lucide-react"
import { db } from "@/server/db"
import { requireAdminAccess } from "@/server/auth/access"
import { formatDate, formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { DataTableCard, type DashboardTableColumn } from "@/components/dashboard/data-table-card"
import { EmptyState } from "@/components/dashboard/empty-state"
import { MetricCard } from "@/components/dashboard/metric-card"
import { MetricGrid } from "@/components/dashboard/metric-grid"
import { PageHeader } from "@/components/dashboard/page-header"
import { ProgressSummary } from "@/components/dashboard/progress-summary"
import { SectionCard } from "@/components/dashboard/section-card"
import { ActivityItem } from "@/components/dashboard/activity-feed"
import { campaignStatusMap, orderStatusMap, StatusBadge, statusFor } from "@/components/dashboard/status-badge"

export const revalidate = 0

type RecentOrder = {
  id: string
  amount: number
  status: "PENDING" | "PAID" | "REFUNDED" | "CANCELLED" | "EXPIRED"
  createdAt: Date
  advertiser: { businessName: string }
  campaign: { id: string; name: string }
  campaignSpot: { label: string }
}

export default async function AdminDashboardPage() {
  await requireAdminAccess()

  const [campaignsCount, spotsStats, paidOrders, recentOrders, pendingOrdersCount, activeCampaigns, recentNotifications] = await Promise.all([
    db.campaign.count(),
    db.campaignSpot.groupBy({ by: ["status"], _count: { id: true } }),
    db.order.findMany({ where: { status: "PAID" }, select: { amount: true } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5, include: { campaign: { select: { id: true, name: true } }, campaignSpot: { select: { label: true } }, advertiser: { select: { businessName: true } } } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.campaign.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, include: { spots: { select: { id: true, status: true, price: true } } } }),
    db.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
  ])

  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0)
  const totalInventory = spotsStats.reduce((sum, stat) => sum + stat._count.id, 0)
  const spotsSold = spotsStats.find((stat) => stat.status === "SOLD")?._count.id ?? 0
  const spotsHeld = spotsStats.find((stat) => stat.status === "HELD")?._count.id ?? 0
  const spotsOpen = spotsStats.find((stat) => stat.status === "OPEN")?._count.id ?? 0
  // Fill rate intentionally includes paid sold spots and temporary held inventory.
  const fillRate = totalInventory ? ((spotsSold + spotsHeld) / totalInventory) * 100 : 0

  const orderColumns: DashboardTableColumn<RecentOrder>[] = [
    { id: "business", header: "Business", cell: (order) => <Link href="/admin/businesses" className="font-medium text-foreground hover:text-primary">{order.advertiser.businessName}</Link> },
    { id: "campaign", header: "Campaign", cell: (order) => <Link href={`/admin/campaigns/${order.campaign.id}`} className="text-muted-foreground hover:text-primary">{order.campaign.name}</Link> },
    { id: "placement", header: "Placement", cell: (order) => <span className="text-sm text-muted-foreground">{order.campaignSpot.label}</span> },
    { id: "amount", header: "Amount", className: "text-right", cell: (order) => <span className="font-semibold text-foreground">{formatPrice(order.amount)}</span> },
    { id: "status", header: "Status", className: "text-right", cell: (order) => { const status = statusFor(orderStatusMap, order.status); return <span className="flex justify-end"><StatusBadge {...status} dot /></span> } },
  ]

  const campaignColumns: DashboardTableColumn<(typeof activeCampaigns)[number]>[] = [
    { id: "campaign", header: "Campaign", cell: (campaign) => <Link href={`/admin/campaigns/${campaign.id}`} className="font-medium text-foreground hover:text-primary">{campaign.name}</Link> },
    { id: "location", header: "Location", cell: (campaign) => <span className="text-muted-foreground">{campaign.city}, {campaign.state}</span> },
    { id: "status", header: "Status", cell: (campaign) => <StatusBadge {...statusFor(campaignStatusMap, campaign.status)} dot /> },
    { id: "filled", header: "Filled", cell: (campaign) => { const sold = campaign.spots.filter((spot) => spot.status === "SOLD").length; return <span className="font-medium text-foreground">{sold} / {campaign.spots.length}</span> } },
    { id: "revenue", header: "Revenue", cell: (campaign) => <span className="font-medium text-foreground">{formatPrice(campaign.spots.filter((spot) => spot.status === "SOLD").reduce((sum, spot) => sum + spot.price, 0))}</span> },
    { id: "mailDate", header: "Est. mail date", cell: (campaign) => <span className="text-muted-foreground">{campaign.estimatedMailDate ? formatDate(campaign.estimatedMailDate) : "Not scheduled"}</span> },
    { id: "actions", header: "", className: "text-right", cell: (campaign) => <Link href={`/admin/campaigns/${campaign.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Manage <ExternalLink className="size-3" aria-hidden="true" /></Link> },
  ]

  const notificationIcon = (type: string) => type.includes("PAYMENT") || type.includes("INVOICE") ? WalletCards : type.includes("CREATIVE") ? PackageCheck : type.includes("INQUIRY") ? MailCheck : Bell
  const activityItems: ActivityItem[] = recentNotifications.map((notification) => ({ id: notification.id, title: notification.title, description: notification.message, timestamp: formatDate(notification.createdAt), icon: notificationIcon(notification.type), tone: notification.type.includes("PAYMENT") ? "success" : notification.type.includes("CREATIVE") ? "warning" : "info", href: notification.link || undefined }))

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHeader title="Admin Dashboard" description="Overview of campaign metrics, sales, inventory, and operational activity." actions={<Button asChild><Link href="/admin/campaigns/new"><Plus aria-hidden="true" />Create campaign</Link></Button>} />

      <MetricGrid>
        <MetricCard label="Total revenue" value={formatPrice(totalRevenue)} icon={CircleDollarSign} tone="orange" description="Paid revenue only" />
        <MetricCard label="Spots sold" value={`${spotsSold} / ${totalInventory}`} icon={PackageCheck} tone="green" description="Paid inventory" />
        <MetricCard label="Total campaigns" value={campaignsCount} icon={Layers3} tone="purple" description="All campaign records" />
        <MetricCard label="Pending payments" value={pendingOrdersCount} icon={CreditCard} tone="amber" description="Unpaid holds" />
        <MetricCard label="Fill rate" value={`${Math.round(fillRate)}%`} icon={CircleGauge} tone="blue" description="Paid + held inventory" />
      </MetricGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(310px,1fr)]">
        <DataTableCard title="Recent Purchases" description="Latest orders across campaigns." data={recentOrders} columns={orderColumns} getRowKey={(order) => order.id} action={<Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">View all orders →</Link>} emptyState={<EmptyState icon={ReceiptText} title="No purchases yet" description="New orders will appear here as soon as a business reserves a placement." />} />
        <SectionCard title="Spot Inventory" description="Across all campaigns.">
          <div className="space-y-4">
            <InventoryRow label="Open / available" value={spotsOpen} color="bg-success" />
            <InventoryRow label="Held" value={spotsHeld} color="bg-warning" />
            <InventoryRow label="Sold / locked" value={spotsSold} color="bg-foreground" />
          </div>
          <div className="mt-7 border-t border-border pt-6"><ProgressSummary value={fillRate} label="Postcard ads filled" description={`${spotsSold} sold · ${spotsHeld} held · ${totalInventory} total`} /></div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(310px,1fr)]">
        <DataTableCard title="Active Campaigns" description="Campaigns currently accepting or fulfilling placements." data={activeCampaigns} columns={campaignColumns} getRowKey={(campaign) => campaign.id} action={<Link href="/admin/campaigns" className="text-sm font-medium text-primary hover:underline">View all campaigns →</Link>} emptyState={<EmptyState icon={Megaphone} title="No active campaigns found" description="Create a campaign to begin building inventory and accepting placements." action={<Button asChild><Link href="/admin/campaigns/new"><Plus aria-hidden="true" />Create campaign</Link></Button>} />} />
        <SectionCard title="Recent Notifications" action={<Link href="/admin/notifications" className="text-sm font-medium text-primary hover:underline">View all</Link>}><ActivityFeed items={activityItems} emptyMessage="No recent notifications." /></SectionCard>
      </div>
    </div>
  )
}

function InventoryRow({ label, value, color }: { label: string; value: number; color: string }) {
  return <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm text-muted-foreground"><span className={`size-2.5 rounded-full ${color}`} aria-hidden="true" />{label}</span><span className="text-lg font-semibold text-foreground">{value}</span></div>
}
