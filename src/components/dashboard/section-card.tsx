import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type SectionCardProps = {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  padding?: "none" | "sm" | "md" | "lg"
  className?: string
}

const paddingClasses = { none: "", sm: "p-4", md: "p-5 sm:p-6", lg: "p-6 sm:p-7" }

export function SectionCard({ title, description, action, children, padding = "md", className }: SectionCardProps) {
  return (
    <section className={cn("rounded-xl border border-border bg-card text-card-foreground shadow-card", className)}>
      {title || description || action ? (
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            {title ? <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p> : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}
      <div className={paddingClasses[padding]}>{children}</div>
    </section>
  )
}
