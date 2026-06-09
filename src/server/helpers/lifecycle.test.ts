import assert from "assert"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { OrderStatus, QrCodeStatus, QrCodeType, ApprovalStatus } from "@prisma/client"
import { GET as qrRedirectGet } from "../../app/q/[slug]/route"
import { GET as clickTrackerGet } from "../../app/api/business-click/route"
import { NextRequest } from "next/server"

console.log("🧪 Running comprehensive advertiser lifecycle E2E QA pass...")

async function runLifecycleE2E() {
  const timestamp = Date.now()
  const testId = `lifecycle-qa-${timestamp}`
  console.log(`\n--- QA E2E Test Context ID: ${testId} ---`)

  const createCaller = createCallerFactory(appRouter)

  // Seed references to clean up later
  let categoryId = ""
  let campaignId = ""
  let spotId = ""
  let advertiserId = ""
  let orderId = ""
  let businessId = ""
  let qrCodeId = ""
  let adminSupabaseId = `admin-sb-${testId}`
  const originalResendApiKey = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY

  try {
    // -------------------------------------------------------------
    // PREPARATION: Seed category, campaign, spot, and advertiser
    // -------------------------------------------------------------
    console.log("⏳ Initializing campaign spot & category...")
    
    const category = await db.businessCategory.create({
      data: {
        name: `QA Category ${testId}`,
        slug: `qa-cat-${testId}`,
      }
    })
    categoryId = category.id

    const campaign = await db.campaign.create({
      data: {
        name: `QA Campaign ${testId}`,
        slug: `qa-camp-${testId}`,
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
        label: "QA Test Spot",
        price: 59000,
        x: 10,
        y: 10,
        width: 10,
        height: 10,
        side: "FRONT",
      }
    })
    spotId = spot.id

    const advertiserEmail = `buyer-${timestamp}@test.com`
    const advertiser = await db.advertiser.create({
      data: {
        contactName: "Brand New Buyer",
        businessName: `QA Biz ${testId}`,
        email: advertiserEmail,
        phone: "555-1234",
        website: "https://newbuyer-qa.com",
        businessAddress: "100 QA Lane",
      }
    })
    advertiserId = advertiser.id

    // Create the order in PENDING status first (prior to Stripe Payment)
    const order = await db.order.create({
      data: {
        campaignId: campaign.id,
        campaignSpotId: spot.id,
        advertiserId: advertiser.id,
        amount: 59000,
        stripeCheckoutSessionId: `session-stripe-${testId}`,
        creativeSubmissionToken: `creative-tok-${testId}`,
        status: OrderStatus.PENDING,
      }
    })
    orderId = order.id

    console.log("✅ Seed database setup complete.")

    // -------------------------------------------------------------
    // STEP 1: Buy a campaign spot through checkout (simulate webhook)
    // -------------------------------------------------------------
    console.log("\n🚀 Step 1: Simulating Stripe Webhook (Order PAID)...")

    // Update order status to PAID
    await db.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
      }
    })

    // Simulate Webhook processing logic to compile Business profile and QR
    const { generateSlug } = await import("./generateSlug")
    const businessSlug = await generateSlug(advertiser.businessName, db)
    
    const crypto = require("crypto")
    const claimToken = crypto.randomBytes(16).toString("hex")
    const claimTokenExpiresAt = new Date()
    claimTokenExpiresAt.setDate(claimTokenExpiresAt.getDate() + 14)

    const business = await db.business.create({
      data: {
        advertiserId: advertiser.id,
        name: advertiser.businessName,
        slug: businessSlug,
        phone: advertiser.phone,
        email: advertiser.email,
        website: advertiser.website,
        address: advertiser.businessAddress,
        status: "ACTIVE",
        claimToken,
        claimTokenExpiresAt,
      }
    })
    businessId = business.id
    console.log(`   ✅ Created Business profile: ${business.name} (Claim Token: ${claimToken})`)

    const { generateQrSlug } = await import("./generateQrSlug")
    const qrSlug = await generateQrSlug(db)
    let qrExpiresAt = new Date(campaign.estimatedMailDate!)
    qrExpiresAt.setDate(qrExpiresAt.getDate() + 90)

    const qrCode = await db.qrCode.create({
      data: {
        businessId: business.id,
        campaignId: campaign.id,
        campaignSpotId: spot.id,
        orderId: order.id,
        slug: qrSlug,
        type: QrCodeType.CAMPAIGN_SLOT,
        status: QrCodeStatus.ACTIVE,
        destinationPath: `/b/${business.slug}`,
        expiresAt: qrExpiresAt,
      }
    })
    qrCodeId = qrCode.id
    console.log(`   ✅ Generated active QR Code: ${qrCode.slug} -> ${qrCode.destinationPath}`)

    // -------------------------------------------------------------
    // STEP 2: Confirm success page polling works after Stripe checkout
    // -------------------------------------------------------------
    console.log("\n🚀 Step 2: Querying order by Stripe Session ID (Success Page Polling)...")
    const publicCaller = createCaller({ db, user: null, supabase: {} as any })
    const successPageData = await publicCaller.order.getByStripeSessionId({ sessionId: order.stripeCheckoutSessionId! })
    
    assert.strictEqual(successPageData.status, OrderStatus.PAID, "Success page query should show order status is PAID.")
    assert.ok(successPageData.business, "Success page query should return the associated business object.")
    assert.strictEqual(successPageData.business.id, business.id, "Returned business ID must match.")
    console.log("   ✅ Success page data verified successfully.")

    // -------------------------------------------------------------
    // STEP 3: Confirm the business profile and claim token are created
    // -------------------------------------------------------------
    console.log("\n🚀 Step 3: Verifying claim token created on the Business profile...")
    const unclaimedBusiness = await db.business.findUnique({
      where: { id: business.id }
    })
    assert.ok(unclaimedBusiness?.claimToken, "Claim token must be present on new business record.")
    assert.ok(unclaimedBusiness?.claimTokenExpiresAt, "Claim token expiration date must be present.")
    assert.strictEqual(unclaimedBusiness.ownerUserId, null, "Business must be unclaimed initially.")
    console.log("   ✅ Unclaimed Business status confirmed.")

    // -------------------------------------------------------------
    // STEP 4: Claim the business with the correct email
    // -------------------------------------------------------------
    console.log("\n🚀 Step 4: Claiming the business with the correct purchaser email...")
    const authedMerchantCaller = createCaller({
      db,
      user: { id: `user-merchant-${testId}`, email: advertiserEmail } as any,
      supabase: {} as any
    })
    const claimedResult = await authedMerchantCaller.business.claimBusiness({ token: claimToken })
    assert.strictEqual(claimedResult.ownerUserId, `user-merchant-${testId}`, "Owner userId should be set to authed user.")
    assert.ok(claimedResult.claimedAt, "claimedAt timestamp should be populated.")
    assert.strictEqual(claimedResult.claimToken, null, "claimToken must be cleared upon successful claiming.")
    console.log("   ✅ Business claimed successfully.")

    // -------------------------------------------------------------
    // STEP 5: Confirm wrong-email claim is blocked
    // -------------------------------------------------------------
    console.log("\n🚀 Step 5: Verifying wrong-email claims are blocked...")
    // Seed another temporary business
    const tempClaimToken = `temp-claim-token-${testId}`
    const tempBusiness = await db.business.create({
      data: {
        name: `Temp Blocked Biz`,
        slug: `temp-blocked-${timestamp}`,
        email: `legit-owner-${timestamp}@test.com`,
        status: "ACTIVE",
        claimToken: tempClaimToken,
        claimTokenExpiresAt: claimTokenExpiresAt,
      }
    })

    const intruderCaller = createCaller({
      db,
      user: { id: `user-intruder-${testId}`, email: "attacker@gmail.com" } as any,
      supabase: {} as any
    })

    await assert.rejects(
      intruderCaller.business.claimBusiness({ token: tempClaimToken }),
      /You can only claim this business using the email address associated with the purchase/,
      "Should block claim due to email mismatch."
    )
    console.log("   ✅ Blocked claim from unauthorized email address.")

    // Clean up temp business
    await db.business.delete({ where: { id: tempBusiness.id } })

    // -------------------------------------------------------------
    // STEP 6: Complete Guided Business Setup Wizard (only required fields)
    // -------------------------------------------------------------
    console.log("\n🚀 Step 6: Completing Guided Setup Wizard using only required fields...")
    // Required fields validation: Business Name and either Phone or Website
    // Let's test providing name and website, leaving other fields null/empty
    const step6Result = await authedMerchantCaller.business.updateProfile({
      name: "QA Updated Business Name",
      website: "https://final-website-qa.com",
      phone: "", // phone is empty
      description: "", // optional
      logoUrl: "", // optional
      coverImageUrl: "", // optional
      address: "", // optional
      city: "",
      state: "",
      zipCode: "",
    })

    assert.strictEqual(step6Result.name, "QA Updated Business Name")
    assert.strictEqual(step6Result.website, "https://final-website-qa.com")
    assert.strictEqual(step6Result.phone, "")
    assert.strictEqual(step6Result.logoUrl, null)
    console.log("   ✅ Guided setup wizard completed successfully with required-only fields.")

    // -------------------------------------------------------------
    // STEP 7: Add optional fields after setup
    // -------------------------------------------------------------
    console.log("\n🚀 Step 7: Adding optional fields post-setup (Description, Logo, Address)...")
    const step7Result = await authedMerchantCaller.business.updateProfile({
      name: "QA Updated Business Name",
      website: "https://final-website-qa.com",
      phone: "555-8888",
      description: "This is a comprehensive E2E test business description.",
      logoUrl: "https://images.unsplash.com/logo-qa.png",
      coverImageUrl: "https://images.unsplash.com/cover-qa.png",
      address: "456 Test Blvd",
      city: "Converse",
      state: "TX",
      zipCode: "78109",
    })

    assert.strictEqual(step7Result.description, "This is a comprehensive E2E test business description.")
    assert.strictEqual(step7Result.logoUrl, "https://images.unsplash.com/logo-qa.png")
    assert.strictEqual(step7Result.address, "456 Test Blvd")
    console.log("   ✅ Optional fields updated successfully.")

    // -------------------------------------------------------------
    // STEP 8: Submit postcard creative
    // -------------------------------------------------------------
    console.log("\n🚀 Step 8: Submitting postcard creative details...")
    const authedCreativeCaller = createCaller({ db, user: null, supabase: {} as any })
    const creativeResult = await authedCreativeCaller.creative.upsert({
      token: order.creativeSubmissionToken!,
      businessName: "QA Updated Business Name",
      logoUrl: "https://images.unsplash.com/logo-qa.png",
      headline: "Headline QA Pass!",
      offerDeal: "$100 OFF E2E Services",
      description: "Postcard promo description.",
      cta: "Call Now!",
      phone: "555-8888",
      website: "https://final-website-qa.com",
      address: "456 Test Blvd",
      notes: "Please verify print alignment.",
    })

    assert.strictEqual(creativeResult.headline, "Headline QA Pass!")
    assert.strictEqual(creativeResult.offerDeal, "$100 OFF E2E Services")
    assert.strictEqual(creativeResult.approvalStatus, ApprovalStatus.PENDING, "Should reset status to PENDING on submit.")
    console.log("   ✅ Creative submission registered successfully.")

    // -------------------------------------------------------------
    // STEP 9: Confirm merchant dashboard checklist updates correctly
    // -------------------------------------------------------------
    console.log("\n🚀 Step 9: Testing merchant dashboard checklist computation...")
    
    // Simulate checklist logic inside dashboard:
    const myBiz = await authedMerchantCaller.business.getMyBusiness()
    const myQrs = await authedMerchantCaller.business.getQrCodes()
    const myOrders = await authedMerchantCaller.business.getMyOrders()

    const activeOrd = myOrders.find((o) => o.status === "PAID")
    const sub = activeOrd?.creativeSubmission

    const c1_payment = activeOrd?.status === "PAID"
    const c2_profile = !!myBiz?.description?.trim() && !!myBiz?.logoUrl?.trim() && !!myBiz?.address?.trim()
    const c3_creative = !!sub?.submittedAt
    const c4_qr = myQrs.length > 0
    const c5_postcard_status = sub?.approvalStatus

    assert.strictEqual(c1_payment, true, "1. Payment complete check should be true.")
    assert.strictEqual(c2_profile, true, "2. Profile complete check should be true.")
    assert.strictEqual(c3_creative, true, "3. Creative complete check should be true.")
    assert.strictEqual(c4_qr, true, "4. QR generated check should be true.")
    assert.strictEqual(c5_postcard_status, ApprovalStatus.PENDING, "5. Postcard status should be PENDING.")
    console.log("   ✅ Dashboard checklist rules evaluated as correct.")

    // -------------------------------------------------------------
    // STEP 10: Confirm admin creative review queue shows the listing
    // -------------------------------------------------------------
    console.log("\n🚀 Step 10: Checking admin review queue for the listing...")
    
    // Create admin user
    await db.adminUser.create({
      data: {
        supabaseUserId: adminSupabaseId,
        email: `admin-${testId}@localspotmailers.com`,
      }
    })

    const adminCaller = createCaller({
      db,
      user: { id: adminSupabaseId, email: `admin-${testId}@localspotmailers.com` } as any,
      supabase: {} as any
    })

    const soldSpotsList = await adminCaller.creative.getSoldSpotsForReview()
    const queueOrder = soldSpotsList.find((o) => o.id === order.id)
    assert.ok(queueOrder, "Newly paid order must appear in admin creative review list.")
    assert.strictEqual(queueOrder.creativeSubmission?.headline, "Headline QA Pass!", "Creative details must load.")
    console.log("   ✅ Order correctly listed in admin review queue.")

    const firstRevision = await adminCaller.creative.updateApproval({
      submissionId: queueOrder.creativeSubmission!.id,
      approvalStatus: ApprovalStatus.NEEDS_REVIEW,
      approvalNotes: "Please upload a higher-resolution logo.",
    })
    assert.strictEqual(firstRevision.approvalStatus, ApprovalStatus.NEEDS_REVIEW)

    const secondRevision = await adminCaller.creative.updateApproval({
      submissionId: queueOrder.creativeSubmission!.id,
      approvalStatus: ApprovalStatus.REJECTED,
      approvalNotes: "The replacement logo still does not meet print requirements.",
    })
    assert.strictEqual(secondRevision.approvalStatus, ApprovalStatus.REJECTED)

    const revisionEvents = await db.creativeReviewEvent.findMany({
      where: {
        creativeSubmissionId: queueOrder.creativeSubmission!.id,
        status: { in: [ApprovalStatus.NEEDS_REVIEW, ApprovalStatus.REJECTED] },
      },
    })
    assert.strictEqual(revisionEvents.length, 2, "Each revision cycle must create an event.")
    assert.strictEqual(
      await db.emailLog.count({
        where: {
          entityType: "creative_review_event",
          entityId: { in: revisionEvents.map((event) => event.id) },
          templateKey: "needs_changes",
        },
      }),
      2,
      "Each revision event must receive its own idempotent email claim."
    )

    // -------------------------------------------------------------
    // STEP 11: Test QR redirect from the admin panel
    // -------------------------------------------------------------
    console.log("\n🚀 Step 11: Testing QR scan redirect handler (/q/[slug])...")
    const reqRedirect = new Request(`http://localhost:3000/q/${qrCode.slug}`, {
      headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)" }
    }) as any as NextRequest
    
    const resRedirect = await qrRedirectGet(reqRedirect, { params: Promise.resolve({ slug: qrCode.slug }) })
    assert.strictEqual(resRedirect.status, 307, "Redirect endpoint must return HTTP 307 temporary redirect.")
    const redirectUrl = resRedirect.headers.get("location")
    assert.ok(redirectUrl?.includes(`/b/${businessSlug}`), "Must redirect to the business landing page path.")
    assert.ok(redirectUrl?.includes(`qr=${qrCode.slug}`), "Redirect URL must preserve QR slug query parameter.")
    console.log("   ✅ Redirect logic and headers match expectations.")

    // -------------------------------------------------------------
    // STEP 12: Test public landing page
    // -------------------------------------------------------------
    console.log("\n🚀 Step 12: Loading public business landing page details...")
    const publicBiz = await db.business.findUnique({
      where: { slug: businessSlug },
      include: { links: true }
    })
    assert.ok(publicBiz, "Business must be resolvable by slug.")
    assert.strictEqual(publicBiz.name, "QA Updated Business Name")
    assert.strictEqual(publicBiz.address, "456 Test Blvd")
    console.log("   ✅ Public landing page data verified.")

    // -------------------------------------------------------------
    // STEP 13: Test call/website/booking click tracking
    // -------------------------------------------------------------
    console.log("\n🚀 Step 13: Testing outbound link click tracking endpoint...")
    const reqClick = new Request(`http://localhost:3000/api/business-click?businessId=${business.id}&qr=${qrCode.slug}&type=PHONE&target=tel:555-8888&label=Call%20Us`) as any as NextRequest
    const resClick = await clickTrackerGet(reqClick)
    assert.strictEqual(resClick.status, 200, "tel: click tracking must return custom HTML response (HTTP 200).")
    
    // Check click event logged in database
    const clicks = await db.businessClickEvent.findMany({
      where: { businessId: business.id }
    })
    assert.strictEqual(clicks.length, 1, "Click event must be logged in the database.")
    assert.strictEqual(clicks[0].linkType, "PHONE")
    console.log("   ✅ Click event tracking and logging verified successfully.")

    // -------------------------------------------------------------
    // STEP 14: Approve for print
    // -------------------------------------------------------------
    console.log("\n🚀 Step 14: Approving creative for print (Admin)...")
    const apprvResult = await adminCaller.creative.updateApproval({
      submissionId: queueOrder.creativeSubmission!.id,
      approvalStatus: ApprovalStatus.APPROVED,
      approvalNotes: "Verified E2E pass alignment."
    })
    assert.strictEqual(apprvResult.approvalStatus, ApprovalStatus.APPROVED)
    console.log("   ✅ Postcard creative approved successfully.")

    // -------------------------------------------------------------
    // STEP 15: Mark as PRINTED
    // -------------------------------------------------------------
    console.log("\n🚀 Step 15: Marking postcard as PRINTED...")
    const printedResult = await adminCaller.creative.updateApproval({
      submissionId: queueOrder.creativeSubmission!.id,
      approvalStatus: ApprovalStatus.PRINTED,
      approvalNotes: "Printed by production team."
    })
    assert.strictEqual(printedResult.approvalStatus, ApprovalStatus.PRINTED)
    console.log("   ✅ Lifecycle status successfully updated to PRINTED.")

    // -------------------------------------------------------------
    // STEP 16: Mark as MAILED
    // -------------------------------------------------------------
    console.log("\n🚀 Step 16: Marking postcard as MAILED...")
    const mailedResult = await adminCaller.creative.updateApproval({
      submissionId: queueOrder.creativeSubmission!.id,
      approvalStatus: ApprovalStatus.MAILED,
      approvalNotes: "Postcards shipped out."
    })
    assert.strictEqual(mailedResult.approvalStatus, ApprovalStatus.MAILED)
    console.log("   ✅ Lifecycle status successfully updated to MAILED.")

    // -------------------------------------------------------------
    // STEP 17: Confirm merchant dashboard reflects lifecycle status
    // -------------------------------------------------------------
    console.log("\n🚀 Step 17: Verifying merchant dashboard reflects updated status...")
    const finalOrders = await authedMerchantCaller.business.getMyOrders()
    const finalOrd = finalOrders.find((o) => o.id === order.id)
    assert.strictEqual(finalOrd?.creativeSubmission?.approvalStatus, ApprovalStatus.MAILED, "Dashboard must reflect MAILED status.")
    console.log("   ✅ Merchant dashboard status verified.")

    // -------------------------------------------------------------
    // STEP 18: Confirm QR analytics still work after PRINTED/MAILED
    // -------------------------------------------------------------
    console.log("\n🚀 Step 18: Verifying QR redirect and scan logging continues after MAILED...")
    const preScanCount = await db.qrScan.count({ where: { qrCodeId: qrCode.id } })
    
    // Scan it again
    await qrRedirectGet(reqRedirect, { params: Promise.resolve({ slug: qrCode.slug }) })
    
    const postScanCount = await db.qrScan.count({ where: { qrCodeId: qrCode.id } })
    assert.strictEqual(postScanCount, preScanCount + 1, "Scan should still log and increment counts.")
    
    // Check analytics summary
    const myAnalytics = await authedMerchantCaller.business.getAnalyticsSummary()
    assert.strictEqual(myAnalytics.totalScans, postScanCount, "Analytics count must match scans table.")
    console.log("   ✅ QR scan redirects and analytics verify cleanly after MAILED status.")

    // -------------------------------------------------------------
    // STEP 19: Review regenerate claim token behavior
    // -------------------------------------------------------------
    console.log("\n🚀 Step 19: Testing admin claim token regeneration safeguards...")
    
    // A. Confirm it is admin-only (non-admin procedures block it)
    await assert.rejects(
      authedMerchantCaller.business.regenerateClaimToken({
        businessId: business.id,
        reason: "Reset account",
      }),
      /Not an admin/,
      "Regenerate token should reject non-admin caller."
    )
    console.log("   ✅ Access control successfully restricts token regeneration to admins.")

    // B. Call as admin and verify resets
    const resetResult = await adminCaller.business.regenerateClaimToken({
      businessId: business.id,
      reason: "Accidental E2E Reset",
      sendEmailNotification: false,
    })

    assert.ok(resetResult.claimToken, "Must return new claim token.")
    assert.ok(resetResult.claimLink.includes(resetResult.claimToken), "Must return claim URL with token.")

    const resettedBiz = await db.business.findUnique({
      where: { id: business.id }
    })
    // Confirm ownership was reset
    assert.strictEqual(resettedBiz?.ownerUserId, null, "ownerUserId must be reset to null.")
    assert.strictEqual(resettedBiz?.claimedAt, null, "claimedAt must be reset to null.")
    assert.strictEqual(resettedBiz?.claimToken, resetResult.claimToken, "claimToken must match regenerated token.")
    console.log("   ✅ Ownership fields correctly reset on the database profile.")

    // Confirm audit log exists
    const auditLogs = await db.adminAuditLog.findMany({
      where: { businessId: business.id }
    })
    assert.strictEqual(auditLogs.length, 1, "An entry must be added to AdminAuditLog.")
    assert.strictEqual(auditLogs[0].action, "REGENERATE_CLAIM_TOKEN", "Action type matches.")
    assert.strictEqual(auditLogs[0].notes, "Accidental E2E Reset", "Notes field matches admin reason.")
    assert.strictEqual(auditLogs[0].adminEmail, `admin-${testId}@localspotmailers.com`, "Admin email matches executor.")
    console.log("   ✅ Reset audit log record verified successfully in AdminAuditLog.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...")
    await db.adminAuditLog.deleteMany({ where: { businessId: business.id } })
    await db.emailLog.deleteMany({ where: { toEmail: advertiserEmail } })
    await db.adminUser.delete({ where: { supabaseUserId: adminSupabaseId } })
    await db.businessClickEvent.deleteMany({ where: { businessId: business.id } })
    await db.qrScan.deleteMany({ where: { businessId: business.id } })
    await db.qrCode.deleteMany({ where: { businessId: business.id } })
    await db.creativeSubmission.deleteMany({ where: { orderId: order.id } })
    await db.business.delete({ where: { id: business.id } })
    await db.order.delete({ where: { id: order.id } })
    await db.campaignSpot.delete({ where: { id: spot.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: category.id } })
    await db.advertiser.delete({ where: { id: advertiser.id } })
    process.env.RESEND_API_KEY = originalResendApiKey
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 ALL E2E LIFECYCLE SCENARIOS PASSED SUCCESSFULLY!");

  } catch (err) {
    process.env.RESEND_API_KEY = originalResendApiKey
    console.error("\n❌ E2E Lifecycle QA Pass failed:")
    console.error(err)
    
    // Attempt emergency cleanup of seeded data
    try {
      console.log("🧹 Attempting emergency cleanup...")
      await db.emailLog.deleteMany({
        where: { toEmail: `buyer-${timestamp}@test.com` },
      })
      if (businessId) {
        await db.adminAuditLog.deleteMany({ where: { businessId } })
        await db.businessClickEvent.deleteMany({ where: { businessId } })
        await db.qrScan.deleteMany({ where: { businessId } })
        await db.qrCode.deleteMany({ where: { businessId } })
      }
      if (adminSupabaseId) {
        await db.adminUser.deleteMany({ where: { supabaseUserId: adminSupabaseId } })
      }
      if (orderId) {
        await db.creativeSubmission.deleteMany({ where: { orderId } })
        await db.order.delete({ where: { id: orderId } })
      }
      if (businessId) await db.business.delete({ where: { id: businessId } })
      if (spotId) await db.campaignSpot.delete({ where: { id: spotId } })
      if (campaignId) await db.campaign.delete({ where: { id: campaignId } })
      if (categoryId) await db.businessCategory.delete({ where: { id: categoryId } })
      if (advertiserId) await db.advertiser.delete({ where: { id: advertiserId } })
      console.log("🧹 Emergency cleanup completed.")
    } catch (cleanupErr) {
      console.error("🧹 Emergency cleanup failed:", cleanupErr)
    }

    process.exit(1)
  }
}

runLifecycleE2E()
