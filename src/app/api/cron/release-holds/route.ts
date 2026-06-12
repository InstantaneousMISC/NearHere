import { NextResponse } from "next/server"
import { releaseExpiredHolds } from "@/server/helpers/releaseExpiredHolds"

export async function GET() {
  try {
    const releasedCount = await releaseExpiredHolds()
    return NextResponse.json({ success: true, released: releasedCount })
  } catch (error: any) {
    console.error("[CRON ERROR] Failed to release expired holds:", error)
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    )
  }
}
