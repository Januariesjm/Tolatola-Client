import { ProductDetailContent } from "@/components/product/product-detail-content"
import { notFound } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import { serverApiGet } from "@/lib/api-server"
import type { Database } from "@/lib/types"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerComponentClient<Database>({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let kycStatus = null
  let isLiked = false

  if (user) {
    try {
      const profileRes = await serverApiGet<{ profile: any }>("profile")
      profile = profileRes.profile
      kycStatus = profileRes.profile?.kyc_status || null
    } catch {
      // ignore
    }
  }

  const productRes = await serverApiGet<{ data: any }>(`products/${id}`).catch(() => ({ data: null }))
  const product = productRes.data

  if (!product) {
    notFound()
  }

  const reviewsRes = await serverApiGet<{ data: any[] }>(`products/${id}/reviews`).catch(() => ({ data: [] }))
  const reviews = reviewsRes.data || []

  if (user) {
    try {
      const likeRes = await serverApiGet<{ liked: boolean }>(`products/${id}/like-status`)
      isLiked = !!likeRes.liked
    } catch {
      isLiked = false
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <ProductDetailContent product={product} reviews={reviews || []} isLiked={isLiked} />
    </div>
  )
}
