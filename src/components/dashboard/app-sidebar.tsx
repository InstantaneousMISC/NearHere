"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { ChevronDown, LogOut, Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export type DashboardNavItem = {
  label: string
  href?: string
  icon: LucideIcon
  badge?: number | string
  children?: Array<{ label: string; href: string }>
}

export type DashboardUser = {
  name: string
  email?: string | null
  initials: string
}

type AppSidebarProps = {
  navigation: DashboardNavItem[]
  portalLabel: string
  user: DashboardUser
  onSignOut?: () => void
  signingOut?: boolean
  className?: string
  onNavigate?: () => void
}

function isActiveItem(pathname: string, item: DashboardNavItem) {
  if (item.href && (pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)))) {
    return true
  }
  return item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`)) ?? false
}

export function AppSidebar({
  navigation,
  portalLabel,
  user,
  onSignOut,
  signingOut,
  className,
  onNavigate,
}: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn("flex h-full w-[248px] flex-col bg-sidebar text-sidebar-foreground", className)}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-5">
        <Link href="/" onClick={onNavigate} className="mb-5 flex items-center gap-2 px-2" aria-label="NearHere home">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xl font-bold text-primary-foreground">N</span>
          <span className="text-[28px] font-bold tracking-[-0.06em] text-white">
            Near<span className="text-primary">Here</span>
          </span>
        </Link>
        <p className="border-b border-sidebar-border px-2 pb-3 text-[10px] font-semibold tracking-[0.12em] text-sidebar-muted">
          {portalLabel}
        </p>

        <nav className="mt-4 space-y-1" aria-label={`${portalLabel.toLowerCase()} navigation`}>
          {navigation.map((item) => {
            const active = isActiveItem(pathname, item)
            const Icon = item.icon
            const content = (
              <>
                <span className="flex min-w-0 items-center gap-3">
                  <Icon className="size-[19px] shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined ? (
                  <span className="ml-2 min-w-5 rounded-full bg-destructive px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                ) : item.children ? (
                  <ChevronDown className={cn("size-4 transition-transform", active && "rotate-180")} aria-hidden="true" />
                ) : null}
              </>
            )

            return (
              <div key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex h-10 items-center justify-between rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      active
                        ? "bg-sidebar-active text-white shadow-sm"
                        : "text-sidebar-foreground hover:bg-white/8 hover:text-white",
                    )}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className={cn("flex h-10 items-center justify-between rounded-lg px-3 text-sm font-medium", active ? "text-white" : "text-sidebar-foreground")}>
                    {content}
                  </div>
                )}
                {item.children && active ? (
                  <div className="ml-5 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "block rounded-md px-2 py-1.5 text-xs transition-colors hover:bg-white/8 hover:text-white",
                          pathname === child.href || pathname.startsWith(`${child.href}/`) ? "text-white" : "text-sidebar-muted",
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm font-medium text-white">
            {user.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user.name}</p>
            {user.email ? <p className="truncate text-xs text-sidebar-muted">{user.email}</p> : null}
          </div>
          <ChevronDown className="size-4 text-sidebar-muted" aria-hidden="true" />
        </div>
        {onSignOut ? (
          <button
            type="button"
            onClick={onSignOut}
            disabled={signingOut}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-primary/70 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogOut className="size-4" aria-hidden="true" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        ) : null}
      </div>
    </aside>
  )
}

type MobileSidebarDrawerProps = AppSidebarProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebarDrawer({ open, onOpenChange, ...sidebarProps }: MobileSidebarDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button type="button" className="absolute inset-0 bg-black/45" onClick={() => onOpenChange(false)} aria-label="Close navigation menu" />
      <div className="relative h-full w-[min(84vw,320px)] shadow-2xl">
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 z-10 rounded-lg p-2 text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Close navigation menu"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
        <AppSidebar {...sidebarProps} onNavigate={() => onOpenChange(false)} />
      </div>
    </div>
  )
}

export function SidebarMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
      aria-label="Open navigation menu"
    >
      <Menu className="size-5" aria-hidden="true" />
    </button>
  )
}
