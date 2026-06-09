import assert from "assert"
import { generateQrSlug } from "./generateQrSlug"
import { type PrismaClient } from "@prisma/client"

console.log("🧪 Running generateQrSlug.test.ts...")

async function runTests() {
  let queriesCount = 0
  
  const mockDb = {
    qrCode: {
      findUnique: async ({ where }: { where: { slug: string } }) => {
        queriesCount++
        // Simulate a collision on the first generation attempt
        if (queriesCount === 1) {
          return { id: "existing-qrcode-id" }
        }
        return null
      },
    },
  } as unknown as PrismaClient

  try {
    const qrSlug = await generateQrSlug(mockDb)

    // Test 1: Check prefix
    assert.ok(qrSlug.startsWith("qr_"), "QR slug must start with 'qr_' prefix.")
    console.log("✅ QR slug begins with 'qr_' prefix.")

    // Test 2: Check length
    assert.strictEqual(qrSlug.length, 11, "QR slug length must be exactly 11 characters (qr_ + 8 hex chars).")
    console.log("✅ QR slug length is correct (11 characters).")

    // Test 3: Check collision retry loop
    assert.strictEqual(queriesCount, 2, "Should try again if the first generated slug exists in the database.")
    console.log("✅ Collision resolution loop works.")

    console.log("🎉 All generateQrSlug tests passed successfully!\n")
  } catch (error) {
    console.error("❌ Test failed:")
    console.error(error)
    process.exit(1)
  }
}

runTests()
