import { db } from "../server/db"

async function cleanupStaleCampaigns() {
  console.log("🧹 Fetching all campaigns to inspect...")
  const campaigns = await db.campaign.findMany({
    include: {
      spots: {
        select: { id: true }
      },
      offers: {
        select: { id: true }
      },
      orders: {
        select: { id: true, advertiserId: true }
      }
    }
  })

  // Filter out campaigns that are test campaigns
  const testCampaigns = campaigns.filter(c => {
    const name = c.name.toLowerCase()
    return name.includes("browser-") || name.includes("e2e campaign") || name.includes("ftb campaign") || name.includes("ftb-test-")
  })

  console.log(`Found ${testCampaigns.length} stale/test campaigns to clean up.`)
  if (testCampaigns.length === 0) {
    console.log("No stale campaigns found.")
    return
  }

  for (const campaign of testCampaigns) {
    console.log(`\nDeleting Campaign: "${campaign.name}" (ID: ${campaign.id})...`)
    const campaignId = campaign.id

    await db.$transaction(async (tx) => {
      // 1. Delete CampaignOfferEvents and CampaignOffers
      const offerIds = campaign.offers.map(o => o.id)
      if (offerIds.length > 0) {
        await tx.campaignOfferEvent.deleteMany({
          where: { campaignOfferId: { in: offerIds } }
        })
        await tx.campaignOffer.deleteMany({
          where: { id: { in: offerIds } }
        })
      }

      // 2. Delete QrCodes, QrScans, CreativeSubmissions, Orders associated with this campaign
      const orderIds = campaign.orders.map(o => o.id)
      const spotIds = campaign.spots.map(s => s.id)

      if (orderIds.length > 0) {
        await tx.qrCode.deleteMany({
          where: { orderId: { in: orderIds } }
        })
        await tx.creativeSubmission.deleteMany({
          where: { orderId: { in: orderIds } }
        })
        await tx.order.deleteMany({
          where: { id: { in: orderIds } }
        })
      }

      // 3. Delete any general campaign QrCodes or spots QrCodes
      if (spotIds.length > 0) {
        await tx.qrCode.deleteMany({
          where: { campaignSpotId: { in: spotIds } }
        })
      }
      await tx.qrCode.deleteMany({
        where: { campaignId }
      })

      // 4. Delete Spots
      if (spotIds.length > 0) {
        await tx.campaignSpot.deleteMany({
          where: { id: { in: spotIds } }
        })
      }

      // 5. Delete Campaign
      await tx.campaign.delete({
        where: { id: campaignId }
      })
    })

    console.log(`   ✅ Campaign "${campaign.name}" successfully deleted.`)
  }

  console.log("\n🎉 Stale campaigns cleanup completed successfully!")
}

cleanupStaleCampaigns()
  .catch(err => {
    console.error("❌ Cleanup failed:", err)
    process.exit(1)
  })
