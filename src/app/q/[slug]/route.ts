import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/server/db"
import crypto from "crypto"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  if (!slug) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // Find QR code with business details
  const qrCode = await db.qrCode.findUnique({
    where: { slug },
    include: { business: true },
  })

  if (!qrCode) {
    console.warn(`[QR REDIRECT] QR code not found for slug: ${slug}`)
    return NextResponse.redirect(new URL("/", request.url))
  }

  const now = new Date()
  const isExpired =
    qrCode.status === "EXPIRED" ||
    (qrCode.expiresAt !== null && qrCode.expiresAt < now)

  const isDisabled = qrCode.status === "DISABLED"

  // Extract Request Metadata
  const userAgent = request.headers.get("user-agent") || null
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || null
  const ipHash = ip ? crypto.createHash("sha256").update(ip).digest("hex") : null
  const referrer = request.headers.get("referer") || null

  // Crude Device Type Detection
  let deviceType = "Desktop"
  if (userAgent) {
    if (/mobi|android|iphone|ipad|ipod/i.test(userAgent)) {
      deviceType = "Mobile"
    } else if (/tablet/i.test(userAgent)) {
      deviceType = "Tablet"
    }
  }

  // Vercel Geolocation Headers
  const country = request.headers.get("x-vercel-ip-country") || null
  const region = request.headers.get("x-vercel-ip-country-region") || null
  const city = request.headers.get("x-vercel-ip-city") || null

  // Simple bot detection
  const isBot = userAgent ? /bot|googlebot|crawler|spider|robot|crawling|lighthouse|pingdom|uptime|slurp|yahoo|bing|baidu|yandex/i.test(userAgent) : false

  // Async Log the Scan (catch errors so redirect never blocks)
  if (!isBot) {
    try {
      await db.qrScan.create({
        data: {
          qrCodeId: qrCode.id,
          businessId: qrCode.businessId,
          campaignId: qrCode.campaignId,
          campaignSpotId: qrCode.campaignSpotId,
          userAgent,
          ipHash,
          referrer,
          deviceType,
          country,
          region,
          city,
          isExpiredScan: isExpired || isDisabled,
        },
      })
    } catch (err) {
      console.error(`[QR REDIRECT ERROR] Failed to record QrScan for ${slug}:`, err)
    }
  }

  // If QR code is explicitly disabled, return a clean styled fallback page
  if (isDisabled) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>Postcard Offer Unavailable</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background-color: #FAF8F4;
              color: #211D1C;
              padding: 1rem;
              box-sizing: border-box;
            }
            .card {
              background: #FAF8F4;
              border: 2px solid #211D1C;
              padding: 2.5rem 1.5rem;
              text-align: center;
              max-width: 420px;
              width: 100%;
              box-sizing: border-box;
            }
            .icon {
              font-size: 2.5rem;
              margin-bottom: 1rem;
            }
            h1 {
              font-family: "Archivo Narrow", "Helvetica Neue", sans-serif;
              font-stretch: condensed;
              text-transform: uppercase;
              font-size: 1.5rem;
              font-weight: 800;
              letter-spacing: -0.01em;
              margin: 0 0 1rem 0;
              color: #D13F1F;
              line-height: 1.1;
            }
            p {
              font-size: 0.9rem;
              color: #77706A;
              line-height: 1.6;
              margin: 0 0 1.75rem 0;
              font-weight: 500;
            }
            .btn {
              display: inline-block;
              padding: 0.85rem 2rem;
              background-color: #211D1C;
              color: #FAF8F4;
              text-decoration: none;
              font-weight: 700;
              font-size: 0.8rem;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              border: 1px solid #211D1C;
              transition: all 0.2s ease;
            }
            .btn:hover {
              background-color: #FAF8F4;
              color: #211D1C;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">📭</div>
            <h1>Offer Temporarily Unavailable</h1>
            <p>This postcard promotion is currently inactive or has been disabled by the business owner. Please check back later or contact the business directly.</p>
            <a href="/" class="btn">Explore NearHere</a>
          </div>
        </body>
      </html>`,
      {
        headers: { "Content-Type": "text/html" },
      }
    )
  }

  // Redirect to NearHere public business profile
  const redirectUrl = new URL(`/b/${qrCode.business.slug}`, request.url)
  redirectUrl.searchParams.set("qr", slug)
  if (isExpired) {
    redirectUrl.searchParams.set("expired", "1")
  }

  return NextResponse.redirect(redirectUrl)
}
