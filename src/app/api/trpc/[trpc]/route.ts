import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createTRPCContext } from '@/server/trpc/init'
import { appRouter } from '@/server/trpc/router'

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError: ({ path, error }) => {
      console.error(`tRPC failed on ${path ?? '<no-path>'}: ${error.message}`)
    },
  })

export { handler as GET, handler as POST }
