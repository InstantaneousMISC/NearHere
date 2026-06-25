import { NextResponse } from "next/server"
import { triggerCreativeSubmissionReminders } from "@/server/email/actions"

export async function GET() {
  try {
    const result = await triggerCreativeSubmissionReminders({ olderThanHours: 72 })
    return NextResponse.json({ success: true, ...result })
  } catch (error: any) {
    console.error("[CRON ERROR] Failed to run creative submission reminders:", error)
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    )
  }
}
