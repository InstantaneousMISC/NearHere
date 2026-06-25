import assert from "node:assert/strict"
import {
  emailPreviewKeys,
  getEmailPreview,
  type EmailPreviewKey,
} from "../email/renderPreview"
import { escapeHtml } from "../email/escapeHtml"
import { getNeedsChangesTemplate } from "../email/templates/needsChanges"

const appUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"

const requiredLinks: Partial<Record<EmailPreviewKey, string>> = {
  "admin-purchase": "/admin/orders/preview-order",
  "claim-business": "/business/claim/preview-token",
  "claim-reset": "/business/claim/preview-token",
  "submit-creative": "/submit-creative/preview-token",
  "creative-received": "/submit-creative/preview-token",
  "needs-changes": "/submit-creative/preview-token",
  approved: "/business/dashboard",
  printed: "/business/dashboard",
  mailed: "/business/dashboard",
  "onboarding-welcome": "/business/dashboard",
  "claim-success": "/business/dashboard",
  "creative-reminder": "/submit-creative/preview-token",
}

for (const key of emailPreviewKeys) {
  const rendered = getEmailPreview(key, appUrl)
  const combined = `${rendered.subject}\n${rendered.html}`

  assert.ok(rendered.subject.trim(), `${key}: subject must not be empty`)
  assert.ok(rendered.html.includes("<!DOCTYPE html>"), `${key}: must render HTML`)
  assert.doesNotMatch(combined, /\b(undefined|null)\b/i, `${key}: unresolved nullish value`)
  assert.doesNotMatch(combined, /\{\{[^}]+\}\}|\$\{[^}]+\}/, `${key}: placeholder token`)

  const requiredLink = requiredLinks[key]
  if (requiredLink) {
    assert.ok(
      rendered.html.includes(`${appUrl.replace(/\/$/, "")}${requiredLink}`),
      `${key}: missing required CTA link`
    )
  }
}

assert.equal(
  escapeHtml(`<script>alert("x")</script> & 'quoted'`),
  "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;quoted&#39;"
)

const escapedTemplate = getNeedsChangesTemplate({
  businessName: `<script>alert("business")</script>`,
  campaignName: "Campaign & Region",
  categoryName: "Home <Services>",
  notes: `<img src=x onerror="alert('notes')">`,
  creativeSubmissionUrl: `${appUrl.replace(/\/$/, "")}/submit-creative/escape-test`,
})
assert.ok(escapedTemplate.html.includes("&lt;script&gt;"))
assert.ok(escapedTemplate.html.includes("&lt;img"))
assert.ok(!escapedTemplate.html.includes("<script>alert"))
assert.ok(!escapedTemplate.html.includes("<img src=x"))

console.log(`Rendered and validated ${emailPreviewKeys.length} email previews.`)

// -------------------------------------------------------------
// INTEGRATION TESTS: Email Actions & Idempotency Logs
// -------------------------------------------------------------
import { db } from "../db"
import {
  sendBookingCancelledEmail,
  sendOnboardingWelcomeEmail,
  sendClaimSuccessEmail,
  triggerCreativeSubmissionReminders,
} from "../email/actions"

async function runEmailIntegrationTests() {
  console.log("\n🧪 Running Email Actions & Idempotency Integration Tests...")
  const timestamp = Date.now()
  const testId = `email-test-${timestamp}`
  const advertiserEmail = `buyer-${timestamp}@test.com`

  let categoryId = ""
  let campaignId = ""
  let spotId = ""
  let advertiserId = ""
  let orderId = ""
  let businessId = ""

  try {
    // 1. Seed database records
    const category = await db.businessCategory.create({
      data: {
        name: `Email Cat ${testId}`,
        slug: `email-cat-${testId}`,
      },
    })
    categoryId = category.id

    const campaign = await db.campaign.create({
      data: {
        name: `Email Campaign ${testId}`,
        slug: `email-camp-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 5000,
        estimatedMailDate: new Date(),
      },
    })
    campaignId = campaign.id

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: category.id,
        label: "Email Test Spot",
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
        contactName: "Email Tester",
        businessName: `Email Biz ${testId}`,
        email: advertiserEmail,
        phone: "555-0999",
        website: "https://emailtest.com",
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
        slug: `email-biz-${testId}`,
        email: advertiserEmail,
        status: "ACTIVE",
      },
    })
    businessId = business.id

    // 2. Test sendBookingCancelledEmail
    console.log("   👉 Testing sendBookingCancelledEmail...")
    await sendBookingCancelledEmail(order.id, "E2E Test Refund Reason")
    const cancelLog = await db.emailLog.findFirst({
      where: { entityType: "order", entityId: order.id, templateKey: "booking_cancelled" },
    })
    assert.ok(cancelLog, "Cancellation email log must be recorded.")
    assert.strictEqual(cancelLog.status, "SENT", "Cancellation email log status must be SENT.")

    // Test Idempotency: call again, check no-op
    await sendBookingCancelledEmail(order.id, "Second Call")
    const cancelLogsCount = await db.emailLog.count({
      where: { entityType: "order", entityId: order.id, templateKey: "booking_cancelled" },
    })
    assert.strictEqual(cancelLogsCount, 1, "Idempotency check: Booking cancelled email must only log once.")

    // 3. Test sendOnboardingWelcomeEmail
    console.log("   👉 Testing sendOnboardingWelcomeEmail...")
    await sendOnboardingWelcomeEmail(business.id)
    const welcomeLog = await db.emailLog.findFirst({
      where: { entityType: "business", entityId: business.id, templateKey: "onboarding_welcome" },
    })
    assert.ok(welcomeLog, "Onboarding welcome email log must be recorded.")
    assert.strictEqual(welcomeLog.status, "SENT")

    // 4. Test sendClaimSuccessEmail
    console.log("   👉 Testing sendClaimSuccessEmail...")
    await sendClaimSuccessEmail(business.id)
    const claimLog = await db.emailLog.findFirst({
      where: { entityType: "business", entityId: business.id, templateKey: "claim_success" },
    })
    assert.ok(claimLog, "Claim success email log must be recorded.")
    assert.strictEqual(claimLog.status, "SENT")

    // 5. Test triggerCreativeSubmissionReminders
    console.log("   👉 Testing triggerCreativeSubmissionReminders...")
    // Running reminders trigger targeting our order
    const reminderResult = await triggerCreativeSubmissionReminders({ olderThanHours: 24, limit: 10 })
    assert.ok(reminderResult.totalSent >= 1, "Should send at least 1 reminder.")

    const reminderLog = await db.emailLog.findFirst({
      where: { entityType: "order_reminder", entityId: order.id, templateKey: "creative_submission_reminder" },
    })
    assert.ok(reminderLog, "Creative submission reminder email log must be recorded.")
    assert.strictEqual(reminderLog.status, "SENT")

    // Run again to verify idempotency (no new reminder emails sent)
    const reminderResultSecond = await triggerCreativeSubmissionReminders({ olderThanHours: 24, limit: 10 })
    assert.strictEqual(reminderResultSecond.totalSent, 0, "Idempotency check: Second reminder call must send 0 emails.")

    console.log("   ✅ Email Integration Tests passed successfully!")
  } finally {
    // 6. Cleanup records
    console.log("🧹 Cleaning up email test database records...")
    await db.emailLog.deleteMany({ where: { toEmail: advertiserEmail } })
    if (businessId) await db.business.delete({ where: { id: businessId } })
    if (orderId) await db.order.delete({ where: { id: orderId } })
    if (spotId) await db.campaignSpot.delete({ where: { id: spotId } })
    if (campaignId) await db.campaign.delete({ where: { id: campaignId } })
    if (categoryId) await db.businessCategory.delete({ where: { id: categoryId } })
    if (advertiserId) await db.advertiser.delete({ where: { id: advertiserId } })
    console.log("✅ Cleanup finished cleanly.")
  }
}

runEmailIntegrationTests().catch((err) => {
  console.error("❌ Email Integration Tests failed:", err)
  process.exit(1)
})
