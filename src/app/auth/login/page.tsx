import { redirect } from "next/navigation"

interface LoginPageProps {
  searchParams: Promise<{ portal?: string; redirectTo?: string; access?: string }>
}

/** Backwards-compatible entry point for old links. New links target a portal directly. */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { portal, redirectTo, access } = await searchParams
  const targetPortal = portal === "business" ? "business" : "admin"
  const params = new URLSearchParams()

  if (redirectTo) params.set("redirectTo", redirectTo)
  if (access) params.set("access", access)

  const suffix = params.size ? `?${params.toString()}` : ""
  redirect(`/auth/${targetPortal}/login${suffix}`)
}
