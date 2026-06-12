import { spawnSync } from "child_process"
import path from "path"

const tests = [
  "src/server/helpers/generateSlug.test.ts",
  "src/server/helpers/generateQrSlug.test.ts",
  "src/server/helpers/templateSpots.test.ts",
  "src/server/helpers/email.test.ts",
  "src/server/helpers/validation.test.ts",
  "src/server/helpers/safeguards.test.ts",
  "src/server/helpers/claim.test.ts",
  "src/server/helpers/webhook.test.ts",
  "src/server/helpers/integration.test.ts",
  "src/server/helpers/adminFlows.test.ts",
  "src/server/helpers/lifecycle.test.ts",
  "src/server/helpers/dashFlow.test.ts",
]

console.log("=========================================")
console.log("📬 RUNNING ALL NEARHERE PLATFORM TESTS")
console.log("=========================================\n")

let failed = false
const results: { name: string; success: boolean; time: number }[] = []

const startSuite = Date.now()

for (const test of tests) {
  const absolutePath = path.resolve(test)
  console.log(`\n-----------------------------------------`)
  console.log(`🧪 Running: ${test}`)
  console.log(`-----------------------------------------`)

  const startTest = Date.now()
  const result = spawnSync("npx", ["tsx", test], {
    stdio: "inherit",
    shell: true,
  })
  const endTest = Date.now()

  const success = result.status === 0
  results.push({
    name: test,
    success,
    time: (endTest - startTest) / 1000,
  })

  if (!success) {
    failed = true
    console.error(`\n❌ Test failed: ${test} (Exit code: ${result.status})`)
  } else {
    console.log(`\n✅ Test passed: ${test}`)
  }
}

const endSuite = Date.now()
const duration = ((endSuite - startSuite) / 1000).toFixed(2)

console.log("\n=========================================")
console.log("📊 TEST RUN SUMMARY")
console.log("=========================================")
console.log(`Total Duration: ${duration}s\n`)

for (const r of results) {
  const status = r.success ? "✅ PASS" : "❌ FAIL"
  console.log(`${status} | ${r.name} (${r.time.toFixed(2)}s)`)
}

console.log("=========================================")

if (failed) {
  console.error("\n❌ SOME TESTS FAILED. CHECK LOGS ABOVE.")
  process.exit(1)
} else {
  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
  process.exit(0)
}
