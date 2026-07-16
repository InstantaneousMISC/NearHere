import assert from "node:assert/strict"
import { db } from "../db"
import { OrderStatus, SpotStatus, QrCodeStatus } from "@prisma/client"
import {
  getQrCodeStats,
  getBusinessCampaignStats,
  getBusinessDashboardCampaigns,
  getAdminCampaignPlacementStats,
  getStatsTimeSeries,
} from "./stats"

async function runStatsIntegrationTests() {
  console.log("\n🧪 Running Stats Helper Integration Tests...")
  const timestamp = Date.now()
  const testId = `stats-test-${timestamp}`
  const userEmail = `merchant-stats-${timestamp}@test.com`
  const userId = `user-stats-${timestamp}`

  let categoryId = ""
  let campaignId = ""
  let spotId = ""
  let advertiserId = ""
  let orderId = ""
  let businessId = ""
  let qrCodeId = ""

  try {
    // 1. Seed database records
    const category = await db.businessCategory.create({
      data: {
        name: `Stats Cat ${testId}`,
        slug: `stats-cat-${testId}`,
      },
    })
    categoryId = category.id

    const campaign = await db.campaign.create({
      data: {
        name: `Stats Campaign ${testId}`,
        slug: `stats-camp-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 5000,
        estimatedMailDate: new Date(),
      },
    })
    campaignId = campaign.id

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: category.id,
        label: "Stats Test Spot",
        price: 39000,
        x: 15,
        y: 15,
        width: 15,
        height: 15,
        side: "FRONT",
        status: SpotStatus.SOLD,
      },
    })
    spotId = spot.id

    const advertiser = await db.advertiser.create({
      data: {
        contactName: "Stats Tester",
        businessName: `Stats Biz ${testId}`,
        email: userEmail,
        phone: "555-9876",
        website: "https://statstester.com",
      },
    })
    advertiserId = advertiser.id

    const order = await db.order.create({
      data: {
        campaignId: campaign.id,
        campaignSpotId: spot.id,
        advertiserId: advertiser.id,
        amount: 39000,
        creativeSubmissionToken: `creative-stats-${testId}`,
        status: OrderStatus.PAID,
        paidAt: new Date(),
      },
    })
    orderId = order.id

    const business = await db.business.create({
      data: {
        advertiserId: advertiser.id,
        ownerUserId: userId,
        name: advertiser.businessName,
        slug: `stats-biz-${testId}`,
        email: userEmail,
        status: "ACTIVE",
      },
    })
    businessId = business.id

    // Create active QR Code for the placement
    const qrCode = await db.qrCode.create({
      data: {
        businessId: business.id,
        campaignId: campaign.id,
        campaignSpotId: spot.id,
        orderId: order.id,
        slug: `qr-stats-${testId}`,
        type: "BUSINESS_PROFILE",
        status: QrCodeStatus.ACTIVE,
        destinationPath: `/business/${business.slug}`,
      },
    })
    qrCodeId = qrCode.id

    // Seed analytics events
    // Today
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    // QrScans
    await db.qrScan.createMany({
      data: [
        { qrCodeId, businessId: business.id, campaignId, campaignSpotId: spot.id, scannedAt: yesterday, userAgent: "Mozilla" },
        { qrCodeId, businessId: business.id, campaignId, campaignSpotId: spot.id, scannedAt: today, userAgent: "Mozilla" },
      ],
    })

    // BusinessPageViews
    await db.businessPageView.createMany({
      data: [
        { businessId: business.id, qrCodeId, viewedAt: yesterday, userAgent: "Mozilla" },
        { businessId: business.id, qrCodeId, viewedAt: today, userAgent: "Mozilla" },
        { businessId: business.id, qrCodeId, viewedAt: today, userAgent: "Mozilla" },
      ],
    })

    // BusinessClickEvents
    await db.businessClickEvent.createMany({
      data: [
        // Call clicks
        { businessId: business.id, qrCodeId, linkType: "PHONE", targetUrl: "tel:+15559876", clickedAt: yesterday },
        // Website clicks
        { businessId: business.id, qrCodeId, linkType: "WEBSITE", targetUrl: "https://statstester.com", clickedAt: today },
        { businessId: business.id, qrCodeId, linkType: "CUSTOM", targetUrl: "https://statstester.com/blog", clickedAt: today },
        // CTA clicks
        { businessId: business.id, qrCodeId, linkType: "BOOKING", targetUrl: "https://statstester.com/book", clickedAt: today },
        { businessId: business.id, qrCodeId, linkType: "MENU", targetUrl: "https://statstester.com/menu", clickedAt: today },
      ],
    })

    // 2. Validate getQrCodeStats
    console.log("   👉 Verifying getQrCodeStats...")
    const qrStats = await getQrCodeStats(qrCodeId)
    assert.strictEqual(qrStats.scansCount, 2, "Should have 2 scans")
    assert.strictEqual(qrStats.pageViewsCount, 3, "Should have 3 page views")
    assert.strictEqual(qrStats.outboundClicksCount, 2, "Should have 2 outbound clicks (WEBSITE + CUSTOM)")
    assert.strictEqual(qrStats.callClicksCount, 1, "Should have 1 call click (PHONE)")
    assert.strictEqual(qrStats.ctaClicksCount, 2, "Should have 2 cta clicks (BOOKING + MENU)")
    assert.ok(qrStats.lastScanDate instanceof Date, "Last scan date should be a Date object")

    // 3. Validate getBusinessCampaignStats
    console.log("   👉 Verifying getBusinessCampaignStats...")
    const bizCampStats = await getBusinessCampaignStats(business.id, campaign.id)
    assert.strictEqual(bizCampStats.qrCodeSlug, qrCode.slug, "Should resolve correct QR code slug")
    assert.strictEqual(bizCampStats.scansCount, 2)
    assert.strictEqual(bizCampStats.pageViewsCount, 3)
    assert.strictEqual(bizCampStats.outboundClicksCount, 2)
    assert.strictEqual(bizCampStats.callClicksCount, 1)
    assert.strictEqual(bizCampStats.ctaClicksCount, 2)

    // 4. Validate getBusinessDashboardCampaigns
    console.log("   👉 Verifying getBusinessDashboardCampaigns...")
    const dashboardCampaigns = await getBusinessDashboardCampaigns(userId)
    assert.strictEqual(dashboardCampaigns.length, 1, "Should return 1 placement for user")
    const placement = dashboardCampaigns[0]
    assert.strictEqual(placement.orderId, order.id)
    assert.strictEqual(placement.campaign.id, campaign.id)
    assert.strictEqual(placement.stats.scansCount, 2)
    assert.strictEqual(placement.stats.pageViewsCount, 3)

    // 5. Validate getAdminCampaignPlacementStats
    console.log("   👉 Verifying getAdminCampaignPlacementStats...")
    const adminPlacements = await getAdminCampaignPlacementStats(campaign.id)
    assert.strictEqual(adminPlacements.length, 1, "Should return 1 spot placement in campaign")
    const adminSpot = adminPlacements[0]
    assert.strictEqual(adminSpot.spotId, spot.id)
    assert.strictEqual(adminSpot.businessName, advertiser.businessName)
    assert.strictEqual(adminSpot.stats.scansCount, 2)

    // 6. Validate getStatsTimeSeries
    console.log("   👉 Verifying getStatsTimeSeries...")
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 3)
    const endDate = new Date()

    const timeSeries = await getStatsTimeSeries({
      businessId: business.id,
      campaignId: campaign.id,
      startDate,
      endDate,
    })

    // There should be 4 dates in the range (startDate to endDate inclusive)
    assert.strictEqual(timeSeries.length, 4, "Should return 4 days of time-series data")

    // Find yesterday and today's items using local timezone formatting helper
    const formatDateLocal = (d: Date) => {
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      return `${yyyy}-${mm}-${dd}`
    }
    const yesterdayStr = formatDateLocal(yesterday)
    const todayStr = formatDateLocal(today)

    const yesterdayData = timeSeries.find((d) => d.date === yesterdayStr)
    const todayData = timeSeries.find((d) => d.date === todayStr)

    assert.ok(yesterdayData, `Yesterday data (${yesterdayStr}) must exist in time series`)
    assert.ok(todayData, `Today data (${todayStr}) must exist in time series`)

    assert.strictEqual(yesterdayData.scans, 1, "Yesterday should have 1 scan")
    assert.strictEqual(yesterdayData.views, 1, "Yesterday should have 1 page view")
    assert.strictEqual(yesterdayData.calls, 1, "Yesterday should have 1 call click")
    assert.strictEqual(yesterdayData.clicks, 0, "Yesterday should have 0 website clicks")

    assert.strictEqual(todayData.scans, 1, "Today should have 1 scan")
    assert.strictEqual(todayData.views, 2, "Today should have 2 page views")
    assert.strictEqual(todayData.clicks, 2, "Today should have 2 website clicks")
    assert.strictEqual(todayData.ctas, 2, "Today should have 2 cta clicks")

    console.log("   ✅ Stats Helper Integration Tests passed successfully!")
  } finally {
    // Cleanup records
    console.log("🧹 Cleaning up stats test database records...")
    if (qrCodeId) {
      await db.qrScan.deleteMany({ where: { qrCodeId } })
      await db.businessPageView.deleteMany({ where: { qrCodeId } })
      await db.businessClickEvent.deleteMany({ where: { qrCodeId } })
      await db.qrCode.delete({ where: { id: qrCodeId } })
    }
    if (businessId) await db.business.delete({ where: { id: businessId } })
    if (orderId) await db.order.delete({ where: { id: orderId } })
    if (spotId) await db.campaignSpot.delete({ where: { id: spotId } })
    if (campaignId) await db.campaign.delete({ where: { id: campaignId } })
    if (categoryId) await db.businessCategory.delete({ where: { id: categoryId } })
    if (advertiserId) await db.advertiser.delete({ where: { id: advertiserId } })
    console.log("✅ Cleanup finished cleanly.")
  }
}

runStatsIntegrationTests().catch((err) => {
  console.error("❌ Stats Helper Integration Tests failed:", err)
  process.exit(1)
})
