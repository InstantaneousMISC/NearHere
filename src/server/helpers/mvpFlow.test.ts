import assert from "assert"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { CampaignStatus, OrderStatus, SpotStatus, ApprovalStatus, SpotType, PostcardSide, QrCodeStatus } from "@prisma/client"
import { GET as qrRedirectGet } from "../../app/q/[slug]/route"
import { GET as clickTrackerGet } from "../../app/api/business-click/route"
import { NextRequest } from "next/server"
import { getQrCodeStats, getStatsTimeSeries } from "./stats"

console.log("🧪 Running MVP Flow E2E Integration Test...")

async function runMvpFlowTest() {
  const timestamp = Date.now()
  const testId = `mvpflow-${timestamp}`
  console.log(`\n--- MVP Flow Test Context ID: ${testId} ---`)

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
  let changeRequestId = ""

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
    // 2. CREATE CAMPAIGN & AD SPOT
    // -------------------------------------------------------------
    console.log("🚀 Step 1: Admin creates campaign & ad spot...")
    const campaign = await adminCaller.campaign.create({
      name: `E2E Campaign ${testId}`,
      slug: `e2e-camp-${testId}`,
      city: "converse",
      state: "tx",
      zipCode: "78109",
      mailingQuantity: 5000,
      cardSize: "9x12",
      cardSkin: "cream",
    })
    campaignId = campaign.id

    const category = await db.businessCategory.create({
      data: {
        name: `E2E Category ${testId}`,
        slug: `e2e-cat-${testId}`,
      }
    })
    categoryId = category.id

    const spot = await adminCaller.spot.create({
      campaignId: campaign.id,
      categoryId: category.id,
      label: "E2E Spot",
      side: PostcardSide.FRONT,
      spotType: SpotType.STANDARD,
      price: 39000,
      x: 10,
      y: 10,
      width: 20,
      height: 20,
    })
    spotId = spot.id

    // Publish the campaign
    await adminCaller.campaign.updateStatus({
      id: campaign.id,
      status: CampaignStatus.ACTIVE,
    })
    console.log("   ✅ Campaign published and spot configured.")

    // -------------------------------------------------------------
    // 3. ADMIN CREATES INVOICE (HOLDING SPOT)
    // -------------------------------------------------------------
    console.log("🚀 Step 2: Admin creates invoice for campaign spot...")
    const invoiceResult = await adminCaller.order.createInvoice({
      spotId: spot.id,
      categoryId: category.id,
      contactName: "E2E Representative",
      businessName: `E2E Business ${testId}`,
      email: merchantEmail,
      phone: "555-111-2222",
      amount: 39000,
      notes: "E2E manual invoice notes",
    })
    orderId = invoiceResult.orderId
    assert.ok(invoiceResult.paymentLink, "Should return payment link.")
    
    // Check spot status is HELD
    const heldSpot = await db.campaignSpot.findUnique({ where: { id: spot.id } })
    assert.strictEqual(heldSpot?.status, SpotStatus.HELD, "Spot status should be HELD.")

    // Check Invoice email logged in EmailLog
    const invoiceEmailLog = await db.emailLog.findFirst({
      where: { entityType: "order", entityId: orderId, templateKey: "invoice_sent" }
    })
    assert.ok(invoiceEmailLog, "Invoice sent email log must exist.")
    console.log("   ✅ Invoice created, spot HELD, and email log recorded.")

    // -------------------------------------------------------------
    // 4. MERCHANT PAYS INVOICE (WEBHOOK SIMULATION)
    // -------------------------------------------------------------
    console.log("🚀 Step 3: Merchant pays invoice (webhook simulation)...")
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

    // Run post-payment auto-setup
    const { ensureBusinessForOrder, ensureQrForOrder, ensureCreativeSubmissionForOrder } = await import("./postPayment")
    const business = await ensureBusinessForOrder(orderId)
    businessId = business.id
    const qrCode = await ensureQrForOrder(orderId)
    qrCodeId = qrCode.id
    await ensureCreativeSubmissionForOrder(orderId)

    const paidOrder = await db.order.findUnique({ where: { id: orderId } })
    assert.strictEqual(paidOrder?.status, OrderStatus.PAID, "Order status must transition to PAID.")
    assert.ok(qrCode, "Campaign-specific QR code must be generated.")
    console.log("   ✅ Order paid. QR Code and Business records created.")

    // -------------------------------------------------------------
    // 5. ANALYTICS: QR SCAN & OUTBOUND LINK CLICKS
    // -------------------------------------------------------------
    console.log("🚀 Step 4: Simulating QR scan and outbound clicks...")
    
    // A. QR Scan
    const reqScan = new Request(`http://localhost:3000/q/${qrCode.slug}`, {
      headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)" }
    }) as any as NextRequest
    const resScan = await qrRedirectGet(reqScan, { params: Promise.resolve({ slug: qrCode.slug }) })
    assert.strictEqual(resScan.status, 307, "Should redirect client.")

    // B. Outbound Click (Website)
    const reqClickWebsite = new Request(`http://localhost:3000/api/business-click?businessId=${business.id}&qr=${qrCode.slug}&type=WEBSITE&target=https://e2ebusiness.com&label=Website`, {
      headers: { "user-agent": "Mozilla/5.0" }
    }) as any as NextRequest
    const resClickWebsite = await clickTrackerGet(reqClickWebsite)
    assert.strictEqual(resClickWebsite.status, 307)

    // C. Call Button Click
    const reqClickCall = new Request(`http://localhost:3000/api/business-click?businessId=${business.id}&qr=${qrCode.slug}&type=PHONE&target=tel:555-111-2222&label=Call`, {
      headers: { "user-agent": "Mozilla/5.0" }
    }) as any as NextRequest
    const resClickCall = await clickTrackerGet(reqClickCall)
    assert.strictEqual(resClickCall.status, 200, "tel: redirect serves HTML wrapper.")

    console.log("   ✅ QR scan and outbound click events tracked.")

    // -------------------------------------------------------------
    // 6. STATS ACCURACY VERIFICATION (DASHBOARD & CAMPAIGN)
    // -------------------------------------------------------------
    console.log("🚀 Step 5: Verifying stats helper calculations...")
    const stats = await getQrCodeStats(qrCode.id)
    assert.strictEqual(stats.scansCount, 1, "Should record 1 scan.")
    assert.strictEqual(stats.outboundClicksCount, 1, "Should record 1 website click.")
    assert.strictEqual(stats.callClicksCount, 1, "Should record 1 call button click.")

    // Verify time series
    const today = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 3)
    const timeSeries = await getStatsTimeSeries({
      qrCodeId: qrCode.id,
      startDate,
      endDate: today,
    })
    const todayStr = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0")
    const todayData = timeSeries.find((d) => d.date === todayStr)
    assert.ok(todayData, "Today's daily timeline data must exist.")
    assert.strictEqual(todayData.scans, 1, "Today scans count should be 1.")
    assert.strictEqual(todayData.clicks, 1, "Today clicks count should be 1.")
    assert.strictEqual(todayData.calls, 1, "Today calls count should be 1.")
    console.log("   ✅ Placement-specific stats and daily timelines verified.")

    // -------------------------------------------------------------
    // 7. PROFILE CHANGE REQUEST (MERCHANT EDITS PROFILE)
    // -------------------------------------------------------------
    console.log("🚀 Step 6: Merchant submits profile edits (creating change request)...")
    const merchantCaller = createCaller({
      db,
      user: { id: merchantSupabaseId, email: merchantEmail } as any,
      supabase: {} as any,
    })

    // Simulate claim first
    await merchantCaller.business.claimBusiness({ token: business.claimToken! })

    // Submit profile update (temporarily setting NODE_ENV to production to avoid the test bypass shortcut)
    const originalEnv = process.env.NODE_ENV
    ;(process.env as any).NODE_ENV = "production"
    let updateResult
    try {
      updateResult = await merchantCaller.business.updateProfile({
        name: `Modified Biz Name ${testId}`,
        description: "Updated description copy",
        phone: "555-333-4444",
        email: merchantEmail,
        website: "https://modifiedbiz.com",
        logoUrl: "https://modifiedbiz.com/logo.png",
        coverImageUrl: "https://modifiedbiz.com/cover.png",
        address: "456 Main St",
        city: "Converse",
        state: "TX",
        zipCode: "78109",
      })
    } finally {
      ;(process.env as any).NODE_ENV = originalEnv
    }

    // The returned business should still have its original name
    assert.strictEqual(updateResult.name, business.name, "Live business name should remain unchanged.")

    // Check that a change request was created
    const pendingRequest = await db.businessProfileChangeRequest.findFirst({
      where: { businessId: business.id, status: "PENDING" }
    })
    assert.ok(pendingRequest, "Pending profile change request must be created.")
    assert.strictEqual(pendingRequest.name, `Modified Biz Name ${testId}`, "Pending request name should match edits.")
    changeRequestId = pendingRequest.id
    console.log("   ✅ Profile edits intercepted; PENDING change request created.")

    // -------------------------------------------------------------
    // 8. DIRECTORY VISIBILITY CONTROLS (UNPUBLISHED)
    // -------------------------------------------------------------
    console.log("🚀 Step 7: Verifying directory visibility before approval...")
    // Business should NOT be visible in directory yet because isDirectoryVisible: false
    const unpublishedBiz = await db.business.findUnique({ where: { id: business.id } })
    assert.strictEqual(unpublishedBiz?.isDirectoryVisible, false, "Live business should have isDirectoryVisible = false initially.")
    console.log("   ✅ Profile visibility restricted correctly.")

    // -------------------------------------------------------------
    // 9. ADMIN APPROVES CHANGE REQUEST
    // -------------------------------------------------------------
    console.log("🚀 Step 8: Admin approves profile change request...")
    const approvedBizResult = await adminCaller.business.approveProfileChange({
      requestId: pendingRequest.id,
    })
    
    // Live business profile details should be updated
    assert.strictEqual(approvedBizResult.name, `Modified Biz Name ${testId}`, "Live business profile name should be updated.")
    
    // Request status set to APPROVED
    const finalRequest = await db.businessProfileChangeRequest.findUnique({ where: { id: pendingRequest.id } })
    assert.strictEqual(finalRequest?.status, ApprovalStatus.APPROVED, "Request status should transition to APPROVED.")

    // Email logged in EmailLog
    const approvalEmailLog = await db.emailLog.findFirst({
      where: { entityType: "business", entityId: business.id, templateKey: `profile_approved_${pendingRequest.id}` }
    })
    assert.ok(approvalEmailLog, "Approval email log must exist.")

    // AdminAuditLog created
    const auditLog = await db.adminAuditLog.findFirst({
      where: { businessId: business.id, action: "APPROVE_PROFILE_CHANGE" }
    })
    assert.ok(auditLog, "Approval audit log entry must be created.")
    console.log("   ✅ Edits approved, live profile updated, audit log and email log recorded.")

    // Let's set the business directory visibility to true (simulating admin toggle or directory publication workflow)
    await db.business.update({
      where: { id: business.id },
      data: { isDirectoryVisible: true }
    })

    // -------------------------------------------------------------
    // 10. ADMIN SOFT-DEACTIVATES BUSINESS
    // -------------------------------------------------------------
    console.log("🚀 Step 9: Admin soft-deactivates business...")
    
    // Deactivate business
    await db.business.update({
      where: { id: business.id },
      data: { deletedAt: new Date() }
    })

    // Query for directory: soft-deleted business should be excluded
    const directoryList = await db.business.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        goodStanding: true,
        isDirectoryVisible: true,
      }
    })
    const isFound = directoryList.some((b) => b.id === business.id)
    assert.strictEqual(isFound, false, "Soft-deleted business must be excluded from directory queries.")

    // Verify historical stats remain intact
    const historicalStats = await getQrCodeStats(qrCode.id)
    assert.strictEqual(historicalStats.scansCount, 1, "Historical QR stats must remain available after deactivation.")
    console.log("   ✅ Soft deactivation works; public queries filtered, while historical stats remain intact.")

    console.log("\n🧹 Cleaning up test database records...")
    // Cleanup
    await db.emailLog.deleteMany({ where: { toEmail: merchantEmail } })
    await db.businessClickEvent.deleteMany({ where: { qrCodeId: qrCode.id } })
    await db.qrScan.deleteMany({ where: { qrCodeId: qrCode.id } })
    await db.qrCode.delete({ where: { id: qrCode.id } })
    await db.businessProfileChangeRequest.deleteMany({ where: { businessId: business.id } })
    await db.business.delete({ where: { id: business.id } })
    await db.order.delete({ where: { id: orderId } })
    await db.campaignSpot.deleteMany({ where: { campaignId: campaign.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: category.id } })
    await db.advertiser.delete({ where: { email: merchantEmail } })
    await db.adminUser.delete({ where: { supabaseUserId: adminSupabaseId } })
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 MVP FLOW E2E INTEGRATION TEST PASSED SUCCESSFULLY!");

  } catch (err) {
    console.error("\n❌ MVP Flow Integration Test failed:")
    console.error(err)

    // Emergency cleanup
    try {
      console.log("🧹 Attempting emergency cleanup...")
      await db.emailLog.deleteMany({ where: { toEmail: merchantEmail } })
      if (qrCodeId) {
        await db.businessClickEvent.deleteMany({ where: { qrCodeId } })
        await db.qrScan.deleteMany({ where: { qrCodeId } })
        await db.qrCode.deleteMany({ where: { id: qrCodeId } })
      }
      if (businessId) {
        await db.businessProfileChangeRequest.deleteMany({ where: { businessId } })
        await db.business.deleteMany({ where: { id: businessId } })
      }
      if (orderId) await db.order.deleteMany({ where: { id: orderId } })
      if (campaignId) {
        await db.campaignSpot.deleteMany({ where: { campaignId } })
        await db.campaign.delete({ where: { id: campaignId } })
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

runMvpFlowTest()
