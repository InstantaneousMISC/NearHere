import assert from "assert"
import {
  validateZip,
  validatePhone,
  formatPhone,
  validateAndNormalizeUrl,
  calculateCostPerHousehold,
  isDeadlinePassed,
  generateSeoMetadata,
  calculateCampaignAvailability,
} from "../../lib/validation"

console.log("🧪 Running validation.test.ts...")

function runTests() {
  try {
    // 1. ZIP Code Validation
    assert.strictEqual(validateZip("78109"), true, "Valid 5-digit ZIP should pass")
    assert.strictEqual(validateZip(" 78109 "), true, "Trimming ZIP should allow it to pass")
    assert.strictEqual(validateZip("7810"), false, "4-digit ZIP should fail")
    assert.strictEqual(validateZip("781090"), false, "6-digit ZIP should fail")
    assert.strictEqual(validateZip("abcde"), false, "Alpha characters should fail")
    assert.strictEqual(validateZip("7810a"), false, "Mixed characters should fail")
    assert.strictEqual(validateZip(""), false, "Empty ZIP should fail")
    console.log("✅ ZIP code validation works.")

    // 2. Phone Validation & Formatting
    assert.strictEqual(validatePhone("5551234567"), true, "10 digit digits should pass")
    assert.strictEqual(validatePhone("(555) 123-4567"), true, "Formatted 10 digit number should pass")
    assert.strictEqual(validatePhone("555-123-4567"), true, "Dashed 10 digit number should pass")
    assert.strictEqual(validatePhone("123456"), false, "Short phone number should fail")
    
    assert.strictEqual(formatPhone("5551234567"), "(555) 123-4567", "Should format 10 digits cleanly")
    assert.strictEqual(formatPhone("555-123-4567"), "(555) 123-4567", "Should format raw digit extracted 10 digits")
    assert.strictEqual(formatPhone("123"), "123", "Should leave non-10 digit numbers as-is (trimmed)")
    console.log("✅ Phone validation and formatting works.")

    // 3. URL Validation & Normalization
    assert.strictEqual(validateAndNormalizeUrl("google.com"), "https://google.com/", "Should prepend https and normalize")
    assert.strictEqual(validateAndNormalizeUrl("http://google.com"), "http://google.com/", "Should preserve http if present")
    assert.strictEqual(validateAndNormalizeUrl("https://my-site.co.uk/page?x=1"), "https://my-site.co.uk/page?x=1", "Should preserve paths and queries")
    assert.strictEqual(validateAndNormalizeUrl("javascript:alert(1)"), null, "Should block javascript schema")
    assert.strictEqual(validateAndNormalizeUrl("data:text/html,abc"), null, "Should block data schema")
    assert.strictEqual(validateAndNormalizeUrl("not-a-valid-url"), null, "Should block malformed hostname")
    assert.strictEqual(validateAndNormalizeUrl(""), null, "Should return null for empty URLs")
    console.log("✅ URL validation and normalization works.")

    // 4. Cost Per Household Calculation
    assert.strictEqual(calculateCostPerHousehold(49000, 5000), 9.8, "49000 cents / 5000 households should be 9.8 cents")
    assert.strictEqual(calculateCostPerHousehold(59000, 5000), 11.8, "59000 cents / 5000 households should be 11.8 cents")
    assert.strictEqual(calculateCostPerHousehold(99000, 5000), 19.8, "99000 cents / 5000 households should be 19.8 cents")
    assert.strictEqual(calculateCostPerHousehold(49000, 0), 0, "Zero households should return 0 without division by zero error")
    console.log("✅ Cost per household calculation works.")

    // 5. Deadline Checks
    const pastDate = new Date(Date.now() - 3600000) // 1 hour ago
    const futureDate = new Date(Date.now() + 3600000) // 1 hour from now
    assert.strictEqual(isDeadlinePassed(pastDate), true, "Past deadline should be passed")
    assert.strictEqual(isDeadlinePassed(futureDate), false, "Future deadline should not be passed")
    assert.strictEqual(isDeadlinePassed(null), false, "Null deadline should not be passed")
    console.log("✅ Deadline checking works.")

    // 6. SEO Metadata Generation
    const seo = generateSeoMetadata("Acme Plumbing", "Plumber", "converse", "tx")
    assert.strictEqual(seo.title, "Acme Plumbing - Plumber in Converse, TX | NearHere", "Title format is correct")
    assert.ok(seo.description.includes("Acme Plumbing"), "Description should include business name")
    assert.ok(seo.description.includes("Plumber"), "Description should include category")
    assert.ok(seo.description.includes("Converse, TX"), "Description should include city/state")
    console.log("✅ SEO metadata generation works.")

    // 7. Campaign Availability Calculation
    const mockSpots = [
      { status: "OPEN" },
      { status: "HELD" },
      { status: "SOLD" },
      { status: "SOLD" },
      { status: "UNAVAILABLE" }
    ]
    const avail = calculateCampaignAvailability(mockSpots)
    assert.strictEqual(avail.total, 5, "Total count is correct")
    assert.strictEqual(avail.available, 1, "Available/open count is correct")
    assert.strictEqual(avail.held, 1, "Held count is correct")
    assert.strictEqual(avail.sold, 2, "Sold count is correct")
    assert.strictEqual(avail.isSoldOut, false, "Campaign is not sold out")

    const mockSoldOutSpots = [
      { status: "SOLD" },
      { status: "SOLD" }
    ]
    const availSoldOut = calculateCampaignAvailability(mockSoldOutSpots)
    assert.strictEqual(availSoldOut.isSoldOut, true, "Campaign is sold out when all spots are SOLD")
    console.log("✅ Campaign availability calculations work.")

    console.log("🎉 All validation unit tests passed successfully!\n")
  } catch (error) {
    console.error("❌ Test failed:")
    console.error(error)
    process.exit(1)
  }
}

runTests()
