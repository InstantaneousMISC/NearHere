import type { ReactNode } from "react"
import { LoaderCircle } from "lucide-react"
import { SectionCard } from "@/components/dashboard/section-card"

export type DashboardTableColumn<T> = { id: string; header: string; className?: string; cell: (row: T) => ReactNode }

export function DataTableCard<T>({ title, description, data, columns, action, filters, emptyState, isLoading, getRowKey }: { title: string; description?: string; data: T[]; columns: DashboardTableColumn<T>[]; action?: ReactNode; filters?: ReactNode; emptyState?: ReactNode; isLoading?: boolean; getRowKey: (row: T, index: number) => string }) {
  return <SectionCard title={title} description={description} action={action} padding="none">{filters ? <div className="border-b border-border px-5 py-3 sm:px-6">{filters}</div> : null}<div className="overflow-x-auto">{isLoading ? <div className="flex min-h-56 items-center justify-center text-sm text-muted-foreground"><LoaderCircle className="mr-2 size-4 animate-spin" />Loading…</div> : data.length ? <table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-muted/70"><tr>{columns.map((column) => <th key={column.id} scope="col" className={`h-12 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:px-6 ${column.className ?? ""}`}>{column.header}</th>)}</tr></thead><tbody className="divide-y divide-border">{data.map((row, index) => <tr key={getRowKey(row, index)} className="h-14 transition-colors hover:bg-muted/50">{columns.map((column) => <td key={column.id} className={`px-5 py-3 sm:px-6 ${column.className ?? ""}`}>{column.cell(row)}</td>)}</tr>)}</tbody></table> : emptyState ?? <p className="py-12 text-center text-sm text-muted-foreground">No results found.</p>}</div></SectionCard>
}
