import assert from "assert"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { CampaignStatus, OrderStatus, SpotStatus, ApprovalStatus, SpotType, PostcardSide, QrCodeType, QrCodeStatus } from "@prisma/client"
import { GET as qrRedirectGet } from "../../app/q/[slug]/route"
import { GET as clickTrackerGet } from "../../app/api/business-click/route"
import { NextRequest } from "next/server"

console.log("🧪 Running DashFlow integration test (Dashboard to checkout)...")

async function runDashFlowTest() {
  const timestamp = Date.now()
  const testId = `dashflow-${timestamp}`
  console.log(`\n--- DashFlow Test Context ID: ${testId} ---`)

  const createCaller = createCallerFactory(appRouter)

  // Seed references for cleanup
  let adminSupabaseId = `admin-sb-${testId}`
  let merchantSupabaseId = `merchant-sb-${testId}`
  let adminEmail = `admin-${testId}@localspotmailers.com`
  let merchantEmail = `merchant-${testId}@test.com`

  let campaignId = ""
  let categoryId = ""
  let spotId = ""
  let orderId = ""
  let businessId = ""
  let qrCodeId = ""

  try {
    // -------------------------------------------------------------
    // 1. SETUP ADMIN USER
    // -------------------------------------------------------------
    console.log("⏳ Setting up admin session...")
    await db.adminUser.create({
      data: {
        supabaseUserId: adminSupabaseId,
        email: adminEmail,
      }
    })

    const adminCaller = createCaller({
      db,
      user: { id: adminSupabaseId, email: adminEmail } as any,
      supabase: {} as any,
    })

    // -------------------------------------------------------------
    // 2. CREATE CAMPAIGN VIA ADMIN ROUTE (Simulating Dashboard)
    // -------------------------------------------------------------
    console.log("🚀 Step 1: Admin creates campaign via dashboard route...")
    const campaign = await adminCaller.campaign.create({
      name: `Dashboard Campaign ${testId}`,
      slug: `dash-camp-${testId}`,
      city: "converse",
      state: "tx",
      zipCode: "78109",
      mailingQuantity: 8000,
      cardSize: "9x12",
      cardSkin: "cream",
    })
    campaignId = campaign.id
    assert.strictEqual(campaign.status, CampaignStatus.DRAFT, "Campaign should start as DRAFT.")
    console.log("   ✅ Campaign created successfully in DRAFT.")

    // -------------------------------------------------------------
    // 3. CREATE SPOTS VIA ADMIN ROUTE (Simulating Dashboard Spot Editor)
    // -------------------------------------------------------------
    console.log("🚀 Step 2: Admin creates ad spot via dashboard editor...")
    const category = await db.businessCategory.create({
      data: {
        name: `Dashboard Cat ${testId}`,
        slug: `dash-cat-${testId}`,
        allowsMultipleAdvertisers: false,
      }
    })
    categoryId = category.id

    const spot = await adminCaller.spot.create({
      campaignId: campaign.id,
      categoryId: category.id,
      label: "Premium Spot Front",
      side: PostcardSide.FRONT,
      spotType: SpotType.PREMIUM,
      price: 149000,
      x: 10,
      y: 10,
      width: 40,
      height: 40,
    })
    spotId = spot.id
    assert.strictEqual(spot.status, SpotStatus.OPEN, "New spot should be OPEN.")
    console.log("   ✅ Placement spot configured successfully.")

    // Publish the campaign
    await adminCaller.campaign.updateStatus({
      id: campaign.id,
      status: CampaignStatus.ACTIVE,
    })
    console.log("   ✅ Campaign published to ACTIVE.")

    // -------------------------------------------------------------
    // 4. BUYER RESERVES SPOT & CHECKS OUT
    // -------------------------------------------------------------
    console.log("🚀 Step 3: Visitor searches by ZIP and checks out spot...")
    
    // Lookup by ZIP
    const publicCaller = createCaller({ db, user: null, supabase: {} as any })
    const foundCampaign = await publicCaller.campaign.searchByZip({ zipCode: "78109" })
    assert.ok(foundCampaign, "Visitor should find the active campaign by ZIP.")

    // Checkout / create order
    const checkoutResult = await publicCaller.order.create({
      spotId: spot.id,
      categoryId: category.id,
      sessionId: `session-checkout-${testId}`,
      contactName: "E2E Buyer",
      businessName: `Dashboard Biz ${testId}`,
      email: merchantEmail,
      phone: "555-555-5555",
      website: "dashboardbiz.com",
    })
    orderId = checkoutResult.orderId
    assert.ok(checkoutResult.checkoutUrl, "Should return Stripe checkout URL.")
    console.log("   ✅ Spot held and Stripe checkout session created.")

    // -------------------------------------------------------------
    // 5. SIMULATE STRIPE WEBHOOK PAYMENT RECEIVED
    // -------------------------------------------------------------
    console.log("🚀 Step 4: Simulating payment webhook...")
    
    // Execute transition to PAID (similar to stripe webhook controller)
    await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        }
      }),
      db.campaignSpot.update({
        where: { id: spot.id },
        data: {
          status: SpotStatus.SOLD,
          heldUntil: null,
          heldBySessionId: null,
        }
      })
    ])

    // Auto-setup post-payment entities
    const { ensureBusinessForOrder, ensureQrForOrder, ensureCreativeSubmissionForOrder, ensurePostPaymentEmailsForOrder } = await import("./postPayment")
    const business = await ensureBusinessForOrder(orderId)
    businessId = business.id
    const qrCode = await ensureQrForOrder(orderId)
    qrCodeId = qrCode.id
    await ensureCreativeSubmissionForOrder(orderId)
    await ensurePostPaymentEmailsForOrder(orderId)

    const paidOrder = await db.order.findUnique({ where: { id: orderId } })
    assert.strictEqual(paidOrder?.status, OrderStatus.PAID, "Order status should be PAID.")
    
    const purchasedSpot = await db.campaignSpot.findUnique({ where: { id: spot.id } })
    assert.strictEqual(purchasedSpot?.status, SpotStatus.SOLD, "Spot status should be SOLD.")
    console.log("   ✅ Payment verified. Spot transitioned to SOLD, profile created.")

    // -------------------------------------------------------------
    // 6. BUSINESS OWNER CLAIMS PROFILE
    // -------------------------------------------------------------
    console.log("🚀 Step 5: Merchant claims business profile...")
    const merchantCaller = createCaller({
      db,
      user: { id: merchantSupabaseId, email: merchantEmail } as any,
      supabase: {} as any,
    })

    const claimed = await merchantCaller.business.claimBusiness({ token: business.claimToken! })
    assert.strictEqual(claimed.ownerUserId, merchantSupabaseId, "Merchant should own profile.")
    console.log("   ✅ Profile claimed successfully.")

    // -------------------------------------------------------------
    // 7. BUSINESS OWNER SUBMITS CREATIVE DETAILS (WITH VALIDATION)
    // -------------------------------------------------------------
    console.log("🚀 Step 6: Merchant submits postcard creative copy...")
    
    const creative = await merchantCaller.creative.upsert({
      token: paidOrder!.creativeSubmissionToken,
      businessName: `Dashboard Biz ${testId}`,
      headline: "Best service in town!",
      offerDeal: "$50 off first call",
      description: "Quick plumber services.",
      phone: "555-555-5555",
      website: "https://dashboardbiz.com",
    })
    assert.strictEqual(creative.headline, "Best service in town!")
    console.log("   ✅ Creative uploaded and submitted for review.")

    // -------------------------------------------------------------
    // 8. ADMIN REVIEWS AND APPROVES CREATIVE
    // -------------------------------------------------------------
    console.log("🚀 Step 7: Admin reviews and approves creative...")
    const approved = await adminCaller.creative.updateApproval({
      submissionId: creative.id,
      approvalStatus: ApprovalStatus.APPROVED,
      approvalNotes: "Ad copy layout verified.",
    })
    assert.strictEqual(approved.approvalStatus, ApprovalStatus.APPROVED, "Status should be APPROVED.")
    console.log("   ✅ Creative approved. Print locks engaged.")

    // -------------------------------------------------------------
    // 9. OUTBOUND LOGGING & BOT FILTER CHECK
    // -------------------------------------------------------------
    console.log("🚀 Step 8: Testing QR redirection & crawler filters...")
    
    // A. Crawler Agent (should not log)
    const reqCrawler = new Request(`http://localhost:3000/q/${qrCode.slug}`, {
      headers: { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" }
    }) as any as NextRequest
    const resCrawler = await qrRedirectGet(reqCrawler, { params: Promise.resolve({ slug: qrCode.slug }) })
    assert.strictEqual(resCrawler.status, 307, "Crawler still redirected.")
    
    const crawlerScans = await db.qrScan.count({ where: { qrCodeId: qrCode.id } })
    assert.strictEqual(crawlerScans, 0, "Crawler scan should NOT be recorded.")

    // B. Mobile User Scan (should log)
    const reqMobile = new Request(`http://localhost:3000/q/${qrCode.slug}`, {
      headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)" }
    }) as any as NextRequest
    const resMobile = await qrRedirectGet(reqMobile, { params: Promise.resolve({ slug: qrCode.slug }) })
    assert.strictEqual(resMobile.status, 307)
    
    const mobileScans = await db.qrScan.count({ where: { qrCodeId: qrCode.id } })
    assert.strictEqual(mobileScans, 1, "Mobile scan should be recorded.")

    // C. Click Tracker Bot Check
    const reqClickBot = new Request(`http://localhost:3000/api/business-click?businessId=${business.id}&qr=${qrCode.slug}&type=WEBSITE&target=https://dashboardbiz.com&label=Website`, {
      headers: { "user-agent": "PingdomUptimeMonitor/2.0" }
    }) as any as NextRequest
    const resClickBot = await clickTrackerGet(reqClickBot)
    assert.strictEqual(resClickBot.status, 307)

    const clickCount = await db.businessClickEvent.count({ where: { businessId: business.id } })
    assert.strictEqual(clickCount, 0, "Bot outbound link click should NOT be recorded.")
    console.log("   ✅ Redirect redirection works, and bot filtering excludes bots from logs successfully.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...")
    await db.emailLog.deleteMany({ where: { toEmail: merchantEmail } })
    await db.businessClickEvent.deleteMany({ where: { businessId: business.id } })
    await db.qrScan.deleteMany({ where: { businessId: business.id } })
    await db.qrCode.deleteMany({ where: { businessId: business.id } })
    await db.creativeSubmission.deleteMany({ where: { orderId: orderId } })
    await db.business.delete({ where: { id: business.id } })
    await db.order.delete({ where: { id: orderId } })
    await db.campaignSpot.deleteMany({ where: { campaignId: campaign.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: category.id } })
    await db.advertiser.delete({ where: { email: merchantEmail } })
    await db.adminUser.delete({ where: { supabaseUserId: adminSupabaseId } })
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 DASHFLOW E2E INTEGRATION TEST PASSED SUCCESSFULLY!");

  } catch (err) {
    console.error("\n❌ DashFlow Integration Test failed:")
    console.error(err)

    // Emergency cleanup
    try {
      console.log("🧹 Attempting emergency cleanup...")
      await db.emailLog.deleteMany({ where: { toEmail: merchantEmail } })
      if (businessId) {
        await db.businessClickEvent.deleteMany({ where: { businessId } })
        await db.qrScan.deleteMany({ where: { businessId } })
        await db.qrCode.deleteMany({ where: { businessId } })
        await db.business.deleteMany({ where: { id: businessId } })
      }
      if (orderId) {
        await db.creativeSubmission.deleteMany({ where: { orderId } })
        await db.order.deleteMany({ where: { id: orderId } })
      }
      if (campaignId) {
        await db.campaignSpot.deleteMany({ where: { campaignId } })
        await db.campaign.deleteMany({ where: { id: campaignId } })
      }
      if (categoryId) await db.businessCategory.deleteMany({ where: { id: categoryId } })
      await db.advertiser.deleteMany({ where: { email: merchantEmail } })
      await db.adminUser.deleteMany({ where: { supabaseUserId: adminSupabaseId } })
      console.log("🧹 Emergency cleanup completed.")
    } catch (cleanupErr) {
      console.error("🧹 Emergency cleanup failed:", cleanupErr)
    }

    process.exit(1)
  }
}

runDashFlowTest()
