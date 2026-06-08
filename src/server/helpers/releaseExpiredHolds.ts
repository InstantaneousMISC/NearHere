import { db } from "@/server/db"

export async function releaseExpiredHolds(campaignId?: string) {
  const now = new Date()
  const where = {
    status: "HELD" as const,
    heldUntil: { lt: now },
    ...(campaignId ? { campaignId } : {}),
  }

  // Find expired held spots
  const expiredSpots = await db.campaignSpot.findMany({ where, select: { id: true } })
  const spotIds = expiredSpots.map(s => s.id)

  if (spotIds.length === 0) return 0

  // Release spots and expire their pending orders in a transaction
  await db.$transaction([
    db.campaignSpot.updateMany({
      where: { id: { in: spotIds } },
      data: { status: "OPEN", heldUntil: null, heldBySessionId: null },
    }),
    db.order.updateMany({
      where: {
        campaignSpotId: { in: spotIds },
        status: "PENDING",
      },
      data: { status: "EXPIRED" },
    }),
  ])

  return spotIds.length
}
