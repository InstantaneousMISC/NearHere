import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/checkout/",
        "/business/claim/",
        "/submit-creative/",
        "/api/",
        "/q/", // Short QR redirect URLs
      ],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
