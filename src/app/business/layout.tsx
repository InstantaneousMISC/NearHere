"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { trpc } from "@/lib/trpc/client"
import { Button } from "@/components/ui/button"

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const isDashboardRoute = 
    pathname.startsWith("/business/dashboard") ||
    pathname.startsWith("/business/profile") ||
    pathname.startsWith("/business/analytics") ||
    pathname.startsWith("/business/setup")

  if (!isDashboardRoute) {
    return <>{children}</>
  }

  // Fetch business info for user profile block in the top-right
  const { data: business, isLoading } = trpc.business.getMyBusiness.useQuery(undefined, {
    retry: false,
  })

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  // Get active breadcrumb label
  const getBreadcrumbs = () => {
    if (pathname.includes("/profile")) {
      return ["Profile", "EDIT PROFILE DETAILS"]
    }
    if (pathname.includes("/analytics")) {
      return ["Reports", "QR SCANS & CLICK ANALYTICS"]
    }
    return ["Overview", "MERCHANT PERFORMANCE OVERVIEW"]
  }

  const [parentCrumb, childCrumb] = getBreadcrumbs()

  const navItems = [
    { name: "Overview", href: "/business/dashboard", active: true },
    { name: "Profile", href: "/business/profile", active: true },
    { name: "Reports & Analytics", href: "/business/analytics", active: true },
    { name: "Campaign Slots", href: "#", active: false, badge: "soon" },
    { name: "Bookings", href: "#", active: false, badge: "soon" },
    { name: "Payments", href: "#", active: false, badge: "soon" },
    { name: "Messages", href: "#", active: false, badge: "soon" },
  ]

  // Get initials for profile avatar
  const getInitials = () => {
    if (!business?.name) return "NH"
    return business.name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="min-h-screen bg-background flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-secondary text-secondary-foreground flex flex-col justify-between shrink-0 border-r border-border select-none">
        <div className="p-6 space-y-8">
          
          {/* NearHere Logo */}
          <div className="flex flex-col text-left">
            <Link href="/" className="font-headline font-black text-2xl tracking-tighter text-primary flex items-center gap-1">
              <span className="bg-primary px-1.5 py-0.5 text-primary-foreground">Near</span>
              <span className="text-secondary-foreground">Here</span>
            </Link>
            <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase font-bold mt-1">
              Advertiser Dashboard
            </span>
          </div>

          <hr className="border-border/20" />

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isCurrent = pathname === item.href
              if (item.active) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-none text-sm font-semibold transition-all ${
                      isCurrent
                        ? "bg-primary text-primary-foreground border border-press"
                        : "text-secondary-foreground/80 hover:bg-secondary-foreground/5 hover:text-secondary-foreground"
                    }`}
                  >
                    <span className="flex items-center">
                      <span>{item.name}</span>
                    </span>
                  </Link>
                )
              } else {
                return (
                  <div
                    key={item.name}
                    title="Coming soon"
                    className="flex items-center justify-between px-4 py-3 text-secondary-foreground/45 cursor-not-allowed select-none rounded-none text-sm font-medium"
                  >
                    <span className="flex items-center">
                      <span>{item.name}</span>
                    </span>
                    {item.badge && (
                      <span className="text-[8px] font-mono font-bold uppercase bg-secondary-foreground/10 text-secondary-foreground/50 px-1.5 py-0.5 rounded-none">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )
              }
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6">
          <Button
            type="button"
            disabled={loading}
            onClick={handleSignOut}
            className="w-full flex items-center justify-center border border-secondary-foreground/30 hover:border-secondary-foreground bg-transparent text-secondary-foreground/80 hover:text-secondary-foreground hover:bg-secondary-foreground/5 rounded-none font-headline font-bold uppercase tracking-wider text-xs h-10 transition-all cursor-pointer"
          >
            <span>{loading ? "Signing out..." : "Logout"}</span>
          </Button>
        </div>
      </aside>

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar Header */}
        <header className="h-20 bg-card border-b border-border px-8 flex items-center justify-between shrink-0 select-none">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="text-muted-foreground uppercase">{parentCrumb}</span>
            <span className="text-border">➔</span>
            <span className="text-primary uppercase">{childCrumb}</span>
          </div>

          {/* Right Header Widgets */}
          <div className="flex items-center gap-6">
            
            {/* Notifications mock badge */}
            <div className="relative cursor-pointer p-1.5 hover:bg-press/5 rounded-none transition-colors">
              <span className="text-xl">🔔</span>
              <span className="absolute top-0 right-0 w-4.5 h-4.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-none flex items-center justify-center border border-press leading-none">
                3
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-border" />

            {/* Profile Avatar & Details */}
            {isLoading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-none bg-press/10" />
                <div className="space-y-1.5">
                  <div className="w-20 h-3 bg-press/10 rounded-none" />
                  <div className="w-16 h-2 bg-press/10 rounded-none" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-press/10 border border-press/20 flex items-center justify-center font-bold text-press text-sm tracking-wide">
                  {getInitials()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-bold text-press truncate max-w-[150px]">
                    {business?.name || "Advertiser"}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-warm truncate max-w-[150px]">
                    {business?.email || "owner"}
                  </div>
                </div>
              </div>
            )}

          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 bg-background/30">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}
