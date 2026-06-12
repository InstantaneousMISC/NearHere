import { redirect } from "next/navigation"

interface BusinessPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ qr?: string; expired?: string }>
}

export default async function BusinessLandingPage({ params, searchParams }: BusinessPageProps) {
  const { slug } = await params
  const { qr, expired } = await searchParams

  const urlParams = new URLSearchParams()
  if (qr) urlParams.set("qr", qr)
  if (expired) urlParams.set("expired", expired)

  const queryString = urlParams.toString()
  redirect(`/business/${slug}${queryString ? `?${queryString}` : ""}`)
}
