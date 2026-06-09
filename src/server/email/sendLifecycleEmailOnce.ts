import { db } from "@/server/db"
import { sendEmail } from "./sendEmail"
import { EmailStatus, Prisma } from "@prisma/client"
import { createHash } from "crypto"

interface SendLifecycleEmailOptions {
  toEmail: string
  templateKey: string
  entityType: string
  entityId: string
  subject: string
  html: string
  from?: string
}

export async function sendLifecycleEmailOnce(options: SendLifecycleEmailOptions): Promise<{
  success: boolean
  alreadySent: boolean
  providerId?: string
  error?: string
}> {
  const { toEmail, templateKey, entityType, entityId, subject, html, from } = options

  const normalizedEmail = toEmail.trim().toLowerCase()
  const idempotencyKey = createHash("sha256")
    .update([templateKey, entityType, entityId, normalizedEmail].join(":"))
    .digest("hex")

  let emailLogId: string
  try {
    const emailLog = await db.emailLog.create({
      data: {
        toEmail: normalizedEmail,
        templateKey,
        entityType,
        entityId,
        status: EmailStatus.PENDING,
      },
    })
    emailLogId = emailLog.id
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await db.emailLog.findUnique({
        where: {
          templateKey_entityType_entityId_toEmail: {
            templateKey,
            entityType,
            entityId,
            toEmail: normalizedEmail,
          },
        },
      })
      console.log(
        `[EMAIL IDEMPOTENCY] Skip claimed email: ${templateKey} to ${normalizedEmail} for ${entityType}:${entityId}`
      )
      return {
        success: existing?.status === EmailStatus.SENT,
        alreadySent: existing?.status === EmailStatus.SENT,
        providerId: existing?.providerId || undefined,
        error: existing?.error || undefined,
      }
    }

    const message = error instanceof Error ? error.message : String(error)
    console.error("[EMAIL ERROR] Failed to claim EmailLog row:", error)
    return { success: false, alreadySent: false, error: message }
  }

  const result = await sendEmail({
    to: normalizedEmail,
    subject,
    html,
    from,
    idempotencyKey,
  })

  if (result.ok) {
    await db.emailLog.update({
      where: { id: emailLogId },
      data: {
        status: EmailStatus.SENT,
        providerId: result.providerId,
        error: null,
        sentAt: new Date(),
      },
    })
    return {
      success: true,
      alreadySent: false,
      providerId: result.providerId,
    }
  }

  await db.emailLog.update({
    where: { id: emailLogId },
    data: {
      status: EmailStatus.FAILED,
      error: result.error,
      sentAt: null,
    },
  })
  return { success: false, alreadySent: false, error: result.error }
}
