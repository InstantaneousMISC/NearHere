import assert from "assert"
import { spots9x12 } from "./templateSpots"

console.log("🧪 Running templateSpots.test.ts...")

try {
  // 1. Total Spots count assertion
  assert.strictEqual(spots9x12.length, 22, "9x12 template must contain exactly 22 spots in total.")
  console.log("✅ Total spots count is exactly 22.")

  // 2. Premium slot assertions
  const premiumSpots = spots9x12.filter(s => s.spotType === "PREMIUM")
  assert.strictEqual(premiumSpots.length, 1, "Should have exactly 1 Premium spot.")
  const premium = premiumSpots[0]!
  assert.strictEqual(premium.side, "BACK", "Premium spot must be on the BACK side.")
  assert.strictEqual(premium.price, 149000, "Premium spot price must be $1,490 (149000 cents).")
  assert.strictEqual(premium.categorySlug, "restaurant", "Premium spot default category slug must be 'restaurant'.")
  console.log("✅ Premium Center Back spot is configured correctly.")

  // 3. Divider event/venue slot assertions
  const dividerSpots = spots9x12.filter(s => s.categorySlug === "events-venues")
  assert.strictEqual(dividerSpots.length, 1, "Should have exactly 1 divider event/venue slot.")
  const divider = dividerSpots[0]!
  assert.strictEqual(divider.side, "FRONT", "Divider slot must be on the FRONT side.")
  assert.strictEqual(divider.price, 49000, "Divider slot price must be $490 (49000 cents).")
  assert.strictEqual(divider.x, 45, "Divider slot X coordinate must be at 45 (center spine).")
  assert.strictEqual(divider.width, 10, "Divider slot width must be 10 (spine divider width).")
  console.log("✅ Front Divider Spine event/venue spot is configured correctly.")

  // 4. Regular slots count assertions
  const regularSpots = spots9x12.filter(s => s.spotType !== "PREMIUM" && s.categorySlug !== "events-venues")
  assert.strictEqual(regularSpots.length, 20, "Should have exactly 20 regular standard/large slots.")
  
  // Front regular slots count
  const frontRegular = regularSpots.filter(s => s.side === "FRONT")
  assert.strictEqual(frontRegular.length, 12, "Should have exactly 12 regular slots on the FRONT.")
  
  // Verify Column distributions based on coordinates
  const col1 = frontRegular.filter(s => s.x < 10)
  const col2 = frontRegular.filter(s => s.x >= 10 && s.x < 30)
  const col4 = frontRegular.filter(s => s.x >= 50 && s.x < 70)
  const col5 = frontRegular.filter(s => s.x >= 70)
  assert.strictEqual(col1.length, 3, "Column 1 must have exactly 3 slots.")
  assert.strictEqual(col2.length, 3, "Column 2 must have exactly 3 slots.")
  assert.strictEqual(col4.length, 3, "Column 4 must have exactly 3 slots.")
  assert.strictEqual(col5.length, 3, "Column 5 must have exactly 3 slots.")
  
  // Back regular slots count
  const backRegular = regularSpots.filter(s => s.side === "BACK")
  assert.strictEqual(backRegular.length, 8, "Should have exactly 8 regular slots on the BACK.")
  
  // Verify Back Row distributions based on Y coordinates
  const backTop = backRegular.filter(s => s.y < 20)
  const backBottom = backRegular.filter(s => s.y > 50)
  assert.strictEqual(backTop.length, 4, "Back Top row must have exactly 4 slots.")
  assert.strictEqual(backBottom.length, 4, "Back Bottom row must have exactly 4 slots.")

  console.log("✅ Regular spots (12 Front standard, 8 Back standard) are configured correctly.")
  
  // 5. Pricing verification for regular spots
  const frontStandard = frontRegular.every(s => s.price === 49000)
  assert.ok(frontStandard, "All front regular standard spots must be priced at $490 (49000 cents).")
  
  const backStandard = backRegular.every(s => s.price === 59000)
  assert.ok(backStandard, "All back regular standard spots must be priced at $590 (59000 cents).")
  console.log("✅ Spot pricing alignment is correct ($490 Front Standard, $590 Back Standard).")

  console.log("\n🎉 All templateSpots test assertions passed successfully!")
} catch (error) {
  console.error("❌ Test failed:")
  console.error(error)
  process.exit(1)
}
