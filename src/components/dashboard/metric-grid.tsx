import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function MetricGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5", className)}>{children}</div>
}
