import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import crypto from "crypto"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get("businessId")
  const qrSlug = searchParams.get("qr")
  const type = searchParams.get("type") || "CUSTOM"
  const target = searchParams.get("target")
  const label = searchParams.get("label")

  if (!businessId || !target) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Extract Metadata
  const userAgent = request.headers.get("user-agent") || null
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || null
  const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : null

  // Lookup QrCode ID if slug is provided
  let qrCodeId: string | null = null
  if (qrSlug) {
    const qr = await db.qrCode.findUnique({
      where: { slug: qrSlug },
      select: { id: true },
    })
    if (qr) {
      qrCodeId = qr.id
    }
  }

  // Record Click Event
  try {
    await db.businessClickEvent.create({
      data: {
        businessId,
        qrCodeId,
        linkType: type,
        linkLabel: label,
        targetUrl: target,
        userAgent,
        ipHash,
      },
    })
  } catch (err) {
    console.error("[CLICK TRACKER ERROR] Failed to record BusinessClickEvent:", err)
  }

  // Redirect to target
  // Next.js NextResponse.redirect() only supports HTTP/HTTPS protocols.
  // For special protocol links (tel:, mailto:, sms:), we serve a client-side HTML redirect.
  const isHttp = target.startsWith("http://") || target.startsWith("https://")

  if (!isHttp) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
          <script>
            window.location.href = ${JSON.stringify(target)};
          </script>
        </head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FAF8F4; color: #211D1C;">
          <div style="text-align: center;">
            <p>Redirecting you to <strong>${target}</strong>...</p>
            <p style="font-size: 0.85rem; color: #77706A;">If you are not redirected automatically, <a href="${target}" style="color: #D13F1F; text-decoration: underline;">click here</a>.</p>
          </div>
        </body>
      </html>`,
      {
        headers: { "Content-Type": "text/html" },
      }
    )
  }

  // For HTTP/HTTPS links, perform a standard server-side redirect
  return NextResponse.redirect(new URL(target))
}
