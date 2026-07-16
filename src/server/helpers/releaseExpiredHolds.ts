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
  const expiredSpots = await db.campaignSpot.findMany({
    where,
    select: { id: true, label: true, campaignId: true },
  })
  const spotIds = expiredSpots.map(s => s.id)

  if (spotIds.length === 0) return 0

  const doubleExpiredSpots = expiredSpots.filter(s => s.label.includes("_DOUBLE_"))
  const regularExpiredSpots = expiredSpots.filter(s => !s.label.includes("_DOUBLE_"))

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
    const regularExpiredIds = regularExpiredSpots.map(s => s.id)
    const doubleExpiredIds = doubleExpiredSpots.map(s => s.id)

    if (regularExpiredIds.length > 0) {
      await tx.campaignSpot.updateMany({
        where: { id: { in: regularExpiredIds } },
        data: { status: "OPEN", heldUntil: null, heldBySessionId: null },
      })
    }

    if (doubleExpiredIds.length > 0) {
      await tx.campaignSpot.updateMany({
        where: { id: { in: doubleExpiredIds } },
        data: { status: "UNAVAILABLE", heldUntil: null, heldBySessionId: null },
      })

      for (const spot of doubleExpiredSpots) {
        const match = spot.label.match(/^(FRONT|BACK)_DOUBLE_(\d+)_(\d+)$/)
        if (match) {
          const side = match[1]
          const u1 = match[2]
          const u2 = match[3]
          const label1 = `${side}_${u1}`
          const label2 = `${side}_${u2}`

          await tx.campaignSpot.updateMany({
            where: {
              campaignId: spot.campaignId,
              label: { in: [label1, label2] },
            },
            data: { status: "OPEN", heldUntil: null, heldBySessionId: null },
          })
        }
      }
    }

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
