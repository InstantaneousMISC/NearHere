import { db } from "@/server/db"
import { CampaignOfferEventType } from "@prisma/client"

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

  // Find all PENDING orders for these spots to see if any have campaign offers
  const ordersToExpire = await db.order.findMany({
    where: {
      campaignSpotId: { in: spotIds },
      status: "PENDING",
    },
    select: {
      id: true,
      campaignOfferId: true,
    },
  })

  // Release spots and expire their pending orders in a transaction, rolling back offer reservations
  await db.$transaction(async (tx) => {
    await tx.campaignSpot.updateMany({
      where: { id: { in: spotIds } },
      data: { status: "OPEN", heldUntil: null, heldBySessionId: null },
    })

    await tx.order.updateMany({
      where: {
        id: { in: ordersToExpire.map(o => o.id) },
      },
      data: { status: "EXPIRED" },
    })

    // Rollback any campaign offer reservations
    for (const order of ordersToExpire) {
      if (order.campaignOfferId) {
        await tx.campaignOffer.update({
          where: { id: order.campaignOfferId },
          data: {
            reservedCount: { decrement: 1 },
          },
        })

        await tx.campaignOfferEvent.create({
          data: {
            campaignOfferId: order.campaignOfferId,
            eventType: CampaignOfferEventType.EXPIRED,
          },
        })
      }
    }
  })

  return spotIds.length
}
