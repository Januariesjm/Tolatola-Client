import { notFound } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import { serverApiGet } from "@/lib/api-server"
import type { Database } from "@/lib/types"
import { ShopDetailContent } from "@/components/shop/shop-detail-content"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const shopRes = await serverApiGet<{ shop: any }>(`shops/${id}`).catch(() => ({ shop: null }))
  const shop = shopRes.shop
  if (!shop) return { title: "Shop Not Found" }
  const description = shop.description
    ? (shop.description.length > 160 ? shop.description.substring(0, 157) + "..." : shop.description)
    : `Shop from ${shop.name} on TOLA Tanzania. Verified vendor, secure checkout.`
  return {
    title: shop.name,
    description: description,
    alternates: { canonical: `https://tolatola.co/shop/${id}` },
    openGraph: { title: shop.name, description: description, type: "website" },
  }
}

export default async function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerComponentClient<Database>({ cookies, headers })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let kycStatus = null

  if (user) {
    try {
      const profileRes = await serverApiGet<{ profile: any }>("profile")
      profile = profileRes.profile
      kycStatus = profileRes.profile?.kyc_status || null
    } catch {
      // ignore
    }
  }

  const shopRes = await serverApiGet<{ shop: any }>(`shops/${id}`).catch(() => ({ shop: null }))
  const shop = shopRes.shop

  if (!shop) {
    notFound()
  }

  const productsRes = await serverApiGet<{ data: any[] }>(`shops/${id}/products`).catch(() => ({ data: [] }))
  const products = productsRes.data || []

  const breadcrumbs = [
    { name: "Home", url: "https://tolatola.co" },
    { name: "Shop", url: "https://tolatola.co/shop" },
    { name: shop.name, url: `https://tolatola.co/shop/${id}` },
  ]

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <ShopDetailContent shop={shop} products={products} />
    </div>
  )
}









