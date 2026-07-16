import assert from "assert"
import { spots9x12_16_regular } from "./templateSpots"

console.log("Running postcard16regular.test.ts...")

try {
  assert.strictEqual(
    spots9x12_16_regular.length,
    16,
    "9x12 16-Regular Template must contain 16 paid placements."
  )

  const front = spots9x12_16_regular.filter((spot) => spot.side === "FRONT")
  const back = spots9x12_16_regular.filter((spot) => spot.side === "BACK")

  assert.strictEqual(front.length, 8, "Front must contain 8 standard positions.")
  assert.strictEqual(back.length, 8, "Back must contain 8 standard positions.")

  assert.ok(
    front.every((spot) => spot.price === 59000),
    "Every front placement must cost $590 (59,000 cents)."
  )
  assert.ok(
    back.every((spot) => spot.price === 49000),
    "Every back placement must cost $490 (49,000 cents)."
  )

  // Verify coordinates of FRONT_1
  const f1 = spots9x12_16_regular.find((spot) => spot.label === "FRONT_1")
  assert.ok(f1, "FRONT_1 must exist.")
  assert.strictEqual(f1.x, 2.5)
  assert.strictEqual(f1.y, 3.3333)
  assert.strictEqual(f1.width, 22.5)
  assert.strictEqual(f1.height, 45.5556)

  // Verify coordinates of BACK_1
  const b1 = spots9x12_16_regular.find((spot) => spot.label === "BACK_1")
  assert.ok(b1, "BACK_1 must exist.")
  assert.strictEqual(b1.x, 2.5)
  assert.strictEqual(b1.y, 3.3333)
  assert.strictEqual(b1.width, 18.75)
  assert.strictEqual(b1.height, 45.5556)

  // Verify coordinates of FRONT_8
  const f8 = spots9x12_16_regular.find((spot) => spot.label === "FRONT_8")
  assert.ok(f8, "FRONT_8 must exist.")
  assert.strictEqual(f8.x, 75.0)
  assert.strictEqual(f8.y, 51.1111)
  assert.strictEqual(f8.width, 22.5)
  assert.strictEqual(f8.height, 45.5556)

  // Verify pairing resolver logic
  function getPairedSpotKey(label: string): string | null {
    const match = label.match(/^(FRONT|BACK)_([1-8])$/)
    if (!match) return null
    const side = match[1]
    const num = parseInt(match[2], 10)
    let pairedNum: number
    if (num === 1) pairedNum = 2
    else if (num === 2) pairedNum = 1
    else if (num === 3) pairedNum = 4
    else if (num === 4) pairedNum = 3
    else if (num === 5) pairedNum = 6
    else if (num === 6) pairedNum = 5
    else if (num === 7) pairedNum = 8
    else if (num === 8) pairedNum = 7
    else return null

    return `${side}_${pairedNum}`
  }

  assert.strictEqual(getPairedSpotKey("FRONT_1"), "FRONT_2")
  assert.strictEqual(getPairedSpotKey("FRONT_2"), "FRONT_1")
  assert.strictEqual(getPairedSpotKey("FRONT_3"), "FRONT_4")
  assert.strictEqual(getPairedSpotKey("FRONT_4"), "FRONT_3")
  assert.strictEqual(getPairedSpotKey("FRONT_5"), "FRONT_6")
  assert.strictEqual(getPairedSpotKey("FRONT_6"), "FRONT_5")
  assert.strictEqual(getPairedSpotKey("FRONT_7"), "FRONT_8")
  assert.strictEqual(getPairedSpotKey("FRONT_8"), "FRONT_7")
  assert.strictEqual(getPairedSpotKey("BACK_1"), "BACK_2")
  assert.strictEqual(getPairedSpotKey("BACK_2"), "BACK_1")
  assert.strictEqual(getPairedSpotKey("INVALID"), null)

  console.log("All 9x12 16-Regular spot assertions passed.")
} catch (error) {
  console.error("postcard16regular test failed:")
  console.error(error)
  process.exit(1)
}
