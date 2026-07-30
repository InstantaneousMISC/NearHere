import { Metadata } from "next"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import MediaKitClient from "./MediaKitClient"

export const metadata: Metadata = {
  title: "Media Kit & Advertising Specifications | NearHere",
  description: "Download or view NearHere's advertising specifications, postcard dimensions, readership demographics, distribution routes, and marketing packages.",
}

export default function MediaKitPage() {
  return (
    <main className="bg-paper text-press min-h-screen flex flex-col font-sans">
      <CampaignNav />
      <MediaKitClient />
      <CampaignFooter />
    </main>
  )
}
