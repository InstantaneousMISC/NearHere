import assert from "assert"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { OrderStatus, QrCodeStatus, QrCodeType } from "@prisma/client"

console.log("🧪 Running comprehensive claim & setup verification tests...")

async function runClaimTests() {
  const timestamp = Date.now()
  const testId = `claim-test-${timestamp}`
  
  console.log(`\n--- Claim Test Context ID: ${testId} ---`)

  // Create caller factory
  const createCaller = createCallerFactory(appRouter)

  try {
    // -------------------------------------------------------------
    // SETUP: Seed test campaign, spot, advertiser, order, and business
    // -------------------------------------------------------------
    console.log("⏳ Setting up claim test seed data...")

    const category = await db.businessCategory.create({
      data: {
        name: `Claim Category ${testId}`,
        slug: `claim-cat-${testId}`,
      }
    })

    const campaign = await db.campaign.create({
      data: {
        name: `Claim Campaign ${testId}`,
        slug: `claim-camp-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 10000,
      }
    })

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: category.id,
        label: "Claim Test Spot",
        price: 49000,
        x: 20.0,
        y: 20.0,
        width: 10.0,
        height: 10.0,
        side: "FRONT",
      }
    })

    // Advertiser email is john-claim@test.com
    const advertiser = await db.advertiser.create({
      data: {
        contactName: "John Claimer",
        businessName: `Claim Acme ${testId}`,
        email: `john-claim-${timestamp}@test.com`,
        phone: "555-9876",
        website: "https://acme-claim.com",
      }
    })

    const order = await db.order.create({
      data: {
        campaignId: campaign.id,
        campaignSpotId: spot.id,
        advertiserId: advertiser.id,
        amount: 49000,
        creativeSubmissionToken: `token-${testId}`,
        status: OrderStatus.PAID, // Must be PAID so it is in sold queue
      }
    })

    const claimToken = `token-val-${testId}`
    const claimTokenExpiresAt = new Date()
    claimTokenExpiresAt.setDate(claimTokenExpiresAt.getDate() + 14) // Expires in 14 days

    // Create unclaimed Business profile
    const business = await db.business.create({
      data: {
        advertiserId: advertiser.id,
        name: advertiser.businessName,
        slug: `claim-acme-test-${timestamp}`,
        phone: advertiser.phone,
        email: advertiser.email,
        website: advertiser.website,
        status: "ACTIVE",
        claimToken,
        claimTokenExpiresAt,
      }
    })

    console.log("✅ Claim seed data setup complete.")

    // -------------------------------------------------------------
    // TEST 1: Valid claim details retrieval
    // -------------------------------------------------------------
    console.log("\n🚀 Test 1: Querying Business Details by Claim Token...")
    
    // Create an unauthenticated caller
    const publicCaller = createCaller({ db, user: null, supabase: {} as any })
    
    const details = await publicCaller.business.getBusinessDetailsByClaimToken({ token: claimToken })
    assert.strictEqual(details.name, business.name, "Business name must match.")
    assert.ok(details.maskedEmail.includes("jo"), "Email masking should preserve starting characters.")
    assert.ok(details.maskedEmail.includes("*"), "Email masking must hide characters with asterisks.")
    assert.ok(!details.maskedEmail.includes(`john-claim-${timestamp}`), "Full email must not be exposed.")
    console.log("✅ Email masking and details query verified.")

    // -------------------------------------------------------------
    // TEST 2: Expired claim token error
    // -------------------------------------------------------------
    console.log("\n🚀 Test 2: Attempting to claim with an Expired Token...")
    
    // Set token as expired
    await db.business.update({
      where: { id: business.id },
      data: { claimTokenExpiresAt: new Date(Date.now() - 3600000) } // 1 hour ago
    })

    // Try details retrieval - should fail
    await assert.rejects(
      publicCaller.business.getBusinessDetailsByClaimToken({ token: claimToken }),
      /Claim token has expired/,
      "Querying expired token details must reject."
    )

    // Try claiming - should fail
    const authedWrongCaller = createCaller({
      db,
      user: { id: `user-${testId}`, email: advertiser.email } as any,
      supabase: {} as any
    })

    await assert.rejects(
      authedWrongCaller.business.claimBusiness({ token: claimToken }),
      /Claim token has expired/,
      "Claiming with expired token must reject."
    )
    console.log("✅ Expired claim token error works.")

    // Restore token expiration
    await db.business.update({
      where: { id: business.id },
      data: { claimTokenExpiresAt }
    })

    // -------------------------------------------------------------
    // TEST 3: Wrong email address error
    // -------------------------------------------------------------
    console.log("\n🚀 Test 3: Attempting to claim with a wrong email address...")
    
    const wrongUserCaller = createCaller({
      db,
      user: { id: `user-wrong-${testId}`, email: "wrong-email@test.com" } as any,
      supabase: {} as any
    })

    await assert.rejects(
      wrongUserCaller.business.claimBusiness({ token: claimToken }),
      /You can only claim this business using the email address associated with the purchase/,
      "Email mismatch should be rejected."
    )
    console.log("✅ Email mismatch check works.")

    // -------------------------------------------------------------
    // TEST 4: Email normalization checks (Spaces & Case insensitivity)
    // -------------------------------------------------------------
    console.log("\n🚀 Test 4: Testing email normalization...")
    
    // Email on seed: john-claim-[ts]@test.com
    // Logged in email:   JOHN-CLAIM-[ts]@TEST.COM  
    const normalizedUserCaller = createCaller({
      db,
      user: { 
        id: `user-norm-${testId}`, 
        email: `   JOHN-CLAIM-${timestamp}@TEST.COM   ` 
      } as any,
      supabase: {} as any
    })

    const claimResult = await normalizedUserCaller.business.claimBusiness({ token: claimToken })
    assert.strictEqual(claimResult.ownerUserId, `user-norm-${testId}`, "Should allow claim due to email normalization.")
    assert.ok(claimResult.claimedAt, "claimedAt timestamp must be set.")
    assert.strictEqual(claimResult.claimToken, null, "Claim token must be cleared on success.")
    console.log("✅ Email normalization (trim & lowercasing) works.")

    // -------------------------------------------------------------
    // TEST 5: Already claimed business error
    // -------------------------------------------------------------
    console.log("\n🚀 Test 5: Attempting to claim an already-claimed business...")
    
    // Try to claim again with a new token (regenerated token)
    await db.business.update({
      where: { id: business.id },
      data: {
        claimToken: "new-token-val",
        claimTokenExpiresAt,
      }
    })

    const anotherCaller = createCaller({
      db,
      user: { id: `user-another-${testId}`, email: advertiser.email } as any,
      supabase: {} as any
    })

    await assert.rejects(
      anotherCaller.business.claimBusiness({ token: "new-token-val" }),
      /This business has already been claimed/,
      "Claiming an already claimed business must fail."
    )
    console.log("✅ Already claimed check works.")

    // -------------------------------------------------------------
    // TEST 6: Admin override check
    // -------------------------------------------------------------
    console.log("\n🚀 Test 6: Testing Admin claiming override...")
    
    // Reset business back to unclaimed state
    await db.business.update({
      where: { id: business.id },
      data: {
        ownerUserId: null,
        claimedAt: null,
        claimToken: "admin-override-token",
        claimTokenExpiresAt,
      }
    })

    // Seed mock AdminUser record
    const adminSupabaseId = `admin-sb-${testId}`
    await db.adminUser.create({
      data: {
        supabaseUserId: adminSupabaseId,
        email: `admin-${testId}@localspotmailers.com`,
      }
    })

    // Authenticate caller as admin with a different email
    const adminCaller = createCaller({
      db,
      user: { id: adminSupabaseId, email: `admin-${testId}@localspotmailers.com` } as any,
      supabase: {} as any
    })

    const adminClaimResult = await adminCaller.business.claimBusiness({ token: "admin-override-token" })
    assert.strictEqual(adminClaimResult.ownerUserId, adminSupabaseId, "Admin should claim despite email mismatch.")
    console.log("✅ Admin override claim works.")

    // -------------------------------------------------------------
    // TEST 7: Regenerate claim token clears claimed state
    // -------------------------------------------------------------
    console.log("\n🚀 Test 7: Testing claim link regeneration resets ownership...")

    const regenResult = await adminCaller.business.regenerateClaimToken({
      businessId: business.id,
      reason: "Test reset request",
      sendEmailNotification: false,
    })
    assert.ok(regenResult.claimToken, "Should generate a new claim token.")
    assert.ok(regenResult.claimLink.includes(regenResult.claimToken), "Claim link should include new token.")

    const updatedBusiness = await db.business.findUnique({
      where: { id: business.id }
    })
    assert.strictEqual(updatedBusiness?.ownerUserId, null, "ownerUserId must be reset to null.")
    assert.strictEqual(updatedBusiness?.claimedAt, null, "claimedAt must be reset to null.")
    assert.strictEqual(updatedBusiness?.claimToken, regenResult.claimToken, "claimToken must match regenerated token.")

    const auditLog = await db.adminAuditLog.findFirst({
      where: { businessId: business.id }
    })
    assert.ok(auditLog, "Audit log entry must be created.")
    assert.strictEqual(auditLog.action, "REGENERATE_CLAIM_TOKEN", "Action must be logged correctly.")
    assert.strictEqual(auditLog.notes, "Test reset request", "Reason/notes must be logged correctly.")
    assert.strictEqual(auditLog.adminEmail, `admin-${testId}@localspotmailers.com`, "Admin email must be logged correctly.")
    console.log("✅ Claim link regeneration ownership reset and audit logging verified.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...")
    await db.adminAuditLog.deleteMany({ where: { businessId: business.id } })
    await db.adminUser.delete({ where: { supabaseUserId: adminSupabaseId } })
    await db.business.delete({ where: { id: business.id } })
    await db.order.delete({ where: { id: order.id } })
    await db.campaignSpot.delete({ where: { id: spot.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: category.id } })
    await db.advertiser.delete({ where: { id: advertiser.id } })
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 ALL CLAIM INTEGRATION TESTS PASSED SUCCESSFULLY!")

  } catch (err) {
    console.error("\n❌ Claim Integration Test failed:")
    console.error(err)
    process.exit(1)
  }
}

runClaimTests()
