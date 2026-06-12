import { SpotType, PostcardSide } from "@prisma/client"
import { categoryAliases } from "../../data/advertiserCategories"

export interface SpotTemplate {
  label: string
  side: PostcardSide
  spotType: SpotType
  price: number // in cents
  x: number
  y: number
  width: number
  height: number
  sortOrder: number
  categorySlug: string
}

export const spots9x12: SpotTemplate[] = [
  // Front: 32px padding, 472px groups, 160px protected center spine.
  { label: "Plumber", side: "FRONT", spotType: "STANDARD", price: 49000, x: 2.6667, y: 3.5556, width: 19.1667, height: 29.4444, sortOrder: 1, categorySlug: "plumbing" },
  { label: "Electrician", side: "FRONT", spotType: "STANDARD", price: 49000, x: 2.6667, y: 35.2222, width: 19.1667, height: 29.4444, sortOrder: 2, categorySlug: "electrical" },
  { label: "Garage Doors", side: "FRONT", spotType: "STANDARD", price: 49000, x: 2.6667, y: 66.8889, width: 19.1667, height: 29.4444, sortOrder: 3, categorySlug: "home-cleaning" },
  { label: "HVAC Services", side: "FRONT", spotType: "STANDARD", price: 49000, x: 22.8333, y: 3.5556, width: 19.1667, height: 29.4444, sortOrder: 4, categorySlug: "hvac" },
  { label: "Pest Control", side: "FRONT", spotType: "STANDARD", price: 49000, x: 22.8333, y: 35.2222, width: 19.1667, height: 29.4444, sortOrder: 5, categorySlug: "pest-control" },
  { label: "Pool Service", side: "FRONT", spotType: "STANDARD", price: 49000, x: 22.8333, y: 66.8889, width: 19.1667, height: 29.4444, sortOrder: 6, categorySlug: "home-cleaning" },
  { label: "Roofer", side: "FRONT", spotType: "STANDARD", price: 49000, x: 58, y: 3.5556, width: 19.1667, height: 29.4444, sortOrder: 7, categorySlug: "roofing" },
  { label: "Landscaper", side: "FRONT", spotType: "STANDARD", price: 49000, x: 58, y: 35.2222, width: 19.1667, height: 29.4444, sortOrder: 8, categorySlug: "landscaping" },
  { label: "Concrete Project", side: "FRONT", spotType: "STANDARD", price: 49000, x: 58, y: 66.8889, width: 19.1667, height: 29.4444, sortOrder: 9, categorySlug: "pressure-washing" },
  { label: "Junk Hauling", side: "FRONT", spotType: "STANDARD", price: 49000, x: 78.1667, y: 3.5556, width: 19.1667, height: 29.4444, sortOrder: 10, categorySlug: "junk-removal" },
  { label: "Remodeling", side: "FRONT", spotType: "STANDARD", price: 49000, x: 78.1667, y: 35.2222, width: 19.1667, height: 29.4444, sortOrder: 11, categorySlug: "carpet-cleaning" },
  { label: "Tree Care", side: "FRONT", spotType: "STANDARD", price: 49000, x: 78.1667, y: 66.8889, width: 19.1667, height: 29.4444, sortOrder: 12, categorySlug: "pest-control" },

  // Back: four larger standards, protected middle row, four larger standards.
  { label: "Windows", side: "BACK", spotType: "STANDARD", price: 59000, x: 2.6667, y: 3.5556, width: 22.9167, height: 25.5556, sortOrder: 13, categorySlug: "real-estate" },
  { label: "Handyman", side: "BACK", spotType: "STANDARD", price: 59000, x: 26.5833, y: 3.5556, width: 22.9167, height: 25.5556, sortOrder: 14, categorySlug: "home-cleaning" },
  { label: "Fence Builder", side: "BACK", spotType: "STANDARD", price: 59000, x: 50.5, y: 3.5556, width: 22.9167, height: 25.5556, sortOrder: 15, categorySlug: "real-estate" },
  { label: "House Cleaning", side: "BACK", spotType: "STANDARD", price: 59000, x: 74.4167, y: 3.5556, width: 22.9167, height: 25.5556, sortOrder: 16, categorySlug: "home-cleaning" },
  { label: "Premium Center Back Spot", side: "BACK", spotType: "PREMIUM", price: 149000, x: 27.5, y: 31.3333, width: 40, height: 36.2222, sortOrder: 17, categorySlug: "restaurant" },
  { label: "Painter", side: "BACK", spotType: "STANDARD", price: 59000, x: 2.6667, y: 69.7778, width: 22.9167, height: 26.6667, sortOrder: 18, categorySlug: "pressure-washing" },
  { label: "Water Heaters", side: "BACK", spotType: "STANDARD", price: 59000, x: 26.5833, y: 69.7778, width: 22.9167, height: 26.6667, sortOrder: 19, categorySlug: "plumbing" },
  { label: "Gutter Care", side: "BACK", spotType: "STANDARD", price: 59000, x: 50.5, y: 69.7778, width: 22.9167, height: 26.6667, sortOrder: 20, categorySlug: "roofing" },
  { label: "Pressure Washing", side: "BACK", spotType: "STANDARD", price: 59000, x: 74.4167, y: 69.7778, width: 22.9167, height: 26.6667, sortOrder: 21, categorySlug: "pressure-washing" },
]

export const spots6x11: SpotTemplate[] = [
  // Front Spotlight: 1 Premium Spot
  { label: "Featured Spotlight", side: "FRONT", spotType: "PREMIUM", price: 100000, x: 2, y: 16, width: 56, height: 60, sortOrder: 1, categorySlug: "restaurant" },
  // Front Right: 2 standard/compact slots
  { label: "Coffee Shop", side: "FRONT", spotType: "STANDARD", price: 45000, x: 60, y: 16, width: 38, height: 28, sortOrder: 2, categorySlug: "bakery-coffee" },
  { label: "Bakery", side: "FRONT", spotType: "STANDARD", price: 45000, x: 60, y: 48, width: 38, height: 28, sortOrder: 3, categorySlug: "bakery-coffee" },
  // Front Bottom: 3 compact slots
  { label: "Pizzeria", side: "FRONT", spotType: "SMALL", price: 25000, x: 2, y: 80, width: 23, height: 18, sortOrder: 4, categorySlug: "restaurant" },
  { label: "Taco Street", side: "FRONT", spotType: "SMALL", price: 25000, x: 26, y: 80, width: 23, height: 18, sortOrder: 5, categorySlug: "restaurant" },
  { label: "Dessert Shop", side: "FRONT", spotType: "SMALL", price: 25000, x: 50, y: 80, width: 23, height: 18, sortOrder: 6, categorySlug: "bakery-coffee" },

  // Back Top Row: 3 compact slots
  { label: "Fitness Center", side: "BACK", spotType: "STANDARD", price: 45000, x: 2, y: 2, width: 31, height: 35, sortOrder: 7, categorySlug: "restaurant" },
  { label: "Beauty Salon", side: "BACK", spotType: "STANDARD", price: 45000, x: 35, y: 2, width: 31, height: 35, sortOrder: 8, categorySlug: "bakery-coffee" },
  { label: "Local Dentist", side: "BACK", spotType: "STANDARD", price: 45000, x: 68, y: 2, width: 30, height: 35, sortOrder: 9, categorySlug: "dentistry" },

  // Back Bottom Row: 3 compact slots
  { label: "Local Boutique", side: "BACK", spotType: "STANDARD", price: 45000, x: 2, y: 63, width: 31, height: 35, sortOrder: 10, categorySlug: "restaurant" },
  { label: "Local Events", side: "BACK", spotType: "STANDARD", price: 45000, x: 35, y: 63, width: 31, height: 35, sortOrder: 11, categorySlug: "restaurant" },
  { label: "Corner Cafe", side: "BACK", spotType: "STANDARD", price: 45000, x: 68, y: 63, width: 30, height: 35, sortOrder: 12, categorySlug: "bakery-coffee" }
]

export async function initializeCampaignSpots(campaignId: string, cardSize: string, db: any) {
  const templates = cardSize === "6x11" ? spots6x11 : spots9x12

  // Fetch all active categories from the database
  const activeCategories = await db.businessCategory.findMany({
    where: { isActive: true }
  })

  if (activeCategories.length === 0) {
    throw new Error("No active categories found in database to assign spots.")
  }

  // Iterate over templates and create campaign spots
  for (const t of templates) {
    // Resolve legacy category slugs using aliases
    const targetSlug = categoryAliases[t.categorySlug] || t.categorySlug
    // Try to find the exact category matching slug
    let category = activeCategories.find((c: any) => c.slug === targetSlug)
    
    // Fallback if not found: cycle through available categories
    if (!category) {
      category = activeCategories[t.sortOrder % activeCategories.length]
    }

    await db.campaignSpot.create({
      data: {
        campaignId,
        categoryId: category.id,
        label: t.label,
        side: t.side,
        spotType: t.spotType,
        price: t.price,
        x: t.x,
        y: t.y,
        width: t.width,
        height: t.height,
        status: "OPEN",
        sortOrder: t.sortOrder,
      }
    })
  }
}
