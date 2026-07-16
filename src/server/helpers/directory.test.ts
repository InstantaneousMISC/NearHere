import assert from "assert"
import { db } from "../db"
import { OrderStatus, ApprovalStatus } from "@prisma/client"
import { syncBusinessToDirectory, checkProfileQuality } from "./directorySync"

console.log("🧪 Running comprehensive directory integration tests...")

async function runDirectoryTests() {
  const timestamp = Date.now()
  const testId = `dir-test-${timestamp}`
  
  console.log(`\n--- Directory Test Context ID: ${testId} ---`)

  try {
    // -------------------------------------------------------------
    // SETUP: Seed campaign category, campaign, spot, advertiser, order, and business
    // -------------------------------------------------------------
    console.log("⏳ Setting up directory test seed data...")

    const campaignCategory = await db.businessCategory.create({
      data: {
        name: `Campaign Category ${testId}`,
        slug: `camp-cat-${testId}`,
      }
    })

    const campaign = await db.campaign.create({
      data: {
        name: `Directory Campaign ${testId}`,
        slug: `dir-camp-${testId}`,
        city: "Converse",
        state: "TX",
        mailingQuantity: 10000,
      }
    })

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: campaignCategory.id,
        label: "Directory Spot",
        price: 39500,
        x: 10.0,
        y: 10.0,
        width: 10.0,
        height: 10.0,
        side: "FRONT",
      }
    })

    const advertiser = await db.advertiser.create({
      data: {
        contactName: "John Directory",
        businessName: `Dir Acme ${testId}`,
        email: `john-dir-${timestamp}@test.com`,
        phone: "555-0100",
        website: "https://acme-dir-test.com",
      }
    })

    const order = await db.order.create({
      data: {
        campaignId: campaign.id,
        campaignSpotId: spot.id,
        advertiserId: advertiser.id,
        amount: 39500,
        creativeSubmissionToken: `token-dir-${testId}`,
        status: OrderStatus.PAID,
      }
    })

    const business = await db.business.create({
      data: {
        advertiserId: advertiser.id,
        name: advertiser.businessName,
        slug: `acme-dir-${timestamp}`,
        phone: advertiser.phone,
        email: advertiser.email,
        website: advertiser.website,
        city: "Converse",
        state: "TX",
        address: "123 Main St, Converse, TX 78109",
        status: "ACTIVE",
        isDirectoryVisible: true,
        goodStanding: true,
      }
    })

    const creative = await db.creativeSubmission.create({
      data: {
        orderId: order.id,
        businessName: advertiser.businessName,
        logoUrl: "https://acme-dir-test.com/logo.png",
        description: "Short desc", // under 20 chars
        phone: advertiser.phone,
        website: advertiser.website,
        address: business.address,
        serviceArea: "Converse and surrounding areas",
        approvalStatus: ApprovalStatus.PENDING,
      }
    })

    console.log("✅ Seed data setup complete.")

    // -------------------------------------------------------------
    // TEST 1: Initial Sync Creates DRAFT Profile
    // -------------------------------------------------------------
    console.log("\n🚀 Test 1: Running initial syncBusinessToDirectory...")
    await syncBusinessToDirectory(business.id)

    const profile = await db.directoryProfile.findUnique({
      where: { businessId: business.id },
      include: {
        locations: {
          include: { city: { include: { state: true } } }
        },
        categories: {
          include: { directoryCategory: true }
        }
      }
    })

    assert.ok(profile, "DirectoryProfile should be created.")
    assert.strictEqual(profile.name, business.name, "Name should match.")
    assert.strictEqual(profile.status, "DRAFT", "Initial status should be DRAFT due to pending creative and short desc.")
    assert.strictEqual(profile.isIndexed, "NOINDEX", "Initial indexing should be NOINDEX.")

    // Check locations
    assert.strictEqual(profile.locations.length, 1, "Should have 1 location associated.")
    const location = profile.locations[0]
    assert.strictEqual(location.city.name, "Converse", "City name should match.")
    assert.strictEqual(location.city.state.name, "Texas", "State name should be resolved.")

    // Check categories
    assert.strictEqual(profile.categories.length, 1, "Should have 1 category associated.")
    const catLink = profile.categories[0]
    assert.strictEqual(catLink.directoryCategory.name, campaignCategory.name, "Category name should match.")

    console.log("✅ Initial sync verified (created draft profile and linked hierarchy).")

    // -------------------------------------------------------------
    // TEST 2: Quality Check evaluation
    // -------------------------------------------------------------
    console.log("\n🚀 Test 2: Verifying checkProfileQuality returns false for thin profile...")
    const meetsQuality1 = await checkProfileQuality(profile.id)
    assert.strictEqual(meetsQuality1, false, "Should fail quality check because description is short and creative is pending.")
    console.log("✅ Quality checks correctly identified thin profile.")

    // -------------------------------------------------------------
    // TEST 3: Sync auto-publishes when quality bar is met
    // -------------------------------------------------------------
    console.log("\n🚀 Test 3: Updating profile content and approval status to meet quality check...")
    
    // Update description and creative approval
    await db.creativeSubmission.update({
      where: { id: creative.id },
      data: {
        description: "This is a much longer description that exceeds twenty characters easily.",
        approvalStatus: ApprovalStatus.APPROVED,
      }
    })

    // Run sync again
    await syncBusinessToDirectory(business.id)

    const updatedProfile = await db.directoryProfile.findUnique({
      where: { businessId: business.id }
    })

    assert.strictEqual(updatedProfile?.status, "PUBLISHED", "Profile should automatically transition to PUBLISHED.")
    assert.strictEqual(updatedProfile?.isIndexed, "INDEX", "Profile should automatically transition to INDEX.")
    console.log("✅ Profile automatically transitioned to PUBLISHED / INDEX status.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...")
    
    // Delete profile locations and categories
    await db.businessLocation.deleteMany({ where: { directoryProfileId: profile.id } })
    await db.businessDirectoryCategory.deleteMany({ where: { directoryProfileId: profile.id } })
    await db.directoryProfile.delete({ where: { id: profile.id } })
    
    // Delete base objects
    await db.creativeSubmission.delete({ where: { id: creative.id } })
    await db.business.delete({ where: { id: business.id } })
    await db.order.delete({ where: { id: order.id } })
    await db.campaignSpot.delete({ where: { id: spot.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: campaignCategory.id } })
    
    // Delete cities/states and directory categories generated by sync if they match test suffix
    await db.city.deleteMany({ where: { name: "Converse" } })
    await db.state.deleteMany({ where: { name: "Texas" } })
    await db.directoryCategory.deleteMany({ where: { name: campaignCategory.name } })

    console.log("✅ Cleanup finished cleanly.")
    console.log("\n🎉 ALL DIRECTORY SYNC TESTS PASSED SUCCESSFULLY!")

  } catch (err) {
    console.error("\n❌ Directory Integration Test failed:")
    console.error(err)
    process.exit(1)
  }
}

runDirectoryTests()
