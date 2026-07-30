import { Metadata } from "next"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import LocalPageClient from "./LocalPageClient"

export const metadata: Metadata = {
  title: "NearHere Local Page — Reaching Neighbors Digitally",
  description: "Every NearHere Postcard Drop is backed by a mobile-first Local Page. Discover the digital companion that bridges direct mail with local search.",
}

export default function LocalPage() {
  return (
    <main className="bg-paper text-press min-h-screen flex flex-col font-sans">
      <CampaignNav />
      <LocalPageClient />
      <CampaignFooter />
    </main>
  )
}
