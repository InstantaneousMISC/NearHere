import { type PrismaClient } from "@prisma/client"

/**
 * Generates a URL-safe unique slug for a Business.
 * If the slug already exists, appends a count suffix (e.g., -1, -2).
 */
export async function generateSlug(name: string, db: PrismaClient): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word characters except spaces/dashes
    .replace(/[\s_-]+/g, "-")  // Replace spaces, underscores, and multiple dashes with a single dash
    .replace(/^-+|-+$/g, "")   // Trim leading/trailing dashes

  let slug = baseSlug || "business"
  let count = 0

  while (true) {
    const existing = await db.business.findUnique({
      where: { slug },
      select: { id: true },
    })

    if (!existing) {
      return slug
    }

    count++
    slug = `${baseSlug}-${count}`
  }
}
