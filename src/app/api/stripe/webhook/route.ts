import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { CampaignStatus, OrderStatus, SpotStatus, CampaignOfferEventType } from "@prisma/client"
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

    if (order.campaignSpot.status === SpotStatus.SOLD) {
      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELLED },
      })
      return "SPOT_UNAVAILABLE" as const
    }

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

    // If order has an associated campaign offer, increment redeemed and decrement reserved, then log event
    if (order.campaignOfferId) {
      await tx.campaignOffer.update({
        where: { id: order.campaignOfferId },
        data: {
          redeemedCount: { increment: 1 },
          reservedCount: { decrement: 1 },
        },
      })

      await tx.campaignOfferEvent.create({
        data: {
          campaignOfferId: order.campaignOfferId,
          eventType: CampaignOfferEventType.PAID,
        },
      })
    }

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

async function transitionOrderToRefunded(
  paymentIntentId: string,
  reason: string | null
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { campaignSpot: true },
    })

    if (!order) return "NOT_FOUND" as const
    if (order.status === OrderStatus.REFUNDED) return "ALREADY_REFUNDED" as const

    // Update Order Status
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.REFUNDED,
        refundedAt: new Date(),
        refundReason: reason || "Stripe dashboard refund",
      },
    })

    // Release the Campaign Spot
    if (order.campaignSpot.label.includes("_DOUBLE_")) {
      await tx.campaignSpot.update({
        where: { id: order.campaignSpotId },
        data: {
          status: SpotStatus.UNAVAILABLE,
          heldUntil: null,
          heldBySessionId: null,
        },
      })

      const match = order.campaignSpot.label.match(/^(FRONT|BACK)_DOUBLE_(\d+)_(\d+)$/)
      if (match) {
        const side = match[1]
        const u1 = match[2]
        const u2 = match[3]
        const label1 = `${side}_${u1}`
        const label2 = `${side}_${u2}`

        await tx.campaignSpot.updateMany({
          where: {
            campaignId: order.campaignId,
            label: { in: [label1, label2] },
          },
          data: {
            status: SpotStatus.OPEN,
            heldUntil: null,
            heldBySessionId: null,
          },
        })
      }
    } else {
      await tx.campaignSpot.update({
        where: { id: order.campaignSpotId },
        data: {
          status: SpotStatus.OPEN,
          heldUntil: null,
          heldBySessionId: null,
        },
      })
    }

    // Disable QR Code if it exists
    await tx.qrCode.updateMany({
      where: { orderId: order.id },
      data: {
        status: "DISABLED",
      },
    })

    // Revert Offer counts if applicable (order was PAID, so we decrement redeemedCount)
    if (order.campaignOfferId) {
      await tx.campaignOffer.update({
        where: { id: order.campaignOfferId },
        data: {
          redeemedCount: { decrement: 1 },
        },
      })
    }

    // Revert Campaign SOLD_OUT status if needed
    const campaign = await tx.campaign.findUnique({
      where: { id: order.campaignId },
    })

    if (campaign && campaign.status === CampaignStatus.SOLD_OUT) {
      await tx.campaign.update({
        where: { id: campaign.id },
        data: { status: CampaignStatus.ACTIVE },
      })
    }

    // Audit Log Entry
    await tx.adminAuditLog.create({
      data: {
        adminEmail: "stripe-webhook@system.localspot",
        action: "ORDER_REFUND",
        businessId: null,
        notes: reason || "Refund processed via Stripe Webhook",
        metadata: {
          orderId: order.id,
          campaignSpotId: order.campaignSpotId,
          campaignId: order.campaignId,
          stripePaymentIntentId: paymentIntentId,
          refundReason: reason,
        },
      },
    })

    return { status: "REFUNDED" as const, orderId: order.id }
  })
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

  if (event.type === "checkout.session.completed") {
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

      // Trigger Admin Notification
      try {
        const order = await db.order.findUnique({
          where: { id: orderId },
          include: { advertiser: true, campaign: true },
        })
        if (order) {
          const amountFormatted = (order.amount / 100).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          })
          const { createAdminNotification } = await import("@/server/helpers/notifications")
          await createAdminNotification({
            type: "INVOICE_PAID",
            title: "Payment Received",
            message: `Invoice of ${amountFormatted} paid by ${order.advertiser.businessName} (Campaign: ${order.campaign.name})`,
            link: `/admin/orders/${order.id}`,
          })
        }
      } catch (err) {
        console.error("[NOTIFICATION ERROR] Failed to trigger payment notification:", err)
      }
    } catch (error) {
      console.error(`[STRIPE WEBHOOK ERROR] Post-payment repair failed for ${orderId}:`, error)
      return new NextResponse("Post-payment processing failed", { status: 500 })
    }

    return NextResponse.json({ received: true })
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object as {
      payment_intent?: string | null
      refunds?: {
        data?: Array<{
          reason?: string | null
        }>
      } | null
    }
    const paymentIntentId = charge.payment_intent
    if (!paymentIntentId) {
      return new NextResponse("No payment_intent ID", { status: 400 })
    }

    const reason = charge.refunds?.data?.[0]?.reason || null
    const transition = await transitionOrderToRefunded(paymentIntentId, reason)

    if (transition === "NOT_FOUND") {
      return new NextResponse("Order not found for Stripe payment intent", { status: 404 })
    }

    if (typeof transition === "object" && transition.status === "REFUNDED") {
      try {
        const { sendBookingCancelledEmail } = await import("@/server/email/actions")
        await sendBookingCancelledEmail(transition.orderId, reason || "Stripe dashboard refund")
      } catch (err) {
        console.error("[STRIPE WEBHOOK ERROR] Failed to send refund email:", err)
      }
    }

    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
