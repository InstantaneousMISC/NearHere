import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

export type MetricTrendProps = { value?: number; period?: string; unavailable?: boolean }

export function MetricTrend({ value, period, unavailable }: MetricTrendProps) {
  if (unavailable || value === undefined) return <p className="text-xs text-muted-foreground">Not enough prior data</p>
  const positive = value > 0
  const neutral = value === 0
  const Icon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight
  return (
    <p className={cn("flex items-center gap-1 text-xs font-medium", neutral ? "text-muted-foreground" : positive ? "text-success" : "text-destructive")}>
      <Icon className="size-3.5" aria-hidden="true" />
      <span>{Math.abs(value)}%</span>
      {period ? <span className="font-normal text-muted-foreground">vs {period}</span> : null}
    </p>
  )
}
