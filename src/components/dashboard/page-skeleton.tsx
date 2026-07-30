import { cn } from "@/lib/utils"

export function PageSkeleton({ className }: { className?: string }) { return <div className={cn("animate-pulse space-y-6", className)}><div className="space-y-2"><div className="h-9 w-64 rounded-lg bg-muted" /><div className="h-5 w-96 max-w-full rounded-lg bg-muted" /></div><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 rounded-xl border border-border bg-card" />)}</div><div className="h-80 rounded-xl border border-border bg-card" /></div> }
