"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { Bell, ChartNoAxesCombined, LayoutDashboard, Settings, Tag, UserRound } from "lucide-react"
import { AppShell, type DashboardNavItem } from "@/components/dashboard/app-shell"
import { createClient } from "@/lib/supabase/client"
import { trpc } from "@/lib/trpc/client"

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const isDashboardRoute = pathname.startsWith("/business/dashboard") || pathname.startsWith("/business/profile") || pathname.startsWith("/business/analytics") || pathname.startsWith("/business/offers") || pathname.startsWith("/business/setup")

  const { data: business } = trpc.business.getMyBusiness.useQuery(undefined, { retry: false, enabled: isDashboardRoute, staleTime: 30_000 })
  const { data: notifications, refetch: refetchNotifications } = trpc.business.listMyNotifications.useQuery(undefined, { enabled: isDashboardRoute, staleTime: 30_000, refetchInterval: 60_000 })
  const { data: unreadNotificationCount, refetch: refetchUnreadNotificationCount } = trpc.business.getMyUnreadNotificationCount.useQuery(undefined, { enabled: isDashboardRoute, staleTime: 30_000, refetchInterval: 60_000 })
  const markNotificationRead = trpc.business.markMyNotificationRead.useMutation()
  const markAllNotificationsRead = trpc.business.markAllMyNotificationsRead.useMutation()

  if (!isDashboardRoute) return <>{children}</>

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/business/login")
    router.refresh()
  }
  const refreshNotifications = () => Promise.all([refetchNotifications(), refetchUnreadNotificationCount()])
  const handleNotificationClick = async (notification: { id: string; read: boolean; link: string | null }) => {
    try {
      if (!notification.read) { await markNotificationRead.mutateAsync({ id: notification.id }); await refreshNotifications() }
      if (notification.link) { setNotificationsOpen(false); router.push(notification.link) }
    } catch (error) { console.error("Failed to update notification:", error) }
  }
  const handleMarkAllNotificationsRead = async () => {
    try { await markAllNotificationsRead.mutateAsync(); await refreshNotifications() } catch (error) { console.error("Failed to mark notifications as read:", error) }
  }
  const initials = (business?.name || "NearHere").split(" ").slice(0, 2).map((word) => word[0]).join("").toUpperCase()
  const navigation: DashboardNavItem[] = [
    { label: "Dashboard", href: "/business/dashboard", icon: LayoutDashboard },
    { label: "My Profile", href: "/business/profile", icon: UserRound },
    { label: "My Offer", href: "/business/offers", icon: Tag },
    { label: "Analytics", icon: ChartNoAxesCombined, children: [{ label: "Overview", href: "/business/analytics" }] },
    { label: "Setup", href: "/business/setup", icon: Settings },
  ]

  return <AppShell navigation={navigation} portalLabel="ADVERTISER PORTAL" user={{ name: business?.name || "NearHere advertiser", email: business?.email, initials }} onSignOut={handleSignOut} signingOut={loading} topBarNavigation={<span className="hidden text-sm font-semibold text-foreground sm:block">Campaign center</span>} topBarActions={<><div className="relative"><button type="button" onClick={() => setNotificationsOpen((open) => !open)} aria-expanded={notificationsOpen} aria-haspopup="dialog" aria-label={`Notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ""}`} className="relative inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Bell className="size-5" aria-hidden="true" />{unreadNotificationCount ? <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-4 text-white">{unreadNotificationCount > 9 ? "9+" : unreadNotificationCount}</span> : null}</button>{notificationsOpen ? <div role="dialog" aria-label="Business notifications" className="absolute right-0 top-full z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card shadow-hover"><div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3"><div><p className="text-sm font-semibold text-foreground">Notifications</p><p className="mt-0.5 text-xs text-muted-foreground">Updates about your business and campaign.</p></div><button type="button" disabled={!unreadNotificationCount || markAllNotificationsRead.isPending} onClick={handleMarkAllNotificationsRead} className="text-xs font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:opacity-50">Mark all read</button></div><div className="max-h-80 overflow-y-auto">{notifications?.length ? notifications.map((notification) => <button key={notification.id} type="button" onClick={() => handleNotificationClick(notification)} className={`block w-full border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-muted/60 ${notification.read ? "bg-card" : "bg-primary/5"}`}><p className="text-sm font-medium text-foreground">{notification.title}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{notification.message}</p><p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(notification.createdAt))}</p></button>) : <p className="px-4 py-8 text-center text-sm text-muted-foreground">You’re all caught up.</p>}</div></div> : null}</div><span className="hidden h-8 w-px bg-border sm:block" aria-hidden="true" /><div className="hidden items-center gap-2 sm:flex"><span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">{initials}</span><span className="max-w-36 truncate text-sm font-medium text-foreground">{business?.name || "Advertiser"}</span></div></>}>
    {children}
  </AppShell>
}
