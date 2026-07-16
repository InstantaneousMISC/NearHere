import type { MetadataRoute } from "next"
import { db } from "@/server/db"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const routes: MetadataRoute.Sitemap = [
    {
      url: `${appUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${appUrl}/directory`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ]

  // Fetch all published/indexable states
  const states = await db.state.findMany({
    where: { status: "PUBLISHED", isIndexed: "INDEX" },
    include: {
      cities: {
        where: { status: "PUBLISHED", isIndexed: "INDEX" },
      },
    },
  })

  for (const state of states) {
    if (state.cities.length === 0) continue

    // Add state page
    routes.push({
      url: `${appUrl}/directory/${state.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    })

    for (const city of state.cities) {
      // Add city page
      routes.push({
        url: `${appUrl}/directory/${state.slug}/${city.slug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.7,
      })

      // Fetch directory profiles for this city
      const profiles = await db.directoryProfile.findMany({
        where: {
          status: "PUBLISHED",
          isIndexed: "INDEX",
          locations: {
            some: {
              cityId: city.id,
              status: "PUBLISHED",
            },
          },
        },
        include: {
          categories: {
            include: { directoryCategory: true },
          },
        },
      })

      // Add profile pages
      for (const profile of profiles) {
        routes.push({
          url: `${appUrl}/directory/${state.slug}/${city.slug}/businesses/${profile.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.6,
        })
      }

      // Group profiles by category to check indexability for city/category pages
      const categoryMap: Record<string, { id: string; name: string; slug: string; desc: string | null; count: number }> = {}
      for (const profile of profiles) {
        for (const pCat of profile.categories) {
          const cat = pCat.directoryCategory
          if (cat.status === "PUBLISHED" && cat.isIndexed === "INDEX") {
            if (!categoryMap[cat.slug]) {
              categoryMap[cat.slug] = {
                id: cat.id,
                name: cat.name,
                slug: cat.slug,
                desc: cat.description,
                count: 0,
              }
            }
            categoryMap[cat.slug].count++
          }
        }
      }

      // Add category pages if they meet the indexability rules
      for (const cat of Object.values(categoryMap)) {
        const isIndexable = cat.count >= 2 || (cat.count === 1 && cat.desc && cat.desc.trim().length >= 100)
        if (isIndexable) {
          routes.push({
            url: `${appUrl}/directory/${state.slug}/${city.slug}/${cat.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.6,
          })
        }
      }
    }
  }

  return routes
}
