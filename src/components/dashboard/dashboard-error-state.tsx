import { AlertTriangle } from "lucide-react"
import { EmptyState } from "@/components/dashboard/empty-state"

export function DashboardErrorState({ title = "We couldn’t load this dashboard", description = "Please try again. If the problem continues, contact support.", action }: { title?: string; description?: string; action?: React.ReactNode }) { return <EmptyState icon={AlertTriangle} title={title} description={description} action={action} /> }
