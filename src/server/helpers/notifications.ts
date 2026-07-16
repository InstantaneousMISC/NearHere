import { db } from "@/server/db"

export async function createAdminNotification(params: {
  type: string
  title: string
  message: string
  link?: string | null
}) {
  try {
    await db.adminNotification.create({
      data: {
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link || null,
        read: false,
      },
    })
  } catch (error) {
    console.error("[NOTIFICATION ERROR] Failed to create admin notification:", error)
  }
}
