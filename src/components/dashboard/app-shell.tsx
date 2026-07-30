"use client"

import { useState, type ReactNode } from "react"
import { AppSidebar, MobileSidebarDrawer, SidebarMenuButton, type DashboardNavItem, type DashboardUser } from "@/components/dashboard/app-sidebar"
import { TopBar } from "@/components/dashboard/top-bar"

export type { DashboardNavItem, DashboardUser } from "@/components/dashboard/app-sidebar"

type AppShellProps = {
  children: ReactNode
  navigation: DashboardNavItem[]
  portalLabel: string
  user: DashboardUser
  onSignOut?: () => void
  signingOut?: boolean
  topBarActions?: ReactNode
  topBarNavigation?: ReactNode
}

export function AppShell({
  children,
  navigation,
  portalLabel,
  user,
  onSignOut,
  signingOut,
  topBarActions,
  topBarNavigation,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const sidebarProps = { navigation, portalLabel, user, onSignOut, signingOut }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground lg:flex">
      <div className="fixed inset-y-0 left-0 z-30 hidden lg:block">
        <AppSidebar {...sidebarProps} />
      </div>
      <MobileSidebarDrawer {...sidebarProps} open={mobileOpen} onOpenChange={setMobileOpen} />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[248px]">
        <TopBar
          navigation={
            <div className="flex items-center gap-2">
              <SidebarMenuButton onClick={() => setMobileOpen(true)} />
              {topBarNavigation}
            </div>
          }
          actions={topBarActions}
        />
        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 xl:px-10">{children}</div>
        </main>
      </div>
    </div>
  )
}
