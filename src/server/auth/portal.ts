import "server-only"

import { db } from "@/server/db"
import { findPaidBusinessForUserId } from "./access"

export type Portal = "admin" | "business"

const defaultDestination: Record<Portal, string> = {
  admin: "/admin",
  business: "/business/dashboard",
}

function isPathForPortal(portal: Portal, pathname: string) {
  if (portal === "admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/")
  }

  return [
    "/business/dashboard",
    "/business/profile",
    "/business/analytics",
    "/business/setup",
    "/submit-creative/",
  ].some((path) => pathname === path || pathname.startsWith(path))
}

/** Keeps redirects within the portal selected by the user. */
export function getSafePortalDestination(portal: Portal, requestedRedirect?: string | null) {
  if (!requestedRedirect || !requestedRedirect.startsWith("/") || requestedRedirect.startsWith("//")) {
    return defaultDestination[portal]
  }

  const parsed = new URL(requestedRedirect, "http://localspot.internal")
  return isPathForPortal(portal, parsed.pathname)
    ? `${parsed.pathname}${parsed.search}${parsed.hash}`
    : defaultDestination[portal]
}

export async function hasPortalAccess(userId: string, portal: Portal) {
  if (portal === "admin") {
    return Boolean(
      await db.adminUser.findUnique({
        where: { supabaseUserId: userId },
        select: { id: true },
      })
    )
  }

  return Boolean(await findPaidBusinessForUserId(userId))
}
