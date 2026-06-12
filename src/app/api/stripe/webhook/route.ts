import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { CampaignStatus, OrderStatus, SpotStatus } from "@prisma/client"
import { stripe } from "@/lib/stripe"
import { db } from "@/server/db"
import {
  ensureBusinessForOrder,
  ensureCreativeSubmissionForOrder,
  ensurePostPaymentEmailsForOrder,
  ensureQrForOrder,
} from "@/server/helpers/postPayment"

async function transitionOrderToPaid(
  orderId: string,
  paymentIntentId: string | null
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { campaignSpot: true },
    })

    if (!order) return "NOT_FOUND" as const
    if (order.status === OrderStatus.PAID) return "ALREADY_PAID" as const

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        stripePaymentIntentId: paymentIntentId,
      },
    })
    await tx.campaignSpot.update({
      where: { id: order.campaignSpotId },
      data: {
        status: SpotStatus.SOLD,
        heldUntil: null,
        heldBySessionId: null,
      },
    })

    return "PAID" as const
  })
}

async function ensureCampaignSoldOut(orderId: string) {
  const order = await db.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { campaignId: true },
  })
  const remainingOpenSpots = await db.campaignSpot.count({
    where: {
      campaignId: order.campaignId,
      status: { in: [SpotStatus.OPEN, SpotStatus.HELD] },
    },
  })

  if (remainingOpenSpots === 0) {
    await db.campaign.update({
      where: { id: order.campaignId },
      data: { status: CampaignStatus.SOLD_OUT },
    })
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  let signature = req.headers.get("stripe-signature") || ""

  if (!signature) {
    try {
      signature = (await headers()).get("stripe-signature") || ""
    } catch {
      // Direct route-handler tests do not have a Next.js request scope.
    }
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  let event

  if (webhookSecret) {
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`[STRIPE WEBHOOK ERROR] Signature verification failed: ${message}`)
      return new NextResponse(`Webhook Error: ${message}`, { status: 400 })
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error("[STRIPE WEBHOOK ERROR] Missing STRIPE_WEBHOOK_SECRET in production.")
    return new NextResponse("Webhook Secret Missing", { status: 500 })
  } else {
    try {
      event = JSON.parse(body)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return new NextResponse(`Invalid JSON body: ${message}`, { status: 400 })
    }
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as {
    client_reference_id?: string | null
    payment_intent?: string | { id?: string } | null
  }
  const orderId = session.client_reference_id
  if (!orderId) {
    return new NextResponse("No client_reference_id", { status: 400 })
  }

  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null
  const transition = await transitionOrderToPaid(orderId, paymentIntentId)

  if (transition === "NOT_FOUND") {
    return new NextResponse("Order not found", { status: 404 })
  }
  if (transition === "SPOT_UNAVAILABLE") {
    return new NextResponse("Spot already sold, order cancelled", { status: 200 })
  }

  try {
    await ensureBusinessForOrder(orderId)
    await ensureQrForOrder(orderId)
    await ensureCreativeSubmissionForOrder(orderId)
    await ensureCampaignSoldOut(orderId)
    await ensurePostPaymentEmailsForOrder(orderId)
  } catch (error) {
    console.error(`[STRIPE WEBHOOK ERROR] Post-payment repair failed for ${orderId}:`, error)
    return new NextResponse("Post-payment processing failed", { status: 500 })
  }

  return NextResponse.json({ received: true })
}
