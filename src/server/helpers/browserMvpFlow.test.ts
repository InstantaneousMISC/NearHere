import puppeteer from "puppeteer-core"
import assert from "assert"
import fs from "fs"
import path from "path"
import { db } from "../db"
import { appRouter } from "../trpc/router"
import { createCallerFactory } from "../trpc/init"
import { CampaignStatus, OrderStatus, SpotStatus, ApprovalStatus, SpotType, PostcardSide } from "@prisma/client"
import { GET as qrRedirectGet } from "../../app/q/[slug]/route"
import { GET as clickTrackerGet } from "../../app/api/business-click/route"
import { NextRequest } from "next/server"

console.log("🧪 Running E2E Browser Validation with Puppeteer...")

async function runBrowserMvpFlow() {
  const timestamp = Date.now()
  const testId = `browser-mvp-${timestamp}`
  console.log(`\n--- Browser E2E Context ID: ${testId} ---`)

  // Detect active port (checking port 3001 first to connect to our newly started instance)
  let port = 3000
  try {
    const res = await fetch("http://localhost:3001/auth/login")
    if (res.ok) {
      port = 3001
    } else {
      port = 3000
    }
  } catch {
    port = 3000
  }
  const appUrl = `http://localhost:${port}`
  console.log(`📡 Connecting to application at: ${appUrl}`)

  // Setup screenshots directory
  const screenshotsDir = path.join(process.cwd(), "screenshots")
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true })
  }
  console.log(`📸 Screenshots will be saved to: ${screenshotsDir}`)

  // Launch local Google Chrome
  console.log("⏳ Launching Google Chrome...")
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

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
  let qrSlug = ""
  let page: any = null
  let hasPageError = false

  async function safeNavigate(url: string, screenshotName?: string) {
    console.log(`📡 Navigating to ${url}...`)
    await page.goto(url, { waitUntil: "networkidle2" })
    
    // Check for Next.js dev server error screen or page crash
    let retries = 3
    while (retries > 0) {
      const hasError = await page.evaluate(() => {
        return document.body.innerText.includes("Manifest file is empty") || 
               document.body.innerText.includes("Runtime Error") ||
               document.body.innerText.includes("stale Webpack")
      })
      if (!hasError && !hasPageError) break
      
      console.log(`⚠️ Next.js compilation or page error on ${url}. Retrying in 2s... (Retries left: ${retries})`)
      hasPageError = false // reset flag
      await new Promise(r => setTimeout(r, 2000))
      await page.goto(url, { waitUntil: "networkidle2" })
      retries--
    }

    await page.waitForFunction(() => !document.body.innerText.toLowerCase().includes("loading"), { timeout: 25000 })
    await new Promise(r => setTimeout(r, 1000))
    if (screenshotName) {
      await page.screenshot({ path: path.join(screenshotsDir, screenshotName) })
      console.log(`   📸 Captured: ${screenshotName}`)
    }
  }

  async function safeReload(screenshotName?: string) {
    console.log(`📡 Reloading page...`)
    await page.reload({ waitUntil: "networkidle2" })
    
    let retries = 3
    while (retries > 0) {
      const hasError = await page.evaluate(() => {
        return document.body.innerText.includes("Manifest file is empty") || 
               document.body.innerText.includes("Runtime Error") ||
               document.body.innerText.includes("stale Webpack")
      })
      if (!hasError && !hasPageError) break
      
      console.log(`⚠️ Next.js compilation or page error on reload. Retrying in 2s... (Retries left: ${retries})`)
      hasPageError = false // reset flag
      await new Promise(r => setTimeout(r, 2000))
      await page.reload({ waitUntil: "networkidle2" })
      retries--
    }

    await page.waitForFunction(() => !document.body.innerText.toLowerCase().includes("loading"), { timeout: 25000 })
    await new Promise(r => setTimeout(r, 1000))
    if (screenshotName) {
      await page.screenshot({ path: path.join(screenshotsDir, screenshotName) })
      console.log(`   📸 Captured: ${screenshotName}`)
    }
  }

  try {
    // -------------------------------------------------------------
    // SETUP: Seed test records in database programmatically
    // -------------------------------------------------------------
    console.log("⏳ Seeding admin and campaign database records...")
    await db.adminUser.create({
      data: {
        supabaseUserId: adminSupabaseId,
        email: adminEmail,
      }
    })

    const createCaller = createCallerFactory(appRouter)
    const adminCaller = createCaller({
      db,
      user: { id: adminSupabaseId, email: adminEmail } as any,
      supabase: {} as any,
    })

    const campaign = await db.campaign.create({
      data: {
        name: `Browser E2E Campaign ${testId}`,
        slug: `browser-camp-${testId}`,
        city: "converse",
        state: "tx",
        zipCode: "78109",
        mailingQuantity: 5000,
        cardSize: "9x12",
        cardSkin: "cream",
        status: CampaignStatus.ACTIVE,
      }
    })
    campaignId = campaign.id

    const category = await db.businessCategory.create({
      data: {
        name: `Browser Category ${testId}`,
        slug: `browser-cat-${testId}`,
      }
    })
    categoryId = category.id

    const spot = await db.campaignSpot.create({
      data: {
        campaignId: campaign.id,
        categoryId: category.id,
        label: "Browser Spot",
        side: PostcardSide.FRONT,
        spotType: SpotType.STANDARD,
        price: 39000,
        status: SpotStatus.OPEN,
        x: 10,
        y: 10,
        width: 20,
        height: 20,
      }
    })
    spotId = spot.id

    // Admin creates invoice programmatically via helper/tRPC emulation to get invoice token
    console.log("⏳ Generating manual invoice for spot...")
    const invoiceResult = await adminCaller.order.createInvoice({
      spotId: spot.id,
      categoryId: category.id,
      contactName: "Browser E2E Merchant",
      businessName: `Browser E2E Business ${testId}`,
      email: merchantEmail,
      phone: "555-999-8888",
      amount: 39000,
      notes: "Browser E2E invoice notes",
    })
    orderId = invoiceResult.orderId

    // Fetch the created order and spot references
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { advertiser: true }
    })
    assert.ok(order, "Order should be created successfully.")

    page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })

    // Auto-accept alert/confirm dialogs
    page.on("dialog", async (dialog: any) => {
      console.log(`💬 Dialog popped up: [${dialog.type()}] ${dialog.message()}`)
      await dialog.accept()
      console.log("   ✅ Dialog accepted/dismissed.")
    })

    // Log console and errors from browser
    page.on("console", (msg: any) => console.log(`[PAGE CONSOLE] ${msg.text()}`))
    page.on("pageerror", (err: any) => {
      console.error(`[PAGE ERROR] ${err.toString()}`)
      hasPageError = true
    })

    // -------------------------------------------------------------
    // 1. PUBLIC INVOICE PAYMENT PAGE
    // -------------------------------------------------------------
    await safeNavigate(`${appUrl}/invoice/${orderId}`, "1_invoice_billing_unpaid.png")

    // Verify Business Name renders
    const pageText = await page.evaluate(() => document.body.innerText)
    assert.ok(pageText.includes(`Browser E2E Business ${testId}`), "Should display business name on invoice page.")

    // Simulate Stripe payment success by database webhook transition
    console.log("🚀 Simulating stripe checkout success webhook updates...")
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

    // Post-payment setup
    const { ensureBusinessForOrder, ensureQrForOrder, ensureCreativeSubmissionForOrder } = await import("./postPayment")
    const business = await ensureBusinessForOrder(order.id)
    businessId = business.id
    const qr = await ensureQrForOrder(order.id)
    qrCodeId = qr.id
    qrSlug = qr.slug
    await ensureCreativeSubmissionForOrder(order.id)

    // Programmatically claim business profile for merchant E2E testing
    const merchantCaller = createCaller({
      db,
      user: { id: merchantSupabaseId, email: merchantEmail } as any,
      supabase: {} as any,
    })
    const liveBusiness = await db.business.findUnique({ where: { id: business.id } })
    assert.ok(liveBusiness?.claimToken, "Claim token must exist.")
    await merchantCaller.business.claimBusiness({ token: liveBusiness.claimToken })
    console.log("   ✅ Profile claimed programmatically by merchant.")

    // Reload invoice page to show PAID state
    await safeReload("2_invoice_billing_paid.png")
    
    const pageTextPaid = await page.evaluate(() => document.body.innerText)
    assert.ok(pageTextPaid.toLowerCase().includes("paid"), "Should render Paid status banner.")

    // -------------------------------------------------------------
    // 2. SIMULATE MOBILE USER QR SCAN & OUTBOUND LINK CLICKS
    // -------------------------------------------------------------
    console.log("🚀 Simulating mobile scan on QR Code slug:", qrSlug)
    // Run direct redirect trigger to record scan
    const reqScan = new Request(`http://localhost:3000/q/${qrSlug}`, {
      headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X)" }
    }) as any as NextRequest
    await qrRedirectGet(reqScan, { params: Promise.resolve({ slug: qrSlug }) })

    // Simulate outbound website click
    const clickReq = new Request(`http://localhost:3000/api/business-click?businessId=${businessId}&qr=${qrSlug}&type=WEBSITE&target=https://browsere2e.com&label=Website`, {
      headers: { "user-agent": "Mozilla/5.0" }
    }) as any as NextRequest
    await clickTrackerGet(clickReq)

    // -------------------------------------------------------------
    // 3. MERCHANT PORTAL DASHBOARD (CHARTS & METRICS)
    // -------------------------------------------------------------
    console.log("🚀 Logging in as Merchant...")
    // Clear cookies first to avoid admin role leak
    await page.deleteCookie({ name: "mock_admin", domain: "localhost" })

    // Set mock merchant session cookies
    await page.setCookie({
      name: "mock_user_email",
      value: encodeURIComponent(merchantEmail),
      domain: "localhost",
      path: "/",
    })
    await page.setCookie({
      name: "mock_user_id",
      value: merchantSupabaseId,
      domain: "localhost",
      path: "/",
    })

    // Navigate to merchant dashboard (navigating first, then waiting for skeleton loader to clear)
    await safeNavigate(`${appUrl}/business/dashboard`)
    console.log("⏳ Waiting for dashboard details to load...")
    await page.waitForFunction(() => 
      document.body.innerText.toLowerCase().includes("your campaign placements") || 
      document.body.innerText.toLowerCase().includes("no campaigns yet"),
      { timeout: 15000 }
    )
    await page.screenshot({ path: path.join(screenshotsDir, "3_merchant_dashboard.png") })
    console.log("   📸 Captured: 3_merchant_dashboard.png")

    // Check dashboard has loaded stats
    const dashboardText = await page.evaluate(() => document.body.innerText)
    assert.ok(dashboardText.toLowerCase().includes("scans"), "Should render scans metric metric card.")
    assert.ok(dashboardText.toLowerCase().includes("clicks"), "Should render clicks metric card.")

    // -------------------------------------------------------------
    // 4. MERCHANT EDIT PROFILE settings (PENDING BANNER)
    // -------------------------------------------------------------
    await safeNavigate(`${appUrl}/business/profile`, "4_merchant_profile_original.png")

    // Type a new modified name
    console.log("✍️ Modifying business name in profile form...")
    await page.waitForSelector("form input[type='text']", { timeout: 15000 })
    const nameInput = await page.$("form input[type='text']")
    assert.ok(nameInput, "Name input field must exist.")
    
    // Clear and type new name (React-friendly clearing via keyboard events)
    await nameInput.focus()
    await page.keyboard.down("Control")
    await page.keyboard.press("KeyA")
    await page.keyboard.up("Control")
    await page.keyboard.press("Backspace")
    await nameInput.type(`Modified Browser Biz ${testId}`)

    // Submit profile form
    console.log("💾 Submitting profile edits...")
    const submitBtn = await page.$("form button[type='submit']")
    assert.ok(submitBtn, "Form submit button must exist.")
    await submitBtn.click()

    // Wait for the pending moderation banner to appear
    console.log("⏳ Waiting for Pending Approval banner...")
    await page.waitForFunction(() => 
      document.body.innerText.includes("Pending Admin Approval") || document.body.innerText.includes("moderation"),
      { timeout: 15000 }
    )
    await new Promise(r => setTimeout(r, 1000))
    await page.screenshot({ path: path.join(screenshotsDir, "5_merchant_profile_pending.png") })
    console.log("   📸 Captured: 5_merchant_profile_pending.png")

    // -------------------------------------------------------------
    // 5. ADMIN PROFILE REVIEW QUEUE
    // -------------------------------------------------------------
    console.log("🚀 Logging in as Admin...")
    // Clear merchant cookies
    await page.deleteCookie({ name: "mock_user_email", domain: "localhost" })
    await page.deleteCookie({ name: "mock_user_id", domain: "localhost" })

    // Set mock admin cookie
    await page.setCookie({
      name: "mock_admin",
      value: "true",
      domain: "localhost",
      path: "/",
    })

    await safeNavigate(`${appUrl}/admin/businesses`, "6_admin_businesses_list.png")

    // Check review queue comparison tab
    console.log("🚀 Clicking Review Queue Tab...")
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"))
      const queueBtn = buttons.find(b => b.textContent?.includes("Review Queue") || b.textContent?.includes("Change Requests"))
      if (queueBtn) queueBtn.click()
    })
    await new Promise(r => setTimeout(r, 1000))

    // Click on the change request card to select it
    console.log("🚀 Selecting the change request card from left sidebar...")
    await page.evaluate((businessName: string) => {
      const headers = Array.from(document.querySelectorAll("button h3"))
      const match = headers.find(h => h.textContent?.includes(businessName))
      if (match) {
        const btn = match.closest("button")
        if (btn) btn.click()
      }
    }, `Browser E2E Business ${testId}`)
    await new Promise(r => setTimeout(r, 1000))

    await page.screenshot({ path: path.join(screenshotsDir, "7_admin_review_queue_comparison.png") })
    console.log("   📸 Captured: 7_admin_review_queue_comparison.png")

    // Click Approve button
    console.log("🚀 Clicking Approve button in moderation queue...")
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"))
      const approveBtn = buttons.find(b => b.textContent?.includes("Approve"))
      if (approveBtn) (approveBtn as HTMLButtonElement).click()
    })
    
    console.log("⏳ Waiting for approval to process...")
    await page.waitForFunction(() => 
      document.body.innerText.includes("Select a change request"),
      { timeout: 15000 }
    )
    console.log("✅ Change request approved by Admin.")

    // -------------------------------------------------------------
    // 6. ADMIN BUSINESS DETAILS & DEACTIVATION
    // -------------------------------------------------------------
    await safeNavigate(`${appUrl}/admin/businesses/${businessId}`, "8_admin_business_details.png")

    // Check that profile name has been updated in UI
    const adminDetailText = await page.evaluate(() => document.body.innerText)
    assert.ok(adminDetailText.toLowerCase().includes(`modified browser biz ${testId}`.toLowerCase()), "Live business profile should display the approved name.")

    console.log("\n🧹 Cleaning up test database records...")
    // Cleanup
    await db.emailLog.deleteMany({ where: { toEmail: merchantEmail } })
    await db.businessClickEvent.deleteMany({ where: { qrCodeId: qr.id } })
    await db.qrScan.deleteMany({ where: { qrCodeId: qr.id } })
    await db.qrCode.delete({ where: { id: qr.id } })
    await db.businessProfileChangeRequest.deleteMany({ where: { businessId: businessId } })
    await db.business.delete({ where: { id: businessId } })
    await db.order.delete({ where: { id: orderId } })
    await db.campaignSpot.deleteMany({ where: { campaignId } })
    await db.campaign.delete({ where: { id: campaignId } })
    await db.businessCategory.delete({ where: { id: categoryId } })
    await db.advertiser.delete({ where: { email: merchantEmail } })
    await db.adminUser.delete({ where: { supabaseUserId: adminSupabaseId } })
    console.log("✅ Cleanup finished cleanly.")

    console.log("\n🎉 ALL E2E BROWSER MVP FLOWS PASSED AND VALIDATED SUCCESSFULLY!");
    process.exit(0)

  } catch (err) {
    console.error("\n❌ Browser MVP Flow test failed:")
    console.error(err)

    // Capture emergency screenshot for visual diagnostics
    try {
      if (page) {
        await page.screenshot({ path: path.join(screenshotsDir, "error.png") })
        console.log("   📸 Captured emergency screenshot: error.png")
      }
    } catch (screenErr) {
      console.error("   ❌ Failed to capture emergency screenshot:", screenErr)
    }

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
        await db.campaign.deleteMany({ where: { id: campaignId } })
      }
      if (categoryId) await db.businessCategory.deleteMany({ where: { id: categoryId } })
      await db.advertiser.deleteMany({ where: { email: merchantEmail } })
      await db.adminUser.deleteMany({ where: { supabaseUserId: adminSupabaseId } })
      console.log("🧹 Emergency cleanup completed.")
    } catch (cleanupErr) {
      console.error("🧹 Emergency cleanup failed:", cleanupErr)
    }

    process.exit(1)
  } finally {
    await browser.close()
  }
}

runBrowserMvpFlow()
