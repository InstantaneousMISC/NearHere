import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { MetricTrend, type MetricTrendProps } from "@/components/dashboard/metric-trend"

type MetricTone = "orange" | "green" | "blue" | "amber" | "purple" | "neutral"

const toneClasses: Record<MetricTone, string> = {
  orange: "bg-primary/10 text-primary",
  green: "bg-success-soft text-success",
  blue: "bg-info-soft text-info",
  amber: "bg-warning-soft text-warning",
  purple: "bg-purple-soft text-purple",
  neutral: "bg-muted text-foreground",
}

type MetricCardProps = {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: MetricTone
  trend?: MetricTrendProps
  description?: string
  sparkline?: number[]
  href?: string
  className?: string
}

function Sparkline({ values, tone }: { values: number[]; tone: MetricTone }) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${28 - (value / max) * 24}`).join(" ")
  const stroke = tone === "green" ? "var(--success)" : tone === "blue" ? "var(--info)" : tone === "purple" ? "var(--purple)" : "var(--primary)"
  return <svg aria-hidden="true" viewBox="0 0 100 32" className="h-8 w-20"><polyline points={points} fill="none" stroke={stroke} strokeWidth="2" /></svg>
}

export function MetricCard({ label, value, icon: Icon, tone = "neutral", trend, description, sparkline, href, className }: MetricCardProps) {
  const content = (
    <div className={cn("min-h-[148px] rounded-xl border border-border bg-card p-5 shadow-card transition-shadow sm:p-6", href && "hover:shadow-hover", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-full", toneClasses[tone])}><Icon className="size-5" aria-hidden="true" /></span>
        {sparkline ? <Sparkline values={sparkline} tone={tone} /> : null}
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
      <div className="mt-3">{trend ? <MetricTrend {...trend} /> : description ? <p className="text-xs text-muted-foreground">{description}</p> : null}</div>
    </div>
  )
  return href ? <Link href={href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{content}</Link> : content
}
