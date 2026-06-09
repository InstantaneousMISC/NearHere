import { createTRPCRouter } from './init'
import { campaignRouter } from './routers/campaign'
import { spotRouter } from './routers/spot'
import { orderRouter } from './routers/order'
import { categoryRouter } from './routers/category'
import { creativeRouter } from './routers/creative'
import { leadRouter } from './routers/lead'

export const appRouter = createTRPCRouter({
  campaign: campaignRouter,
  spot: spotRouter,
  order: orderRouter,
  category: categoryRouter,
  creative: creativeRouter,
  lead: leadRouter,
})

export type AppRouter = typeof appRouter
