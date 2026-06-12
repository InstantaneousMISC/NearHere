import { Resend } from "resend"
import { createHash } from "crypto"

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  idempotencyKey: string
}

export type SendEmailResult =
  | { ok: true; providerId: string }
  | { ok: false; error: string }

export async function sendEmail(options: EmailOptions): Promise<SendEmailResult> {
  const {
    to,
    subject,
    html,
    idempotencyKey,
    from = "LocalSpot Mailers <noreply@localspotmailers.com>",
  } = options
  
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === "re_...") {
    console.log("[EMAIL STUB] Would send email:", { to, subject })
    console.log("[EMAIL STUB] HTML:", html.substring(0, 200) + "...")
    const stubId = createHash("sha256").update(idempotencyKey).digest("hex").slice(0, 24)
    return { ok: true, providerId: `stub_${stubId}` }
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const response = await resend.emails.send(
      { from, to, subject, html },
      { idempotencyKey }
    )

    if (response.error) {
      return { ok: false, error: response.error.message }
    }

    if (!response.data?.id) {
      return { ok: false, error: "Resend returned no provider email ID" }
    }

    return { ok: true, providerId: response.data.id }
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send email:", error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
