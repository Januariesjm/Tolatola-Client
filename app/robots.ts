import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/vendor/dashboard/", "/api/", "/checkout/", "/cart/"],
    },
    sitemap: "https://tolatola.vercel.app/sitemap.xml",
  }
}
