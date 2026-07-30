import { cn } from "@/lib/utils"

export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger" | "purple"

const toneClasses: Record<StatusTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-info/20 bg-info-soft text-info",
  warning: "border-warning/20 bg-warning-soft text-warning",
  success: "border-success/20 bg-success-soft text-success",
  danger: "border-destructive/20 bg-destructive/10 text-destructive",
  purple: "border-purple/20 bg-purple-soft text-purple",
}

export const creativeStatusMap = {
  PENDING: { label: "Pending", tone: "neutral" },
  NEEDS_REVIEW: { label: "Needs review", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  REJECTED: { label: "Needs changes", tone: "danger" },
  PRINTED: { label: "Printed", tone: "info" },
  MAILED: { label: "Mailed", tone: "purple" },
} as const satisfies Record<string, { label: string; tone: StatusTone }>

export const orderStatusMap = {
  PENDING: { label: "Pending", tone: "warning" },
  PAID: { label: "Paid", tone: "success" },
  REFUNDED: { label: "Refunded", tone: "info" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  EXPIRED: { label: "Expired", tone: "neutral" },
} as const satisfies Record<string, { label: string; tone: StatusTone }>

export const campaignStatusMap = {
  DRAFT: { label: "Draft", tone: "neutral" },
  ACTIVE: { label: "Active", tone: "success" },
  SOLD_OUT: { label: "Sold out", tone: "warning" },
  CLOSED: { label: "Closed", tone: "neutral" },
  DESIGNING: { label: "Designing", tone: "info" },
  READY_FOR_PRINT: { label: "Ready for print", tone: "warning" },
  PRINTING: { label: "Printing", tone: "info" },
  PRINTED: { label: "Printed", tone: "info" },
  MAILED: { label: "Mailed", tone: "purple" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
} as const satisfies Record<string, { label: string; tone: StatusTone }>

export function StatusBadge({ label, tone, dot = false, className }: { label: string; tone: StatusTone; dot?: boolean; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", toneClasses[tone], className)}>{dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}{label}</span>
}

export function statusFor(map: Record<string, { label: string; tone: StatusTone }>, status: string | null | undefined, fallback = "Pending") {
  return status ? map[status] ?? { label: status.replaceAll("_", " "), tone: "neutral" as StatusTone } : { label: fallback, tone: "neutral" as StatusTone }
}
