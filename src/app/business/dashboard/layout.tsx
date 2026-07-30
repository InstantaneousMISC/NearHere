import { requireBusinessDashboardAccess } from "@/server/auth/access"

export default async function BusinessDashboardProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireBusinessDashboardAccess("/business/dashboard")
  return children
}
