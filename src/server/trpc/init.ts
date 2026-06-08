import { initTRPC, TRPCError } from '@trpc/server'
import { createServerClient } from '@supabase/ssr'
import { db } from '@/server/db'
import superjson from 'superjson'

export async function createTRPCContext(opts: { headers: Headers }) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Parse cookies from the raw header since we're in a route handler context
          const cookieHeader = opts.headers.get('cookie') ?? ''
          return cookieHeader
            .split(';')
            .filter(Boolean)
            .map((cookie) => {
              const [name, ...rest] = cookie.trim().split('=')
              return { name, value: rest.join('=') }
            })
        },
        setAll() {
          // No-op in tRPC context — cookies are managed by the middleware
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { db, user, supabase }
}

const t = initTRPC
  .context<Awaited<ReturnType<typeof createTRPCContext>>>()
  .create({
    transformer: superjson,
  })

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory
export const publicProcedure = t.procedure

/**
 * Protected procedure that verifies the user is authenticated AND
 * has a matching AdminUser record in the database.
 */
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not authenticated',
    })
  }

  const adminUser = await ctx.db.adminUser.findUnique({
    where: { supabaseUserId: ctx.user.id },
  })

  if (!adminUser) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Not an admin',
    })
  }

  return next({
    ctx: {
      ...ctx,
      adminUser,
    },
  })
})
