import { createClient } from "@supabase/supabase-js"

/**
 * Creates a server-only Supabase admin client. The secret/service-role key
 * bypasses RLS, so this module must only be imported by server actions, route
 * handlers, or other server-only code.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // `SUPABASE_SECRET_KEY` is Supabase's current key name. Keep the legacy
  // service-role name for existing deployments.
  const adminKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !adminKey) {
    throw new Error(
      "Supabase admin auth is not configured. Set SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) on the server."
    )
  }

  return createClient(supabaseUrl, adminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
