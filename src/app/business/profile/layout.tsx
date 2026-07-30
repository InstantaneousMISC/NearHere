import { requireBusinessDashboardAccess } from "@/server/auth/access"

export default async function BusinessProfileProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireBusinessDashboardAccess("/business/profile")
  return children
}
