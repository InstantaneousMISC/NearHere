import { db } from "../db"
import { generateSlug } from "./generateSlug"
import { generateQrSlug } from "./generateQrSlug"

async function seedBusinessAndQrs() {
  console.log("🌱 Syncing seeded orders with Business and QR records...")
  
  try {
    const orders = await db.order.findMany({
      where: { status: "PAID" },
      include: { advertiser: true, campaign: true, campaignSpot: true },
    })

    for (const order of orders) {
      let business = await db.business.findFirst({
        where: { advertiserId: order.advertiserId },
      })

      if (!business) {
        const slug = await generateSlug(order.advertiser.businessName, db)
        const crypto = require("crypto")
        const claimToken = crypto.randomBytes(16).toString("hex")
        const claimTokenExpiresAt = new Date()
        claimTokenExpiresAt.setDate(claimTokenExpiresAt.getDate() + 14)

        business = await db.business.create({
          data: {
            advertiserId: order.advertiserId,
            name: order.advertiser.businessName,
            slug,
            phone: order.advertiser.phone,
            email: order.advertiser.email,
            website: order.advertiser.website,
            address: order.advertiser.businessAddress,
            status: "ACTIVE",
            claimToken,
            claimTokenExpiresAt,
          },
        })
        console.log(`  ✅ Created Business profile: ${business.name} (${business.slug})`)
      } else if (!business.ownerUserId && !business.claimToken) {
        const crypto = require("crypto")
        const claimToken = crypto.randomBytes(16).toString("hex")
        const claimTokenExpiresAt = new Date()
        claimTokenExpiresAt.setDate(claimTokenExpiresAt.getDate() + 14)

        business = await db.business.update({
          where: { id: business.id },
          data: {
            claimToken,
            claimTokenExpiresAt,
          }
        })
      }

      // Check for creative submissions to copy over
      const creative = await db.creativeSubmission.findUnique({
        where: { orderId: order.id },
      })

      if (creative && business) {
        business = await db.business.update({
          where: { id: business.id },
          data: {
            logoUrl: creative.logoUrl || business.logoUrl,
            description: creative.description || business.description,
            phone: creative.phone || business.phone,
            website: creative.website || business.website,
            address: creative.address || business.address,
          },
        })
        console.log(`  ✅ Synced creative submission details for ${business.name}`)
      }

      const existingQr = await db.qrCode.findFirst({
        where: { orderId: order.id },
      })

      if (!existingQr) {
        const qrSlug = await generateQrSlug(db)
        let expiresAt: Date | null = null
        if (order.campaign.estimatedMailDate) {
          expiresAt = new Date(order.campaign.estimatedMailDate)
          expiresAt.setDate(expiresAt.getDate() + 90)
        }

        const qr = await db.qrCode.create({
          data: {
            businessId: business.id,
            campaignId: order.campaignId,
            campaignSpotId: order.campaignSpotId,
            orderId: order.id,
            slug: qrSlug,
            type: "CAMPAIGN_SLOT",
            status: "ACTIVE",
            destinationPath: `/b/${business.slug}`,
            expiresAt,
          },
        })
        console.log(`  ✅ Created QR Code: ${qr.slug} -> ${qr.destinationPath}`)
      }
    }
    console.log("🎉 Seeding Business and QR profiles completed successfully!")
  } catch (error) {
    console.error("❌ Seeding Business/QR failed:", error)
  }
}

seedBusinessAndQrs()
