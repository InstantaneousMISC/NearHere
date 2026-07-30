import { requireBusinessDashboardAccess } from "@/server/auth/access"

export default async function BusinessSetupProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireBusinessDashboardAccess("/business/setup")
  return children
}
