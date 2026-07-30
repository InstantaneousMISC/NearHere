import { OrderStatus, type Business } from "@prisma/client"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { db } from "@/server/db"

/**
 * A user may access the business portal only after claiming a business that has
 * at least one completed placement. Pending invoices never grant portal access.
 */
export async function findPaidBusinessForUserId(userId: string): Promise<Business | null> {
  return db.business.findFirst({
    where: {
      ownerUserId: userId,
      status: "ACTIVE",
      deletedAt: null,
      goodStanding: true,
      OR: [
        {
          advertiser: {
            orders: {
              some: { status: OrderStatus.PAID },
            },
          },
        },
        {
          qrCodes: {
            some: {
              order: { status: OrderStatus.PAID },
            },
          },
        },
      ],
    },
    orderBy: { createdAt: "asc" },
  })
}

interface AuthenticatedUser {
  id: string
  email?: string | null
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  if (process.env.NODE_ENV !== "production") {
    const cookieStore = await cookies()

    if (cookieStore.get("mock_admin")?.value === "true") {
      return {
        id: "6a43af92-16fe-4873-9f64-1dd278d794c2",
        email: "admin@localspotmailers.com",
      }
    }

    const mockUserId = cookieStore.get("mock_user_id")?.value
    const mockUserEmail = cookieStore.get("mock_user_email")?.value
    if (mockUserId && mockUserEmail) {
      return { id: mockUserId, email: mockUserEmail }
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireAdminAccess() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/admin/login")
  }

  const adminUser = await db.adminUser.findUnique({
    where: { supabaseUserId: user.id },
  })

  if (!adminUser) {
    redirect("/auth/admin/login?access=denied")
  }

  return { user, adminUser }
}

export async function requireBusinessDashboardAccess(returnTo: string) {
  const user = await getCurrentUser()

  if (!user) {
    redirect(`/auth/business/login?redirectTo=${encodeURIComponent(returnTo)}`)
  }

  const business = await findPaidBusinessForUserId(user.id)

  if (!business) {
    redirect("/business/access-denied")
  }

  return { user, business }
}
