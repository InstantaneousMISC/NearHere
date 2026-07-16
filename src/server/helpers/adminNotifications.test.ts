import assert from "assert"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { OrderStatus } from "@prisma/client"

console.log("🧪 Running administrative updates & notifications integration tests...")

async function runTests() {
  const timestamp = Date.now()
  const testId = `notif-test-${timestamp}`
  console.log(`\n--- Test Context ID: ${testId} ---`)

  const createCaller = createCallerFactory(appRouter)

  try {
    // -------------------------------------------------------------
    // SETUP: Seed test admin, category, campaign, spot, advertiser
    // -------------------------------------------------------------
    console.log("⏳ Setting up test seed data...")

    const adminSupabaseId = `admin-sb-${testId}`
    const admin = await db.adminUser.create({
      data: {
        supabaseUserId: adminSupabaseId,
        email: `admin-${testId}@localspotmailers.com`,
        name: "Test Admin",
      },
    })

    const category = await db.businessCategory.create({
      data: {
        name: `Notif Category ${testId}`,
        slug: `notif-cat-${testId}`,
      },
    })

    const campaign = await db.campaign.create({
      data: {
        name: `Notif Campaign ${testId}`,
        slug: `notif-camp-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 10000,
      },
    })

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: category.id,
        label: "Notif Test Spot",
        price: 49000,
        x: 20.0,
        y: 20.0,
        width: 10.0,
        height: 10.0,
        side: "FRONT",
      },
    })

    const advertiser = await db.advertiser.create({
      data: {
        contactName: "John Notifier",
        businessName: `Acme Notif ${testId}`,
        email: `john-notif-${timestamp}@test.com`,
        phone: "555-1234",
        website: "https://acme-notif.com",
      },
    })

    const adminCaller = createCaller({
      db,
      user: { id: adminSupabaseId, email: admin.email } as any,
      supabase: {} as any,
    })

    console.log("✅ Seed data setup complete.")

    // -------------------------------------------------------------
    // TEST 1: Manual Booking Notification Trigger
    // -------------------------------------------------------------
    console.log("\n🚀 Test 1: Testing manual booking notification trigger...")
    
    // Call bookManually mutation
    const bookingResult = await adminCaller.order.bookManually({
      spotId: spot.id,
      categoryId: category.id,
      advertiserId: advertiser.id,
      contactName: advertiser.contactName,
      businessName: advertiser.businessName,
      email: advertiser.email,
      phone: advertiser.phone,
      website: advertiser.website || "",
      amount: 49000,
      overrideExclusivity: true,
      notes: "Test manual booking notes",
    })

    assert.ok(bookingResult.orderId, "Manual booking must return order ID.")

    // Verify admin notification was logged
    const bookingNotif = await db.adminNotification.findFirst({
      where: {
        type: "INVOICE_PAID",
        title: "Manual Booking Created",
      },
      orderBy: { createdAt: "desc" },
    })

    assert.ok(bookingNotif, "Admin notification for manual booking must be created.")
    assert.ok(bookingNotif.message.includes(advertiser.businessName), "Notification message must mention business name.")
    assert.strictEqual(bookingNotif.read, false, "Notification must be unread initially.")
    console.log("✅ Manual booking notification verified.")

    // -------------------------------------------------------------
    // TEST 2: Pending Invoice Notification Trigger
    // -------------------------------------------------------------
    console.log("\n🚀 Test 2: Testing pending invoice notification trigger...")

    // Clear previous spot status to make it available for another order
    await db.campaignSpot.update({
      where: { id: spot.id },
      data: { status: "OPEN" },
    })

    const invoiceResult = await adminCaller.order.createInvoice({
      spotId: spot.id,
      categoryId: category.id,
      advertiserId: advertiser.id,
      contactName: advertiser.contactName,
      businessName: advertiser.businessName,
      email: advertiser.email,
      phone: advertiser.phone,
      website: advertiser.website || "",
      amount: 49000,
      overrideExclusivity: true,
      notes: "Test invoice creation notes",
    })

    assert.ok(invoiceResult.orderId, "Create invoice must return order ID.")

    // Verify pending order notification was logged
    const pendingNotif = await db.adminNotification.findFirst({
      where: {
        type: "PENDING_ORDER",
        title: "Invoice Generated",
      },
      orderBy: { createdAt: "desc" },
    })

    assert.ok(pendingNotif, "Admin notification for pending invoice must be created.")
    assert.ok(pendingNotif.message.includes(advertiser.businessName), "Notification message must mention business name.")
    console.log("✅ Pending invoice notification verified.")

    // -------------------------------------------------------------
    // TEST 3: Business Update Admin Mutation & Profile Sync
    // -------------------------------------------------------------
    console.log("\n🚀 Test 3: Testing admin business update mutation...")

    const business = await db.business.findFirstOrThrow({
      where: { advertiserId: advertiser.id },
    })

    const updatedName = `Updated Name ${testId}`
    const updatedSlug = `updated-slug-${testId}`
    const updatedDesc = "This is an admin updated description"
    const updatedPhone = "555-0000"

    const updatedBusiness = await adminCaller.business.update({
      id: business.id,
      name: updatedName,
      slug: updatedSlug,
      description: updatedDesc,
      phone: updatedPhone,
      email: business.email,
      website: business.website,
      logoUrl: business.logoUrl,
      coverImageUrl: business.coverImageUrl,
      address: business.address,
      city: business.city,
      state: business.state,
      zipCode: business.zipCode,
      serviceArea: business.serviceArea,
      hours: business.hours,
      preferredCta: business.preferredCta,
      services: ["Test Service 1", "Test Service 2"],
      establishedYear: "2018",
      licenseNumber: "LIC-1234",
    })

    assert.strictEqual(updatedBusiness.name, updatedName, "Name must be updated.")
    assert.strictEqual(updatedBusiness.slug, updatedSlug, "Slug must be updated.")
    assert.strictEqual(updatedBusiness.description, updatedDesc, "Description must be updated.")
    assert.strictEqual(updatedBusiness.phone, updatedPhone, "Phone must be updated.")
    assert.deepEqual(updatedBusiness.services, ["Test Service 1", "Test Service 2"], "Services must be updated.")
    assert.strictEqual(updatedBusiness.establishedYear, "2018", "Established year must be updated.")
    assert.strictEqual(updatedBusiness.licenseNumber, "LIC-1234", "License number must be updated.")

    // Verify audit log was created
    const auditLog = await db.adminAuditLog.findFirst({
      where: {
        action: "UPDATE_BUSINESS",
        businessId: business.id,
      },
    })
    assert.ok(auditLog, "Admin audit log for business update must be created.")
    console.log("✅ Admin business update mutation verified.")

    // -------------------------------------------------------------
    // TEST 4: Notification Router (list, getUnreadCount, markAsRead, markAllAsRead)
    // -------------------------------------------------------------
    console.log("\n🚀 Test 4: Testing notification router operations...")

    const unreadCount = await adminCaller.notification.getUnreadCount()
    assert.ok(unreadCount >= 2, "Unread count should include our seeded notifications.")

    const list = await adminCaller.notification.list()
    assert.ok(list.length >= 2, "List should return at least our two notifications.")

    // Mark single as read
    const firstNotif = list[0]
    await adminCaller.notification.markAsRead({ id: firstNotif.id })

    const updatedNotif = await db.adminNotification.findUnique({
      where: { id: firstNotif.id },
    })
    assert.strictEqual(updatedNotif?.read, true, "Notification must be marked as read.")

    // Mark all as read
    await adminCaller.notification.markAllAsRead()
    const finalUnreadCount = await adminCaller.notification.getUnreadCount()
    assert.strictEqual(finalUnreadCount, 0, "All notifications must be marked as read.")
    console.log("✅ Notification router operations verified.")

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up test database records...")
    await db.adminNotification.deleteMany({
      where: {
        OR: [
          { message: { contains: testId } },
          { message: { contains: advertiser.businessName } },
        ],
      },
    })
    await db.adminAuditLog.deleteMany({ where: { businessId: business.id } })
    await db.business.delete({ where: { id: business.id } })
    await db.order.deleteMany({ where: { advertiserId: advertiser.id } })
    await db.campaignSpot.delete({ where: { id: spot.id } })
    await db.campaign.delete({ where: { id: campaign.id } })
    await db.businessCategory.delete({ where: { id: category.id } })
    await db.advertiser.delete({ where: { id: advertiser.id } })
    await db.adminUser.delete({ where: { id: admin.id } })
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 ALL ADMIN UPDATE & NOTIFICATION TESTS PASSED SUCCESSFULLY!")

  } catch (err) {
    console.error("\n❌ Administrative Integration Tests failed:")
    console.error(err)
    process.exit(1)
  }
}

runTests()
