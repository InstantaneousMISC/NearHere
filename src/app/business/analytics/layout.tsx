import { requireBusinessDashboardAccess } from "@/server/auth/access"

export default async function BusinessAnalyticsProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireBusinessDashboardAccess("/business/analytics")
  return children
}
