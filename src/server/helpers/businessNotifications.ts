import { db } from "@/server/db"

export async function createBusinessNotification(params: {
  businessId: string
  type: string
  title: string
  message: string
  link?: string | null
}) {
  try {
    await db.businessNotification.create({
      data: {
        businessId: params.businessId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
    })
  } catch (error) {
    // A notification must never make the business action itself fail.
    console.error("[BUSINESS NOTIFICATION ERROR] Failed to create notification:", error)
  }
}
