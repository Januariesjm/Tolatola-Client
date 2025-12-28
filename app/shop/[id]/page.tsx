import { notFound } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import { serverApiGet } from "@/lib/api-server"
import type { Database } from "@/lib/types"
import { ShopDetailContent } from "@/components/shop/shop-detail-content"

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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <ShopDetailContent shop={shop} products={products} />
    </div>
  )
}








