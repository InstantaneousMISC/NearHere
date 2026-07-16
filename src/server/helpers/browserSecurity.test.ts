import puppeteer from "puppeteer-core"
import assert from "assert"
import { db } from "../db"
import { CampaignStatus, OrderStatus, SpotStatus, SpotType, PostcardSide } from "@prisma/client"

console.log("🧪 Running Malicious Merchant Browser Security Validation with Puppeteer...")

async function runBrowserSecurityTest() {
  const timestamp = Date.now()
  const testId = `browser-sec-${timestamp}`
  console.log(`\n--- Browser Security E2E Context ID: ${testId} ---`)

  // Detect active port
  let port = 3000
  try {
    const res = await fetch("http://localhost:3001/auth/login")
    if (res.ok) {
      port = 3001
    } else {
      port = 3000
    }
  } catch {
    port = 3000
  }
  const appUrl = `http://localhost:${port}`
  console.log(`📡 Connecting to application at: ${appUrl}`)

  // Launch Puppeteer
  console.log("⏳ Launching Google Chrome...")
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  // Seed references for cleanup
  const merchantAEmail = `merchant-a-${timestamp}@test.com`
  const merchantASupabaseId = `user-a-sb-${testId}`
  const merchantBEmail = `merchant-b-${timestamp}@test.com`
  const merchantBSupabaseId = `user-b-sb-${testId}`

  let categoryId = ""
  let campaignAId = "", campaignBId = ""
  let spotAId = "", spotBId = ""
  let advAId = "", advBId = ""
  let ordAId = "", ordBId = ""
  let bizAId = "", bizBId = ""
  let qrAId = "", qrBId = ""

  try {
    // -------------------------------------------------------------
    // SETUP: Seed Merchant A and Merchant B records across two campaigns
    // -------------------------------------------------------------
    console.log("⏳ Seeding Merchant A and Merchant B data...")

    const category = await db.businessCategory.create({
      data: {
        name: `Sec Category ${testId}`,
        slug: `sec-cat-${testId}`,
      }
    })
    categoryId = category.id

    const campaignA = await db.campaign.create({
      data: {
        name: `Sec Campaign A ${testId}`,
        slug: `sec-camp-a-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 5000,
        status: CampaignStatus.ACTIVE,
      }
    })
    campaignAId = campaignA.id

    const campaignB = await db.campaign.create({
      data: {
        name: `Sec Campaign B ${testId}`,
        slug: `sec-camp-b-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 5000,
        status: CampaignStatus.ACTIVE,
      }
    })
    campaignBId = campaignB.id

    // Spot A & B
    const spotA = await db.campaignSpot.create({
      data: {
        campaignId: campaignA.id,
        categoryId: category.id,
        label: "Spot A",
        price: 39000,
        x: 0, y: 0, width: 10, height: 10, side: PostcardSide.FRONT,
      }
    })
    spotAId = spotA.id

    const spotB = await db.campaignSpot.create({
      data: {
        campaignId: campaignB.id,
        categoryId: category.id,
        label: "Spot B",
        price: 39000,
        x: 10, y: 10, width: 10, height: 10, side: PostcardSide.FRONT,
      }
    })
    spotBId = spotB.id

    // Advertisers
    const advA = await db.advertiser.create({
      data: {
        contactName: "Merchant A",
        businessName: `Biz A ${testId}`,
        email: merchantAEmail,
        phone: "555-0001",
      }
    })
    advAId = advA.id

    const advB = await db.advertiser.create({
      data: {
        contactName: "Merchant B",
        businessName: `Biz B ${testId}`,
        email: merchantBEmail,
        phone: "555-0002",
      }
    })
    advBId = advB.id

    // Orders
    const orderA = await db.order.create({
      data: {
        campaignId: campaignA.id,
        campaignSpotId: spotA.id,
        advertiserId: advA.id,
        amount: 39000,
        stripeCheckoutSessionId: `session-a-${testId}`,
        creativeSubmissionToken: `creative-token-a-${testId}`,
        status: OrderStatus.PAID,
      }
    })
    ordAId = orderA.id

    const orderB = await db.order.create({
      data: {
        campaignId: campaignB.id,
        campaignSpotId: spotB.id,
        advertiserId: advB.id,
        amount: 39000,
        stripeCheckoutSessionId: `session-b-${testId}`,
        creativeSubmissionToken: `creative-token-b-${testId}`,
        status: OrderStatus.PAID,
      }
    })
    ordBId = orderB.id

    // Businesses
    const bizA = await db.business.create({
      data: {
        advertiserId: advA.id,
        ownerUserId: merchantASupabaseId,
        name: advA.businessName,
        slug: `biz-a-${testId}`,
        phone: advA.phone,
        email: advA.email,
        status: "ACTIVE",
      }
    })
    bizAId = bizA.id

    const bizB = await db.business.create({
      data: {
        advertiserId: advB.id,
        ownerUserId: merchantBSupabaseId,
        name: advB.businessName,
        slug: `biz-b-${testId}`,
        phone: advB.phone,
        email: advB.email,
        status: "ACTIVE",
      }
    })
    bizBId = bizB.id

    // QR Codes
    const qrA = await db.qrCode.create({
      data: {
        businessId: bizA.id,
        campaignId: campaignA.id,
        campaignSpotId: spotA.id,
        orderId: orderA.id,
        slug: `qr-a-${testId}`,
        type: "CAMPAIGN_SLOT",
        status: "ACTIVE",
        destinationPath: `/b/${bizA.slug}`,
      }
    })
    qrAId = qrA.id

    const qrB = await db.qrCode.create({
      data: {
        businessId: bizB.id,
        campaignId: campaignB.id,
        campaignSpotId: spotB.id,
        orderId: orderB.id,
        slug: `qr-b-${testId}`,
        type: "CAMPAIGN_SLOT",
        status: "ACTIVE",
        destinationPath: `/b/${bizB.slug}`,
      }
    })
    qrBId = qrB.id

    console.log("✅ Seed data populated. Creating browser page...")
    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    // Set cookie for Merchant A (malicious merchant login)
    await page.setCookie({
      name: "mock_user_email",
      value: encodeURIComponent(merchantAEmail),
      domain: "localhost",
      path: "/",
    })
    await page.setCookie({
      name: "mock_user_id",
      value: merchantASupabaseId,
      domain: "localhost",
      path: "/",
    })

    // Navigate to dashboard first to initialize session
    await page.goto(`${appUrl}/business/dashboard`, { waitUntil: "networkidle2" })

    // -------------------------------------------------------------
    // SECURITY ATTACK SCENARIOS
    // -------------------------------------------------------------
    console.log("\n🚀 Executing client-side security attack validations...")

    // Scenario 1: Merchant A attempts to fetch Merchant B's QR stats
    console.log("   👉 Attack 1: Requesting Merchant B's QR stats via getCampaignPlacementTimeSeries...")
    const resultQrStats = await page.evaluate(async (qrCodeId) => {
      const res = await fetch(`/api/trpc/business.getCampaignPlacementTimeSeries?input=${encodeURIComponent(JSON.stringify({ json: { qrCodeId } }))}`)
      return { status: res.status, json: await res.json() }
    }, qrB.id)

    console.log("   [DEBUG] Attack 1 response:", JSON.stringify(resultQrStats))
    assert.ok(resultQrStats.status === 200 || resultQrStats.status === 400 || resultQrStats.status === 403, "tRPC returns error status")
    const hasForbiddenError1 = JSON.stringify(resultQrStats.json).includes("FORBIDDEN") || JSON.stringify(resultQrStats.json).includes("UNAUTHORIZED") || resultQrStats.status === 403
    assert.ok(hasForbiddenError1, "Should return FORBIDDEN or UNAUTHORIZED error for accessing other business QR Code.")
    console.log("   ✅ Attack 1 blocked successfully: Merchant A cannot query Merchant B's stats.")

    // Scenario 2: Merchant A attempts to fetch Merchant B's campaign stats (Campaign B)
    console.log("   👉 Attack 2: Requesting Merchant B's campaign stats...")
    const resultCampStats = await page.evaluate(async (campaignId) => {
      const res = await fetch(`/api/trpc/business.getCampaignPlacementTimeSeries?input=${encodeURIComponent(JSON.stringify({ json: { campaignId } }))}`)
      return { status: res.status, json: await res.json() }
    }, campaignB.id)

    console.log("   [DEBUG] Attack 2 response:", JSON.stringify(resultCampStats))
    assert.ok(resultCampStats.status === 200 || resultCampStats.status === 400 || resultCampStats.status === 403, "tRPC returns error status")
    const hasForbiddenError2 = JSON.stringify(resultCampStats.json).includes("FORBIDDEN") || JSON.stringify(resultCampStats.json).includes("UNAUTHORIZED") || resultCampStats.status === 403
    assert.ok(hasForbiddenError2, "Should return FORBIDDEN or UNAUTHORIZED error for accessing other business campaign.")
    console.log("   ✅ Attack 2 blocked successfully: Merchant A cannot query Merchant B's campaign stats.")

    // Scenario 3: Merchant A attempts to query Merchant B's invoice and parse tokens
    console.log("   👉 Attack 3: Querying Merchant B's invoice...")
    const resultInvoice = await page.evaluate(async (invoiceId) => {
      const res = await fetch(`/api/trpc/order.getInvoice?input=${encodeURIComponent(JSON.stringify({ json: { id: invoiceId } }))}`)
      return { status: res.status, json: await res.json() }
    }, orderB.id)

    console.log("   [DEBUG] Attack 3 response:", JSON.stringify(resultInvoice))
    const invoiceData = resultInvoice.json?.result?.data?.json
    assert.ok(invoiceData, "Should return invoice details (as it is public).")
    assert.strictEqual(invoiceData.creativeSubmissionToken, undefined, "leak: creativeSubmissionToken")
    assert.strictEqual(invoiceData.stripeCheckoutSessionId, undefined, "leak: stripeCheckoutSessionId")
    console.log("   ✅ Attack 3 blocked successfully: Merchant B's sensitive tokens are completely hidden.")

    // Cleanup cookies
    await page.deleteCookie({ name: "mock_user_email", domain: "localhost" })
    await page.deleteCookie({ name: "mock_user_id", domain: "localhost" })

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...")
    await db.qrCode.deleteMany({ where: { id: { in: [qrAId, qrBId] } } })
    await db.business.deleteMany({ where: { id: { in: [bizAId, bizBId] } } })
    await db.order.deleteMany({ where: { id: { in: [ordAId, ordBId] } } })
    await db.campaignSpot.deleteMany({ where: { id: { in: [spotAId, spotBId] } } })
    await db.campaign.deleteMany({ where: { id: { in: [campaignAId, campaignBId] } } })
    await db.businessCategory.delete({ where: { id: categoryId } })
    await db.advertiser.deleteMany({ where: { id: { in: [advAId, advBId] } } })

    console.log("✅ Cleanup finished cleanly.")
    console.log("\n🎉 ALL E2E BROWSER SECURITY TESTS PASSED SUCCESSFULLY!");
    process.exit(0)

  } catch (err) {
    console.error("\n❌ Browser Security E2E Test failed:")
    console.error(err)

    // Emergency cleanup
    try {
      console.log("🧹 Attempting emergency cleanup...")
      await db.qrCode.deleteMany({ where: { slug: { contains: testId } } })
      await db.business.deleteMany({ where: { name: { contains: testId } } })
      await db.order.deleteMany({ where: { stripeCheckoutSessionId: { contains: testId } } })
      await db.campaignSpot.deleteMany({ where: { label: { in: ["Spot A", "Spot B"] } } })
      await db.campaign.deleteMany({ where: { name: { contains: testId } } })
      await db.businessCategory.deleteMany({ where: { name: { contains: testId } } })
      await db.advertiser.deleteMany({ where: { businessName: { contains: testId } } })
      console.log("🧹 Emergency cleanup completed.")
    } catch (cleanupErr) {
      console.error("🧹 Emergency cleanup failed:", cleanupErr)
    }

    process.exit(1)
  } finally {
    await browser.close()
  }
}

runBrowserSecurityTest()
