import assert from "assert"
import crypto from "crypto"
import { db } from "../db"
import { isCampaignOfferRedeemable, calculateOfferDiscount, calculateOfferPrice } from "./campaignOffers"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { releaseExpiredHolds } from "./releaseExpiredHolds"
import { POST as webhookPost } from "../../app/api/stripe/webhook/route"
import {
  CampaignOfferDiscountType,
  CampaignOfferStatus,
  CampaignOfferEventType,
  OrderStatus,
  SpotStatus,
} from "@prisma/client"

console.log("🧪 Running Campaign Offers Unit and Integration Tests...")

async function runCampaignOfferTests() {
  const timestamp = Date.now()
  const testId = `offer-test-${timestamp}`
  console.log(`\n--- Campaign Offer Test Context ID: ${testId} ---`)

  const createCaller = createCallerFactory(appRouter)

  // Seeded records tracking for cleanup
  let categoryId = ""
  let campaignId = ""
  let spotId = ""
  let adminUserId = ""
  let offerId = ""
  let advertiserId = ""
  let orderId = ""

  try {
    // -------------------------------------------------------------
    // 1. UNIT TESTS: Pricing and Expirations
    // -------------------------------------------------------------
    console.log("🚀 Test 1: Pricing and Redeemability Helpers...")

    // Helper mock offer
    const mockActiveOffer: any = {
      status: CampaignOfferStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      maxRedemptions: 10,
      redeemedCount: 2,
      reservedCount: 1,
      discountType: CampaignOfferDiscountType.AMOUNT_OFF,
      discountAmount: 15000, // $150
      discountPercent: null,
    }

    // Redeemability checks
    assert.strictEqual(isCampaignOfferRedeemable(mockActiveOffer), true, "Active, future expiry, below limit should be redeemable")
    
    assert.strictEqual(
      isCampaignOfferRedeemable({ ...mockActiveOffer, status: CampaignOfferStatus.DISABLED }),
      false,
      "Disabled offers should not be redeemable"
    )

    assert.strictEqual(
      isCampaignOfferRedeemable({ ...mockActiveOffer, expiresAt: new Date(Date.now() - 3600000) }),
      false,
      "Expired offers should not be redeemable"
    )

    assert.strictEqual(
      isCampaignOfferRedeemable({ ...mockActiveOffer, maxRedemptions: 3 }),
      false,
      "Offers at max redemptions (redeemed + reserved >= max) should not be redeemable"
    )

    // Pricing checks (AMOUNT_OFF)
    assert.strictEqual(calculateOfferDiscount(50000, mockActiveOffer), 15000, "Should apply full discount when price > discount")
    assert.strictEqual(calculateOfferDiscount(10000, mockActiveOffer), 10000, "Discount should be capped at base price")
    assert.strictEqual(calculateOfferPrice(50000, mockActiveOffer), 35000, "Price should be base minus discount")
    assert.strictEqual(calculateOfferPrice(10000, mockActiveOffer), 0, "Price should never be less than 0")

    // Pricing checks (PERCENT_OFF)
    const mockPercentOffer = {
      ...mockActiveOffer,
      discountType: CampaignOfferDiscountType.PERCENT_OFF,
      discountAmount: null,
      discountPercent: 20, // 20%
    }
    assert.strictEqual(calculateOfferDiscount(50000, mockPercentOffer), 10000, "20% off 50000 is 10000")
    assert.strictEqual(calculateOfferPrice(50000, mockPercentOffer), 40000, "Price should be 40000 cents")

    console.log("   ✅ Unit tests passed.")

    // -------------------------------------------------------------
    // SETUP: DB seeds
    // -------------------------------------------------------------
    console.log("⏳ Setting up database mock records for integration testing...")

    const category = await db.businessCategory.create({
      data: {
        name: `Offer Cat ${testId}`,
        slug: `offer-cat-${testId}`,
      },
    })
    categoryId = category.id

    const campaign = await db.campaign.create({
      data: {
        name: `Offer Camp ${testId}`,
        slug: `offer-camp-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 10000,
        estimatedMailDate: new Date(),
      },
    })
    campaignId = campaign.id

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: category.id,
        label: "Offer Spot Placement",
        price: 49000,
        x: 10,
        y: 10,
        width: 10,
        height: 10,
        side: "FRONT",
      },
    })
    spotId = spot.id

    const adminUser = await db.adminUser.create({
      data: {
        supabaseUserId: `admin-sb-offer-${testId}`,
        email: `admin-offer-${testId}@localspotmailers.com`,
        name: "Sales Rep Jim",
      },
    })
    adminUserId = adminUser.id

    console.log("   ✅ Mock campaign, spot, and admin rep seeded.")

    // -------------------------------------------------------------
    // 2. INTEGRATION TESTS: tRPC Router Operations
    // -------------------------------------------------------------
    console.log("\n🚀 Test 2: Verifying campaignOffer tRPC procedures...")

    const adminCaller = createCaller({
      db,
      user: { id: adminUser.supabaseUserId, email: adminUser.email } as any,
      supabase: {} as any,
    })

    const publicCaller = createCaller({
      db,
      user: null,
      supabase: {} as any,
    })

    // Test 2A: Create offer via adminCaller
    const offer = await adminCaller.campaignOffer.create({
      campaignId: campaign.id,
      name: "D2D Autumn Promo",
      discountType: CampaignOfferDiscountType.PERCENT_OFF,
      discountPercent: 15, // 15% Off
      maxRedemptions: 5,
    })
    offerId = offer.id
    assert.ok(offer.token, "Opaque token should be generated")
    assert.strictEqual(offer.status, CampaignOfferStatus.ACTIVE)
    assert.strictEqual(offer.discountPercent, 15)

    // Test 2B: Retrieve offer publicly by token (safe, masked details)
    const publicOfferDetails = await publicCaller.campaignOffer.getByToken({ token: offer.token })
    assert.strictEqual(publicOfferDetails.name, "D2D Autumn Promo")
    assert.strictEqual(publicOfferDetails.promotedBy, "D2D Autumn Promo / Sales Rep Jim", "Should display offer name / rep name")
    assert.strictEqual(publicOfferDetails.campaign.name, `Offer Camp ${testId}`)
    assert.strictEqual(publicOfferDetails.redeemable, true)

    // Test 2B-fallback: Update admin name to null and retrieve again to check fallback
    await db.adminUser.update({
      where: { id: adminUser.id },
      data: { name: null },
    })
    const publicOfferDetailsFallback = await publicCaller.campaignOffer.getByToken({ token: offer.token })
    assert.strictEqual(publicOfferDetailsFallback.promotedBy, "D2D Autumn Promo / NearHere Representative", "Should display fallback rep name when name is null")

    // Restore admin user name for remaining tests
    await db.adminUser.update({
      where: { id: adminUser.id },
      data: { name: "Sales Rep Jim" },
    })

    // Test 2C: Public recordScan procedure
    const scanResult = await publicCaller.campaignOffer.recordScan({ token: offer.token })
    assert.ok(scanResult.success)
    
    const offerAfterScan = await db.campaignOffer.findUnique({
      where: { id: offer.id },
      include: { events: true },
    })
    assert.strictEqual(offerAfterScan?.scanCount, 1, "scanCount should increment")
    assert.strictEqual(offerAfterScan?.events.length, 1)
    assert.strictEqual(offerAfterScan?.events[0].eventType, CampaignOfferEventType.SCAN)

    // Test 2D: Public recordCheckoutStart procedure
    const startResult = await publicCaller.campaignOffer.recordCheckoutStart({ token: offer.token })
    assert.ok(startResult.success)

    const offerAfterStart = await db.campaignOffer.findUnique({
      where: { id: offer.id },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
    })
    assert.strictEqual(offerAfterStart?.checkoutStartCount, 1, "checkoutStartCount should increment")
    assert.strictEqual(offerAfterStart?.events[0].eventType, CampaignOfferEventType.CHECKOUT_STARTED)

    console.log("   ✅ tRPC campaignOffer procedures validated.")

    // -------------------------------------------------------------
    // 3. INTEGRATION TESTS: Order Checkout & Rollbacks
    // -------------------------------------------------------------
    console.log("\n🚀 Test 3: Verifying Checkout Order with Offer Token...")

    // Seed advertiser details
    const advertiserEmail = `buyer-offer-${timestamp}@test.com`

    // Create Order with Campaign Offer Token
    // We expect this to apply 15% discount on 49000 cents spot price -> 41650 cents final amount
    const orderRes = await publicCaller.order.create({
      spotId: spot.id,
      categoryId: category.id,
      sessionId: `session-offer-test-${testId}`,
      contactName: "Discount Buyer",
      businessName: "Promo Biz",
      email: advertiserEmail,
      phone: "555-9876",
      offerToken: offer.token,
    })

    assert.ok(orderRes.orderId)
    orderId = orderRes.orderId

    // Verify order amounts and audit fields
    const order = await db.order.findUnique({
      where: { id: orderRes.orderId },
      include: { advertiser: true },
    })
    advertiserId = order?.advertiserId || ""

    assert.strictEqual(order?.status, OrderStatus.PENDING)
    assert.strictEqual(order?.amount, 41650, "Order amount should be discounted: 49000 * 0.85 = 41650")
    assert.strictEqual(order?.campaignOfferId, offer.id)
    assert.strictEqual(order?.originalAmount, 49000)
    assert.strictEqual(order?.discountAmount, 7350, "Discount amount is 7350 cents")
    assert.strictEqual(order?.finalAmount, 41650)

    // Verify campaign offer reservation count and logs
    const offerAfterReserve = await db.campaignOffer.findUnique({
      where: { id: offer.id },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
    })
    assert.strictEqual(offerAfterReserve?.reservedCount, 1, "reservedCount should be incremented")
    assert.strictEqual(offerAfterReserve?.events[0].eventType, CampaignOfferEventType.ORDER_CREATED)

    // Test 3B: Expired Holds release decrements reservation
    console.log("   🔄 Simulating hold expiration of campaign spot...")

    // Mock spot and order as expired (update heldUntil to past, spot status HELD)
    await db.campaignSpot.update({
      where: { id: spot.id },
      data: {
        status: SpotStatus.HELD,
        heldUntil: new Date(Date.now() - 60000), // 1 min ago
        heldBySessionId: `session-offer-test-${testId}`,
      },
    })

    // Execute releaseExpiredHolds
    const releasedCount = await releaseExpiredHolds(campaign.id)
    assert.strictEqual(releasedCount, 1, "Should release 1 expired spot")

    // Check Spot status reverted
    const spotAfterRelease = await db.campaignSpot.findUnique({ where: { id: spot.id } })
    assert.strictEqual(spotAfterRelease?.status, SpotStatus.OPEN)
    assert.strictEqual(spotAfterRelease?.heldUntil, null)

    // Check Order status updated to EXPIRED
    const orderAfterRelease = await db.order.findUnique({ where: { id: orderId } })
    assert.strictEqual(orderAfterRelease?.status, OrderStatus.EXPIRED)

    // Check Campaign Offer reservedCount rolled back (decremented) and EXPIRED event logged
    const offerAfterRelease = await db.campaignOffer.findUnique({
      where: { id: offer.id },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
    })
    assert.strictEqual(offerAfterRelease?.reservedCount, 0, "reservedCount should be rolled back to 0")
    assert.strictEqual(offerAfterRelease?.events[0].eventType, CampaignOfferEventType.EXPIRED)

    console.log("   ✅ Expiration releases and reservation rollback work.")

    // -------------------------------------------------------------
    // 4. INTEGRATION TESTS: Stripe Webhook paid transitions
    // -------------------------------------------------------------
    console.log("\n🚀 Test 4: Verifying Stripe Webhook payment attribution success...")

    // Re-create a pending checkout order for this spot with offer
    // Reset spot first
    await db.campaignSpot.update({
      where: { id: spot.id },
      data: { status: SpotStatus.OPEN },
    })

    const webhookOrderRes = await publicCaller.order.create({
      spotId: spot.id,
      categoryId: category.id,
      sessionId: `session-offer-web-${testId}`,
      contactName: "Webhook Buyer",
      businessName: "Web Biz",
      email: advertiserEmail,
      phone: "555-1212",
      offerToken: offer.token,
    })
    // Update orderId to new order
    orderId = webhookOrderRes.orderId

    // Set mock checkout session ID
    await db.order.update({
      where: { id: orderId },
      data: { stripeCheckoutSessionId: `session-web-${testId}` },
    })

    // Verify reservedCount is 1
    const offerBeforeWeb = await db.campaignOffer.findUnique({ where: { id: offer.id } })
    assert.strictEqual(offerBeforeWeb?.reservedCount, 1)
    assert.strictEqual(offerBeforeWeb?.redeemedCount, 0)

    // Send mock Webhook event POST
    const webhookReq = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { client_reference_id: orderId } },
      }),
      headers: { "content-type": "application/json" },
    })

    const webhookRes = await webhookPost(webhookReq)
    assert.strictEqual(webhookRes.status, 200)

    // Check Order is PAID
    const orderAfterWeb = await db.order.findUnique({ where: { id: orderId } })
    assert.strictEqual(orderAfterWeb?.status, OrderStatus.PAID)

    // Check Spot is SOLD
    const spotAfterWeb = await db.campaignSpot.findUnique({ where: { id: spot.id } })
    assert.strictEqual(spotAfterWeb?.status, SpotStatus.SOLD)

    // Check Campaign Offer stats updated: redeemedCount = 1, reservedCount = 0, PAID event logged
    const offerAfterWeb = await db.campaignOffer.findUnique({
      where: { id: offer.id },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
    })
    assert.strictEqual(offerAfterWeb?.redeemedCount, 1, "redeemedCount should increment to 1")
    assert.strictEqual(offerAfterWeb?.reservedCount, 0, "reservedCount should decrement to 0")
    assert.strictEqual(offerAfterWeb?.events[0].eventType, CampaignOfferEventType.PAID)

    console.log("   ✅ Webhook payments update offer attribution correctly.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...")
    await db.campaignOfferEvent.deleteMany({ where: { campaignOfferId: offer.id } })
    await db.campaignOffer.delete({ where: { id: offer.id } })
    
    // Find business created by webhook
    const createdBiz = await db.business.findFirst({ where: { advertiserId } })
    if (createdBiz) {
      await db.qrCode.deleteMany({ where: { businessId: createdBiz.id } })
      await db.business.delete({ where: { id: createdBiz.id } })
    }

    await db.creativeSubmission.deleteMany({ where: { orderId } })
    await db.order.deleteMany({ where: { advertiserId } })
    await db.campaignSpot.delete({ where: { id: spot.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: category.id } })
    await db.advertiser.delete({ where: { id: advertiserId } })
    await db.adminUser.delete({ where: { id: adminUser.id } })
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 ALL CAMPAIGN OFFER TESTS PASSED SUCCESSFULLY!\n")

  } catch (err) {
    console.error("\n❌ Campaign Offer Tests failed:")
    console.error(err)

    // Emergency cleanup
    try {
      console.log("🧹 Attempting emergency cleanup...")
      if (offerId) {
        await db.campaignOfferEvent.deleteMany({ where: { campaignOfferId: offerId } })
        await db.campaignOffer.deleteMany({ where: { id: offerId } })
      }
      if (advertiserId) {
        const createdBiz = await db.business.findFirst({ where: { advertiserId } })
        if (createdBiz) {
          await db.qrCode.deleteMany({ where: { businessId: createdBiz.id } })
          await db.business.deleteMany({ where: { id: createdBiz.id } })
        }
        await db.creativeSubmission.deleteMany({ where: { order: { advertiserId } } })
        await db.order.deleteMany({ where: { advertiserId } })
      }
      if (spotId) await db.campaignSpot.deleteMany({ where: { id: spotId } })
      if (campaignId) await db.campaign.deleteMany({ where: { id: campaignId } })
      if (categoryId) await db.businessCategory.deleteMany({ where: { id: categoryId } })
      if (advertiserId) await db.advertiser.deleteMany({ where: { id: advertiserId } })
      if (adminUserId) await db.adminUser.deleteMany({ where: { id: adminUserId } })
      console.log("🧹 Emergency cleanup completed.")
    } catch (cleanupErr) {
      console.error("🧹 Emergency cleanup failed:", cleanupErr)
    }

    process.exit(1)
  }
}

runCampaignOfferTests()
