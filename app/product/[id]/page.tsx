import { ProductDetailContent } from "@/components/product/product-detail-content"
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld"
import { notFound } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import { serverApiGet } from "@/lib/api-server"
import type { Database } from "@/lib/types"
import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const productRes = await serverApiGet<{ data: any }>(`products/${id}`).catch(() => ({ data: null }))
  const product = productRes.data

  if (!product) {
    return {
      title: "Product Not Found",
    }
  }

  const imageUrl = product.images?.[0]?.url || product.image_url || "/logo-new.png"
  const description = product.description
    ? (product.description.length > 160 ? product.description.substring(0, 157) + "..." : product.description)
    : `Buy ${product.name} on TOLA Tanzania. Verified vendors, secure checkout, M-Pesa & Tigo Pesa.`

  return {
    title: product.name,
    description: description,
    alternates: {
      canonical: `https://tolatola.co/product/${id}`,
    },
    openGraph: {
      title: product.name,
      description: description,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: product.name,
        },
      ],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: description,
      images: [imageUrl],
    },
  }
}

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

  const breadcrumbs = [
    { name: "Home", url: "https://tolatola.co" },
    { name: "Shop", url: "https://tolatola.co/shop" },
    { name: product.name, url: `https://tolatola.co/product/${id}` },
  ]

  return (
    <div className="min-h-screen bg-white">
      <BreadcrumbJsonLd items={breadcrumbs} />
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <ProductDetailContent product={product} reviews={reviews || []} isLiked={isLiked} />
    </div>
  )
}
