import assert from "assert"
import {
  TEMPLATE_1_DOUBLE_POSITIONS,
  TEMPLATE_1_PRICING,
} from "@/lib/nearHereSharedCard9x12"
import { spots9x12 } from "./templateSpots"

console.log("Running templateSpots.test.ts...")

try {
  assert.strictEqual(
    spots9x12.length,
    21,
    "9x12 Template 1 must contain 21 paid placements."
  )

  const front = spots9x12.filter((spot) => spot.side === "FRONT")
  const backStandard = spots9x12.filter(
    (spot) => spot.side === "BACK" && spot.spotType === "STANDARD"
  )
  const premium = spots9x12.find((spot) => spot.spotType === "PREMIUM")

  assert.strictEqual(front.length, 12, "Front must contain 12 standard positions.")
  assert.strictEqual(
    backStandard.length,
    8,
    "Back must contain eight standard positions."
  )
  assert.ok(premium, "Premium Center Back placement is required.")
  assert.strictEqual(premium.side, "BACK")
  assert.strictEqual(premium.x, 27.5)
  assert.strictEqual(premium.y, 31.3333)
  assert.strictEqual(premium.width, 40)
  assert.strictEqual(premium.height, 36.2222)

  assert.ok(
    front.every(
      (spot) => spot.price === TEMPLATE_1_PRICING.frontStandard * 100
    ),
    "Every front standard must cost $490."
  )
  assert.ok(
    backStandard.every(
      (spot) => spot.price === TEMPLATE_1_PRICING.backStandard * 100
    ),
    "Every back standard must cost $590."
  )
  assert.strictEqual(
    premium.price,
    TEMPLATE_1_PRICING.premiumCenterBack * 100
  )
  assert.strictEqual(TEMPLATE_1_PRICING.frontDouble, 950)
  assert.strictEqual(TEMPLATE_1_PRICING.backDouble, 1090)

  assert.strictEqual(
    spots9x12.some(
      (spot) => spot.side === "FRONT" && spot.x >= 43 && spot.x <= 57
    ),
    false,
    "The 160px center spine must not be sellable."
  )

  assert.deepStrictEqual(TEMPLATE_1_DOUBLE_POSITIONS.back, [
    ["B-T1", "B-T2"],
    ["B-T3", "B-T4"],
    ["B-B1", "B-B2"],
    ["B-B3", "B-B4"],
  ])

  console.log("All Template 1 spot geometry and pricing assertions passed.")
} catch (error) {
  console.error("Template 1 spot test failed:")
  console.error(error)
  process.exit(1)
}
