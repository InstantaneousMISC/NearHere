import type { LucideIcon } from "lucide-react"
import { Check, Circle, CircleAlert } from "lucide-react"
import { cn } from "@/lib/utils"

export type WorkflowStep = {
  id: string
  label: string
  description?: string
  date?: string
  status: "complete" | "current" | "upcoming" | "blocked"
  icon?: LucideIcon
}

export function WorkflowStepper({ steps, orientation = "horizontal" }: { steps: WorkflowStep[]; orientation?: "horizontal" | "vertical" }) {
  const vertical = orientation === "vertical"
  return (
    <ol className={cn("flex", vertical ? "flex-col gap-4" : "flex-col gap-4 sm:flex-row sm:gap-0")}>
      {steps.map((step, index) => {
        const Icon = step.icon
        const marker = step.status === "complete" ? <Check className="size-4" /> : step.status === "blocked" ? <CircleAlert className="size-4" /> : Icon ? <Icon className="size-4" /> : <Circle className="size-3" />
        return (
          <li key={step.id} className={cn("relative flex min-w-0", vertical ? "gap-3" : "flex-1 gap-3 sm:flex-col sm:gap-2") }>
            {index > 0 ? <span className={cn("absolute bg-border", vertical ? "left-[15px] -top-4 h-4 w-px" : "left-[-50%] top-[15px] hidden h-px w-full sm:block")} aria-hidden="true" /> : null}
            <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border", step.status === "complete" ? "border-success bg-success-soft text-success" : step.status === "current" ? "border-primary bg-primary/10 text-primary" : step.status === "blocked" ? "border-destructive bg-destructive/10 text-destructive" : "border-border bg-card text-muted-foreground")}>{marker}</span>
            <span className="min-w-0">
              <span className={cn("block text-sm font-medium", step.status === "current" ? "text-primary" : "text-foreground")}>{step.label}</span>
              {step.description ? <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{step.description}</span> : null}
              {step.date ? <span className="mt-0.5 block text-xs text-muted-foreground">{step.date}</span> : null}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
