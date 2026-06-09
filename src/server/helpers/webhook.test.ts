import assert from "assert"
import { db } from "../db"
import { POST as webhookPost } from "../../app/api/stripe/webhook/route"
import { OrderStatus, SpotStatus } from "@prisma/client"

console.log("🧪 Running Stripe Webhook security verification tests...")

async function runWebhookTests() {
  const timestamp = Date.now()
  const testId = `webhook-test-${timestamp}`
  console.log(`\n--- Webhook Test Context ID: ${testId} ---`)

  // Save references for cleanup
  let categoryId = ""
  let campaignId = ""
  let spotId = ""
  let advertiserId = ""
  let orderId = ""
  let businessId = ""

  // Preserve original environment state
  const originalEnv = process.env.NODE_ENV
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET
  const originalResendApiKey = process.env.RESEND_API_KEY
  const mutableEnv = process.env as Record<string, string | undefined>
  delete process.env.RESEND_API_KEY

  try {
    // -------------------------------------------------------------
    // SETUP: Seed test campaign, spot, advertiser, and order
    // -------------------------------------------------------------
    console.log("⏳ Setting up database mock records...")

    const category = await db.businessCategory.create({
      data: {
        name: `Webhook Category ${testId}`,
        slug: `webhook-cat-${testId}`,
      }
    })
    categoryId = category.id

    const campaign = await db.campaign.create({
      data: {
        name: `Webhook Campaign ${testId}`,
        slug: `webhook-camp-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 10000,
        estimatedMailDate: new Date(),
      }
    })
    campaignId = campaign.id

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: category.id,
        label: "Webhook Test Spot",
        price: 39000,
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        side: "FRONT",
      }
    })
    spotId = spot.id

    const advertiser = await db.advertiser.create({
      data: {
        contactName: "Webhook Buyer",
        businessName: `Webhook Biz ${testId}`,
        email: `webhook-${timestamp}@test.com`,
        phone: "555-4321",
        website: "https://webhook-test.com",
      }
    })
    advertiserId = advertiser.id

    const order = await db.order.create({
      data: {
        campaignId: campaign.id,
        campaignSpotId: spot.id,
        advertiserId: advertiser.id,
        amount: 39000,
        stripeCheckoutSessionId: `session-${testId}`,
        creativeSubmissionToken: `creative-${testId}`,
        status: OrderStatus.PENDING,
      }
    })
    orderId = order.id

    console.log("✅ Mock records seeded.")

    // -------------------------------------------------------------
    // SCENARIO 1: STRIPE_WEBHOOK_SECRET is missing in Production
    // -------------------------------------------------------------
    console.log("\n🚀 Scenario 1: Enforcing fail-safe block in production when STRIPE_WEBHOOK_SECRET is missing...")
    
    // Simulate production environment and clear secret
    mutableEnv.NODE_ENV = "production"
    delete process.env.STRIPE_WEBHOOK_SECRET

    const reqProdMissing = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { client_reference_id: order.id } }
      }),
      headers: {
        "content-type": "application/json"
      }
    })

    const resProdMissing = await webhookPost(reqProdMissing)
    assert.strictEqual(resProdMissing.status, 500, "Should return 500 when secret is missing in production.")
    const txtProdMissing = await resProdMissing.text()
    assert.strictEqual(txtProdMissing, "Webhook Secret Missing", "Should return 'Webhook Secret Missing' message.")
    
    // Verify order remains pending
    const orderUnpaid1 = await db.order.findUnique({ where: { id: order.id } })
    assert.strictEqual(orderUnpaid1?.status, OrderStatus.PENDING, "Order must remain PENDING.")
    console.log("   ✅ Fail-safe check blocks unverified production request.")

    // -------------------------------------------------------------
    // SCENARIO 2: Signature verification failures
    // -------------------------------------------------------------
    console.log("\n🚀 Scenario 2: Enforcing signature checking when STRIPE_WEBHOOK_SECRET is configured...")
    
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_testsecret12345"

    const reqBadSig = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { client_reference_id: order.id } }
      }),
      headers: {
        "content-type": "application/json",
        "stripe-signature": "t=123,v1=badsig"
      }
    })

    const resBadSig = await webhookPost(reqBadSig)
    assert.strictEqual(resBadSig.status, 400, "Should fail with 400 Bad Request on invalid signature.")
    const txtBadSig = await resBadSig.text()
    assert.ok(txtBadSig.includes("Webhook Error"), "Response should specify verification failure.")

    // Verify order remains pending
    const orderUnpaid2 = await db.order.findUnique({ where: { id: order.id } })
    assert.strictEqual(orderUnpaid2?.status, OrderStatus.PENDING, "Order must remain PENDING.")
    console.log("   ✅ Webhook correctly rejects invalid signatures.")

    // -------------------------------------------------------------
    // SCENARIO 3: Local development fallback is workable without secret
    // -------------------------------------------------------------
    console.log("\n🚀 Scenario 3: Bypassing signature checking in local development when secret is missing...")
    
    // Simulate development env and clear secret
    mutableEnv.NODE_ENV = "development"
    delete process.env.STRIPE_WEBHOOK_SECRET

    const reqDevPass = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { client_reference_id: order.id } }
      }),
      headers: {
        "content-type": "application/json"
      }
    })

    const resDevPass = await webhookPost(reqDevPass)
    assert.strictEqual(resDevPass.status, 200, "Should return 200 OK in local development.")

    // Verify order is now PAID
    const orderPaid = await db.order.findUnique({ where: { id: order.id } })
    assert.strictEqual(orderPaid?.status, OrderStatus.PAID, "Order status should be updated to PAID.")
    assert.ok(orderPaid?.paidAt, "paidAt timestamp must be set.")

    // Verify spot is marked as SOLD
    const spotSold = await db.campaignSpot.findUnique({ where: { id: spot.id } })
    assert.strictEqual(spotSold?.status, SpotStatus.SOLD, "Campaign spot should be updated to SOLD.")

    // Verify business was created
    const createdBiz = await db.business.findFirst({ where: { advertiserId: advertiser.id } })
    assert.ok(createdBiz, "Business profile should be created.")
    businessId = createdBiz.id

    const initialEmailLogCount = await db.emailLog.count({
      where: {
        OR: [{ entityId: order.id }, { entityId: createdBiz.id }],
      },
    })
    assert.ok(initialEmailLogCount >= 3, "Post-payment emails should be claimed.")

    await db.qrCode.deleteMany({ where: { orderId: order.id } })
    await db.creativeSubmission.deleteMany({ where: { orderId: order.id } })

    const retryRequest = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: { object: { client_reference_id: order.id } },
      }),
      headers: { "content-type": "application/json" },
    })
    const retryResponse = await webhookPost(retryRequest)
    assert.strictEqual(retryResponse.status, 200, "Paid-order retry should succeed.")
    assert.ok(
      await db.qrCode.findUnique({ where: { orderId: order.id } }),
      "Retry should recreate a missing QR code."
    )
    assert.ok(
      await db.creativeSubmission.findUnique({ where: { orderId: order.id } }),
      "Retry should recreate a missing creative submission."
    )
    assert.strictEqual(
      await db.emailLog.count({
        where: {
          OR: [{ entityId: order.id }, { entityId: createdBiz.id }],
        },
      }),
      initialEmailLogCount,
      "Retry must not create duplicate EmailLog claims."
    )

    console.log("   ✅ Local development fallback updates database records successfully.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...")
    await db.emailLog.deleteMany({
      where: { OR: [{ entityId: order.id }, { entityId: businessId }] },
    })
    if (businessId) {
      await db.qrCode.deleteMany({ where: { businessId } })
      await db.business.delete({ where: { id: businessId } })
    }
    await db.order.delete({ where: { id: order.id } })
    await db.campaignSpot.delete({ where: { id: spot.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: category.id } })
    await db.advertiser.delete({ where: { id: advertiser.id } })
    console.log("✅ Cleanup finished cleanly.")

    // Restore environment
    mutableEnv.NODE_ENV = originalEnv
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret
    process.env.RESEND_API_KEY = originalResendApiKey

    console.log("\n🎉 STRIPE WEBHOOK SECURITY TESTS PASSED SUCCESSFULLY!");

  } catch (err) {
    // Restore environment
    mutableEnv.NODE_ENV = originalEnv
    process.env.STRIPE_WEBHOOK_SECRET = originalSecret
    process.env.RESEND_API_KEY = originalResendApiKey

    console.error("\n❌ Webhook Security Test failed:")
    console.error(err)

    // Attempt emergency cleanup
    try {
      console.log("🧹 Attempting emergency cleanup...")
      await db.emailLog.deleteMany({
        where: { OR: [{ entityId: orderId }, { entityId: businessId }] },
      })
      await db.order.deleteMany({ where: { stripeCheckoutSessionId: `session-${testId}` } })
      await db.campaignSpot.deleteMany({ where: { label: "Webhook Test Spot" } })
      await db.campaign.deleteMany({ where: { name: { contains: testId } } })
      await db.businessCategory.deleteMany({ where: { name: { contains: testId } } })
      await db.advertiser.deleteMany({ where: { businessName: { contains: testId } } })
      console.log("🧹 Emergency cleanup completed.")
    } catch (cleanupErr) {
      console.error("🧹 Emergency cleanup failed:", cleanupErr)
    }

    process.exit(1)
  }
}

runWebhookTests()
