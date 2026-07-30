import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StatusTone } from "@/components/dashboard/status-badge"

export type ActivityItem = { id: string; title: string; description?: string; timestamp: string; icon: LucideIcon; tone?: StatusTone; href?: string }

const iconTone: Record<StatusTone, string> = { neutral: "bg-muted text-muted-foreground", info: "bg-info-soft text-info", warning: "bg-warning-soft text-warning", success: "bg-success-soft text-success", danger: "bg-destructive/10 text-destructive", purple: "bg-purple-soft text-purple" }

export function ActivityFeed({ items, emptyMessage = "No recent activity.", className }: { items: ActivityItem[]; emptyMessage?: string; className?: string }) {
  if (!items.length) return <p className="py-8 text-center text-sm text-muted-foreground">{emptyMessage}</p>
  return <div className={cn("divide-y divide-border", className)}>{items.map((item) => {
    const Icon = item.icon
    const content = <div className="flex gap-3 px-1 py-3.5"><span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", iconTone[item.tone ?? "neutral"])}><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-foreground">{item.title}</p>{item.description ? <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{item.description}</p> : null}<p className="mt-1 text-xs text-muted-foreground">{item.timestamp}</p></div></div>
    return item.href ? <Link key={item.id} href={item.href} className="block rounded-lg transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{content}</Link> : <div key={item.id}>{content}</div>
  })}</div>
}
