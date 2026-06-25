import { db } from "@/server/db"
import { formatPrice, formatDate } from "@/lib/utils"
import Link from "next/link"
import { OrderStatus } from "@prisma/client"
import { getFriendlyApprovalStatusLabel, getFriendlyApprovalStatusBadgeClass } from "@/lib/statusHelper"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

export const revalidate = 0 // Disable cache for live stats

interface OrdersListPageProps {
  searchParams: Promise<{
    status?: string
    campaignId?: string
    search?: string
  }>
}

export default async function OrdersListPage({ searchParams }: OrdersListPageProps) {
  const { status, campaignId, search } = await searchParams

  // Build prisma filter conditions
  const where: any = {}

  if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
    where.status = status as OrderStatus
  }

  if (campaignId && campaignId !== "all") {
    where.campaignId = campaignId
  }

  if (search) {
    where.OR = [
      { advertiser: { businessName: { contains: search, mode: 'insensitive' } } },
      { advertiser: { contactName: { contains: search, mode: 'insensitive' } } },
      { advertiser: { email: { contains: search, mode: 'insensitive' } } },
    ]
  }

  // Fetch orders and campaigns parallel
  const [orders, campaigns] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: true,
        campaignSpot: {
          include: { category: true }
        },
        advertiser: true,
        creativeSubmission: {
          select: { approvalStatus: true }
        },
      },
    }),
    db.campaign.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  // Count metrics for secondary dashboard view
  const totalRevenue = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + o.amount, 0)
  const paidCount = orders.filter((o) => o.status === "PAID").length
  const pendingCount = orders.filter((o) => o.status === "PENDING").length

  return (
    <div className="space-y-8 font-sans">
      <div className="space-y-1">
        <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-press leading-none">
          Orders & Transactions
        </h1>
        <p className="text-xs text-warm font-medium">
          Monitor customer checkouts, Stripe transaction flows, and creative asset approvals.
        </p>
      </div>

      {/* Mini Stats Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold font-mono text-warm uppercase tracking-wider block">
              Filtered Revenue
            </span>
            <span className="font-headline font-black text-2xl text-press">
              {formatPrice(totalRevenue)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100">
            💵
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold font-mono text-warm uppercase tracking-wider block">
              Paid Bookings
            </span>
            <span className="font-headline font-black text-2xl text-press">
              {paidCount} <span className="text-xs text-warm font-mono font-bold">orders</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-none bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100">
            ✅
          </div>
        </Card>

        <Card className="p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9px] font-bold font-mono text-warm uppercase tracking-wider block">
              Pending / Holds
            </span>
            <span className="font-headline font-black text-2xl text-press">
              {pendingCount} <span className="text-xs text-warm font-mono font-bold">active</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-none bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-100">
            ⏳
          </div>
        </Card>
      </div>

      {/* Filter Form Panel */}
      <Card className="p-6">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search bar */}
          <div className="space-y-1.5 md:col-span-2 text-left">
            <label htmlFor="search" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
              Search Business / Contact
            </label>
            <Input
              id="search"
              name="search"
              type="text"
              defaultValue={search || ""}
              placeholder="e.g. Acme Plumbing, John Doe, info@..."
            />
          </div>

          {/* Status filter */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="status" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
              Payment Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status || ""}
              className="w-full rounded-none border border-input bg-card text-press h-10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
            >
              <option value="">All Statuses</option>
              {Object.values(OrderStatus).map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Filter */}
          <div className="space-y-1.5 text-left">
            <label htmlFor="campaignId" className="block text-[10px] font-mono font-bold text-warm uppercase tracking-wider">
              Postcard Campaign
            </label>
            <select
              id="campaignId"
              name="campaignId"
              defaultValue={campaignId || ""}
              className="w-full rounded-none border border-input bg-card text-press h-10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
            >
              <option value="all">All Campaigns</option>
              {campaigns.map((camp) => (
                <option key={camp.id} value={camp.id}>
                  {camp.name}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="md:col-span-4 flex justify-end gap-3 pt-2">
            <Button
              asChild
              variant="outline"
              size="sm"
            >
              <Link href="/admin/orders">
                Clear Filters
              </Link>
            </Button>
            <Button
              type="submit"
              size="sm"
            >
              Apply Filters
            </Button>
          </div>
        </form>
      </Card>

      {/* Orders Table Card */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 px-6">Order ID</TableHead>
              <TableHead className="py-4 px-6">Business / Advertiser</TableHead>
              <TableHead className="py-4 px-6">Campaign Info</TableHead>
              <TableHead className="py-4 px-6">Ad Spot (Label)</TableHead>
              <TableHead className="py-4 px-6">Amount</TableHead>
              <TableHead className="py-4 px-6">Payment</TableHead>
              <TableHead className="py-4 px-6">Creative status</TableHead>
              <TableHead className="py-4 px-6">Date</TableHead>
              <TableHead className="py-4 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-warm italic">
                  No orders match your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const creativeStatus = order.creativeSubmission?.approvalStatus
                return (
                  <TableRow key={order.id}>
                    <TableCell className="py-4 px-6 font-mono text-[10px] text-warm">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-primary font-bold hover:underline"
                      >
                        {order.id.slice(0, 8)}...
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="space-y-0.5 text-left">
                        <div className="font-bold text-press">{order.advertiser.businessName}</div>
                        <div className="text-[11px] text-warm font-medium">
                          {order.advertiser.contactName} ({order.advertiser.email})
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-left">
                      <span className="font-headline font-black text-sm uppercase tracking-tight text-press truncate block max-w-[150px]">
                        {order.campaign.name}
                      </span>
                      <span className="text-[10px] text-warm font-mono font-bold uppercase block mt-0.5">
                        {order.campaign.city}, {order.campaign.state}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 px-6 text-left">
                      <div className="space-y-0.5">
                        <span className="bg-press text-paper text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5">
                          {order.campaignSpot.label}
                        </span>
                        <span className="text-[9px] text-warm block font-bold uppercase tracking-wide mt-0.5">
                          {order.campaignSpot.side} • {order.campaignSpot.spotType}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6 font-bold text-press">
                      {formatPrice(order.amount)}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge
                        variant={
                          order.status === "PAID"
                            ? "success"
                            : order.status === "PENDING"
                            ? "warning"
                            : "outline"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {order.status !== "PAID" ? (
                        <span className="text-[10px] text-warm italic">—</span>
                      ) : !creativeStatus ? (
                        <Badge variant="outline">
                          No Submission
                        </Badge>
                      ) : (
                        <Badge
                          variant={
                            creativeStatus === "APPROVED"
                              ? "success"
                              : creativeStatus === "REJECTED"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {getFriendlyApprovalStatusLabel(creativeStatus)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4 px-6 font-mono text-xs text-warm font-bold">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-right">
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                      >
                        <Link href={`/admin/orders/${order.id}`}>
                          Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
