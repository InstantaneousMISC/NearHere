import puppeteer from "puppeteer-core"
import assert from "assert"
import { db } from "../db"
import { SpotStatus, OrderStatus, ApprovalStatus } from "@prisma/client"

console.log("🧪 Running Browser E2E validation flow...")

async function runBrowserE2E() {
  const timestamp = Date.now()
  const testId = `browser-${timestamp}`
  console.log(`\n--- E2E Browser Test Context ID: ${testId} ---`)

  // 1. Launch local Google Chrome
  console.log("⏳ Launching Google Chrome...")
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  let campaignId = ""
  let categoryId = ""
  let spotId = ""
  let orderId = ""
  let businessId = ""

  try {
    const page = await browser.newPage()
    // Set a large viewport
    await page.setViewport({ width: 1280, height: 800 })

    // -------------------------------------------------------------
    // 2. ADMIN LOGIN BYPASS
    // -------------------------------------------------------------
    console.log("⏳ Opening login page...")
    await page.goto("http://localhost:3000/auth/login", { waitUntil: "networkidle2" })

    console.log("🚀 Clicking Admin Bypass...")
    const bypassBtn = await page.waitForSelector("button", { timeout: 35000 })
    assert.ok(bypassBtn, "Bypass button should be visible.")
    
    // Let's click the bypass button.
    // We can evaluate which button is the bypass button and click it to avoid any text selector issues.
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"))
      const devBypass = buttons.find(b => b.textContent?.includes("Dev Admin Mode"))
      if (devBypass) {
        devBypass.click()
      } else {
        throw new Error("Dev Bypass button not found on page")
      }
    })
    await page.waitForFunction(() => window.location.href.includes("/admin"), { timeout: 15000 })
    console.log("✅ Logged in successfully. Current URL:", page.url())

    // -------------------------------------------------------------
    // 3. CREATE CAMPAIGN VIA ADMIN DASHBOARD PAGE
    // -------------------------------------------------------------
    console.log("🚀 Navigating to campaign creation form...")
    await page.goto("http://localhost:3000/admin/campaigns/new", { waitUntil: "networkidle2" })

    console.log("✍️ Filling out campaign creation form...")
    await page.type("#name", `Converse E2E Campaign ${testId}`)
    await page.type("#city", "converse")
    await page.type("#state", "texas")
    await page.type("#county", "Bexar")
    await page.type("#zipCode", "78109")
    
    // Clear mailing quantity default and type 10000
    const qtyInput = await page.$("#quantity")
    await page.evaluate(el => (el as HTMLInputElement).value = "", qtyInput)
    await page.type("#quantity", "10000")
    
    await page.type("#mailDate", "12-01-2026") // MM-DD-YYYY for input[type="date"] on windows locale
    await page.type("#desc", `E2E automated campaign for Converse ${testId}`)

    console.log("💾 Submitting campaign form...")
    await page.click("button[type='submit']")

    await page.waitForFunction(
      () => window.location.href.includes("/admin/campaigns/") && !window.location.href.endsWith("/new"),
      { timeout: 20000 }
    )
    const campaignUrl = page.url()
    console.log("✅ Campaign created. Redirected to URL:", campaignUrl)
    
    // Extract campaignId
    const parts = campaignUrl.split("/")
    campaignId = parts[parts.length - 1]
    assert.ok(campaignId, "Campaign ID should be parsed from URL.")

    // -------------------------------------------------------------
    // 4. ADD AD SPOT VIA ADMIN PLACEMENT EDITOR
    // -------------------------------------------------------------
    console.log("🚀 Opening Spots Tab in Admin panel...")
    await page.waitForFunction(() => 
      Array.from(document.querySelectorAll("button")).some(b => b.textContent?.toLowerCase().includes("spots")),
      { timeout: 35000 }
    )
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"))
      const spotsTab = buttons.find(b => b.textContent?.toLowerCase().includes("spots"))
      if (spotsTab) {
        spotsTab.click()
      } else {
        throw new Error("Spots tab button not found")
      }
    })
    await new Promise(r => setTimeout(r, 800))

    console.log("🚀 Clicking 'Add Spot'...")
    await page.waitForFunction(() => 
      Array.from(document.querySelectorAll("button")).some(b => b.textContent?.includes("Add Spot")),
      { timeout: 15000 }
    )
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"))
      const addSpotBtn = buttons.find(b => b.textContent?.includes("Add Spot"))
      if (addSpotBtn) {
        addSpotBtn.click()
      } else {
        throw new Error("Add Spot button not found")
      }
    })
    await new Promise(r => setTimeout(r, 800))

    // Query plumbers category from DB dynamically
    const category = await db.businessCategory.findFirst({
      where: { slug: "plumbers" }
    })
    assert.ok(category, "Plumbers category should exist in DB.")
    categoryId = category.id

    console.log("✍️ Configuring spot details (Plumbing category)...")
    await page.type("#spotLabel", "E2E Plumber")
    await page.select("#spotCategory", categoryId)
    
    const spotPrice = await page.$("#spotPrice")
    await page.evaluate(el => (el as HTMLInputElement).value = "", spotPrice)
    await page.type("#spotPrice", "499")

    console.log("💾 Submitting spot form...")
    await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll("form"))
      const spotForm = forms.find(f => f.querySelector("h3")?.textContent?.includes("Postcard Spot"))
      if (spotForm) {
        const submitBtn = spotForm.querySelector("button[type='submit']") as HTMLButtonElement
        submitBtn?.click()
      } else {
        throw new Error("Spot form not found")
      }
    })
    await new Promise(r => setTimeout(r, 1500))
    console.log("✅ Spot created successfully in UI.")

    // Verify spot in database
    const createdSpot = await db.campaignSpot.findFirst({
      where: { campaignId, label: "E2E Plumber" }
    })
    assert.ok(createdSpot, "Spot should exist in the database.")
    spotId = createdSpot.id

    // -------------------------------------------------------------
    // 5. PUBLISH CAMPAIGN TO ACTIVE
    // -------------------------------------------------------------
    console.log("🚀 Transitioning Campaign status to ACTIVE...")
    await page.select("#campaignStatus", "ACTIVE")
    await new Promise(r => setTimeout(r, 2000)) // Wait for status mutation and page refetch
    console.log("✅ Campaign published to ACTIVE.")

    const activeCamp = await db.campaign.findUnique({ where: { id: campaignId } })
    assert.strictEqual(activeCamp?.status, "ACTIVE", "Campaign status should be ACTIVE in DB.")

    // -------------------------------------------------------------
    // 6. VISITOR SEARCHES BY ZIP ON HOMEPAGE
    // -------------------------------------------------------------
    console.log("🚀 Navigating to Homepage to check ZIP search...")
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" })

    await page.type("input[placeholder*='ZIP code']", "78109")
    await page.click("button[type='submit']")
    await page.waitForFunction(() => window.location.href.includes("/campaigns/"), { timeout: 15000 })
    console.log("✅ Redirected to public campaign page URL:", page.url())

    // -------------------------------------------------------------
    // 7. BUYER CHECKS OUT PLACEMENT
    // -------------------------------------------------------------
    assert.ok(activeCamp, "Campaign should exist in DB.")
    const campaignSlug = activeCamp.slug

    console.log(`🚀 Navigating to spot checkout page for slug: ${campaignSlug}...`)
    const spotCheckoutUrl = `http://localhost:3000/campaigns/texas/converse/${campaignSlug}/checkout/${spotId}?categoryId=${categoryId}`
    await page.goto(spotCheckoutUrl, { waitUntil: "networkidle2" })

    // Wait for Next.js page hydration
    await new Promise(r => setTimeout(r, 3500))

    console.log("✍️ Filling checkout contact details...")
    await page.type("#businessName", `E2E Plumbing Biz ${testId}`)
    await page.type("#contactName", "E2E Tester")
    await page.type("#email", `merchant-${testId}@test.com`)
    await page.type("#phone", "555-555-5555")
    await page.type("#website", `e2eplumbing-${testId}.com`)

    // Wait a brief moment to ensure all React state updates are flushed
    await new Promise(r => setTimeout(r, 1000))

    console.log("💳 Submitting checkout form (simulating Stripe)...")
    await page.click("button[type='submit']")

    // Query pending order in DB with polling
    console.log("⏳ Waiting for pending order to be recorded in DB...")
    let pendingOrder = null
    for (let i = 0; i < 20; i++) {
      pendingOrder = await db.order.findFirst({
        where: { campaignSpotId: spotId, status: OrderStatus.PENDING }
      })
      if (pendingOrder) break
      await new Promise(r => setTimeout(r, 500))
    }
    assert.ok(pendingOrder, "Pending order should be recorded in DB.")
    orderId = pendingOrder.id
    console.log("✅ Pending Order created. Order ID:", orderId)

    // Simulate Stripe payment success by database transition (representing stripe webhook)
    console.log("🚀 Simulating stripe payment webhook updates...")
    await db.$transaction([
      db.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PAID,
          paidAt: new Date(),
        }
      }),
      db.campaignSpot.update({
        where: { id: spotId },
        data: {
          status: SpotStatus.SOLD,
          heldUntil: null,
          heldBySessionId: null,
        }
      })
    ])

    // Initialize business, QR, and creative templates post-payment
    const { ensureBusinessForOrder, ensureQrForOrder, ensureCreativeSubmissionForOrder, ensurePostPaymentEmailsForOrder } = await import("./postPayment")
    const business = await ensureBusinessForOrder(orderId)
    businessId = business.id
    const qrCode = await ensureQrForOrder(orderId)
    await ensureCreativeSubmissionForOrder(orderId)
    await ensurePostPaymentEmailsForOrder(orderId)
    console.log("✅ Webhook simulation completed. Business profile and QR created.")

    // Verify Post-Payment Emails in DB
    console.log("🔍 Validating post-payment emails in DB...")
    const merchantEmail = `merchant-${testId}@test.com`
    const postPaymentEmails = await db.emailLog.findMany({
      where: {
        OR: [
          { toEmail: merchantEmail },
          { toEmail: process.env.ADMIN_EMAIL || "admin@localspotmailers.com" }
        ],
        entityId: { in: [orderId, businessId] }
      }
    })
    
    // Check that we got all 4 post-payment emails
    const templateKeys = postPaymentEmails.map(e => e.templateKey)
    console.log("📧 Generated Post-Payment Emails:", templateKeys)
    assert.ok(templateKeys.includes("payment_confirmation"), "Should have sent payment_confirmation email.")
    assert.ok(templateKeys.includes("admin_purchase_notification"), "Should have sent admin_purchase_notification email.")
    assert.ok(templateKeys.includes("claim_business_profile"), "Should have sent claim_business_profile email.")
    assert.ok(templateKeys.includes("submit_postcard_creative"), "Should have sent submit_postcard_creative email.")
    console.log("✅ Post-payment email validation successful.")

    // -------------------------------------------------------------
    // 8. ADVERTISER SUBMITS CREATIVE DETAILS
    // -------------------------------------------------------------
    const submissionUrl = `http://localhost:3000/submit-creative/${pendingOrder.creativeSubmissionToken}`
    console.log("🚀 Navigating to creative submission page:", submissionUrl)
    await page.goto(submissionUrl, { waitUntil: "networkidle2" })

    // Wait for Next.js page hydration
    await new Promise(r => setTimeout(r, 3500))

    console.log("✍️ Submitting postcard ad copy...")
    await page.type("#headline", "Top Rated Plumbers in Converse!")
    await page.type("#offerDeal", "$50 OFF your first pipe repair service!")
    await page.type("#description", "Licensed local plumbers. Available 24/7. Trusted by families.")
    await page.type("#cta", "Call today to schedule!")

    // Clear phone and website before typing to avoid appending to pre-populated values
    const phoneInput = await page.$("#displayPhone")
    await page.evaluate(el => (el as HTMLInputElement).value = "", phoneInput)
    await page.type("#displayPhone", "555-555-5555")

    const websiteInput = await page.$("#displayWebsite")
    await page.evaluate(el => (el as HTMLInputElement).value = "", websiteInput)
    await page.type("#displayWebsite", `https://e2eplumbing-${testId}.com`)

    await page.type("#displayAddress", "123 Converse Rd, Converse, TX 78109")

    // Wait a brief moment to ensure all React state updates are flushed
    await new Promise(r => setTimeout(r, 1000))

    await page.click("button[type='submit']")

    // Wait for frontend success message banner to appear
    await page.waitForFunction(() => 
      document.body.innerText.toLowerCase().includes("creative details saved successfully"),
      { timeout: 15000 }
    )
    console.log("✅ Ad creative details submitted successfully.")

    // Verify submission is pending in DB
    const creative = await db.creativeSubmission.findUnique({ where: { orderId } })
    assert.ok(creative, "Creative submission should exist.")
    assert.strictEqual(creative.approvalStatus, ApprovalStatus.PENDING, "Creative should be PENDING.")

    // Verify creative submission email in DB
    console.log("🔍 Validating creative submission confirmation email...")
    const submissionEmails = await db.emailLog.findMany({
      where: {
        toEmail: merchantEmail,
        templateKey: "creative_submission_received",
        entityId: creative.id
      }
    })
    assert.strictEqual(submissionEmails.length, 1, "Should have logged 1 creative_submission_received email.")
    console.log("✅ Creative submission confirmation email validated.")

    // -------------------------------------------------------------
    // 9. ADMIN REVIEWS AND APPROVES CREATIVE
    // -------------------------------------------------------------
    console.log("🚀 Navigating back to admin portal to review creative...")
    // Navigate directly to campaign page details
    await page.goto(campaignUrl, { waitUntil: "networkidle2" })

    console.log("🚀 Clicking Creative Tab...")
    await page.waitForFunction(() => 
      Array.from(document.querySelectorAll("button")).some(b => b.textContent?.toLowerCase().includes("creative")),
      { timeout: 35000 }
    )
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"))
      const creativeTab = buttons.find(b => b.textContent?.toLowerCase().includes("creative"))
      if (creativeTab) {
        creativeTab.click()
      } else {
        throw new Error("Creative tab button not found")
      }
    })
    await new Promise(r => setTimeout(r, 800))

    // Handle the browser dialog/prompt for approval notes
    page.on("dialog", async dialog => {
      console.log(`💬 Dialog popup: ${dialog.type()} "${dialog.message()}"`)
      await dialog.accept("Approved E2E layout verified.")
    })

    console.log("🚀 Clicking 'Approve Ad Creative' button...")
    await page.waitForFunction(() => 
      Array.from(document.querySelectorAll("button")).some(b => b.textContent?.includes("Approve Ad Creative")),
      { timeout: 15000 }
    )
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"))
      const approveBtn = buttons.find(b => b.textContent?.includes("Approve Ad Creative"))
      if (approveBtn) {
        approveBtn.click()
      } else {
        throw new Error("Approve Ad Creative button not found")
      }
    })
    await new Promise(r => setTimeout(r, 2000))

    // Verify creative is approved in DB
    const approvedCreative = await db.creativeSubmission.findUnique({ where: { orderId } })
    assert.ok(approvedCreative, "Approved creative should exist.")
    assert.strictEqual(approvedCreative.approvalStatus, ApprovalStatus.APPROVED, "Creative should be APPROVED in DB.")
    console.log("✅ Creative approved by Admin successfully.")

    // Verify approval email in DB
    console.log("🔍 Validating creative approved email...")
    const approvalEmails = await db.emailLog.findMany({
      where: {
        toEmail: merchantEmail,
        templateKey: "approved_for_print",
        entityId: approvedCreative.id
      }
    })
    assert.strictEqual(approvalEmails.length, 1, "Should have logged 1 approved_for_print email.")
    console.log("✅ Creative approved email validated.")

    // -------------------------------------------------------------
    // 10. CLEANUP TEST DATA
    // -------------------------------------------------------------
    console.log("\n🧹 Cleaning up database E2E records...")
    await db.emailLog.deleteMany({ where: { toEmail: merchantEmail } })
    await db.businessClickEvent.deleteMany({ where: { businessId: business.id } })
    await db.qrScan.deleteMany({ where: { businessId: business.id } })
    await db.qrCode.deleteMany({ where: { businessId: business.id } })
    await db.creativeSubmission.deleteMany({ where: { orderId } })
    await db.business.delete({ where: { id: business.id } })
    await db.order.delete({ where: { id: orderId } })
    await db.campaignSpot.deleteMany({ where: { campaignId } })
    await db.campaign.delete({ where: { id: campaignId } })
    await db.advertiser.delete({ where: { email: merchantEmail } })
    console.log("✅ Cleaned up successfully.")

    console.log("\n🎉 ALL E2E BROWSER VALIDATION FLOWS PASSED SUCCESSFULLY!");
    process.exit(0)

  } catch (err) {
    console.error("\n❌ E2E Browser Test failed:")
    console.error(err)

    // Emergency cleanup
    try {
      console.log("🧹 Attempting emergency cleanup...")
      const merchantEmail = `merchant-${testId}@test.com`

      if (campaignId) {
        // Find all orders linked to this campaign
        const orders = await db.order.findMany({ where: { campaignId } })
        const orderIds = orders.map(o => o.id)

        // Find all businesses linked to this merchant email
        const businesses = await db.business.findMany({
          where: { advertiser: { email: merchantEmail } }
        })
        const bizIds = businesses.map(b => b.id)

        await db.emailLog.deleteMany({
          where: {
            OR: [
              { toEmail: merchantEmail },
              { toEmail: process.env.ADMIN_EMAIL || "admin@localspotmailers.com" }
            ]
          }
        })

        if (bizIds.length > 0) {
          await db.businessClickEvent.deleteMany({ where: { businessId: { in: bizIds } } })
          await db.qrScan.deleteMany({ where: { businessId: { in: bizIds } } })
          await db.qrCode.deleteMany({ where: { businessId: { in: bizIds } } })
          await db.business.deleteMany({ where: { id: { in: bizIds } } })
        }

        if (orderIds.length > 0) {
          await db.creativeSubmission.deleteMany({ where: { orderId: { in: orderIds } } })
          await db.order.deleteMany({ where: { id: { in: orderIds } } })
        }

        await db.campaignSpot.deleteMany({ where: { campaignId } })
        await db.campaign.deleteMany({ where: { id: campaignId } })
      }

      await db.advertiser.deleteMany({ where: { email: merchantEmail } })
      console.log("🧹 Emergency cleanup completed.")
    } catch (cleanupErr) {
      console.error("🧹 Emergency cleanup failed:", cleanupErr)
    }

    process.exit(1)
  } finally {
    await browser.close()
    await db.$disconnect()
  }
}

runBrowserE2E()
