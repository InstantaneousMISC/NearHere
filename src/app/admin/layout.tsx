"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    document.cookie = "mock_admin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;"
    router.push("/auth/login")
    router.refresh()
  }

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: "📊" },
    { name: "Campaigns", href: "/admin/campaigns", icon: "📬" },
    { name: "Categories", href: "/admin/categories", icon: "📁" },
    { name: "Orders", href: "/admin/orders", icon: "💳" },
    { name: "Creative Reviews", href: "/admin/creative-review", icon: "🎨" },
  ]

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 shadow-lg select-none">
        <div className="p-6 space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
              LS
            </div>
            <span className="text-white font-extrabold text-lg tracking-tight">
              Admin Portal
            </span>
          </div>

          <hr className="border-slate-800" />

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                      : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="p-6">
          <button
            type="button"
            disabled={loading}
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 text-sm font-semibold text-slate-400 hover:text-white hover:border-white transition-colors"
          >
            <span>🚪</span>
            <span>{loading ? "Signing out..." : "Sign Out"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-10">
        {children}
      </main>
    </div>
  )
}
