import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

export function SearchField({ value, onChange, placeholder = "Search", className }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) { return <label className={cn("relative block min-w-52", className)}><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" /></label> }
