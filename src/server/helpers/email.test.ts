import assert from "node:assert/strict"
import {
  emailPreviewKeys,
  getEmailPreview,
  type EmailPreviewKey,
} from "../email/renderPreview"
import { escapeHtml } from "../email/escapeHtml"
import { getNeedsChangesTemplate } from "../email/templates/needsChanges"

const appUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3000"

const requiredLinks: Partial<Record<EmailPreviewKey, string>> = {
  "admin-purchase": "/admin/orders/preview-order",
  "claim-business": "/business/claim/preview-token",
  "claim-reset": "/business/claim/preview-token",
  "submit-creative": "/submit-creative/preview-token",
  "creative-received": "/submit-creative/preview-token",
  "needs-changes": "/submit-creative/preview-token",
  approved: "/business/dashboard",
  printed: "/business/dashboard",
  mailed: "/business/dashboard",
}

for (const key of emailPreviewKeys) {
  const rendered = getEmailPreview(key, appUrl)
  const combined = `${rendered.subject}\n${rendered.html}`

  assert.ok(rendered.subject.trim(), `${key}: subject must not be empty`)
  assert.ok(rendered.html.includes("<!DOCTYPE html>"), `${key}: must render HTML`)
  assert.doesNotMatch(combined, /\b(undefined|null)\b/i, `${key}: unresolved nullish value`)
  assert.doesNotMatch(combined, /\{\{[^}]+\}\}|\$\{[^}]+\}/, `${key}: placeholder token`)

  const requiredLink = requiredLinks[key]
  if (requiredLink) {
    assert.ok(
      rendered.html.includes(`${appUrl.replace(/\/$/, "")}${requiredLink}`),
      `${key}: missing required CTA link`
    )
  }
}

assert.equal(
  escapeHtml(`<script>alert("x")</script> & 'quoted'`),
  "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;quoted&#39;"
)

const escapedTemplate = getNeedsChangesTemplate({
  businessName: `<script>alert("business")</script>`,
  campaignName: "Campaign & Region",
  categoryName: "Home <Services>",
  notes: `<img src=x onerror="alert('notes')">`,
  creativeSubmissionUrl: `${appUrl.replace(/\/$/, "")}/submit-creative/escape-test`,
})
assert.ok(escapedTemplate.html.includes("&lt;script&gt;"))
assert.ok(escapedTemplate.html.includes("&lt;img"))
assert.ok(!escapedTemplate.html.includes("<script>alert"))
assert.ok(!escapedTemplate.html.includes("<img src=x"))

console.log(`Rendered and validated ${emailPreviewKeys.length} email previews.`)
