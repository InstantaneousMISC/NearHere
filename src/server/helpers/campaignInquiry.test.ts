import assert from "assert"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { CampaignInquiryStatus, CampaignStatus } from "@prisma/client"
import { TRPCError } from "@trpc/server"

console.log("🧪 Running Campaign Inquiry Flow Integration Tests...")

async function runInquiryTests() {
  const timestamp = Date.now()
  const testId = `inq-test-${timestamp}`
  console.log(`\n--- Inquiry Test Context ID: ${testId} ---`)

  const createCaller = createCallerFactory(appRouter)

  // Seeded records tracking for cleanup
  const adminSupabaseId = `admin-sb-${testId}`
  const nonAdminSupabaseId = `merchant-sb-${testId}`
  const adminEmail = `admin-${testId}@localspotmailers.com`
  const nonAdminEmail = `merchant-${testId}@test.com`

  // Override ADMIN_INQUIRY_EMAIL for test assertions
  process.env.ADMIN_INQUIRY_EMAIL = adminEmail

  let campaignId = ""
  let inquiryId = ""

  try {
    // -------------------------------------------------------------
    // SETUP: Create Campaign and AdminUser
    // -------------------------------------------------------------
    console.log("⏳ Setting up test seed data...")
    const adminUser = await db.adminUser.create({
      data: {
        supabaseUserId: adminSupabaseId,
        email: adminEmail,
        name: "Test Admin",
      }
    })

    const campaign = await db.campaign.create({
      data: {
        name: `Test Inquiry Campaign ${testId}`,
        slug: `inq-camp-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 10000,
        status: CampaignStatus.ACTIVE,
      }
    })
    campaignId = campaign.id

    const publicCaller = createCaller({ db, user: null, supabase: {} as any })
    const nonAdminCaller = createCaller({
      db,
      user: { id: nonAdminSupabaseId, email: nonAdminEmail } as any,
      supabase: {} as any,
    })
    const adminCaller = createCaller({
      db,
      user: { id: adminSupabaseId, email: adminEmail } as any,
      supabase: {} as any,
    })

    console.log("✅ Seed data generated successfully.")

    // -------------------------------------------------------------
    // TEST 1: Public Inquiry Creation & Email Triggering
    // -------------------------------------------------------------
    console.log("\n🚀 Test 1: Testing public inquiry submission and email dispatch...")
    
    const inquiry = await publicCaller.campaignInquiry.create({
      campaignId: campaign.id,
      name: "Prospect Contact",
      businessName: "Prospect Business Ltd",
      email: `prospect-${testId}@test.com`,
      phone: "555-4321",
      businessCategory: "Restaurants",
      websiteOrFacebook: "prospectbusiness.com",
      interestType: "pricing",
      preferredContactMethod: "email",
      message: "Hello! We would like to learn more about the 9x12 shared postcard campaign reach.",
    })

    inquiryId = inquiry.id
    assert.ok(inquiry.id, "Inquiry should be created successfully.")
    assert.strictEqual(inquiry.status, CampaignInquiryStatus.NEW, "Inquiry should have status NEW.")
    assert.strictEqual(inquiry.businessName, "Prospect Business Ltd")
    assert.strictEqual(inquiry.name, "Prospect Contact")

    // Check if email logs were triggered
    const prospectEmailLog = await db.emailLog.findFirst({
      where: {
        toEmail: `prospect-${testId}@test.com`,
        templateKey: "campaign_inquiry_prospect_confirmation",
        entityId: inquiry.id,
      }
    })
    assert.ok(prospectEmailLog, "Should record an EmailLog for prospect confirmation.")

    const adminEmailLog = await db.emailLog.findFirst({
      where: {
        toEmail: adminEmail,
        templateKey: "campaign_inquiry_admin_alert",
        entityId: inquiry.id,
      }
    })
    assert.ok(adminEmailLog, "Should record an EmailLog for admin alert.")
    
    console.log("   ✅ Public submission works and correctly triggers confirmation and alert logs.")

    // -------------------------------------------------------------
    // TEST 1b: Optional Fields Omission Submission & Required Check
    // -------------------------------------------------------------
    console.log("\n🚀 Test 1b: Testing inquiry submission with required fields...")
    
    // Verify that missing required fields throws a validation error
    await assert.rejects(
      publicCaller.campaignInquiry.create({
        campaignId: campaign.id,
        businessName: "No Email Inc",
        // missing email, name, phone, preferredContactMethod
      } as any),
      (err: any) => {
        return true
      },
      "Submitting inquiry without required fields should be blocked by validation."
    )

    const minimalInquiry = await publicCaller.campaignInquiry.create({
      campaignId: campaign.id,
      name: "Minimal Contact",
      businessName: "Minimalist Business Corp",
      email: `minimal-${testId}@test.com`,
      phone: "555-0000",
      businessCategory: "Services",
      preferredContactMethod: "text",
      message: "Just trying to get in touch.",
    })

    assert.ok(minimalInquiry.id, "Minimal inquiry should be created successfully.")
    assert.strictEqual(minimalInquiry.businessName, "Minimalist Business Corp")
    assert.strictEqual(minimalInquiry.email, `minimal-${testId}@test.com`)
    assert.strictEqual(minimalInquiry.name, "Minimal Contact")
    assert.strictEqual(minimalInquiry.phone, "555-0000")
    assert.strictEqual(minimalInquiry.businessCategory, "Services")
    assert.strictEqual(minimalInquiry.preferredContactMethod, "text")

    // Verify it triggers a prospect confirmation email since email is provided
    const minimalProspectEmailLog = await db.emailLog.findFirst({
      where: {
        toEmail: `minimal-${testId}@test.com`,
        templateKey: "campaign_inquiry_prospect_confirmation",
        entityId: minimalInquiry.id,
      }
    })
    assert.ok(minimalProspectEmailLog, "Should send email to prospect if email is provided.")

    // Verify it still triggers an admin alert email
    const minimalAdminEmailLog = await db.emailLog.findFirst({
      where: {
        toEmail: adminEmail,
        templateKey: "campaign_inquiry_admin_alert",
        entityId: minimalInquiry.id,
      }
    })
    assert.ok(minimalAdminEmailLog, "Should record an EmailLog for admin alert even for minimal inquiry.")

    console.log("   ✅ Inquiry with only required fields (including email) submitted successfully and alerted admin.")

    // -------------------------------------------------------------
    // TEST 2: Honeypot Spam Protection
    // -------------------------------------------------------------
    console.log("\n🚀 Test 2: Testing honeypot spam protection...")
    
    const honeypotRes = await publicCaller.campaignInquiry.create({
      campaignId: campaign.id,
      name: "Bot Name",
      businessName: "Bot Business",
      email: "bot@spam.com",
      phone: "555-0000",
      businessCategory: "Retail",
      preferredContactMethod: "text",
      honeypot: "some-bot-value",
    })

    assert.strictEqual(honeypotRes.id, "spam-inquiry-prevented", "Should return fake success response.")
    
    // Ensure it wasn't saved in the database
    const dbSpamInquiry = await db.campaignInquiry.findFirst({
      where: { email: "bot@spam.com" }
    })
    assert.strictEqual(dbSpamInquiry, null, "Spam inquiry should not be saved in database.")
    
    console.log("   ✅ Honeypot successfully intercepts spam submissions silently.")

    // -------------------------------------------------------------
    // TEST 3: Rate Limiting
    // -------------------------------------------------------------
    console.log("\n🚀 Test 3: Testing rate limiting protection...")
    
    await assert.rejects(
      publicCaller.campaignInquiry.create({
        campaignId: campaign.id,
        name: "Prospect Contact",
        businessName: "Prospect Business Ltd",
        email: `prospect-${testId}@test.com`, // Same email
        phone: "555-4321",
        businessCategory: "Restaurants",
        preferredContactMethod: "email",
      }),
      (err: any) => {
        assert.strictEqual(err.code, "TOO_MANY_REQUESTS")
        assert.ok(err.message.includes("submitted an inquiry recently"))
        return true
      },
      "Submitting duplicate inquiry within 60s should be blocked by rate limit."
    )

    console.log("   ✅ Rate limit blocks consecutive duplicate inquiries within 60 seconds.")

    // -------------------------------------------------------------
    // TEST 4: Admin Authorization & Listing
    // -------------------------------------------------------------
    console.log("\n🚀 Test 4: Testing admin authorization for inquiries list...")
    
    // Unauthenticated should fail
    await assert.rejects(
      publicCaller.campaignInquiry.list(),
      (err: any) => {
        assert.strictEqual(err.code, "UNAUTHORIZED")
        return true
      }
    )

    // Authenticated non-admin should fail
    await assert.rejects(
      nonAdminCaller.campaignInquiry.list(),
      (err: any) => {
        assert.strictEqual(err.code, "FORBIDDEN")
        return true
      }
    )

    // Admin should succeed
    const list = await adminCaller.campaignInquiry.list({ campaignId: campaign.id })
    assert.strictEqual(list.length, 2, "Should return exactly 2 inquiries for the campaign.")
    assert.ok(list.some(x => x.id === inquiryId), "List should contain the first inquiry.")
    
    console.log("   ✅ Listing inquiries is secured and correctly returns list for admin.")

    // -------------------------------------------------------------
    // TEST 5: Admin Update Status
    // -------------------------------------------------------------
    console.log("\n🚀 Test 5: Testing admin status updates...")
    
    const updated = await adminCaller.campaignInquiry.updateStatus({
      id: inquiryId,
      status: CampaignInquiryStatus.CONTACTED,
    })
    
    assert.strictEqual(updated.status, CampaignInquiryStatus.CONTACTED)
    
    const dbInquiry = await db.campaignInquiry.findUniqueOrThrow({ where: { id: inquiryId } })
    assert.strictEqual(dbInquiry.status, CampaignInquiryStatus.CONTACTED, "Database status should be CONTACTED.")
    
    console.log("   ✅ Status updates function correctly.")

    // -------------------------------------------------------------
    // TEST 6: Admin Update Assignment
    // -------------------------------------------------------------
    console.log("\n🚀 Test 6: Testing admin representative assignment...")
    
    const assigned = await adminCaller.campaignInquiry.updateAssignedTo({
      id: inquiryId,
      assignedToAdminId: adminUser.id,
    })
    
    assert.strictEqual(assigned.assignedToAdminId, adminUser.id)
    
    const dbAssigned = await db.campaignInquiry.findUniqueOrThrow({ where: { id: inquiryId } })
    assert.strictEqual(dbAssigned.assignedToAdminId, adminUser.id, "Database assigned rep should be set.")
    
    console.log("   ✅ Representative assignment updates function correctly.")

    // -------------------------------------------------------------
    // TEST 7: Admin Update Internal Notes
    // -------------------------------------------------------------
    console.log("\n🚀 Test 7: Testing admin internal notes updates...")
    
    const noted = await adminCaller.campaignInquiry.updateInternalNotes({
      id: inquiryId,
      internalNotes: "Admin spoke to prospect, they are interested in standard front spot.",
    })
    
    assert.strictEqual(noted.internalNotes, "Admin spoke to prospect, they are interested in standard front spot.")
    
    const dbNoted = await db.campaignInquiry.findUniqueOrThrow({ where: { id: inquiryId } })
    assert.strictEqual(dbNoted.internalNotes, "Admin spoke to prospect, they are interested in standard front spot.", "Database notes should be updated.")
    
    console.log("   ✅ Internal notes updates function correctly.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...");
    await db.emailLog.deleteMany({
      where: {
        entityType: "campaign_inquiry",
        toEmail: { in: [adminEmail, `prospect-${testId}@test.com`] },
      }
    })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.adminUser.delete({ where: { id: adminUser.id } })
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 ALL CAMPAIGN INQUIRY TESTS PASSED SUCCESSFULLY!\n");

  } catch (err) {
    console.error("\n❌ Campaign Inquiry Integration Tests failed:")
    console.error(err)

    // Emergency cleanup
    try {
      console.log("🧹 Attempting emergency cleanup...")
      await db.emailLog.deleteMany({
        where: {
          entityType: "campaign_inquiry",
          toEmail: { in: [adminEmail, `prospect-${testId}@test.com`] },
        }
      })
      if (campaignId) {
        await db.campaign.deleteMany({ where: { id: campaignId } })
      }
      await db.adminUser.deleteMany({ where: { supabaseUserId: adminSupabaseId } })
      console.log("🧹 Emergency cleanup completed.")
    } catch (cleanupErr) {
      console.error("🧹 Emergency cleanup failed:", cleanupErr)
    }

    process.exit(1)
  }
}

runInquiryTests()
