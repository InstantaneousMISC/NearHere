import { redirect } from "next/navigation"
import PortalLoginForm from "@/components/auth/PortalLoginForm"
import { getCurrentUser } from "@/server/auth/access"
import { getSafePortalDestination, hasPortalAccess } from "@/server/auth/portal"

interface BusinessLoginPageProps {
  searchParams: Promise<{ redirectTo?: string; reset?: string }>
}

export default async function BusinessLoginPage({ searchParams }: BusinessLoginPageProps) {
  const { redirectTo, reset } = await searchParams
  const destination = getSafePortalDestination("business", redirectTo)
  const user = await getCurrentUser()

  if (user && await hasPortalAccess(user.id, "business")) {
    redirect(destination)
  }

  return (
    <PortalLoginForm
      portal="business"
      redirectTo={destination}
      accessDenied={false}
      signedInAs={user?.email}
      passwordReset={reset === "success"}
    />
  )
}
