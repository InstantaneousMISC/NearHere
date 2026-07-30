import type { ReactNode } from "react"
import { SectionCard } from "@/components/dashboard/section-card"

export function AnalyticsChartCard({ title, description, controls, children, className }: { title: string; description?: string; controls?: ReactNode; children: ReactNode; className?: string }) {
  return <SectionCard title={title} description={description} action={controls} className={className}>{children}</SectionCard>
}
