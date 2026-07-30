import { redirect } from "next/navigation"
import PortalLoginForm from "@/components/auth/PortalLoginForm"
import { getCurrentUser } from "@/server/auth/access"
import { getSafePortalDestination, hasPortalAccess } from "@/server/auth/portal"

interface AdminLoginPageProps {
  searchParams: Promise<{ redirectTo?: string; access?: string }>
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { redirectTo, access } = await searchParams
  const destination = getSafePortalDestination("admin", redirectTo)
  const user = await getCurrentUser()

  if (user && await hasPortalAccess(user.id, "admin")) {
    redirect(destination)
  }

  return (
    <PortalLoginForm
      portal="admin"
      redirectTo={destination}
      accessDenied={access === "denied"}
      signedInAs={user?.email}
    />
  )
}
