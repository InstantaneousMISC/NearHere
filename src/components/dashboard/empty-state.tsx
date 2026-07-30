import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

export function EmptyState({ icon: Icon, title, description, action, secondaryAction, className }: { icon: LucideIcon; title: string; description: string; action?: ReactNode; secondaryAction?: ReactNode; className?: string }) {
  return (
    <div className={`flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center ${className ?? ""}`}>
      <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-6" aria-hidden="true" /></span>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action || secondaryAction ? <div className="mt-5 flex flex-wrap justify-center gap-3">{action}{secondaryAction}</div> : null}
    </div>
  )
}
