import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import crypto from "crypto"
import { db } from "@/server/db"
import { CampaignOfferEventType } from "@prisma/client"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const offer = await db.campaignOffer.findUnique({
    where: { token },
    select: { name: true },
  })

  return {
    title: offer ? `${offer.name} - Exclusive LocalSpot Mailers Offer` : "Exclusive Campaign Offer",
    description: "Claim your special discount and reserve your local postcard mailer placement.",
  }
}

export default async function ClaimOfferPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  // 1. Fetch the campaign offer
  const offer = await db.campaignOffer.findUnique({
    where: { token },
    include: {
      campaign: true,
    },
  })

  if (!offer) {
    return notFound()
  }

  // 2. Log a SCAN event and increment scanCount
  try {
    const headersList = await headers()
    const userAgent = headersList.get("user-agent")
    const ip = (headersList.get("x-forwarded-for") || "").split(",")[0].trim()
    const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16) : null

    // Run this inside a transaction to prevent race conditions or partial writes
    await db.$transaction([
      db.campaignOffer.update({
        where: { id: offer.id },
        data: { scanCount: { increment: 1 } },
      }),
      db.campaignOfferEvent.create({
        data: {
          campaignOfferId: offer.id,
          eventType: CampaignOfferEventType.SCAN,
          userAgent,
          ipHash,
        },
      }),
    ])
  } catch (error) {
    console.error("Error logging offer scan event:", error)
  }

  const campaign = offer.campaign
  redirect(
    `/campaigns/${campaign.state.toLowerCase()}/${campaign.city.toLowerCase()}/${campaign.slug.toLowerCase()}?offer=${token}#placements`
  )
}
