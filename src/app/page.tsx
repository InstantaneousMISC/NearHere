import { Nav } from "@/components/home/Nav"
import { Hero } from "@/components/home/Hero"
import { Stats } from "@/components/home/Stats"
import { HowItWorks } from "@/components/home/HowItWorks"
import { Comparison } from "@/components/home/Comparison"
import { Testimonials } from "@/components/home/Testimonials"
import { CoverageCta, Footer } from "@/components/home/CoverageCta"

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/10">
      <Nav />
      <Hero />
      <Stats />
      <HowItWorks />
      <Comparison />
      <Testimonials />
      <CoverageCta />
      <Footer />
    </div>
  )
}
