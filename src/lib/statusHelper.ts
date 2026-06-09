export function getFriendlyApprovalStatusLabel(status: string | null | undefined): string {
  if (!status) return "Pending Submission"
  
  const normalized = status.toUpperCase()
  switch (normalized) {
    case "APPROVED":
      return "Approved for Print"
    case "NEEDS_REVIEW":
    case "REJECTED":
      return "Needs Changes"
    case "PENDING":
      return "Pending Review"
    case "PRINTED":
      return "Printed"
    case "MAILED":
      return "Mailed"
    default:
      return status
  }
}

export function getFriendlyApprovalStatusBadgeClass(status: string | null | undefined): string {
  if (!status) return "bg-slate-100 text-slate-700 border border-slate-200"

  const normalized = status.toUpperCase()
  switch (normalized) {
    case "MAILED":
      return "bg-purple-50 text-purple-700 border border-purple-200"
    case "PRINTED":
      return "bg-indigo-50 text-indigo-700 border border-indigo-200"
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border border-emerald-200"
    case "PENDING":
      return "bg-blue-50 text-blue-700 border border-blue-200 animate-pulse"
    case "NEEDS_REVIEW":
    case "REJECTED":
      return "bg-red-50 text-red-700 border border-red-200"
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200"
  }
}
