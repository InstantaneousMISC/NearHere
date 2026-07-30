import { requireAdminAccess } from "@/server/auth/access"
import AdminLayoutClient from "./AdminLayoutClient"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAccess()
  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
