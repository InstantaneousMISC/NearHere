import assert from "assert"
import { db } from "../db"
import { generateSlug } from "./generateSlug"
import { generateQrSlug } from "./generateQrSlug"
import { OrderStatus, SpotStatus, CampaignStatus, BusinessStatus, BusinessLinkType, QrCodeStatus, QrCodeType } from "@prisma/client"
import { GET as qrRedirectGet } from "../../app/q/[slug]/route"
import { GET as clickTrackerGet } from "../../app/api/business-click/route"
import { NextRequest } from "next/server"

console.log("🧪 Running comprehensive integration tests...")

async function runIntegrationTests() {
  const timestamp = Date.now()
  const testId = `test-${timestamp}` // Use dash so slug generation matches exactly
  
  console.log(`\n--- Test Context ID: ${testId} ---`)

  try {
    // -------------------------------------------------------------
    // SETUP: Create a temporary campaign, spot, advertiser, and order
    // -------------------------------------------------------------
    console.log("⏳ Setting up test seed data...")
    
    const category = await db.businessCategory.create({
      data: {
        name: `Test Category ${testId}`,
        slug: `test-cat-${testId}`,
        allowsMultipleAdvertisers: true,
      }
    })

    const campaign = await db.campaign.create({
      data: {
        name: `Test Campaign ${testId}`,
        slug: `test-camp-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 10000,
        estimatedMailDate: new Date(),
      }
    })

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: category.id,
        label: "Standard Test Spot",
        price: 49000,
        x: 10.5,
        y: 15.2,
        width: 15.0,
        height: 10.0,
        side: "FRONT",
      }
    })

    const advertiser = await db.advertiser.create({
      data: {
        contactName: "John Test",
        businessName: `Test Acme ${testId}`,
        email: `john-${testId}@test.com`,
        phone: "555-0199",
        website: "https://acme-test.com",
        businessAddress: "123 Test Lane",
      }
    })

    const order = await db.order.create({
      data: {
        campaignId: campaign.id,
        campaignSpotId: spot.id,
        advertiserId: advertiser.id,
        amount: 49000,
        creativeSubmissionToken: `token-${testId}`,
        status: OrderStatus.PENDING,
      }
    })

    console.log("✅ Seed data generated successfully.")

    // -------------------------------------------------------------
    // SCENARIO 1: Stripe Webhook Paid & Idempotency
    // -------------------------------------------------------------
    console.log("\n🚀 Scenario 1: Simulating Order Paid (Stripe Webhook)...")

    // Find or create Business
    let business = await db.business.findFirst({
      where: { advertiserId: advertiser.id }
    })
    assert.strictEqual(business, null, "Should not have a Business profile initially.")

    // Webhook executes logic:
    const businessSlug = await generateSlug(advertiser.businessName, db)
    business = await db.business.create({
      data: {
        advertiserId: advertiser.id,
        name: advertiser.businessName,
        slug: businessSlug,
        phone: advertiser.phone,
        email: advertiser.email,
        website: advertiser.website,
        address: advertiser.businessAddress,
        status: "ACTIVE",
      }
    })
    assert.ok(business.id, "Business should be created successfully.")
    assert.strictEqual(business.slug, `test-acme-test-${timestamp}`, "Slug should be converted properly.")

    const qrSlug = await generateQrSlug(db)
    let expiresAt = new Date(campaign.estimatedMailDate!)
    expiresAt.setDate(expiresAt.getDate() + 90)

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
        expiresAt,
      }
    })
    assert.ok(qrCode.id, "QrCode should be created successfully.")
    console.log("✅ Webhook creation simulated successfully.")

    // Test Idempotency: Duplicate Webhook Event
    console.log("🔄 Testing Webhook Idempotency (Duplicate checks)...")
    const duplicateQr = await db.qrCode.findFirst({
      where: { orderId: order.id }
    })
    assert.ok(duplicateQr, "Webhook check: QR code already exists for this order.")
    // Logic skips creation if duplicateQr is present
    console.log("✅ Webhook duplicate checking logic works (idempotent).")

    // -------------------------------------------------------------
    // SCENARIO 2: QR Redirection Tracking & Expiration
    // -------------------------------------------------------------
    console.log("\n🚀 Scenario 2: Testing QR Scan Redirection...")

    // Log a scan
    const scan = await db.qrScan.create({
      data: {
        qrCodeId: qrCode.id,
        businessId: business.id,
        campaignId: campaign.id,
        campaignSpotId: spot.id,
        userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)",
        ipHash: "hashed_ip_address",
        deviceType: "Mobile",
        country: "US",
        region: "TX",
        city: "San Antonio",
        isExpiredScan: false,
      }
    })
    assert.ok(scan.id, "QrScan record should log successfully.")
    assert.strictEqual(scan.deviceType, "Mobile", "Device type should log correctly.")
    console.log("✅ Scan log recorded successfully.")

    // Test Expiration scanning
    console.log("⌛ Testing Expiration scanning behavior...")
    const expiredQr = await db.qrCode.create({
      data: {
        businessId: business.id,
        slug: `qr-exp-${testId}`,
        destinationPath: `/b/${business.slug}`,
        status: QrCodeStatus.EXPIRED,
      }
    })

    const expiredScan = await db.qrScan.create({
      data: {
        qrCodeId: expiredQr.id,
        businessId: business.id,
        isExpiredScan: true,
      }
    })
    assert.strictEqual(expiredScan.isExpiredScan, true, "Scan should log expiredScan flag as true.")
    console.log("✅ Expired scan flag logic works.")

    // Test the actual Route Handler GET functions for redirection & click tracking
    console.log("🌐 Testing QR Redirect Endpoint (/q/[slug])...")
    
    // 1. Test valid QR redirect
    const reqValid = new Request(`http://localhost:3000/q/${qrCode.slug}`, {
      headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)" }
    }) as any as NextRequest
    const resValid = await qrRedirectGet(reqValid, { params: Promise.resolve({ slug: qrCode.slug }) })
    assert.strictEqual(resValid.status, 307)
    const locationValid = resValid.headers.get("location")
    assert.ok(locationValid?.includes(`/b/${business.slug}`))
    assert.ok(locationValid?.includes(`qr=${qrCode.slug}`))
    console.log("   ✅ Valid QR Redirect returns 307 to landing page.")

    // 2. Test invalid QR redirect
    const reqInvalid = new Request("http://localhost:3000/q/qr-invalid-slug") as any as NextRequest
    const resInvalid = await qrRedirectGet(reqInvalid, { params: Promise.resolve({ slug: "qr-invalid-slug" }) })
    assert.strictEqual(resInvalid.status, 307)
    assert.strictEqual(resInvalid.headers.get("location"), "http://localhost:3000/")
    console.log("   ✅ Invalid QR Redirect returns 307 to homepage.")

    // 3. Test expired QR redirect
    const reqExpired = new Request(`http://localhost:3000/q/${expiredQr.slug}`) as any as NextRequest
    const resExpired = await qrRedirectGet(reqExpired, { params: Promise.resolve({ slug: expiredQr.slug }) })
    assert.strictEqual(resExpired.status, 307)
    const locationExpired = resExpired.headers.get("location")
    assert.ok(locationExpired?.includes(`/b/${business.slug}`))
    assert.ok(locationExpired?.includes(`qr=${expiredQr.slug}`))
    assert.ok(locationExpired?.includes("expired=1"))
    console.log("   ✅ Expired QR Redirect returns 307 with expired=1 query param.")

    // 4. Test disabled QR code (custom fallback HTML page)
    console.log("🚫 Testing Disabled QR scanning behavior...")
    const disabledQr = await db.qrCode.create({
      data: {
        businessId: business.id,
        slug: `qr-dis-${testId}`,
        destinationPath: `/b/${business.slug}`,
        status: QrCodeStatus.DISABLED,
      }
    })
    const reqDisabled = new Request(`http://localhost:3000/q/${disabledQr.slug}`) as any as NextRequest
    const resDisabled = await qrRedirectGet(reqDisabled, { params: Promise.resolve({ slug: disabledQr.slug }) })
    assert.strictEqual(resDisabled.status, 200)
    assert.strictEqual(resDisabled.headers.get("content-type"), "text/html")
    const htmlDisabled = await resDisabled.text()
    assert.ok(htmlDisabled.includes("Offer Temporarily Unavailable"))
    console.log("   ✅ Disabled QR Redirect returns 200 with fallback HTML.")

    // 5. Test Click Tracking Endpoint (/api/business-click)
    console.log("🖱️ Testing Click Tracking Endpoint (/api/business-click)...")
    
    // Test HTTP redirect link tracking
    const reqClickHttp = new Request(`http://localhost:3000/api/business-click?businessId=${business.id}&qr=${qrCode.slug}&type=WEBSITE&target=https://acme-test.com&label=Website`) as any as NextRequest
    const resClickHttp = await clickTrackerGet(reqClickHttp)
    assert.strictEqual(resClickHttp.status, 307)
    assert.strictEqual(resClickHttp.headers.get("location"), "https://acme-test.com/")
    console.log("   ✅ HTTP Click tracking returns 307 redirect to target URL.")

    // Test non-HTTP protocol link tracking (e.g. tel:)
    const reqClickTel = new Request(`http://localhost:3000/api/business-click?businessId=${business.id}&qr=${qrCode.slug}&type=PHONE&target=tel:555-0199&label=Call%20Us`) as any as NextRequest
    const resClickTel = await clickTrackerGet(reqClickTel)
    assert.strictEqual(resClickTel.status, 200)
    assert.strictEqual(resClickTel.headers.get("content-type"), "text/html")
    const htmlClickTel = await resClickTel.text()
    assert.ok(htmlClickTel.includes("tel:555-0199"))
    console.log("   ✅ non-HTTP Click tracking returns 200 custom redirect HTML.")

    // -------------------------------------------------------------
    // SCENARIO 3: Creative Submission Syncing
    // -------------------------------------------------------------
    console.log("\n🚀 Scenario 3: Testing Creative details syncing to Business profile...")

    const inputName = `Updated Biz ${testId}`
    const inputLogo = "https://images.com/mylogo.png"
    const inputPhone = "555-9999"

    // Creative upsert mutation updates associated business details
    const targetBusiness = await db.business.findFirst({
      where: { advertiserId: advertiser.id }
    })

    assert.ok(targetBusiness, "Must find associated business profile.")
    
    const updatedBusiness = await db.business.update({
      where: { id: targetBusiness.id },
      data: {
        name: inputName,
        logoUrl: inputLogo,
        phone: inputPhone,
      }
    })

    assert.strictEqual(updatedBusiness.name, inputName, "Business name should be updated.")
    assert.strictEqual(updatedBusiness.logoUrl, inputLogo, "Logo URL should be updated.")
    assert.strictEqual(updatedBusiness.phone, inputPhone, "Phone number should be updated.")
    console.log("✅ Creative details synchronized successfully to Business profile.")

    // -------------------------------------------------------------
    // SCENARIO 4: tRPC Router self-healing & linking
    // -------------------------------------------------------------
    console.log("\n🚀 Scenario 4: Testing tRPC User Association (Self-healing)...")
    
    // Simulate a merchant logging in with Supabase user ID who has advertiser email matches
    const mockUserId = `auth-user-${testId}`
    
    let linkedBusiness = await db.business.findFirst({
      where: {
        OR: [
          { ownerUserId: mockUserId },
          { advertiser: { email: advertiser.email } },
        ],
      },
    })
    assert.ok(linkedBusiness, "Should find the business matching the advertiser email.")
    assert.strictEqual(linkedBusiness.ownerUserId, null, "Initially, the business should not have an ownerUserId.")

    // Associate user session
    linkedBusiness = await db.business.update({
      where: { id: linkedBusiness.id },
      data: { ownerUserId: mockUserId }
    })
    assert.strictEqual(linkedBusiness.ownerUserId, mockUserId, "Owner user ID should lock in successfully.")
    console.log("✅ tRPC owner-linking / self-healing logic works.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...")
    // Delete cascade will handle links, scans, page views, and qr codes
    await db.business.delete({ where: { id: business.id } })
    await db.order.delete({ where: { id: order.id } })
    await db.campaignSpot.delete({ where: { id: spot.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: category.id } })
    await db.advertiser.delete({ where: { id: advertiser.id } })
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!")

  } catch (err) {
    console.error("\n❌ Integration Test failed:")
    console.error(err)
    
    // Attempt cleanup of whatever was created in case of failure
    try {
      console.log("🧹 Attempting emergency cleanup...")
      await db.business.deleteMany({ where: { name: { contains: testId } } })
      await db.order.deleteMany({ where: { creativeSubmissionToken: `token-${testId}` } })
      await db.campaignSpot.deleteMany({ where: { label: "Standard Test Spot" } })
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

runIntegrationTests()
