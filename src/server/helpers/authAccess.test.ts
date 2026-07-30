import assert from "assert"
import { OrderStatus, PostcardSide } from "@prisma/client"
import { db } from "../db"
import { findPaidBusinessForUserId } from "../auth/access"
import { createCallerFactory } from "../trpc/init"
import { appRouter } from "../trpc/router"

console.log("Running business access entitlement tests...")

async function runAuthAccessTests() {
  const timestamp = Date.now()
  const testId = `auth-access-${timestamp}`
  const paidOwnerId = `paid-owner-${testId}`
  const pendingOwnerId = `pending-owner-${testId}`
  const noAccessUserId = `no-access-${testId}`
  const createCaller = createCallerFactory(appRouter)

  let categoryId = ""
  let campaignId = ""
  let paidAdvertiserId = ""
  let pendingAdvertiserId = ""
  let paidBusinessId = ""
  let pendingBusinessId = ""

  try {
    const category = await db.businessCategory.create({
      data: { name: `Auth Category ${testId}`, slug: `auth-category-${testId}` },
    })
    categoryId = category.id

    const campaign = await db.campaign.create({
      data: {
        name: `Auth Campaign ${testId}`,
        slug: `auth-campaign-${testId}`,
        city: "converse",
        state: "tx",
        mailingQuantity: 1000,
      },
    })
    campaignId = campaign.id

    const [paidSpot, pendingSpot] = await Promise.all([
      db.campaignSpot.create({
        data: {
          campaignId,
          categoryId,
          label: `Paid Spot ${testId}`,
          price: 50000,
          x: 10,
          y: 10,
          width: 10,
          height: 10,
          side: PostcardSide.FRONT,
        },
      }),
      db.campaignSpot.create({
        data: {
          campaignId,
          categoryId,
          label: `Pending Spot ${testId}`,
          price: 50000,
          x: 25,
          y: 10,
          width: 10,
          height: 10,
          side: PostcardSide.FRONT,
        },
      }),
    ])

    const [paidAdvertiser, pendingAdvertiser] = await Promise.all([
      db.advertiser.create({
        data: {
          contactName: "Paid Owner",
          businessName: `Paid Business ${testId}`,
          email: `paid-${testId}@example.com`,
          phone: "555-111-2222",
        },
      }),
      db.advertiser.create({
        data: {
          contactName: "Pending Owner",
          businessName: `Pending Business ${testId}`,
          email: `pending-${testId}@example.com`,
          phone: "555-333-4444",
        },
      }),
    ])
    paidAdvertiserId = paidAdvertiser.id
    pendingAdvertiserId = pendingAdvertiser.id

    await Promise.all([
      db.order.create({
        data: {
          campaignId,
          campaignSpotId: paidSpot.id,
          advertiserId: paidAdvertiserId,
          amount: 50000,
          status: OrderStatus.PAID,
          creativeSubmissionToken: `paid-token-${testId}`,
        },
      }),
      db.order.create({
        data: {
          campaignId,
          campaignSpotId: pendingSpot.id,
          advertiserId: pendingAdvertiserId,
          amount: 50000,
          status: OrderStatus.PENDING,
          creativeSubmissionToken: `pending-token-${testId}`,
        },
      }),
    ])

    const [paidBusiness, pendingBusiness] = await Promise.all([
      db.business.create({
        data: {
          advertiserId: paidAdvertiserId,
          ownerUserId: paidOwnerId,
          name: `Paid Business ${testId}`,
          slug: `paid-business-${testId}`,
          status: "ACTIVE",
        },
      }),
      db.business.create({
        data: {
          advertiserId: pendingAdvertiserId,
          ownerUserId: pendingOwnerId,
          name: `Pending Business ${testId}`,
          slug: `pending-business-${testId}`,
          status: "ACTIVE",
        },
      }),
    ])
    paidBusinessId = paidBusiness.id
    pendingBusinessId = pendingBusiness.id

    const eligibleBusiness = await findPaidBusinessForUserId(paidOwnerId)
    assert.strictEqual(eligibleBusiness?.id, paidBusinessId, "A claimed paid business should be eligible")

    assert.strictEqual(
      await findPaidBusinessForUserId(pendingOwnerId),
      null,
      "A pending invoice must not grant business dashboard access"
    )

    const paidCaller = createCaller({
      db,
      user: { id: paidOwnerId, email: paidAdvertiser.email } as any,
      supabase: {} as any,
    })
    const returnedBusiness = await paidCaller.business.getMyBusiness()
    assert.strictEqual(returnedBusiness?.id, paidBusinessId)

    const noAccessCaller = createCaller({
      db,
      user: { id: noAccessUserId, email: `no-access-${testId}@example.com` } as any,
      supabase: {} as any,
    })
    await assert.rejects(
      noAccessCaller.business.getMyBusiness(),
      (error: any) => error.code === "FORBIDDEN",
      "An authenticated user with no paid claimed business must be blocked"
    )

    const autoCreatedBusiness = await db.business.findFirst({ where: { ownerUserId: noAccessUserId } })
    assert.strictEqual(autoCreatedBusiness, null, "Access checks must not create a business profile")

    console.log("Business access entitlement tests passed.")
  } finally {
    if (paidBusinessId || pendingBusinessId) {
      await db.business.deleteMany({ where: { id: { in: [paidBusinessId, pendingBusinessId].filter(Boolean) } } })
    }
    if (campaignId) await db.order.deleteMany({ where: { campaignId } })
    if (campaignId) await db.campaignSpot.deleteMany({ where: { campaignId } })
    if (campaignId) await db.campaign.deleteMany({ where: { id: campaignId } })
    if (categoryId) await db.businessCategory.deleteMany({ where: { id: categoryId } })
    await db.advertiser.deleteMany({ where: { id: { in: [paidAdvertiserId, pendingAdvertiserId].filter(Boolean) } } })
  }
}

runAuthAccessTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Business access entitlement tests failed:", error)
    process.exit(1)
  })
