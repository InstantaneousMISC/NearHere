import 'server-only'

import { createTRPCContext } from '@/server/trpc/init'
import { appRouter } from '@/server/trpc/router'
import { createCallerFactory } from '@/server/trpc/init'
import { headers } from 'next/headers'

/**
 * Create a tRPC caller for use in Server Components, Server Actions,
 * and other server-side contexts. This forwards the current request
 * headers (including cookies) so Supabase auth works correctly.
 */
export async function createCaller() {
  const heads = new Headers(await headers())
  const ctx = await createTRPCContext({ headers: heads })
  const createCallerFn = createCallerFactory(appRouter)
  return createCallerFn(ctx)
}
