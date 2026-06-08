import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/server/db"
import { sendEmail } from "@/server/email/sendEmail"
import { getPurchaseConfirmationTemplate } from "@/server/email/templates/purchaseConfirmation"
import { getAdminPurchaseNotificationTemplate } from "@/server/email/templates/adminPurchaseNotification"
import { OrderStatus, SpotStatus, CampaignStatus } from "@prisma/client"

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature") ?? ""

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("[STRIPE WEBHOOK ERROR] Missing STRIPE_WEBHOOK_SECRET environment variable.")
    return new NextResponse("Webhook Secret Missing", { status: 500 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err: any) {
    console.error(`[STRIPE WEBHOOK ERROR] ${err.message}`)
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 })
  }

  // Handle checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any
    const orderId = session.client_reference_id

    if (!orderId) {
      console.warn("[STRIPE WEBHOOK] No client_reference_id found in session.")
      return new NextResponse("No client_reference_id", { status: 400 })
    }

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        campaignSpot: true,
        campaign: true,
        advertiser: true,
      },
    })

    if (!order) {
      console.error(`[STRIPE WEBHOOK] Order not found: ${orderId}`)
      return new NextResponse("Order not found", { status: 404 })
    }

    // Only process if status is not already paid
    if (order.status !== OrderStatus.PAID) {
      console.log(`[STRIPE WEBHOOK] Updating order ${orderId} status to PAID.`)

      // Perform updates inside a transaction
      await db.$transaction([
        db.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.PAID,
            paidAt: new Date(),
            stripePaymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null,
          },
        }),
        db.campaignSpot.update({
          where: { id: order.campaignSpotId },
          data: {
            status: SpotStatus.SOLD,
            heldUntil: null,
            heldBySessionId: null,
          },
        }),
      ])

      // Auto transition campaign to SOLD_OUT if all spots are sold
      const remainingOpenSpots = await db.campaignSpot.count({
        where: {
          campaignId: order.campaignId,
          status: { in: [SpotStatus.OPEN, SpotStatus.HELD] },
        },
      })

      if (remainingOpenSpots === 0) {
        console.log(`[STRIPE WEBHOOK] Campaign ${order.campaignId} is now SOLD OUT.`)
        await db.campaign.update({
          where: { id: order.campaignId },
          data: { status: CampaignStatus.SOLD_OUT },
        })
      }

      // Generate emails URLs
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const creativeUrl = `${appUrl}/submit-creative/${order.creativeSubmissionToken}`
      const adminOrderUrl = `${appUrl}/admin/orders/${order.id}`

      // 1. Send confirmation email to buyer
      const buyerMail = getPurchaseConfirmationTemplate({
        businessName: order.advertiser.businessName,
        campaignName: order.campaign.name,
        categoryName: order.campaignSpot.label,
        amount: order.amount,
        creativeSubmissionUrl: creativeUrl,
      })

      await sendEmail({
        to: order.advertiser.email,
        subject: buyerMail.subject,
        html: buyerMail.html,
      })

      // 2. Send alert email to admins
      const adminMail = getAdminPurchaseNotificationTemplate({
        businessName: order.advertiser.businessName,
        contactName: order.advertiser.contactName,
        email: order.advertiser.email,
        phone: order.advertiser.phone,
        campaignName: order.campaign.name,
        categoryName: order.campaignSpot.label,
        amount: order.amount,
        adminOrderUrl,
      })

      const adminEmail = process.env.ADMIN_EMAIL || "admin@localspotmailers.com"
      await sendEmail({
        to: adminEmail,
        subject: adminMail.subject,
        html: adminMail.html,
      })
    }
  }

  return NextResponse.json({ received: true })
}
