"use client"

import { cn } from "@/lib/utils"

export type DateRangeOption = { label: string; value: number }
export function DateRangeSelector({ value, onChange, options = [{ label: "7 days", value: 7 }, { label: "14 days", value: 14 }, { label: "30 days", value: 30 }, { label: "90 days", value: 90 }] }: { value: number; onChange: (value: number) => void; options?: DateRangeOption[] }) {
  return <div className="inline-flex rounded-lg border border-border bg-muted/60 p-1" role="group" aria-label="Date range">{options.map((option) => <button key={option.value} type="button" onClick={() => onChange(option.value)} className={cn("rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors", option.value === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{option.label}</button>)}</div>
}
