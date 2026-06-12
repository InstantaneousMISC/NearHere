"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { trpc } from "@/lib/trpc/client"

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Bypass dashboard layout for public business profiles
  const isDashboardRoute = 
    pathname.startsWith("/business/dashboard") ||
    pathname.startsWith("/business/profile") ||
    pathname.startsWith("/business/analytics") ||
    pathname.startsWith("/business/setup") ||
    pathname.includes("/business/claim")

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
    { name: "Overview", href: "/business/dashboard", icon: "📊", active: true },
    { name: "Profile", href: "/business/profile", icon: "👤", active: true },
    { name: "Reports & Analytics", href: "/business/analytics", icon: "📈", active: true },
    { name: "Campaign Slots", href: "#", icon: "📬", active: false, badge: "soon" },
    { name: "Bookings", href: "#", icon: "📅", active: false, badge: "soon" },
    { name: "Payments", href: "#", icon: "💳", active: false, badge: "soon" },
    { name: "Messages", href: "#", icon: "✉️", active: false, badge: "soon" },
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
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#211D1C] text-[#FAF8F4] flex flex-col justify-between shrink-0 shadow-xl select-none">
        <div className="p-6 space-y-8">
          
          {/* NearHere Logo */}
          <div className="flex flex-col text-left">
            <Link href="/" className="font-headline font-black text-2xl tracking-tighter text-[#D13F1F] flex items-center gap-1">
              <span className="text-xl">📍</span>
              <span className="text-[#FAF8F4]">Near</span>Here
            </Link>
            <span className="text-[10px] font-mono tracking-widest text-[#77706A] uppercase font-bold mt-1">
              Advertiser Dashboard
            </span>
          </div>

          <hr className="border-[#77706A]/20" />

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isCurrent = pathname === item.href
              if (item.active) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isCurrent
                        ? "bg-[#D13F1F] text-[#FAF8F4] shadow-md shadow-[#D13F1F]/20"
                        : "text-[#FAF8F4]/80 hover:bg-[#FAF8F4]/5 hover:text-[#FAF8F4]"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.name}</span>
                    </span>
                  </Link>
                )
              } else {
                return (
                  <div
                    key={item.name}
                    title="Coming soon"
                    className="flex items-center justify-between px-4 py-3 text-[#FAF8F4]/40 cursor-not-allowed select-none rounded-xl text-sm font-medium"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.name}</span>
                    </span>
                    {item.badge && (
                      <span className="text-[8px] font-mono font-bold uppercase bg-[#FAF8F4]/10 text-[#FAF8F4]/50 px-1.5 py-0.5 rounded-md">
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
          <button
            type="button"
            disabled={loading}
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[#77706A]/30 text-sm font-semibold text-[#FAF8F4]/70 hover:text-white hover:border-[#FAF8F4] transition-all cursor-pointer"
          >
            <span>🚪</span>
            <span>{loading ? "Signing out..." : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navbar Header */}
        <header className="h-20 bg-white border-b border-[#E7E0D8] px-8 flex items-center justify-between shrink-0 select-none">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-mono font-bold">
            <span className="text-[#77706A] uppercase">{parentCrumb}</span>
            <span className="text-[#E7E0D8]">➔</span>
            <span className="text-[#D13F1F] uppercase">{childCrumb}</span>
          </div>

          {/* Right Header Widgets */}
          <div className="flex items-center gap-6">
            
            {/* Notifications mock badge */}
            <div className="relative cursor-pointer p-1.5 hover:bg-slate-100 rounded-full transition-colors">
              <span className="text-xl">🔔</span>
              <span className="absolute top-0 right-0 w-4.5 h-4.5 bg-[#D13F1F] text-[#FAF8F4] text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white leading-none">
                3
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-[#E7E0D8]" />

            {/* Profile Avatar & Details */}
            {isLoading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="w-20 h-3 bg-slate-200 rounded" />
                  <div className="w-16 h-2 bg-slate-200 rounded" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#E7E0D8] border border-press/20 flex items-center justify-center font-bold text-press text-sm tracking-wide">
                  {getInitials()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-bold text-press truncate max-w-[150px]">
                    {business?.name || "Advertiser"}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-[#77706A] truncate max-w-[150px]">
                    {business?.email || "owner"}
                  </div>
                </div>
              </div>
            )}

          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#FAF8F4]/30">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </main>

      </div>
    </div>
  )
}
