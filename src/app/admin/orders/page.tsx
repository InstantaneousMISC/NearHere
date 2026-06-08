import { db } from "@/server/db"
import { formatPrice, formatDate } from "@/lib/utils"
import Link from "next/link"
import { OrderStatus } from "@prisma/client"

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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Orders & Transactions
        </h1>
        <p className="mt-1 text-slate-500">
          Monitor customer checkouts, Stripe transaction flows, and creative asset approvals.
        </p>
      </div>

      {/* Mini Stats Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              Filtered Revenue
            </span>
            <span className="text-2xl font-black text-slate-900">
              {formatPrice(totalRevenue)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-100">
            💵
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              Paid Bookings
            </span>
            <span className="text-2xl font-black text-slate-900">
              {paidCount} <span className="text-sm font-semibold text-slate-400">orders</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
            ✅
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              Pending / Holds
            </span>
            <span className="text-2xl font-black text-slate-900">
              {pendingCount} <span className="text-sm font-semibold text-slate-400">active</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-100">
            ⏳
          </div>
        </div>
      </div>

      {/* Filter Form Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <form method="GET" className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* Search bar */}
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="search" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Search Business / Contact
            </label>
            <input
              id="search"
              name="search"
              type="text"
              defaultValue={search || ""}
              placeholder="e.g. Acme Plumbing, John Doe, info@..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Status filter */}
          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Payment Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status || ""}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
          <div className="space-y-1.5">
            <label htmlFor="campaignId" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Postcard Campaign
            </label>
            <select
              id="campaignId"
              name="campaignId"
              defaultValue={campaignId || ""}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
            <Link
              href="/admin/orders"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 hover:border-slate-300 bg-white font-bold text-xs px-4 py-2.5 text-slate-600 transition-colors"
            >
              Clear Filters
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 transition-colors shadow"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-55/20 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-4 px-6">Order ID</th>
                <th className="py-4 px-6">Business / Advertiser</th>
                <th className="py-4 px-6">Campaign Info</th>
                <th className="py-4 px-6">Ad Spot (Label)</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Payment</th>
                <th className="py-4 px-6">Creative status</th>
                <th className="py-4 px-6">Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 italic">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const creativeStatus = order.creativeSubmission?.approvalStatus
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-mono text-[10px] text-slate-400">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-blue-600 font-bold hover:underline"
                        >
                          {order.id.slice(0, 8)}...
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900">{order.advertiser.businessName}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {order.advertiser.contactName} ({order.advertiser.email})
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-700 truncate block max-w-[150px]">
                          {order.campaign.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-medium uppercase mt-0.5">
                          {order.campaign.city}, {order.campaign.state}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-0.5">
                          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-bold">
                            {order.campaignSpot.label}
                          </span>
                          <span className="text-[9px] text-slate-400 block font-semibold uppercase">
                            {order.campaignSpot.side} • {order.campaignSpot.spotType}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {formatPrice(order.amount)}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block text-[9px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider ${
                            order.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : order.status === "PENDING"
                              ? "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                              : order.status === "REFUNDED"
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {order.status !== "PAID" ? (
                          <span className="text-[10px] text-slate-400 italic">—</span>
                        ) : !creativeStatus ? (
                          <span className="bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                            No Submission
                          </span>
                        ) : (
                          <span
                            className={`inline-block text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              creativeStatus === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : creativeStatus === "NEEDS_REVIEW"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : creativeStatus === "REJECTED"
                                ? "bg-red-50 text-red-700 border border-red-100"
                                : "bg-blue-50 text-blue-700 border border-blue-100"
                            }`}
                          >
                            {creativeStatus}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-3 py-2 border border-slate-200 transition-colors shadow-sm"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
