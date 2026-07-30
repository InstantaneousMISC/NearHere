import { Metadata } from "next"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import CommunitiesClient from "./CommunitiesClient"

export const metadata: Metadata = {
  title: "Target Neighborhoods & Communities | NearHere",
  description: "Explore active and upcoming NearHere postcard drops in Converse, TX and surrounding areas. Request a drop for your neighborhood today.",
}

export default function CommunitiesPage() {
  return (
    <main className="bg-paper text-press min-h-screen flex flex-col font-sans">
      <CampaignNav />
      <CommunitiesClient />
      <CampaignFooter />
    </main>
  )
}
