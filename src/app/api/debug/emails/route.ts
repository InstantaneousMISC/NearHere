import { createClient } from "@/lib/supabase/server"
import { db } from "@/server/db"
import {
  emailPreviewKeys,
  getEmailPreview,
  isEmailPreviewKey,
} from "@/server/email/renderPreview"

async function isAuthorizedAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false

  return Boolean(
    await db.adminUser.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true },
    })
  )
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production" && !(await isAuthorizedAdmin())) {
    return new Response("Forbidden", { status: 403 })
  }

  const template =
    new URL(request.url).searchParams.get("template") || emailPreviewKeys[0]
  if (!isEmailPreviewKey(template)) {
    return Response.json(
      { error: "Unknown email template", templates: emailPreviewKeys },
      { status: 400 }
    )
  }

  const preview = getEmailPreview(template)
  return new Response(preview.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Email-Subject": encodeURIComponent(preview.subject),
    },
  })
}
