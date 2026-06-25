import assert from "node:assert/strict"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { TRPCError } from "@trpc/server"
import { GET as cronRemindersGet } from "../../app/api/cron/send-reminders/route"

console.log("🧪 Running validationAndCron.test.ts...")

async function runTests() {
  const timestamp = Date.now()
  const testId = `valcron-${timestamp}`
  
  let categoryId = ""
  let campaignId = ""
  let spotId = ""
  let advertiserId = ""
  let orderId = ""
  let businessId = ""
  let ownerUserId = `sb-user-${testId}`
  let advertiserEmail = `merchant-cron-${timestamp}@test.com`

  try {
    // 1. Seed database records
    const category = await db.businessCategory.create({
      data: {
        name: `ValCron Category ${testId}`,
        slug: `valcron-cat-${testId}`,
      },
    })
    categoryId = category.id

    const campaign = await db.campaign.create({
      data: {
        name: `ValCron Campaign ${testId}`,
        slug: `valcron-camp-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 5000,
        estimatedMailDate: new Date(),
        status: "ACTIVE",
      },
    })
    campaignId = campaign.id

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: category.id,
        label: "ValCron Test Spot",
        price: 39000,
        x: 10,
        y: 10,
        width: 10,
        height: 10,
        side: "FRONT",
      },
    })
    spotId = spot.id

    const advertiser = await db.advertiser.create({
      data: {
        contactName: "ValCron Tester",
        businessName: `ValCron Biz ${testId}`,
        email: advertiserEmail,
        phone: "555-0999",
        website: "https://valcrontest.com",
      },
    })
    advertiserId = advertiser.id

    // Create a PAID order 4 days ago to trigger creative reminders
    const fourDaysAgo = new Date()
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4)

    const order = await db.order.create({
      data: {
        campaignId: campaign.id,
        campaignSpotId: spot.id,
        advertiserId: advertiser.id,
        amount: 39000,
        creativeSubmissionToken: `creative-rem-${testId}`,
        status: "PAID",
        paidAt: fourDaysAgo,
      },
    })
    orderId = order.id

    const business = await db.business.create({
      data: {
        advertiserId: advertiser.id,
        name: advertiser.businessName,
        slug: `valcron-biz-${testId}`,
        email: advertiserEmail,
        status: "ACTIVE",
        ownerUserId: ownerUserId,
      },
    })
    businessId = business.id

    // 2. Instantiate tRPC Caller
    const createCaller = createCallerFactory(appRouter)
    const merchantCaller = createCaller({
      db,
      user: { id: ownerUserId, email: advertiserEmail } as any,
      supabase: {} as any,
    })

    // 3. Test updateProfile input sanitation
    console.log("   👉 Testing updateProfile input sanitation (valid phone and website formats)...")
    const updateResult = await merchantCaller.business.updateProfile({
      name: `ValCron Biz Updated ${testId}`,
      phone: "555 123 4567",
      website: "my-site.com",
      logoUrl: "http://my-logo.com",
      coverImageUrl: "https://my-cover.com/img.jpg",
    })

    assert.strictEqual(updateResult.phone, "(555) 123-4567", "Phone number should be formatted cleanly")
    assert.strictEqual(updateResult.website, "https://my-site.com/", "Website URL should be normalized with https prefix")
    assert.strictEqual(updateResult.logoUrl, "http://my-logo.com/", "Logo URL should be normalized (preserving http)")
    assert.strictEqual(updateResult.coverImageUrl, "https://my-cover.com/img.jpg", "Cover image URL should be normalized")

    // Verify it updated in DB
    const dbBusiness = await db.business.findUnique({ where: { id: businessId } })
    assert.ok(dbBusiness)
    assert.strictEqual(dbBusiness.phone, "(555) 123-4567")
    assert.strictEqual(dbBusiness.website, "https://my-site.com/")

    // 4. Test updateProfile input validation (invalid formats)
    console.log("   👉 Testing updateProfile input validation error throws...")
    
    // Invalid Phone
    await assert.rejects(
      async () => {
        await merchantCaller.business.updateProfile({
          name: `ValCron Biz Updated ${testId}`,
          phone: "123", // too short
        })
      },
      (err: any) => {
        return err instanceof TRPCError && err.code === "BAD_REQUEST" && err.message.includes("at least 10 digits")
      },
      "Should reject short phone number with BAD_REQUEST"
    )

    // Invalid URL schema (javascript:)
    await assert.rejects(
      async () => {
        await merchantCaller.business.updateProfile({
          name: `ValCron Biz Updated ${testId}`,
          website: "javascript:alert(1)",
        })
      },
      (err: any) => {
        return err instanceof TRPCError && err.code === "BAD_REQUEST" && err.message.includes("valid website URL")
      },
      "Should reject javascript URL scheme"
    )

    // Invalid URL schema (data:)
    await assert.rejects(
      async () => {
        await merchantCaller.business.updateProfile({
          name: `ValCron Biz Updated ${testId}`,
          logoUrl: "data:image/png;base64,123",
        })
      },
      (err: any) => {
        return err instanceof TRPCError && err.code === "BAD_REQUEST" && err.message.includes("valid logo image URL")
      },
      "Should reject data URL scheme"
    )

    // 5. Test Cron API Route Programmatically (BEFORE creative details are submitted)
    console.log("   👉 Testing Cron Reminders API Route handler...")
    const response = await cronRemindersGet()
    assert.strictEqual(response.status, 200, "Cron handler should return 200 status")
    
    const body = await response.json()
    assert.strictEqual(body.success, true, "Cron handler should succeed")
    assert.ok(body.totalSent >= 1, "Should send at least 1 reminder for the overdue seed order")

    // Test Cron Idempotency: Trigger again, should send 0
    console.log("   👉 Testing Cron Reminders API Route idempotency...")
    const response2 = await cronRemindersGet()
    const body2 = await response2.json()
    assert.strictEqual(body2.success, true)
    assert.strictEqual(body2.totalSent, 0, "Subsequent cron runs should send 0 reminders")

    // 6. Test creative.upsert input sanitation
    console.log("   👉 Testing creative.upsert input sanitation...")
    const creativeResult = await merchantCaller.creative.upsert({
      token: order.creativeSubmissionToken,
      businessName: `ValCron Biz ${testId}`,
      phone: " 210-555-9988 ",
      website: " creative-portal.org/home ",
      logoUrl: "https://images.com/my-logo.png",
    })

    assert.strictEqual(creativeResult.phone, "(210) 555-9988", "Creative phone should be formatted")
    assert.strictEqual(creativeResult.website, "https://creative-portal.org/home", "Creative website URL should be normalized")
    assert.strictEqual(creativeResult.logoUrl, "https://images.com/my-logo.png", "Creative logo URL should be normalized")

    // Check associated business updates
    const associatedBusiness = await db.business.findUnique({ where: { id: businessId } })
    assert.ok(associatedBusiness)
    assert.strictEqual(associatedBusiness.phone, "(210) 555-9988")
    assert.strictEqual(associatedBusiness.website, "https://creative-portal.org/home")

    // 7. Test creative.upsert input validation error throws
    console.log("   👉 Testing creative.upsert input validation error throws...")
    await assert.rejects(
      async () => {
        await merchantCaller.creative.upsert({
          token: order.creativeSubmissionToken,
          phone: "999", // invalid
        })
      },
      (err: any) => {
        return err instanceof TRPCError && err.code === "BAD_REQUEST"
      },
      "Should reject invalid phone in creative upsert"
    )

    console.log("   ✅ All validation and cron integration tests passed successfully!")

  } finally {
    // 8. Clean up seeded records
    console.log("🧹 Cleaning up validation and cron test database records...")
    await db.emailLog.deleteMany({ where: { toEmail: advertiserEmail } })
    if (businessId) await db.business.delete({ where: { id: businessId } })
    if (orderId) {
      await db.creativeSubmission.deleteMany({ where: { orderId: orderId } })
      await db.order.delete({ where: { id: orderId } })
    }
    if (spotId) await db.campaignSpot.delete({ where: { id: spotId } })
    if (campaignId) await db.campaign.delete({ where: { id: campaignId } })
    if (categoryId) await db.businessCategory.delete({ where: { id: categoryId } })
    if (advertiserId) await db.advertiser.delete({ where: { id: advertiserId } })
    console.log("✅ Cleanup finished cleanly.")
  }
}

runTests().catch((err) => {
  console.error("❌ Test failed:")
  console.error(err)
  process.exit(1)
})
