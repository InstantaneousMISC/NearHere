import { db } from "@/server/db"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const revalidate = 0 // Disable cache for live dashboard stats

export default async function AdminDashboardPage() {
  // Query all stats in parallel
  const [
    campaignsCount,
    spotsStats,
    paidOrders,
    recentOrders,
    pendingOrdersCount,
    activeCampaigns,
  ] = await Promise.all([
    db.campaign.count(),
    db.campaignSpot.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { price: true },
    }),
    db.order.findMany({
      where: { status: "PAID" },
      select: { amount: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        campaign: true,
        campaignSpot: true,
        advertiser: true,
      },
    }),
    db.order.count({
      where: { status: "PENDING" },
    }),
    db.campaign.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: {
        spots: {
          select: { id: true, status: true, price: true },
        },
      },
    }),
  ])

  // Process stats
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0)
  
  const spotsCount = spotsStats.reduce((sum, s) => sum + s._count.id, 0)
  const spotsSold = spotsStats.find((s) => s.status === "SOLD")?._count.id || 0
  const spotsOpen = spotsStats.find((s) => s.status === "OPEN")?._count.id || 0

  const soldPercentage = spotsCount > 0 ? Math.round((spotsSold / spotsCount) * 100) : 0

  return (
    <div className="space-y-8 font-sans">
      <div className="space-y-1">
        <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-press leading-none">
          Admin Dashboard
        </h1>
        <p className="text-xs text-warm font-medium">
          Overview of LocalSpot Mailers campaign metrics, sales, and order stats.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Revenue */}
        <Card className="p-6 space-y-2">
          <div className="font-headline font-black text-2xl text-press">{formatPrice(totalRevenue)}</div>
          <div className="text-[9px] font-bold font-mono text-warm uppercase tracking-wider">
            Total Revenue
          </div>
        </Card>

        {/* Spots Sold */}
        <Card className="p-6 space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-headline font-black text-2xl text-press">{spotsSold}</span>
            <span className="text-[10px] text-warm font-mono font-bold">/ {spotsCount} spots</span>
          </div>
          <div className="text-[9px] font-bold font-mono text-warm uppercase tracking-wider">
            Spots Sold ({soldPercentage}%)
          </div>
        </Card>

        {/* Campaigns */}
        <Card className="p-6 space-y-2">
          <div className="font-headline font-black text-2xl text-press">{campaignsCount}</div>
          <div className="text-[9px] font-bold font-mono text-warm uppercase tracking-wider">
            Total Campaigns
          </div>
        </Card>

        {/* Pending Payments */}
        <Card className="p-6 space-y-2">
          <div className="flex items-baseline gap-1.5">
            <span className="font-headline font-black text-2xl text-press">{pendingOrdersCount}</span>
            <span className="text-[10px] text-warm font-mono font-bold">holds</span>
          </div>
          <div className="text-[9px] font-bold font-mono text-warm uppercase tracking-wider">
            Pending Payments
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <Card className="lg:col-span-2 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-3">
            <h3 className="font-headline font-extrabold text-lg uppercase tracking-tight text-press">Recent Purchases</h3>
            <Link
              href="/admin/orders"
              className="text-xs font-headline font-bold text-primary hover:text-primary/80 uppercase tracking-wider"
            >
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-press bg-press/5 text-warm font-mono text-[9px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Business</th>
                  <th className="py-3 px-4">Campaign</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-warm font-medium italic">
                      No orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="text-press hover:bg-press/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold">
                        {order.advertiser.businessName}
                      </td>
                      <td className="py-3.5 px-4 text-warm truncate max-w-[150px]">
                        {order.campaign.name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-press text-paper text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-none">
                          {order.campaignSpot.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-press">
                        {formatPrice(order.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Spot Inventory Status sidebar */}
        <Card className="p-6 space-y-6">
          <h3 className="font-headline font-extrabold text-lg uppercase tracking-tight text-press border-b border-border pb-3">Spot Inventory</h3>

          <div className="space-y-4 text-xs font-semibold">
            <div className="flex justify-between items-center">
              <span className="text-warm uppercase font-mono tracking-wider text-[10px] flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-600 rounded-none border border-press" />
                Open / Available
              </span>
              <span className="font-headline font-black text-lg text-press">{spotsOpen}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between items-center">
              <span className="text-warm uppercase font-mono tracking-wider text-[10px] flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-press rounded-none" />
                Sold / Locked
              </span>
              <span className="font-headline font-black text-lg text-press">{spotsSold}</span>
            </div>
          </div>

          <div className="border-t border-border pt-6 text-center space-y-3">
            <div className="font-headline font-black text-4xl text-press">{soldPercentage}%</div>
            <div className="text-[10px] text-warm font-mono font-bold uppercase tracking-wider">
              Postcard Ads Filled
            </div>
            {/* Visual Mini Progress */}
            <div className="w-full bg-[#E7E0D8]/45 h-3.5 rounded-none border border-press overflow-hidden">
              <div
                style={{ width: `${soldPercentage}%` }}
                className="bg-primary h-full transition-all duration-500"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Active Campaigns Section */}
      <Card className="p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-border pb-3">
          <h3 className="font-headline font-extrabold text-lg uppercase tracking-tight text-press">Active Campaigns</h3>
          <Link
            href="/admin/campaigns"
            className="text-xs font-headline font-bold text-primary hover:text-primary/80 uppercase tracking-wider"
          >
            View All Campaigns →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-press bg-press/5 text-warm font-mono text-[9px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Campaign</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Filled Ads</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">Est. Mail Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-warm font-medium italic">
                    No active campaigns found.
                  </td>
                </tr>
              ) : (
                activeCampaigns.map((camp) => {
                  const spotsCount = camp.spots.length
                  const spotsSold = camp.spots.filter((s) => s.status === "SOLD").length
                  const campRevenue = camp.spots
                      .filter((s) => s.status === "SOLD")
                      .reduce((sum, s) => sum + s.price, 0)

                  return (
                    <tr key={camp.id} className="text-press hover:bg-press/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold">
                        <Link href={`/admin/campaigns/${camp.id}`} className="hover:text-primary transition-colors text-base font-headline font-extrabold uppercase tracking-tight">
                          {camp.name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-warm font-semibold text-xs uppercase">
                        {camp.city.charAt(0).toUpperCase() + camp.city.slice(1)}, {camp.state.toUpperCase()}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-press">{spotsSold} / {spotsCount}</span>
                          <div className="w-16 bg-[#E7E0D8]/45 h-2 rounded-none border border-press overflow-hidden hidden sm:block">
                            <div
                              style={{ width: `${spotsCount > 0 ? (spotsSold / spotsCount) * 100 : 0}%` }}
                              className="bg-primary h-full"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-press">
                        {formatPrice(campRevenue)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-warm font-bold">
                        {camp.estimatedMailDate ? new Date(camp.estimatedMailDate).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                        >
                          <Link
                            href={`/campaigns/${camp.state.toLowerCase()}/${camp.city.toLowerCase()}/${camp.slug.toLowerCase()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Live Page ↗
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                        >
                          <Link href={`/admin/campaigns/${camp.id}`}>
                            Manage
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
