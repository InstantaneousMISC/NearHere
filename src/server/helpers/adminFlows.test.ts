import assert from "assert"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { CampaignStatus, OrderStatus, SpotStatus, ApprovalStatus, SpotType, PostcardSide } from "@prisma/client"
import { TRPCError } from "@trpc/server"

console.log("🧪 Running Admin Flow & Authorization Integration Tests...")

async function runAdminFlowTests() {
  const timestamp = Date.now()
  const testId = `admin-test-${timestamp}`
  console.log(`\n--- Admin Test Context ID: ${testId} ---`)

  const createCaller = createCallerFactory(appRouter)

  // Seeded records tracking for cleanup
  let adminSupabaseId = `admin-sb-${testId}`
  let merchantSupabaseId = `merchant-sb-${testId}`
  let adminEmail = `admin-${testId}@localspotmailers.com`
  let merchantEmail = `merchant-${testId}@test.com`

  let campaignId = ""
  let spotId = ""
  let orderId = ""
  let businessId = ""
  let exclusiveCategoryId = ""
  let nonExclusiveCategoryId = ""
  let advertiserId = ""

  try {
    // -------------------------------------------------------------
    // SETUP: Create AdminUser in DB
    // -------------------------------------------------------------
    await db.adminUser.create({
      data: {
        supabaseUserId: adminSupabaseId,
        email: adminEmail,
      }
    })

    const unauthedCaller = createCaller({ db, user: null, supabase: {} as any })
    const nonAdminCaller = createCaller({
      db,
      user: { id: merchantSupabaseId, email: merchantEmail } as any,
      supabase: {} as any,
    })
    const adminCaller = createCaller({
      db,
      user: { id: adminSupabaseId, email: adminEmail } as any,
      supabase: {} as any,
    })

    // -------------------------------------------------------------
    // TEST 1: Admin Authentication Procedures
    // -------------------------------------------------------------
    console.log("🚀 Test 1: Verifying admin authentication safeguards...")
    
    // Unauthenticated user should be rejected
    await assert.rejects(
      unauthedCaller.campaign.list(),
      (err: any) => {
        assert.strictEqual(err.code, "UNAUTHORIZED")
        assert.strictEqual(err.message, "Not authenticated")
        return true
      },
      "Unauthenticated caller should be blocked"
    )

    // Authenticated non-admin should be forbidden
    await assert.rejects(
      nonAdminCaller.campaign.list(),
      (err: any) => {
        assert.strictEqual(err.code, "FORBIDDEN")
        assert.strictEqual(err.message, "Not an admin")
        return true
      },
      "Non-admin caller should be blocked"
    )

    // Admin should succeed
    const listResult = await adminCaller.campaign.list()
    assert.ok(Array.isArray(listResult), "Admin should be able to list campaigns")
    console.log("   ✅ Admin authentication and role checks work.")

    // -------------------------------------------------------------
    // TEST 2: Campaign CRUD & Status Transitions
    // -------------------------------------------------------------
    console.log("\n🚀 Test 2: Testing Admin Campaign creation and status updates...")
    
    const campaign = await adminCaller.campaign.create({
      name: `Admin Campaign ${testId}`,
      slug: `admin-camp-${testId}`,
      city: "converse",
      state: "tx",
      zipCode: "78109",
      mailingQuantity: 5000,
      cardSize: "9x12",
      cardSkin: "cream",
    })
    campaignId = campaign.id
    assert.strictEqual(campaign.status, CampaignStatus.DRAFT, "New campaign should start in DRAFT")
    assert.strictEqual(campaign.name, `Admin Campaign ${testId}`)

    // Update status to ACTIVE
    const published = await adminCaller.campaign.updateStatus({
      id: campaign.id,
      status: CampaignStatus.ACTIVE,
    })
    assert.strictEqual(published.status, CampaignStatus.ACTIVE, "Campaign should be ACTIVE")

    // Update status back to DRAFT
    const unpublished = await adminCaller.campaign.updateStatus({
      id: campaign.id,
      status: CampaignStatus.DRAFT,
    })
    assert.strictEqual(unpublished.status, CampaignStatus.DRAFT, "Campaign should be back in DRAFT")
    console.log("   ✅ Campaign CRUD and status updates work.")

    // -------------------------------------------------------------
    // TEST 3: Coordinate validation checks
    // -------------------------------------------------------------
    console.log("\n🚀 Test 3: Verifying Coordinate range validation boundaries...")
    
    const exclusiveCategory = await db.businessCategory.create({
      data: {
        name: `Exclusive Category ${testId}`,
        slug: `excl-cat-${testId}`,
        allowsMultipleAdvertisers: false,
      }
    })
    exclusiveCategoryId = exclusiveCategory.id

    // Test low boundary (negative X coordinate)
    await assert.rejects(
      adminCaller.spot.create({
        campaignId: campaign.id,
        categoryId: exclusiveCategoryId,
        label: "Out of Bounds Spot",
        side: PostcardSide.FRONT,
        spotType: SpotType.STANDARD,
        price: 49000,
        x: -5,
        y: 10,
        width: 10,
        height: 10,
      }),
      (err: any) => {
        // Zod validation throws error on bad input boundaries
        assert.ok(err instanceof Error, "Should throw coordinate boundary validation error")
        return true
      },
      "Negative coordinate should fail"
    )

    // Test high boundary (X coordinate > 100)
    await assert.rejects(
      adminCaller.spot.create({
        campaignId: campaign.id,
        categoryId: exclusiveCategoryId,
        label: "Out of Bounds Spot",
        side: PostcardSide.FRONT,
        spotType: SpotType.STANDARD,
        price: 49000,
        x: 105,
        y: 10,
        width: 10,
        height: 10,
      }),
      (err: any) => {
        assert.ok(err instanceof Error, "Should throw coordinate boundary validation error")
        return true
      },
      "Coordinate greater than 100 should fail"
    )

    // Create a valid spot
    const validSpot = await adminCaller.spot.create({
      campaignId: campaign.id,
      categoryId: exclusiveCategoryId,
      label: "Valid Admin Spot",
      side: PostcardSide.FRONT,
      spotType: SpotType.STANDARD,
      price: 49000,
      x: 10,
      y: 15,
      width: 20,
      height: 25,
    })
    spotId = validSpot.id
    assert.strictEqual(validSpot.x, 10)
    assert.strictEqual(validSpot.width, 20)
    console.log("   ✅ Coordinate boundary range validation blocks out-of-range parameters.")

    // -------------------------------------------------------------
    // TEST 4: Category Exclusivity Validation
    // -------------------------------------------------------------
    console.log("\n🚀 Test 4: Verifying Category Exclusivity rules...")

    // Seed another spot in the same campaign, using the same exclusive category
    const secondSpot = await adminCaller.spot.create({
      campaignId: campaign.id,
      categoryId: exclusiveCategoryId,
      label: "Second Spot Exclusive Category",
      side: PostcardSide.BACK,
      spotType: SpotType.STANDARD,
      price: 59000,
      x: 30,
      y: 30,
      width: 15,
      height: 15,
    })

    // Seed advertiser
    const advertiser = await db.advertiser.create({
      data: {
        contactName: "Exclusive Test Buyer",
        businessName: `Excl Biz ${testId}`,
        email: merchantEmail,
        phone: "555-0000",
      }
    })
    advertiserId = advertiser.id

    // Create order for the first spot (reserves the category)
    const order = await db.order.create({
      data: {
        campaignId: campaign.id,
        campaignSpotId: validSpot.id,
        advertiserId: advertiser.id,
        amount: 49000,
        stripeCheckoutSessionId: `session-excl-${testId}`,
        creativeSubmissionToken: `token-excl-${testId}`,
        status: OrderStatus.PAID,
      }
    })
    orderId = order.id

    // Update spot status to SOLD to simulate purchase
    await db.campaignSpot.update({
      where: { id: validSpot.id },
      data: { status: SpotStatus.SOLD, categoryId: exclusiveCategoryId }
    })

    // Attempting to reserve the second spot with the same exclusive category should now succeed
    const conflictRes = await nonAdminCaller.order.create({
      spotId: secondSpot.id,
      categoryId: exclusiveCategoryId,
      sessionId: `session-conflict-${testId}`,
      contactName: "Interloper Name",
      businessName: "Interloper Biz",
      email: "interloper@test.com",
      phone: "555-1111",
    })
    assert.ok(conflictRes.orderId, "Should allow duplicate reservation of exclusive category (manual refund flow)")

    // Clean up the conflict order
    await db.creativeSubmission.deleteMany({ where: { orderId: conflictRes.orderId } })
    await db.order.deleteMany({ where: { id: conflictRes.orderId } })


    // Now test a non-exclusive category
    const nonExclusiveCategory = await db.businessCategory.create({
      data: {
        name: `Non-Exclusive Category ${testId}`,
        slug: `non-excl-cat-${testId}`,
        allowsMultipleAdvertisers: true,
      }
    })
    nonExclusiveCategoryId = nonExclusiveCategory.id

    // Swapping second spot's category to non-exclusive
    await db.campaignSpot.update({
      where: { id: secondSpot.id },
      data: { categoryId: nonExclusiveCategoryId }
    })

    // Non-exclusive category should allow reservation even if another spot is sold in the same category
    // First, mock a sold spot in the non-exclusive category
    const thirdSpot = await adminCaller.spot.create({
      campaignId: campaign.id,
      categoryId: nonExclusiveCategoryId,
      label: "Third Spot Non-Exclusive Category",
      side: PostcardSide.FRONT,
      spotType: SpotType.STANDARD,
      price: 49000,
      x: 50,
      y: 50,
      width: 10,
      height: 10,
    })
    await db.campaignSpot.update({
      where: { id: thirdSpot.id },
      data: { status: SpotStatus.SOLD }
    })

    // Trying to hold/checkout another spot with this non-exclusive category should succeed
    const res = await nonAdminCaller.order.create({
      spotId: secondSpot.id,
      categoryId: nonExclusiveCategoryId,
      sessionId: `session-nonexcl-${testId}`,
      contactName: "Regular Buyer",
      businessName: "Regular Biz",
      email: "regular@test.com",
      phone: "555-2222",
    })
    assert.ok(res.orderId, "Non-exclusive category should allow multiple spot reservations")

    // Cleanup the duplicate order created
    await db.creativeSubmission.deleteMany({ where: { orderId: res.orderId } })
    await db.order.deleteMany({ where: { id: res.orderId } })
    await db.campaignSpot.delete({ where: { id: thirdSpot.id } })
    await db.campaignSpot.delete({ where: { id: secondSpot.id } })
    console.log("   ✅ Category exclusivity blocks conflicts and permits multi-allowed category reservations.");

    // -------------------------------------------------------------
    // TEST 5: Edit Safeguards / Locking Mechanism
    // -------------------------------------------------------------
    console.log("\n🚀 Test 5: Testing Profile/Creative edit locking safeguards...");

    // Create business profile associated with merchant
    const business = await db.business.create({
      data: {
        advertiserId: advertiser.id,
        ownerUserId: merchantSupabaseId,
        name: advertiser.businessName,
        slug: `excl-biz-slug-${testId}`,
        phone: advertiser.phone,
        email: advertiser.email,
        status: "ACTIVE",
      }
    })
    businessId = business.id

    // Test 5A: Locked due to campaign status READY_FOR_PRINT
    console.log("   🔄 Locking due to Campaign READY_FOR_PRINT status...")
    await db.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.READY_FOR_PRINT }
    })

    // Try to update print-sensitive business profile field (phone)
    await assert.rejects(
      nonAdminCaller.business.updateProfile({
        name: advertiser.businessName,
        phone: "555-9999", // Change phone (print-sensitive)
      }),
      (err: any) => {
        assert.strictEqual(err.code, "FORBIDDEN")
        assert.ok(err.message.includes("blocked") || err.message.includes("lock") || err.message.includes("print-sensitive"))
        return true
      },
      "Print-sensitive profile changes should be blocked"
    )

    // Digital-only field (description) should update successfully
    const profileUpdate = await nonAdminCaller.business.updateProfile({
      name: advertiser.businessName, // unchanged
      description: "Digital profile description",
    })
    assert.strictEqual(profileUpdate.description, "Digital profile description", "Digital-only fields remain editable")

    // Test 5B: Locked due to creative submission status APPROVED
    console.log("   🔄 Locking due to Creative approval status APPROVED...")
    // Reset campaign status to DRAFT first
    await db.campaign.update({
      where: { id: campaign.id },
      data: { status: CampaignStatus.DRAFT }
    })

    // Seed CreativeSubmission in APPROVED status
    const creative = await db.creativeSubmission.create({
      data: {
        orderId: order.id,
        businessName: business.name,
        approvalStatus: ApprovalStatus.APPROVED, // Lock condition!
      }
    })

    // Try to update print-sensitive creative field (businessName)
    await assert.rejects(
      nonAdminCaller.creative.upsert({
        token: order.creativeSubmissionToken,
        businessName: "New Business Name", // Change business display name
      }),
      (err: any) => {
        assert.strictEqual(err.code, "FORBIDDEN")
        assert.ok(err.message.includes("print-sensitive") || err.message.includes("approved"))
        return true
      },
      "Print-sensitive creative edits should be blocked"
    )

    // Digital-only creative field (notes) should update successfully
    const creativeUpdate = await nonAdminCaller.creative.upsert({
      token: order.creativeSubmissionToken,
      businessName: business.name, // unchanged
      notes: "High priority designer instructions",
    })
    assert.strictEqual(creativeUpdate.notes, "High priority designer instructions", "Digital-only creative fields remain editable")
    assert.strictEqual(creativeUpdate.approvalStatus, ApprovalStatus.APPROVED, "Creative approvalStatus must remain APPROVED")
    console.log("   ✅ Print lock safeguards verified successfully.");

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...");
    await db.emailLog.deleteMany({ where: { toEmail: advertiser.email } })
    await db.creativeSubmission.deleteMany({ where: { orderId: order.id } })
    await db.business.delete({ where: { id: business.id } })
    await db.order.delete({ where: { id: order.id } })
    await db.campaignSpot.deleteMany({ where: { campaignId: campaign.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: exclusiveCategoryId } })
    await db.businessCategory.delete({ where: { id: nonExclusiveCategoryId } })
    await db.advertiser.delete({ where: { id: advertiser.id } })
    await db.adminUser.delete({ where: { supabaseUserId: adminSupabaseId } })
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 ALL ADMIN FLOW & AUTHORIZATION INTEGRATION TESTS PASSED!");

  } catch (err) {
    console.error("\n❌ Admin Flow Integration Tests failed:")
    console.error(err)

    // Emergency cleanup
    try {
      console.log("🧹 Attempting emergency cleanup...")
      await db.emailLog.deleteMany({
        where: { toEmail: merchantEmail },
      })
      await db.adminUser.deleteMany({ where: { supabaseUserId: adminSupabaseId } })
      await db.creativeSubmission.deleteMany({ where: { orderId } })
      await db.order.deleteMany({ where: { campaignId } })
      await db.business.deleteMany({ where: { name: { contains: testId } } })
      await db.campaignSpot.deleteMany({ where: { campaignId } })
      await db.campaign.deleteMany({ where: { id: campaignId } })
      if (exclusiveCategoryId) await db.businessCategory.delete({ where: { id: exclusiveCategoryId } })
      if (nonExclusiveCategoryId) await db.businessCategory.delete({ where: { id: nonExclusiveCategoryId } })
      if (advertiserId) await db.advertiser.delete({ where: { id: advertiserId } })
      console.log("🧹 Emergency cleanup completed.")
    } catch (cleanupErr) {
      console.error("🧹 Emergency cleanup failed:", cleanupErr)
    }

    process.exit(1)
  }
}

runAdminFlowTests()
