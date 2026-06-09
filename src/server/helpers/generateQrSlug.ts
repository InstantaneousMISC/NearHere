import { type PrismaClient } from "@prisma/client"
import crypto from "crypto"

/**
 * Generates a short, unique URL-safe slug for tracking QR codes.
 * Format: qr_[8-character random hex string] (e.g., qr_a1b2c3d4)
 */
export async function generateQrSlug(db: PrismaClient): Promise<string> {
  let slug = ""

  while (true) {
    const randomHex = crypto.randomBytes(4).toString("hex") // Generates an 8-char hex string
    slug = `qr_${randomHex}`

    const existing = await db.qrCode.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) {
      return slug
    }
  }
}
