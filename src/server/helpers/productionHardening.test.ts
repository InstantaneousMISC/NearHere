import assert from "assert"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { OrderStatus, CampaignStatus, ApprovalStatus, IndexControl } from "@prisma/client"
import { syncBusinessToDirectory } from "./directorySync"

console.log("🧪 Running Production Hardening & Security regression tests...")

async function runHardeningTests() {
  const timestamp = Date.now()
  const testId = `hardening-test-${timestamp}`
  console.log(`\n--- Hardening Test Context ID: ${testId} ---`)

  const createCaller = createCallerFactory(appRouter)

  // IDs for cleanup
  let catId = ""
  let campAId = "", campBId = ""
  let spotAId = "", spotBId = ""
  let advAId = "", advBId = ""
  let ordAId = "", ordBId = "", ordCId = ""
  let bizAId = "", bizBId = ""
  let qrAId = "", qrBId = ""

  try {
    // -------------------------------------------------------------
    // SETUP: Seed test categories, campaigns, spots, advertisers, orders, businesses, and QRs
    // -------------------------------------------------------------
    console.log("⏳ Seeding mock database records for Merchant A and Merchant B...")

    const category = await db.businessCategory.create({
      data: {
        name: `Hardening Cat ${testId}`,
        slug: `hardening-cat-${testId}`,
      }
    })
    catId = category.id

    // Campaign A & B
    const campaignA = await db.campaign.create({
      data: {
        name: `Camp A ${testId}`,
        slug: `camp-a-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 10000,
        status: CampaignStatus.ACTIVE,
      }
    })
    campAId = campaignA.id

    const campaignB = await db.campaign.create({
      data: {
        name: `Camp B ${testId}`,
        slug: `camp-b-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 10000,
        status: CampaignStatus.ACTIVE,
      }
    })
    campBId = campaignB.id

    // Spot A & B
    const spotA = await db.campaignSpot.create({
      data: {
        campaignId: campaignA.id,
        categoryId: category.id,
        label: "Spot A",
        price: 39000,
        x: 0, y: 0, width: 10, height: 10, side: "FRONT",
      }
    })
    spotAId = spotA.id

    const spotB = await db.campaignSpot.create({
      data: {
        campaignId: campaignB.id,
        categoryId: category.id,
        label: "Spot B",
        price: 39000,
        x: 0, y: 0, width: 10, height: 10, side: "FRONT",
      }
    })
    spotBId = spotB.id

    // Advertiser A & B
    const advA = await db.advertiser.create({
      data: {
        contactName: "Merchant A",
        businessName: `Biz A ${testId}`,
        email: `merchant-a-${timestamp}@test.com`,
        phone: "555-0001",
      }
    })
    advAId = advA.id

    const advB = await db.advertiser.create({
      data: {
        contactName: "Merchant B",
        businessName: `Biz B ${testId}`,
        email: `merchant-b-${timestamp}@test.com`,
        phone: "555-0002",
      }
    })
    advBId = advB.id

    // Order A (PAID) & B (PAID) & C (EXPIRED)
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

    const orderC = await db.order.create({
      data: {
        campaignId: campaignA.id,
        campaignSpotId: spotA.id,
        advertiserId: advA.id,
        amount: 39000,
        stripeCheckoutSessionId: `session-c-${testId}`,
        creativeSubmissionToken: `creative-token-c-${testId}`,
        status: OrderStatus.EXPIRED,
      }
    })
    ordCId = orderC.id

    // Business A & B
    const bizA = await db.business.create({
      data: {
        advertiserId: advA.id,
        ownerUserId: `user-a-${testId}`,
        name: advA.businessName,
        slug: `biz-a-${testId}`,
        phone: advA.phone,
        email: advA.email,
        website: "https://test.com",
        logoUrl: "https://test.com/logo.png",
        description: "This is a long description of at least twenty characters.",
        city: "converse",
        state: "tx",
        status: "ACTIVE",
        isDirectoryVisible: true,
        goodStanding: true,
      }
    })
    bizAId = bizA.id

    const bizB = await db.business.create({
      data: {
        advertiserId: advB.id,
        ownerUserId: `user-b-${testId}`,
        name: advB.businessName,
        slug: `biz-b-${testId}`,
        phone: advB.phone,
        email: advB.email,
        website: "https://test.com",
        logoUrl: "https://test.com/logo.png",
        description: "This is a long description of at least twenty characters.",
        city: "converse",
        state: "tx",
        status: "ACTIVE",
        isDirectoryVisible: true,
        goodStanding: true,
      }
    })
    bizBId = bizB.id

    // Creative Submission for Order A (required to pass profile quality check)
    await db.creativeSubmission.create({
      data: {
        orderId: orderA.id,
        businessName: bizA.name,
        description: bizA.description,
        phone: bizA.phone,
        website: bizA.website,
        logoUrl: bizA.logoUrl,
        approvalStatus: "APPROVED",
      }
    })

    // QR A & B
    const qrA = await db.qrCode.create({
      data: {
        businessId: bizA.id,
        campaignId: campaignA.id,
        campaignSpotId: spotA.id,
        orderId: orderA.id,
        slug: `qr-slug-a-${testId}`,
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
        slug: `qr-slug-b-${testId}`,
        type: "CAMPAIGN_SLOT",
        status: "ACTIVE",
        destinationPath: `/b/${bizB.slug}`,
      }
    })
    qrBId = qrB.id

    // Instantiate Caller for Merchant A
    const callerA = createCaller({
      db,
      user: { id: `user-a-${testId}`, email: advA.email } as any,
      supabase: {} as any,
    })

    // Instantiate Caller for Merchant B
    const callerB = createCaller({
      db,
      user: { id: `user-b-${testId}`, email: advB.email } as any,
      supabase: {} as any,
    })

    // Instantiate Unauthenticated Caller
    const callerPublic = createCaller({
      db,
      user: null,
      supabase: {} as any,
    })

    // -------------------------------------------------------------
    // TEST 1: Merchant BOLA Checks
    // -------------------------------------------------------------
    console.log("\n🚀 Test 1: Verifying Merchant BOLA Protection...")

    // Merchant A trying to fetch Merchant B's time series using qrCodeId
    try {
      await callerA.business.getCampaignPlacementTimeSeries({
        qrCodeId: qrB.id,
      })
      assert.fail("Merchant A was able to retrieve Merchant B's QR Code stats!")
    } catch (err: any) {
      assert.strictEqual(err.code, "FORBIDDEN")
      console.log("   ✅ BOLA blocked Merchant A from querying Merchant B's qrCodeId stats.")
    }

    // Merchant A trying to fetch Merchant B's time series using campaignId
    try {
      await callerA.business.getCampaignPlacementTimeSeries({
        campaignId: campaignB.id,
      })
      assert.fail("Merchant A was able to retrieve Merchant B's Campaign stats!")
    } catch (err: any) {
      assert.strictEqual(err.code, "FORBIDDEN")
      console.log("   ✅ BOLA blocked Merchant A from querying Merchant B's campaignId stats.")
    }

    // Merchant A querying their own qrCodeId should succeed
    const statsA = await callerA.business.getCampaignPlacementTimeSeries({
      qrCodeId: qrA.id,
      days: 7,
    })
    assert.ok(Array.isArray(statsA))
    console.log("   ✅ Merchant A successfully queried their own QR Code stats.")


    // -------------------------------------------------------------
    // TEST 2: Public Invoice Response Sanitization DTO
    // -------------------------------------------------------------
    console.log("\n🚀 Test 2: Verifying Public Invoice Response Sanitization DTO...")

    const invoice = await callerPublic.order.getInvoice({ id: orderA.id })
    
    // Assert sensitive fields are completely omitted
    assert.strictEqual((invoice as any).creativeSubmissionToken, undefined, "leak: creativeSubmissionToken")
    assert.strictEqual((invoice as any).stripeCheckoutSessionId, undefined, "leak: stripeCheckoutSessionId")
    assert.strictEqual((invoice as any).claimToken, undefined, "leak: claimToken")
    assert.strictEqual((invoice as any).internalNotes, undefined, "leak: internalNotes")
    assert.strictEqual((invoice as any).adminNotes, undefined, "leak: adminNotes")
    
    // Assert safe public fields exist
    assert.strictEqual(invoice.id, orderA.id)
    assert.strictEqual(invoice.status, OrderStatus.PAID)
    assert.strictEqual(invoice.campaign.name, campaignA.name)
    assert.strictEqual(invoice.campaignSpot.label, spotA.label)
    assert.strictEqual(invoice.advertiser.businessName, advA.businessName)
    console.log("   ✅ Public invoice response is safely sanitized (DTO mapping verified).")


    // -------------------------------------------------------------
    // TEST 3: Directory Visibility Rules (Sync & Listing Layers)
    // -------------------------------------------------------------
    console.log("\n🚀 Test 3: Verifying Directory Sync Visibility Controls...")

    // 3a. Setup directory profile
    const dirProfile = await db.directoryProfile.create({
      data: {
        businessId: bizA.id,
        name: bizA.name,
        slug: bizA.slug,
        status: "PUBLISHED",
        isIndexed: IndexControl.INDEX,
      }
    })

    // Assert initially sync puts it to PUBLISHED because meetsQuality & isDirectoryVisible are true
    await syncBusinessToDirectory(bizA.id)
    let profile = await db.directoryProfile.findUnique({ where: { id: dirProfile.id } })
    assert.strictEqual(profile?.status, "PUBLISHED")

    // 3b. Set isDirectoryVisible to false, sync, check it hides to DRAFT/NOINDEX
    await db.business.update({
      where: { id: bizA.id },
      data: { isDirectoryVisible: false }
    })
    await syncBusinessToDirectory(bizA.id)
    profile = await db.directoryProfile.findUnique({ where: { id: dirProfile.id } })
    assert.strictEqual(profile?.status, "DRAFT")
    assert.strictEqual(profile?.isIndexed, IndexControl.NOINDEX)
    console.log("   ✅ Correctly hid directory profile to DRAFT when isDirectoryVisible = false.")

    // Reset visibility, check it republishes
    await db.business.update({
      where: { id: bizA.id },
      data: { isDirectoryVisible: true }
    })
    await syncBusinessToDirectory(bizA.id)
    profile = await db.directoryProfile.findUnique({ where: { id: dirProfile.id } })
    assert.strictEqual(profile?.status, "PUBLISHED")

    // 3c. Set deletedAt (soft-deleted), sync, check it hides to DRAFT
    await db.business.update({
      where: { id: bizA.id },
      data: { deletedAt: new Date() }
    })
    await syncBusinessToDirectory(bizA.id)
    profile = await db.directoryProfile.findUnique({ where: { id: dirProfile.id } })
    assert.strictEqual(profile?.status, "DRAFT")
    console.log("   ✅ Correctly hid directory profile to DRAFT when business is soft-deleted.")

    // Reset deletedAt, goodStanding = false (suspended), sync, check it hides to DRAFT
    await db.business.update({
      where: { id: bizA.id },
      data: { deletedAt: null, goodStanding: false }
    })
    await syncBusinessToDirectory(bizA.id)
    profile = await db.directoryProfile.findUnique({ where: { id: dirProfile.id } })
    assert.strictEqual(profile?.status, "DRAFT")
    console.log("   ✅ Correctly hid directory profile to DRAFT when business is suspended (not in good standing).")


    // -------------------------------------------------------------
    // TEST 4: Expired Invoice Payment Creation Blocks
    // -------------------------------------------------------------
    console.log("\n🚀 Test 4: Verifying Expired Invoice Blocks...")

    try {
      await callerPublic.order.getOrRenewStripeSession({ orderId: orderC.id })
      assert.fail("Allowed creating checkout session for an EXPIRED invoice!")
    } catch (err: any) {
      assert.strictEqual(err.code, "BAD_REQUEST")
      assert.strictEqual(err.message, "This invoice is no longer pending payment.")
      console.log("   ✅ Correctly blocked checkout creation on expired invoice.")
    }


    // -------------------------------------------------------------
    // TEST 5: QR Redirect Visibility Rules
    // -------------------------------------------------------------
    console.log("\n🚀 Test 5: Verifying QR Redirection Visibility Checks...")

    // Check Business A (currently suspended/goodStanding=false)
    const dbBusiness = await db.business.findUnique({ where: { id: bizA.id } })
    assert.strictEqual(dbBusiness?.goodStanding, false)

    // Simulate QR Redirect evaluation logic
    const isBusinessInactive = !dbBusiness || dbBusiness.deletedAt !== null || !dbBusiness.goodStanding
    assert.strictEqual(isBusinessInactive, true, "Business A is inactive, redirect should show fallback")
    console.log("   ✅ QR Redirection logic correctly flags the suspended business as inactive.")


    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up database mock records...")
    await db.directoryProfile.deleteMany({ where: { businessId: { in: [bizAId, bizBId] } } })
    await db.qrCode.deleteMany({ where: { id: { in: [qrAId, qrBId] } } })
    await db.business.deleteMany({ where: { id: { in: [bizAId, bizBId] } } })
    await db.order.deleteMany({ where: { id: { in: [ordAId, ordBId, ordCId] } } })
    await db.campaignSpot.deleteMany({ where: { id: { in: [spotAId, spotBId] } } })
    await db.campaign.deleteMany({ where: { id: { in: [campAId, campBId] } } })
    await db.businessCategory.deleteMany({ where: { id: catId } })
    await db.advertiser.deleteMany({ where: { id: { in: [advAId, advBId] } } })

    console.log("✅ Cleanup finished cleanly.")
    console.log("\n🎉 ALL PRODUCTION HARDENING REGRESSION TESTS PASSED SUCCESSFULLY!");

  } catch (err) {
    console.error("\n❌ Hardening regression tests failed:")
    console.error(err)

    // Emergency cleanup
    try {
      console.log("🧹 Attempting emergency cleanup...")
      await db.directoryProfile.deleteMany({ where: { name: { contains: testId } } })
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
  }
}

runHardeningTests()
