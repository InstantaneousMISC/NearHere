import { notFound, redirect } from "next/navigation"
import { db } from "@/server/db"

interface BusinessPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ qr?: string; expired?: string }>
}

export default async function BusinessProfileRedirectPage({ params, searchParams }: BusinessPageProps) {
  const { slug } = await params
  const { qr, expired } = await searchParams

  const business = await db.business.findUnique({
    where: { slug },
    include: {
      directoryProfile: {
        include: {
          locations: {
            where: { status: "PUBLISHED" },
            include: { city: { include: { state: true } } },
            orderBy: { createdAt: "asc" },
          },
          categories: {
            include: { directoryCategory: true },
          },
        },
      },
    },
  })

  if (!business || !business.goodStanding || business.deletedAt) {
    notFound()
  }

  const profile = business.directoryProfile
  if (!profile || profile.locations.length === 0) {
    notFound()
  }

  const primaryLoc = profile.locations[0]
  const stateSlug = primaryLoc.city.state.slug
  const citySlug = primaryLoc.city.slug
  const catSlug = profile.categories?.[0]?.directoryCategory?.slug || "general"

  const urlParams = new URLSearchParams()
  if (qr) urlParams.set("qr", qr)
  if (expired) urlParams.set("expired", expired)
  const queryString = urlParams.toString()

  redirect(`/directory/${stateSlug}/${citySlug}/businesses/${catSlug}/${profile.slug}${queryString ? `?${queryString}` : ""}`)
}
