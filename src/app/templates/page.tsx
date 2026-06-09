import React from "react"
import { Nav } from "@/components/home/Nav"
import { Footer } from "@/components/home/CoverageCta"
import PostcardTemplateBoard from "@/components/postcard/PostcardTemplateBoard"

export const metadata = {
  title: "NearHere Postcard Templates — Preview Engine",
  description: "Explore our premium 9x12 Shared Card and 6x11 Community Card print postcard layouts with high-fidelity advertiser grid previews.",
}

export default function TemplatesPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F4] text-[#211D1C] selection:bg-primary/10">
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-12">
        <PostcardTemplateBoard />
      </main>
      <Footer />
    </div>
  )
}
