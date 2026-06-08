import { db } from "@/server/db"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"

export const revalidate = 0 // Disable cache for live dashboard stats

export default async function AdminDashboardPage() {
  // Query all stats in parallel
  const [
    campaignsCount,
    spotsStats,
    paidOrders,
    recentOrders,
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
  ])

  // Process stats
  const totalRevenue = paidOrders.reduce((sum, order) => sum + order.amount, 0)
  
  const spotsCount = spotsStats.reduce((sum, s) => sum + s._count.id, 0)
  const spotsSold = spotsStats.find((s) => s.status === "SOLD")?._count.id || 0
  const spotsHeld = spotsStats.find((s) => s.status === "HELD")?._count.id || 0
  const spotsOpen = spotsStats.find((s) => s.status === "OPEN")?._count.id || 0

  const soldPercentage = spotsCount > 0 ? Math.round((spotsSold / spotsCount) * 100) : 0

  return (
    <div className="space-y-8 font-sans">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="mt-1.5 text-slate-500">
          Overview of LocalSpot Mailers campaign metrics, sales, and order stats.
        </p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <div className="text-2xl font-black text-slate-900">{formatPrice(totalRevenue)}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Revenue
          </div>
        </div>

        {/* Spots Sold */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{spotsSold}</span>
            <span className="text-xs text-slate-400 font-semibold">/ {spotsCount} spots</span>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Spots Sold ({soldPercentage}%)
          </div>
        </div>

        {/* Campaigns */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <div className="text-2xl font-black text-slate-900">{campaignsCount}</div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Total Campaigns
          </div>
        </div>

        {/* Open Holds */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{spotsHeld}</span>
            <span className="text-xs text-slate-400 font-semibold">holds active</span>
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Temporary Holds
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Recent Purchases</h3>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All Orders →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">Business</th>
                  <th className="pb-3">Campaign</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                      No orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="text-slate-800 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-900">
                        {order.advertiser.businessName}
                      </td>
                      <td className="py-3.5 text-slate-500 truncate max-w-[150px]">
                        {order.campaign.name}
                      </td>
                      <td className="py-3.5">
                        <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">
                          {order.campaignSpot.label}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold text-slate-700">
                        {formatPrice(order.amount)}
                      </td>
                      <td className="py-3.5 text-right">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                            order.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : order.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Spot Inventory Status sidebar */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Spot Inventory</h3>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Open / Available
              </span>
              <span className="font-bold text-slate-800">{spotsOpen}</span>
            </div>
            <hr className="border-slate-100" />
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                Held in Checkout
              </span>
              <span className="font-bold text-slate-800">{spotsHeld}</span>
            </div>
            <hr className="border-slate-100" />
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                Sold / Locked
              </span>
              <span className="font-bold text-slate-800">{spotsSold}</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 text-center space-y-3">
            <div className="text-3xl font-extrabold text-slate-900">{soldPercentage}%</div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Postcard Ads Filled
            </div>
            {/* Visual Mini Progress */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                style={{ width: `${soldPercentage}%` }}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
