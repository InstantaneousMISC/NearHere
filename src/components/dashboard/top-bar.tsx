import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type TopBarProps = {
  navigation?: ReactNode
  actions?: ReactNode
  className?: string
}

export function TopBar({ navigation, actions, className }: TopBarProps) {
  return (
    <header className={cn("flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 sm:px-6 lg:px-8", className)}>
      <div className="min-w-0">{navigation}</div>
      {actions ? <div className="ml-4 flex shrink-0 items-center gap-3">{actions}</div> : null}
    </header>
  )
}
