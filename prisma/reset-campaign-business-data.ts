import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const counts = async () => ({
  campaigns: await prisma.campaign.count(),
  campaignSpots: await prisma.campaignSpot.count(),
  advertisers: await prisma.advertiser.count(),
  orders: await prisma.order.count(),
  businesses: await prisma.business.count(),
  qrCodes: await prisma.qrCode.count(),
  directoryProfilesLinkedToBusinesses: await prisma.directoryProfile.count({
    where: { businessId: { not: null } },
  }),
  adminUsers: await prisma.adminUser.count(),
})

async function main() {
  const execute = process.argv.includes("--execute")
  const before = await counts()
  console.table(before)

  if (!execute) {
    console.log("Dry run only. Run with --execute to remove campaign and business data.")
    return
  }

  await prisma.$transaction(async (tx) => {
    // Clear leaf records before their referenced campaigns, orders, and businesses.
    await tx.qrScan.deleteMany()
    await tx.qrCode.deleteMany()
    await tx.creativeReviewEvent.deleteMany()
    await tx.creativeSubmission.deleteMany()
    await tx.campaignOfferEvent.deleteMany()
    await tx.order.deleteMany()
    await tx.campaignOffer.deleteMany()
    await tx.campaignInquiry.deleteMany()

    // Business-owned profiles are data, while directory locations/categories are
    // retained as reference data for a clean next test run.
    await tx.directoryProfile.deleteMany({ where: { businessId: { not: null } } })
    await tx.businessProfileChangeRequest.deleteMany()
    await tx.businessPageView.deleteMany()
    await tx.businessClickEvent.deleteMany()
    await tx.businessLink.deleteMany({ where: { businessId: { not: null } } })
    await tx.business.deleteMany()
    await tx.advertiser.deleteMany()

    await tx.campaignSpot.deleteMany()
    await tx.campaign.deleteMany()

    // These are operational records created from the removed data. Admin users
    // and all catalog/reference records are intentionally preserved.
    await tx.adminAuditLog.deleteMany()
    await tx.adminNotification.deleteMany()
    await tx.emailLog.deleteMany()

    const defaultAdminEmail = process.env.ADMIN_EMAIL ?? "admin@localspotmailers.com"
    await tx.adminUser.deleteMany({ where: { email: { not: defaultAdminEmail } } })
  }, { maxWait: 10_000, timeout: 60_000 })

  console.log("Campaign and business reset complete. Admin users and reference data were preserved.")
  console.table(await counts())
}

main()
  .catch((error) => {
    console.error("Campaign/business reset failed:", error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
