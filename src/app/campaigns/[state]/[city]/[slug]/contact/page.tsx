import { redirect } from "next/navigation"

interface ContactPageProps {
  params: Promise<{
    state: string
    city: string
    slug: string
  }>
}

export default async function CampaignContactPage({
  params,
}: ContactPageProps) {
  const { state, city, slug } = await params
  
  // Clean parameter cases just in case
  const lowerState = decodeURIComponent(state).toLowerCase()
  const lowerCity = decodeURIComponent(city).toLowerCase()
  const lowerSlug = decodeURIComponent(slug).toLowerCase()

  redirect(`/campaigns/${lowerState}/${lowerCity}/${lowerSlug}`)
}
