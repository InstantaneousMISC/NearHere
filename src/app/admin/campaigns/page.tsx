import { db } from "@/server/db"
import { formatPrice, formatDate } from "@/lib/utils"
import Link from "next/link"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="font-headline font-black text-3xl uppercase tracking-tight text-press leading-none">
            Campaigns
          </h1>
          <p className="text-xs text-warm font-medium">
            Create, configure, and monitor postcard mailing campaigns.
          </p>
        </div>
        <div>
          <Button asChild>
            <Link href="/admin/campaigns/new">
              ＋ Create Campaign
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-6 py-4">Campaign Info</TableHead>
              <TableHead className="px-6 py-4">Location</TableHead>
              <TableHead className="px-6 py-4">Mailing Qty</TableHead>
              <TableHead className="px-6 py-4">Filled Ads</TableHead>
              <TableHead className="px-6 py-4">Revenue</TableHead>
              <TableHead className="px-6 py-4">Est. Mail Date</TableHead>
              <TableHead className="px-6 py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-warm italic">
                  No campaigns created yet. Click "Create Campaign" to start.
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((camp) => {
                const spotsCount = camp.spots.length
                const spotsSold = camp.spots.filter((s) => s.status === "SOLD").length
                const campRevenue = camp.spots
                  .filter((s) => s.status === "SOLD")
                  .reduce((sum, s) => sum + s.price, 0)
                
                return (
                  <TableRow key={camp.id}>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1 text-left">
                        <Link
                          href={`/admin/campaigns/${camp.id}`}
                          className="font-headline font-black text-base text-press hover:text-primary transition-colors uppercase tracking-tight"
                        >
                          {camp.name}
                        </Link>
                        <div className="flex gap-2 items-center flex-wrap">
                          <Badge
                            variant={
                              camp.status === "ACTIVE"
                                ? "success"
                                : camp.status === "DRAFT"
                                ? "outline"
                                : "secondary"
                            }
                          >
                            {camp.status}
                          </Badge>
                          <span className="text-[10px] font-mono text-warm font-semibold">
                            slug: {camp.slug}
                          </span>
                          {camp.status === "ACTIVE" && (
                            <>
                              <span className="text-border text-[10px]">|</span>
                              <Link
                                href={`/campaigns/${camp.state.toLowerCase()}/${camp.city.toLowerCase()}/${camp.slug.toLowerCase()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-headline font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-0.5 uppercase tracking-wider"
                              >
                                Live Page ↗
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-warm font-semibold text-xs uppercase">
                      {camp.city.charAt(0).toUpperCase() + camp.city.slice(1)}, {camp.state.toUpperCase()}
                    </TableCell>
                    <TableCell className="px-6 py-4 font-mono text-xs text-press font-bold">
                      {new Intl.NumberFormat().format(camp.mailingQuantity)}
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="space-y-1 text-left">
                        <div className="text-press font-bold text-xs font-mono">
                          {spotsSold} / {spotsCount} spots
                        </div>
                        {/* Mini Progress */}
                        <div className="w-24 bg-[#E7E0D8]/45 h-1.5 rounded-none border border-press overflow-hidden">
                          <div
                            style={{
                              width: `${spotsCount > 0 ? (spotsSold / spotsCount) * 100 : 0}%`,
                            }}
                            className="bg-primary h-full"
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 font-bold text-press">
                      {formatPrice(campRevenue)}
                    </TableCell>
                    <TableCell className="px-6 py-4 font-mono text-xs text-warm font-bold">
                      {camp.estimatedMailDate ? formatDate(camp.estimatedMailDate) : "—"}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right space-x-2">
                      {camp.status === "ACTIVE" && (
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250"
                        >
                          <Link
                            href={`/campaigns/${camp.state.toLowerCase()}/${camp.city.toLowerCase()}/${camp.slug.toLowerCase()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Live Page ↗
                          </Link>
                        </Button>
                      )}
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                      >
                        <Link href={`/admin/campaigns/${camp.id}`}>
                          Manage
                        </Link>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                      >
                        <Link href={`/admin/campaigns/${camp.id}/edit`}>
                          Edit
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
