import type { ReactNode } from "react"

export type DetailListItem = { label: string; value: ReactNode }
export function DetailList({ items }: { items: DetailListItem[] }) { return <dl className="divide-y divide-border">{items.map((item) => <div key={item.label} className="flex items-start justify-between gap-6 py-3"><dt className="text-sm text-muted-foreground">{item.label}</dt><dd className="text-right text-sm font-medium text-foreground">{item.value}</dd></div>)}</dl> }
