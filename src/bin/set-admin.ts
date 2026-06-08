import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface AuthUser {
  id: string
  email: string
}

async function main() {
  const inputArg = process.argv[2]
  const email = process.argv[3] || process.env.ADMIN_EMAIL || "admin@localspotmailers.com"

  console.log("--------------------------------------------------")
  console.log("👤 LocalSpot Mailers Admin Mapping Helper")
  console.log("--------------------------------------------------")

  // If a UUID was explicitly passed as the first argument, map it directly.
  if (inputArg && inputArg.includes("-")) {
    try {
      console.log(`🔍 Mapping explicit UUID ${inputArg} to admin: ${email}...`)
      const admin = await prisma.adminUser.upsert({
        where: { email: email.toLowerCase() },
        update: { supabaseUserId: inputArg },
        create: {
          email: email.toLowerCase(),
          supabaseUserId: inputArg,
          role: "SUPER_ADMIN",
        },
      })
      console.log(`\n✅ Success! Mapped email "${admin.email}" to Supabase User ID: "${admin.supabaseUserId}"`)
      process.exit(0)
    } catch (err: any) {
      console.error("❌ Database update failed:", err.message || err)
      process.exit(1)
    }
  }

  // Otherwise, automatically look up the email in Supabase's auth.users table.
  const lookupEmail = (inputArg || email).toLowerCase()
  console.log(`🔍 Automatically looking up email "${lookupEmail}" in Supabase Auth tables...`)

  try {
    // Query Supabase's internal auth schema
    const users = await prisma.$queryRawUnsafe<AuthUser[]>(
      `SELECT id, email FROM auth.users WHERE LOWER(email) = $1 LIMIT 1`,
      lookupEmail
    )

    if (!users || users.length === 0) {
      console.log("\n❌ User not found in Supabase Auth yet.")
      console.log(`We couldn't find any registered user with email: "${lookupEmail}"`)
      console.log("\n💡 How to resolve:")
      console.log("1. Go to your Supabase project dashboard -> Authentication -> Users.")
      console.log(`2. Click 'Add User' -> 'Create User' and enter email: ${lookupEmail}`)
      console.log("3. Once the user is registered, run this script again:")
      console.log("   npx tsx src/bin/set-admin.ts")
      console.log("\nAlternatively, if you know the UUID, pass it explicitly:")
      console.log(`   npx tsx src/bin/set-admin.ts <USER_UUID> ${lookupEmail}`)
      process.exit(1)
    }

    const authUser = users[0]
    console.log(`Found registered Supabase User UUID: ${authUser.id}`)

    const admin = await prisma.adminUser.upsert({
      where: { email: lookupEmail },
      update: { supabaseUserId: authUser.id },
      create: {
        email: lookupEmail,
        supabaseUserId: authUser.id,
        role: "SUPER_ADMIN",
      },
    })

    console.log(`\n✅ Success! Auto-mapped "${admin.email}" to Supabase UUID: "${admin.supabaseUserId}"`)
    console.log("You can now log in and access all protected admin routes/APIs.")
  } catch (err: any) {
    console.error("\n❌ Database query failed.")
    console.error("Make sure your DATABASE_URL in .env has direct permissions to read from the auth.users table.")
    console.error("Error details:", err.message || err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
