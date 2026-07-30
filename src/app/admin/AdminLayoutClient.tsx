"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Bell, Building2, FolderTree, LayoutDashboard, Mail, Map, Megaphone, MessageCircle, ReceiptText, ShieldCheck } from "lucide-react"
import { AppShell, type DashboardNavItem } from "@/components/dashboard/app-shell"
import { createClient } from "@/lib/supabase/client"
import { trpc } from "@/components/providers"

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const { data: unreadCount } = trpc.notification.getUnreadCount.useQuery(undefined, { refetchInterval: 10_000, retry: false })

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = "mock_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
    router.push("/auth/admin/login")
    router.refresh()
  }

  const navigation: DashboardNavItem[] = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Notifications", href: "/admin/notifications", icon: Bell, badge: unreadCount && unreadCount > 0 ? unreadCount : undefined },
    { label: "Campaigns", href: "/admin/campaigns", icon: Megaphone },
    { label: "Categories", href: "/admin/categories", icon: FolderTree },
    { label: "Orders", href: "/admin/orders", icon: ReceiptText },
    { label: "Creative Reviews", href: "/admin/creative-review", icon: ShieldCheck },
    { label: "Businesses", href: "/admin/businesses", icon: Building2 },
    { label: "Inquiries", href: "/admin/inquiries", icon: MessageCircle },
    { label: "Directory", href: "/admin/directory", icon: Map },
    { label: "Email Logs", href: "/admin/email-logs", icon: Mail },
  ]

  return (
    <AppShell
      navigation={navigation}
      portalLabel="ADMIN PORTAL"
      user={{ name: "Admin User", initials: "AU" }}
      onSignOut={handleSignOut}
      signingOut={loading}
      topBarNavigation={<span className="hidden text-sm font-semibold text-foreground sm:block">NearHere operations</span>}
      topBarActions={
        <>
          <Link href="/admin/notifications" className="relative inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}>
            <Bell className="size-5" aria-hidden="true" />
            {unreadCount ? <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white">{unreadCount > 9 ? "9+" : unreadCount}</span> : null}
          </Link>
          <span className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" />
          <div className="hidden items-center gap-2 sm:flex"><span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">AU</span><span className="text-sm font-medium text-foreground">Admin User</span></div>
        </>
      }
    >
      {children}
    </AppShell>
  )
}
