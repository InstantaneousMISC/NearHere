import { cn } from "@/lib/utils"

export function ProgressSummary({ value, label, description, tone = "primary", className }: { value: number; label: string; description?: string; tone?: "primary" | "success" | "info"; className?: string }) {
  const boundedValue = Math.min(100, Math.max(0, value))
  const toneClass = tone === "success" ? "bg-success" : tone === "info" ? "bg-info" : "bg-primary"
  return <div className={cn("space-y-3", className)}><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-medium text-foreground">{label}</p>{description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}</div><p className="text-2xl font-bold tracking-tight text-foreground">{Math.round(boundedValue)}%</p></div><div className="h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={boundedValue}><div className={cn("h-full rounded-full transition-[width]", toneClass)} style={{ width: `${boundedValue}%` }} /></div></div>
}
