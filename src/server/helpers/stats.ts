import { db } from "@/server/db"
import { OrderStatus } from "@prisma/client"

export interface QrStats {
  scansCount: number
  pageViewsCount: number
  outboundClicksCount: number
  callClicksCount: number
  ctaClicksCount: number
  lastScanDate: Date | null
}

export interface StatsTimeSeriesItem {
  date: string
  scans: number
  views: number
  clicks: number
  calls: number
  ctas: number
}

export interface StatsTimeSeriesParams {
  businessId?: string
  campaignId?: string
  qrCodeId?: string
  startDate: Date
  endDate: Date
}


// 1. Get stats for a specific QR Code ID
export async function getQrCodeStats(qrCodeId: string): Promise<QrStats> {
  const [scansCount, pageViewsCount, clicks, lastScan] = await Promise.all([
    db.qrScan.count({ where: { qrCodeId } }),
    db.businessPageView.count({ where: { qrCodeId } }),
    // Group click counts by type
    db.businessClickEvent.groupBy({
      by: ["linkType", "targetUrl"],
      where: { qrCodeId },
      _count: { id: true },
    }),
    db.qrScan.findFirst({
      where: { qrCodeId },
      orderBy: { scannedAt: "desc" },
      select: { scannedAt: true },
    }),
  ])

  let outboundClicksCount = 0
  let callClicksCount = 0
  let ctaClicksCount = 0

  for (const click of clicks) {
    const type = click.linkType.toUpperCase()
    const target = click.targetUrl || ""
    const count = click._count.id

    if (type === "PHONE" || type === "CALL" || target.startsWith("tel:")) {
      callClicksCount += count
    } else if (["BOOKING", "MENU", "GOOGLE_MAPS", "CTA"].includes(type)) {
      ctaClicksCount += count
    } else {
      outboundClicksCount += count
    }
  }

  return {
    scansCount,
    pageViewsCount,
    outboundClicksCount,
    callClicksCount,
    ctaClicksCount,
    lastScanDate: lastScan?.scannedAt || null,
  }
}

// 2. Get stats for a business campaign placement (resolving first to the QR/placement)
export async function getBusinessCampaignStats(
  businessId: string,
  campaignId: string
): Promise<QrStats & { qrCodeSlug: string | null }> {
  // Find the QR Code for this business and campaign
  const qrCode = await db.qrCode.findFirst({
    where: {
      businessId,
      campaignId,
      status: "ACTIVE",
    },
    select: { id: true, slug: true },
  })

  if (!qrCode) {
    return {
      scansCount: 0,
      pageViewsCount: 0,
      outboundClicksCount: 0,
      callClicksCount: 0,
      ctaClicksCount: 0,
      lastScanDate: null,
      qrCodeSlug: null,
    }
  }

  const stats = await getQrCodeStats(qrCode.id)
  return {
    ...stats,
    qrCodeSlug: qrCode.slug,
  }
}

// 3. Get all campaign placements / orders for a user's businesses
export async function getBusinessDashboardCampaigns(userId: string) {
  // Find all businesses owned by this user
  const businesses = await db.business.findMany({
    where: {
      ownerUserId: userId,
      deletedAt: null,
    },
    select: { id: true },
  })

  const businessIds = businesses.map((b) => b.id)
  if (businessIds.length === 0) return []

  // Find all paid/pending orders linked to these businesses via QrCode or advertiser
  // Wait, let's select orders
  const orders = await db.order.findMany({
    where: {
      status: { in: [OrderStatus.PAID, OrderStatus.PENDING] },
      OR: [
        { qrCodes: { some: { businessId: { in: businessIds } } } },
        { advertiser: { businesses: { some: { id: { in: businessIds }, deletedAt: null } } } },
      ],
    },
    include: {
      campaign: true,
      campaignSpot: {
        include: { category: true },
      },
      qrCodes: {
        where: { businessId: { in: businessIds } },
      },
      creativeSubmission: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return await Promise.all(orders.map(async (order) => {
    const qrCode = order.qrCodes[0] || null
    let stats: QrStats = {
      scansCount: 0,
      pageViewsCount: 0,
      outboundClicksCount: 0,
      callClicksCount: 0,
      ctaClicksCount: 0,
      lastScanDate: null,
    }

    if (qrCode) {
      stats = await getQrCodeStats(qrCode.id)
    }

    return {
      orderId: order.id,
      campaign: order.campaign,
      campaignSpot: order.campaignSpot,
      qrCode,
      creativeStatus: order.creativeSubmission?.approvalStatus || null,
      creativeSubmission: order.creativeSubmission,
      creativeSubmissionToken: order.creativeSubmissionToken,
      orderStatus: order.status,
      stats,
    }
  }))
}

// 4. Get a detailed placement table for admin campaign-wide view
export async function getAdminCampaignPlacementStats(campaignId: string) {
  const spots = await db.campaignSpot.findMany({
    where: { campaignId },
    include: {
      category: true,
      orders: {
        where: { status: { in: [OrderStatus.PAID, OrderStatus.PENDING] } },
        include: {
          advertiser: {
            include: {
              businesses: {
                where: { deletedAt: null },
              },
            },
          },
          qrCodes: true,
          creativeSubmission: {
            select: { approvalStatus: true },
          },
        },
      },
    },
    orderBy: { label: "asc" },
  })

  const placements = []

  for (const spot of spots) {
    const order = spot.orders[0] || null
    const advertiser = order?.advertiser || null
    // Business should belong to advertiser or be linked via qrCode
    const business = advertiser?.businesses[0] || order?.qrCodes[0]?.businessId 
      ? await db.business.findFirst({
          where: {
            OR: [
              { advertiserId: advertiser?.id },
              { qrCodes: { some: { orderId: order?.id } } },
            ],
            deletedAt: null,
          },
        })
      : null

    const qrCode = order?.qrCodes[0] || null
    let stats: QrStats = {
      scansCount: 0,
      pageViewsCount: 0,
      outboundClicksCount: 0,
      callClicksCount: 0,
      ctaClicksCount: 0,
      lastScanDate: null,
    }

    if (qrCode) {
      stats = await getQrCodeStats(qrCode.id)
    }

    placements.push({
      spotId: spot.id,
      spotLabel: spot.label,
      spotType: spot.spotType,
      spotPrice: spot.price,
      spotStatus: spot.status,
      orderId: order?.id || null,
      orderStatus: order?.status || null,
      businessName: business?.name || advertiser?.businessName || null,
      businessId: business?.id || null,
      ownerUserId: business?.ownerUserId || null,
      creativeStatus: order?.creativeSubmission?.approvalStatus || null,
      qrCode,
      stats,
    })
  }

  return placements
}

// 5. Get time-series data for daily charts
export async function getStatsTimeSeries(params: StatsTimeSeriesParams): Promise<StatsTimeSeriesItem[]> {
  const { businessId, campaignId, qrCodeId, startDate, endDate } = params

  // 1. Resolve QR Codes we care about
  let targetQrCodeIds: string[] = []

  if (qrCodeId) {
    targetQrCodeIds = [qrCodeId]
  } else if (businessId && campaignId) {
    const qrs = await db.qrCode.findMany({
      where: { businessId, campaignId },
      select: { id: true },
    })
    targetQrCodeIds = qrs.map((q) => q.id)
  } else if (businessId) {
    const qrs = await db.qrCode.findMany({
      where: { businessId },
      select: { id: true },
    })
    targetQrCodeIds = qrs.map((q) => q.id)
  } else if (campaignId) {
    const qrs = await db.qrCode.findMany({
      where: { campaignId },
      select: { id: true },
    })
    targetQrCodeIds = qrs.map((q) => q.id)
  }

  // 2. Fetch all scans, views, clicks in range
  const qrScope = targetQrCodeIds.length > 0
    ? { qrCodeId: { in: targetQrCodeIds } }
    : businessId
    ? { businessId }
    : {}
  const [qrScans, pageViews, clicks] = await Promise.all([
    db.qrScan.findMany({
      where: { scannedAt: { gte: startDate, lte: endDate }, ...qrScope },
      select: { scannedAt: true },
    }),
    db.businessPageView.findMany({
      where: { viewedAt: { gte: startDate, lte: endDate }, ...qrScope },
      select: { viewedAt: true },
    }),
    db.businessClickEvent.findMany({
      where: { clickedAt: { gte: startDate, lte: endDate }, ...qrScope },
      select: { clickedAt: true, linkType: true, targetUrl: true },
    }),
  ])

  // Helper: Date to YYYY-MM-DD
  const formatDate = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  // Generate day map for all dates in range
  const dailyMap: Record<string, StatsTimeSeriesItem> = {}
  const current = new Date(startDate.getTime())
  while (current <= endDate) {
    const dateStr = formatDate(current)
    dailyMap[dateStr] = {
      date: dateStr,
      scans: 0,
      views: 0,
      clicks: 0,
      calls: 0,
      ctas: 0,
    }
    current.setDate(current.getDate() + 1)
  }

  // Populate data
  qrScans.forEach((scan) => {
    const dateStr = formatDate(scan.scannedAt)
    if (dailyMap[dateStr]) {
      dailyMap[dateStr].scans++
    }
  })

  pageViews.forEach((view) => {
    const dateStr = formatDate(view.viewedAt)
    if (dailyMap[dateStr]) {
      dailyMap[dateStr].views++
    }
  })

  clicks.forEach((click) => {
    const dateStr = formatDate(click.clickedAt)
    if (dailyMap[dateStr]) {
      const type = click.linkType.toUpperCase()
      const target = click.targetUrl || ""

      if (type === "PHONE" || type === "CALL" || target.startsWith("tel:")) {
        dailyMap[dateStr].calls++
      } else if (["BOOKING", "MENU", "GOOGLE_MAPS", "CTA"].includes(type)) {
        dailyMap[dateStr].ctas++
      } else {
        dailyMap[dateStr].clicks++
      }
    }
  })

  return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
}
