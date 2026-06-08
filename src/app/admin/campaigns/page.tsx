import { db } from "@/server/db"
import { formatPrice, formatDate } from "@/lib/utils"
import Link from "next/link"

export const revalidate = 0

export default async function CampaignsListPage() {
  const campaigns = await db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      spots: {
        select: { id: true, status: true, price: true },
      },
    },
  })

  return (
    <div className="space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Campaigns
          </h1>
          <p className="mt-1 text-slate-500">
            Create, configure, and monitor postcard mailing campaigns.
          </p>
        </div>
        <div>
          <Link
            href="/admin/campaigns/new"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-3 shadow-md hover:shadow-lg transition-all"
          >
            ＋ Create Campaign
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-55/20 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-4 px-6">Campaign Info</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6">Mailing Qty</th>
                <th className="py-4 px-6">Filled Ads</th>
                <th className="py-4 px-6">Revenue</th>
                <th className="py-4 px-6">Est. Mail Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 italic">
                    No campaigns created yet. Click "Create Campaign" to start.
                  </td>
                </tr>
              ) : (
                campaigns.map((camp) => {
                  const spotsCount = camp.spots.length
                  const spotsSold = camp.spots.filter((s) => s.status === "SOLD").length
                  const campRevenue = camp.spots
                    .filter((s) => s.status === "SOLD")
                    .reduce((sum, s) => sum + s.price, 0)
                  
                  return (
                    <tr key={camp.id} className="hover:bg-slate-55/10 transition-colors">
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <Link
                            href={`/admin/campaigns/${camp.id}`}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-base"
                          >
                            {camp.name}
                          </Link>
                          <div className="flex gap-2">
                            <span
                              className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                camp.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : camp.status === "DRAFT"
                                  ? "bg-slate-100 text-slate-600 border border-slate-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-100"
                              }`}
                            >
                              {camp.status}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              slug: {camp.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-medium">
                        {camp.city.charAt(0).toUpperCase() + camp.city.slice(1)}, {camp.state.toUpperCase()}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-700">
                        {new Intl.NumberFormat().format(camp.mailingQuantity)}
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="text-slate-800 font-semibold">
                            {spotsSold} / {spotsCount} spots
                          </div>
                          {/* Mini Progress */}
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              style={{
                                width: `${spotsCount > 0 ? (spotsSold / spotsCount) * 100 : 0}%`,
                              }}
                              className="bg-blue-600 h-full rounded-full"
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {formatPrice(campRevenue)}
                      </td>
                      <td className="py-4 px-6 text-slate-500 font-medium">
                        {camp.estimatedMailDate ? formatDate(camp.estimatedMailDate) : "—"}
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <Link
                          href={`/admin/campaigns/${camp.id}`}
                          className="inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 border border-slate-200 transition-colors"
                        >
                          Manage
                        </Link>
                        <Link
                          href={`/admin/campaigns/${camp.id}/edit`}
                          className="inline-flex items-center justify-center rounded-lg border border-slate-200 hover:border-slate-400 text-slate-600 font-bold text-xs px-3 py-2 transition-colors bg-white"
                        >
                          Edit
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
