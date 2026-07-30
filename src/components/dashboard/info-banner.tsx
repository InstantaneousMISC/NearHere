import type { ReactNode } from "react"
import { Info } from "lucide-react"
import { cn } from "@/lib/utils"

export function InfoBanner({ title, children, tone = "info", action, className }: { title: string; children: ReactNode; tone?: "info" | "warning" | "success"; action?: ReactNode; className?: string }) {
  const tones = { info: "border-info/20 bg-info-soft text-info", warning: "border-warning/20 bg-warning-soft text-warning", success: "border-success/20 bg-success-soft text-success" }
  return <div className={cn("flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-start sm:justify-between", tones[tone], className)}><div className="flex gap-3"><Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div><p className="text-sm font-semibold">{title}</p><div className="mt-1 text-sm leading-5 text-foreground/80">{children}</div></div></div>{action ? <div className="shrink-0">{action}</div> : null}</div>
}
