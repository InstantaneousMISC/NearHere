import { Metadata } from "next"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import PressKitClient from "./PressKitClient"

export const metadata: Metadata = {
  title: "Press Kit & Brand Assets | NearHere",
  description: "Access NearHere logos, high-res photos, brand guidelines, founder bios, and press contacts for media coverage.",
}

export default function PressKitPage() {
  return (
    <main className="bg-paper text-press min-h-screen flex flex-col font-sans">
      <CampaignNav />
      <PressKitClient />
      <CampaignFooter />
    </main>
  )
}
