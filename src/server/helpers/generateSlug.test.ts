import assert from "assert"
import { generateSlug } from "./generateSlug"
import { type PrismaClient } from "@prisma/client"

console.log("🧪 Running generateSlug.test.ts...")

async function runTests() {
  const mockDb = {
    business: {
      findUnique: async ({ where }: { where: { slug: string } }) => {
        // Mock existing records to force collision suffix resolution
        if (where.slug === "acme-plumbing") {
          return { id: "b-1" }
        }
        if (where.slug === "acme-plumbing-1") {
          return { id: "b-2" }
        }
        return null
      },
    },
  } as unknown as PrismaClient

  try {
    // Test 1: Clean conversion
    const slug1 = await generateSlug("Acme Plumbing & Heating!", mockDb)
    assert.strictEqual(slug1, "acme-plumbing-heating", "Should strip special characters, replace spaces, and lowercase.")
    console.log("✅ Conversion of spaces, casing, and special characters works.")

    // Test 2: Uniqueness suffix resolution
    const slug2 = await generateSlug("Acme Plumbing", mockDb)
    assert.strictEqual(slug2, "acme-plumbing-2", "Should check existing records and increment suffix number.")
    console.log("✅ Appending suffix count for uniqueness resolution works.")

    console.log("🎉 All generateSlug tests passed successfully!\n")
  } catch (error) {
    console.error("❌ Test failed:")
    console.error(error)
    process.exit(1)
  }
}

runTests()
