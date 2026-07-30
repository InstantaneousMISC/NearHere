import { Metadata } from "next"
import { CampaignNav } from "@/components/campaign/CampaignNav"
import CampaignFooter from "@/components/campaign/CampaignFooter"
import ContactClient from "./ContactClient"

export const metadata: Metadata = {
  title: "Contact Us | NearHere Postcards",
  description: "Get in touch with NearHere. Send us a message regarding local postcard advertising, neighborhood recommendations, or general inquiries.",
}

export default function ContactPage() {
  return (
    <main className="bg-paper text-press min-h-screen flex flex-col font-sans">
      <CampaignNav />
      <ContactClient />
      <CampaignFooter />
    </main>
  )
}
