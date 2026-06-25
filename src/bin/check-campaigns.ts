import { db } from "../server/db"

async function checkCampaigns() {
  console.log("🔍 Fetching all campaigns in database...")
  const campaigns = await db.campaign.findMany({
    include: {
      spots: true,
      orders: {
        include: {
          advertiser: true
        }
      },
      _count: {
        select: {
          spots: true,
          orders: true
        }
      }
    }
  })

  console.log(`\nFound ${campaigns.length} campaigns total:`)
  console.log("--------------------------------------------------")
  for (const c of campaigns) {
    const paidOrders = c.orders.filter(o => o.status === "PAID").length
    console.log(`ID: ${c.id}`)
    console.log(`Name: "${c.name}"`)
    console.log(`Location: ${c.city}, ${c.state} (ZIP: ${c.zipCode || 'none'})`)
    console.log(`Slug: ${c.slug}`)
    console.log(`Status: ${c.status}`)
    console.log(`Spots: ${c._count.spots} total`)
    console.log(`Orders: ${c._count.orders} total (${paidOrders} paid)`)
    console.log("--------------------------------------------------")
  }
}

checkCampaigns()
