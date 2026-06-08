import { Resend } from "resend"

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, from = "LocalSpot Mailers <noreply@localspotmailers.com>" } = options
  
  if (!process.env.RESEND_API_KEY) {
    console.log("[EMAIL STUB] Would send email:", { to, subject })
    console.log("[EMAIL STUB] HTML:", html.substring(0, 200) + "...")
    return true
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from, to, subject, html })
    return true
  } catch (error) {
    console.error("[EMAIL ERROR] Failed to send email:", error)
    return false
  }
}
