import assert from "assert"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { OrderStatus, CampaignStatus, ApprovalStatus } from "@prisma/client"

console.log("🧪 Running Profile/Creative Safeguards validation tests...")

async function runSafeguardsTests() {
  const timestamp = Date.now()
  const testId = `safeguards-test-${timestamp}`
  console.log(`\n--- Safeguards Test Context ID: ${testId} ---`)

  const createCaller = createCallerFactory(appRouter)

  // References for cleanup
  let categoryId = ""
  let campaignId = ""
  let spotId = ""
  let advertiserId = ""
  let orderId = ""
  let businessId = ""
  const originalResendApiKey = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY

  try {
    // -------------------------------------------------------------
    // SETUP: Seed test campaign, spot, advertiser, order, and business
    // -------------------------------------------------------------
    console.log("⏳ Setting up database mock records...")

    const category = await db.businessCategory.create({
      data: {
        name: `Safeguards Cat ${testId}`,
        slug: `safeguards-cat-${testId}`,
      }
    })
    categoryId = category.id

    const campaign = await db.campaign.create({
      data: {
        name: `Safeguards Camp ${testId}`,
        slug: `safeguards-camp-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 10000,
        status: CampaignStatus.PRINTING, // Lock condition!
      }
    })
    campaignId = campaign.id

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: category.id,
        label: "Safeguards Spot",
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
        contactName: "Safeguards Buyer",
        businessName: `Safeguards Biz ${testId}`,
        email: `safeguards-${timestamp}@test.com`,
        phone: "555-9999",
        website: "https://safeguards-test.com",
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
        status: OrderStatus.PAID,
      }
    })
    orderId = order.id

    const business = await db.business.create({
      data: {
        advertiserId: advertiser.id,
        ownerUserId: `user-${testId}`, // authed user ID
        name: advertiser.businessName,
        slug: `safeguards-biz-${testId}`,
        phone: advertiser.phone,
        email: advertiser.email,
        website: advertiser.website,
        status: "ACTIVE",
      }
    })
    businessId = business.id

    // Instantiate caller for authenticated user
    const caller = createCaller({
      db,
      user: {
        id: `user-${testId}`,
        email: advertiser.email,
      } as any,
      supabase: {} as any,
    })

    // -------------------------------------------------------------
    // TEST 1: Block print-sensitive fields in Business Profile
    // -------------------------------------------------------------
    console.log("\n🚀 Test 1: Verifying Business Profile print lock block...")
    
    // Attempting to change print-sensitive fields should throw FORBIDDEN
    try {
      await caller.business.updateProfile({
        name: "New Business Name",
        phone: "555-9999",
      })
      assert.fail("Should have thrown FORBIDDEN error for modifying print-sensitive fields")
    } catch (err: any) {
      assert.strictEqual(err.code, "FORBIDDEN", "Error code should be FORBIDDEN")
      assert.ok(err.message.includes("blocked") || err.message.includes("locked") || err.message.includes("profile"), "Error message should mention block/lock")
      console.log("   ✅ Correctly blocked changing Business Name/Phone.")
    }

    // Attempting to change digital-only fields should succeed
    console.log("🚀 Test 2: Verifying Business Profile digital-only fields remain editable...")
    const updatedBiz = await caller.business.updateProfile({
      name: advertiser.businessName, // unchanged
      description: "This is a digital description",
      coverImageUrl: "https://safeguards-test.com/cover.jpg",
      address: "123 Commerce St",
      city: "Converse",
      state: "TX",
      zipCode: "78109",
    })
    assert.strictEqual(updatedBiz.description, "This is a digital description")
    assert.strictEqual(updatedBiz.coverImageUrl, "https://safeguards-test.com/cover.jpg")
    console.log("   ✅ Correctly updated digital-only fields without throwing.")

    // -------------------------------------------------------------
    // TEST 3: Block print-sensitive fields in Creative Submission
    // -------------------------------------------------------------
    console.log("\n🚀 Test 3: Verifying Creative Submission print lock block...")

    // Seed initial creative submission in PENDING status
    const creative = await db.creativeSubmission.create({
      data: {
        orderId: order.id,
        businessName: business.name,
        approvalStatus: ApprovalStatus.APPROVED, // Lock condition!
      }
    })

    // Attempting to change print-sensitive fields should throw FORBIDDEN
    try {
      await caller.creative.upsert({
        token: order.creativeSubmissionToken,
        businessName: "Different Display Name",
      })
      assert.fail("Should have thrown FORBIDDEN error for modifying print-sensitive fields")
    } catch (err: any) {
      assert.strictEqual(err.code, "FORBIDDEN", "Error code should be FORBIDDEN")
      console.log("   ✅ Correctly blocked changing Display Name in Creative.")
    }

    // Attempting to change digital-only fields should succeed
    console.log("🚀 Test 4: Verifying Creative Submission digital-only fields remain editable...")
    const updatedCreative = await caller.creative.upsert({
      token: order.creativeSubmissionToken,
      businessName: business.name, // unchanged
      additionalImages: ["https://safeguards-test.com/showcase.jpg"],
      notes: "Please match hex colors.",
    })
    assert.ok(JSON.parse(updatedCreative.additionalImages as string).includes("https://safeguards-test.com/showcase.jpg"))
    assert.strictEqual(updatedCreative.notes, "Please match hex colors.")
    // Verify approvalStatus is NOT reset to PENDING
    assert.strictEqual(updatedCreative.approvalStatus, ApprovalStatus.APPROVED, "approvalStatus must remain APPROVED")
    console.log("   ✅ Correctly updated digital-only fields without resetting approvalStatus.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up database mock records...")
    await db.emailLog.deleteMany({ where: { toEmail: advertiser.email } })
    await db.creativeSubmission.deleteMany({ where: { orderId: order.id } })
    await db.business.delete({ where: { id: business.id } })
    await db.order.delete({ where: { id: order.id } })
    await db.campaignSpot.delete({ where: { id: spot.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: category.id } })
    await db.advertiser.delete({ where: { id: advertiser.id } })
    process.env.RESEND_API_KEY = originalResendApiKey
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 ALL PROFILE/CREATIVE SAFEGUARDS VALIDATION TESTS PASSED SUCCESSFULLY!");

  } catch (err) {
    process.env.RESEND_API_KEY = originalResendApiKey
    console.error("\n❌ Safeguards Validation Test failed:")
    console.error(err)

    // Emergency cleanup
    try {
      console.log("🧹 Attempting emergency cleanup...")
      await db.emailLog.deleteMany({
        where: { toEmail: `safeguards-${timestamp}@test.com` },
      })
      await db.creativeSubmission.deleteMany({ where: { orderId: { in: [orderId] } } })
      await db.business.deleteMany({ where: { name: { contains: testId } } })
      await db.order.deleteMany({ where: { stripeCheckoutSessionId: `session-${testId}` } })
      await db.campaignSpot.deleteMany({ where: { label: "Safeguards Spot" } })
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

runSafeguardsTests()
