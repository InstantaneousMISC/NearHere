export const SPOT_HOLD_DURATION_MINUTES = 15
export const CREATIVE_TOKEN_LENGTH = 32

export const SPOT_TYPE_COLORS = {
  PREMIUM: { bg: "bg-primary/10", border: "border-primary", text: "text-primary" },
  LARGE: { bg: "bg-stone-bg/50", border: "border-border", text: "text-foreground" },
  STANDARD: { bg: "bg-stone-bg/30", border: "border-border", text: "text-muted-foreground" },
  SMALL: { bg: "bg-stone-bg/20", border: "border-border", text: "text-muted-foreground" },
} as const

export const SPOT_STATUS_COLORS = {
  OPEN: { bg: "bg-primary/5", border: "border-primary", text: "text-primary" },
  HELD: { bg: "bg-amber-500/5", border: "border-amber-500 border-dashed", text: "text-amber-700" },
  SOLD: { bg: "bg-stone-bg/50 opacity-30", border: "border-border border-dashed", text: "text-muted-foreground" },
  UNAVAILABLE: { bg: "bg-stone-bg/20 opacity-30", border: "border-border border-dashed", text: "text-muted-foreground" },
} as const

export const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  SOLD_OUT: "Sold Out",
  CLOSED: "Closed",
  DESIGNING: "Designing",
  READY_FOR_PRINT: "Ready for Print",
  PRINTING: "Printing",
  MAILED: "Mailed",
  CANCELLED: "Cancelled",
}
