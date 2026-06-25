import assert from "assert"
import crypto from "crypto"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { POST as webhookPost } from "../../app/api/stripe/webhook/route"
import {
  CampaignStatus,
  OrderStatus,
  SpotStatus,
  ApprovalStatus,
  SpotType,
  PostcardSide,
  CampaignOfferDiscountType,
  CampaignOfferStatus,
  CampaignOfferEventType,
} from "@prisma/client"

console.log("🧪 Running Front-to-Back Campaign Offer Card & Creative Flow Tests...")

async function runFrontToBackTest() {
  const timestamp = Date.now()
  const testId = `ftb-test-${timestamp}`
  console.log(`\n--- Front-to-Back Context ID: ${testId} ---`)

  const createCaller = createCallerFactory(appRouter)

  // References for cleanup
  let adminSupabaseUserId = `admin-sb-ftb-${testId}`
  let merchantSupabaseUserId = `merchant-sb-ftb-${testId}`
  let adminEmail = `admin-ftb-${testId}@localspotmailers.com`
  let merchantEmail = `buyer-ftb-${testId}@test.com`

  let campaignId = ""
  let categoryId = ""
  let spotId = ""
  let offerId = ""
  let offerToken = ""
  let orderId = ""
  let businessId = ""
  let advertiserId = ""
  let adminUserId = ""

  try {
    // -------------------------------------------------------------
    // 1. SETUP: Create Admin and Campaign
    // -------------------------------------------------------------
    console.log("⏳ Setting up database test records...")
    
    // Create admin user
    const adminUser = await db.adminUser.create({
      data: {
        supabaseUserId: adminSupabaseUserId,
        email: adminEmail,
        name: "Admin Rep Jim",
      },
    })
    adminUserId = adminUser.id

    const adminCaller = createCaller({
      db,
      user: { id: adminUser.supabaseUserId, email: adminUser.email } as any,
      supabase: {} as any,
    })

    // Create category
    const category = await db.businessCategory.create({
      data: {
        name: `FTB Category ${testId}`,
        slug: `ftb-cat-${testId}`,
        allowsMultipleAdvertisers: false,
      },
    })
    categoryId = category.id

    // Create campaign via admin caller
    const campaign = await adminCaller.campaign.create({
      name: `FTB Campaign ${testId}`,
      slug: `ftb-camp-${testId}`,
      city: "converse",
      state: "tx",
      zipCode: "78109",
      mailingQuantity: 5000,
      cardSize: "9x12",
      cardSkin: "cream",
    })
    campaignId = campaign.id

    // Verify campaign status starts in DRAFT
    assert.strictEqual(campaign.status, CampaignStatus.DRAFT)

    // Publish campaign to ACTIVE
    await adminCaller.campaign.updateStatus({
      id: campaign.id,
      status: CampaignStatus.ACTIVE,
    })

    // Create standard ad spot in campaign
    const spot = await adminCaller.spot.create({
      campaignId: campaign.id,
      categoryId: category.id,
      label: "FTB Ad Placement Spot",
      side: PostcardSide.FRONT,
      spotType: SpotType.STANDARD,
      price: 49000, // $490.00
      x: 15,
      y: 15,
      width: 20,
      height: 20,
    })
    spotId = spot.id

    console.log("   ✅ Database test context initialized.")

    // -------------------------------------------------------------
    // 2. ADMIN CREATES CAMPAIGN OFFER (Door-to-door Flyer Card)
    // -------------------------------------------------------------
    console.log("\n🚀 Step 1: Admin creates a Campaign Offer card...")
    const offer = await adminCaller.campaignOffer.create({
      campaignId: campaign.id,
      name: "Converses Best Door-to-Door Discount",
      discountType: CampaignOfferDiscountType.AMOUNT_OFF,
      discountAmount: 15000, // $150.00 Off
      maxRedemptions: 5,
    })
    offerId = offer.id
    offerToken = offer.token

    assert.ok(offer.token, "Opaque token must be generated.")
    assert.strictEqual(offer.status, CampaignOfferStatus.ACTIVE)
    assert.strictEqual(offer.discountAmount, 15000)
    console.log(`   ✅ Campaign Offer Card created successfully. Token: ${offer.token}`)

    // -------------------------------------------------------------
    // 3. BUSINESS SCANS QR CODE (Arrives at /o/[token])
    // -------------------------------------------------------------
    console.log("\n🚀 Step 2: Business scans QR code (Publicly resolves offer)...")
    
    // Simulate user browser call to public getByToken
    const publicCaller = createCaller({
      db,
      user: null,
      supabase: {} as any,
    })

    // Public details lookup
    const resolvedOffer = await publicCaller.campaignOffer.getByToken({ token: offerToken })
    assert.strictEqual(resolvedOffer.name, "Converses Best Door-to-Door Discount")
    assert.strictEqual(resolvedOffer.promotedBy, "Converses Best Door-to-Door Discount / Admin Rep Jim")
    assert.strictEqual(resolvedOffer.redeemable, true)

    // Record scan event
    await publicCaller.campaignOffer.recordScan({ token: offerToken })

    // Check stats updated
    const offerScanChecked = await db.campaignOffer.findUnique({
      where: { id: offer.id },
      include: { events: true },
    })
    assert.strictEqual(offerScanChecked?.scanCount, 1)
    assert.strictEqual(offerScanChecked?.events[0].eventType, CampaignOfferEventType.SCAN)
    console.log("   ✅ Offer scan event registered and counts incremented.")

    // -------------------------------------------------------------
    // 4. BUSINESS GOES TO CHECKOUT & CREATES ORDER
    // -------------------------------------------------------------
    console.log("\n🚀 Step 3: Business selects spot & opens Checkout page...")
    
    // Record checkout start page event
    await publicCaller.campaignOffer.recordCheckoutStart({ token: offerToken })
    
    const offerStartChecked = await db.campaignOffer.findUnique({
      where: { id: offer.id },
    })
    assert.strictEqual(offerStartChecked?.checkoutStartCount, 1)

    // Create order with applied offerToken
    // Spot price is $490.00, discount is $150.00 -> final price $340.00 (34000 cents)
    const orderRes = await publicCaller.order.create({
      spotId: spot.id,
      categoryId: category.id,
      sessionId: `ftb-checkout-session-${testId}`,
      contactName: "FTB Business Owner",
      businessName: `FTB Plumbing Pros ${testId}`,
      email: merchantEmail,
      phone: "555-777-8888",
      website: "https://converseplumbingpros.com",
      offerToken,
    })

    assert.ok(orderRes.orderId)
    orderId = orderRes.orderId

    // Inspect order pricing & attribution
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { advertiser: true },
    })
    advertiserId = order?.advertiserId || ""

    assert.strictEqual(order?.status, OrderStatus.PENDING)
    assert.strictEqual(order?.amount, 34000, "Final order amount should be 34000 cents ($340.00)")
    assert.strictEqual(order?.campaignOfferId, offer.id)
    assert.strictEqual(order?.originalAmount, 49000)
    assert.strictEqual(order?.discountAmount, 15000)
    assert.strictEqual(order?.finalAmount, 34000)

    // Inspect reservedCount count updated
    const offerReserveChecked = await db.campaignOffer.findUnique({
      where: { id: offer.id },
    })
    assert.strictEqual(offerReserveChecked?.reservedCount, 1)
    console.log("   ✅ Order created with discounted pricing. Reservation recorded.")

    // -------------------------------------------------------------
    // 5. STRIPE PAYMENT SUCCESSFUL WEBHOOK
    // -------------------------------------------------------------
    console.log("\n🚀 Step 4: Stripe Webhook confirms successful payment...")
    
    // Set Stripe session ID on order
    await db.order.update({
      where: { id: orderId },
      data: { stripeCheckoutSessionId: `session-ftb-${testId}` },
    })

    // POST mock Webhook transaction
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

    // Verify order is PAID
    const orderPaid = await db.order.findUnique({ where: { id: orderId } })
    assert.strictEqual(orderPaid?.status, OrderStatus.PAID)

    // Verify spot is SOLD
    const spotSold = await db.campaignSpot.findUnique({ where: { id: spot.id } })
    assert.strictEqual(spotSold?.status, SpotStatus.SOLD)

    // Verify campaign offer stats transitioned to PAID (reserved -> 0, redeemed -> 1)
    const offerPaidChecked = await db.campaignOffer.findUnique({
      where: { id: offer.id },
      include: {
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
    })
    assert.strictEqual(offerPaidChecked?.reservedCount, 0)
    assert.strictEqual(offerPaidChecked?.redeemedCount, 1)
    assert.strictEqual(offerPaidChecked?.events[0].eventType, CampaignOfferEventType.PAID)
    console.log("   ✅ Webhook processed. Placements locked. Attribution statistics updated.")

    // -------------------------------------------------------------
    // 6. BUSINESS PROFILE CONFIGURATION
    // -------------------------------------------------------------
    console.log("\n🚀 Step 5: Business claims profile & updates details...")
    
    // Retrieve business profile created post-payment
    const business = await db.business.findFirst({
      where: { advertiserId },
    })
    assert.ok(business, "Business profile must be created.")
    businessId = business.id

    // Create merchant caller
    const merchantCaller = createCaller({
      db,
      user: { id: merchantSupabaseUserId, email: merchantEmail } as any,
      supabase: {} as any,
    })

    // Set business profile ownerUserId to associate with merchant
    await db.business.update({
      where: { id: business.id },
      data: { ownerUserId: merchantSupabaseUserId },
    })

    // Merchant updates their profile data
    const updatedProfile = await merchantCaller.business.updateProfile({
      name: "Converse Plumbing Pros (FTB Certified)",
      phone: "555-777-8888",
      email: merchantEmail,
      website: "https://converseplumbingpros.com",
      description: "Fast, reliable plumbing repairs in Converse, TX.",
      address: "100 Broadway St, Converse, TX 78109",
    })

    assert.strictEqual(updatedProfile.name, "Converse Plumbing Pros (FTB Certified)")
    assert.strictEqual(updatedProfile.description, "Fast, reliable plumbing repairs in Converse, TX.")
    assert.strictEqual(updatedProfile.address, "100 Broadway St, Converse, TX 78109")
    console.log("   ✅ Business profile details updated successfully.")

    // -------------------------------------------------------------
    // 7. BUSINESS SUBMITS AD COPY FLOW
    // -------------------------------------------------------------
    console.log("\n🚀 Step 6: Business uploads postcard ad copy details...")
    
    assert.ok(orderPaid?.creativeSubmissionToken)

    const submittedCreative = await merchantCaller.creative.upsert({
      token: orderPaid.creativeSubmissionToken,
      businessName: "Converse Plumbing Pros",
      headline: "Need A Plumber Fast?",
      offerDeal: "$50 OFF First Service Call",
      description: "Leaky faucets, clogged drains, water heater installs. Call Converse Plumbing Pros today!",
      cta: "Call Now (555) 777-8888",
      phone: "(555) 777-8888",
      website: "https://converseplumbingpros.com",
      address: "100 Broadway St",
      notes: "Please use blue color themes.",
    })

    assert.strictEqual(submittedCreative.headline, "Need A Plumber Fast?")
    assert.strictEqual(submittedCreative.offerDeal, "$50 OFF First Service Call")
    assert.strictEqual(submittedCreative.approvalStatus, ApprovalStatus.PENDING)
    console.log("   ✅ Ad copy details submitted. Creative pending admin review.")

    // -------------------------------------------------------------
    // 8. ADMIN APPROVES COPY & PRINT LOCK ENGAGES
    // -------------------------------------------------------------
    console.log("\n🚀 Step 7: Admin reviews & approves creative (Locking edits)...")
    
    await adminCaller.creative.updateApproval({
      submissionId: submittedCreative.id,
      approvalStatus: ApprovalStatus.APPROVED,
      approvalNotes: "Perfect layout copy. Ready for print.",
    })

    const approvedCreative = await db.creativeSubmission.findUnique({
      where: { id: submittedCreative.id },
    })
    assert.strictEqual(approvedCreative?.approvalStatus, ApprovalStatus.APPROVED)

    // Verify edit locks: Business tries to edit print-sensitive field (headline) -> should reject
    await assert.rejects(
      merchantCaller.creative.upsert({
        token: orderPaid.creativeSubmissionToken,
        businessName: "Converse Plumbing Pros",
        headline: "Tired of Drips?", // Print-sensitive edit!
      }),
      (err: any) => {
        assert.strictEqual(err.code, "FORBIDDEN")
        assert.ok(err.message.includes("print-sensitive") || err.message.includes("approved"))
        return true
      },
      "Business should be blocked from editing approved ad copy."
    )

    console.log("   ✅ Ad creative approved. Print lock successfully engaged.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...")
    
    // Clean up events & offers
    await db.campaignOfferEvent.deleteMany({ where: { campaignOfferId: offer.id } })
    await db.campaignOffer.delete({ where: { id: offer.id } })

    // Clean up order creative & business
    await db.emailLog.deleteMany({ where: { toEmail: merchantEmail } })
    await db.creativeReviewEvent.deleteMany({ where: { creativeSubmissionId: approvedCreative.id } })
    await db.creativeSubmission.delete({ where: { id: approvedCreative.id } })
    await db.qrCode.deleteMany({ where: { businessId: businessId } })
    await db.business.delete({ where: { id: businessId } })
    await db.order.delete({ where: { id: orderId } })
    await db.campaignSpot.deleteMany({ where: { campaignId } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: categoryId } })
    await db.advertiser.delete({ where: { id: advertiserId } })
    await db.adminUser.delete({ where: { id: adminUser.id } })
    
    console.log("✅ Cleanup finished cleanly.")
    console.log("\n🎉 FRONT-TO-BACK CAMPAIGN OFFER FLOW TEST PASSED SUCCESSFULLY!");

  } catch (err) {
    console.error("\n❌ Front-to-Back Test failed:")
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
      if (campaignId) {
        await db.campaignSpot.deleteMany({ where: { campaignId } })
        await db.campaign.delete({ where: { id: campaignId } })
      }
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

runFrontToBackTest()
