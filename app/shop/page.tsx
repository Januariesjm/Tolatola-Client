import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { ShopContent } from "@/components/shop/shop-content"
import SiteHeader from "@/components/layout/site-header"
import { redirect } from "next/navigation"
import { CategoriesNav } from "@/components/layout/categories-nav"
import { ProductSearch } from "@/components/layout/product-search"
import { serverApiGet } from "@/lib/api-server"
import { cookies, headers } from "next/headers"
import type { Database } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; minPrice?: string; maxPrice?: string; sort?: string }
}) {
  const supabase = createServerComponentClient<Database>({ cookies, headers } as any)
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
      if (profile?.user_type === "admin") {
        redirect("/admin")
      }
    } catch {
      // ignore profile fetch errors
    }
  }

  const currentCategory = searchParams.category
  const searchQuery = searchParams.search || ""
  const minPrice = searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined
  const maxPrice = searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined

  const categoriesRes = await serverApiGet<{ data: any[] }>("categories").catch(() => ({ data: [] }))
  const categories = categoriesRes.data || []

  let productsUrl = "products"
  const params = new URLSearchParams()
  if (currentCategory) {
    const cat = categories.find((c: any) => c.slug === currentCategory)
    if (cat) {
      params.append("category", cat.id)
    }
  }
  if (searchQuery) {
    params.append("search", searchQuery)
  }
  if (minPrice) {
    params.append("minPrice", minPrice.toString())
  }
  if (maxPrice) {
    params.append("maxPrice", maxPrice.toString())
  }

  // Location-based prioritization
  if (profile?.latitude && profile?.longitude) {
    params.append("userLat", profile.latitude.toString())
    params.append("userLng", profile.longitude.toString())

    // Default to closest if no sort is specified
    if (!searchParams.sort) {
      params.append("sortBy", "closest")
    }
  }

  if (searchParams.sort === "closest") {
    params.append("sortBy", "closest")
  }

  if (params.toString()) {
    productsUrl += `?${params.toString()}`
  }

  const productsRes = await serverApiGet<{ data: any[] }>(productsUrl).catch(() => ({ data: [] }))
  let products = productsRes.data || []

  // Apply sorting
  const sortBy = searchParams.sort || "name"
  if (sortBy === "price_asc") {
    products = [...products].sort((a, b) => a.price - b.price)
  } else if (sortBy === "price_desc") {
    products = [...products].sort((a, b) => b.price - a.price)
  } else if (sortBy === "name") {
    products = [...products].sort((a, b) => a.name.localeCompare(b.name))
  } else if (sortBy === "newest") {
    products = [...products].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateB - dateA
    })
  }

  const trending = products?.slice(0, 8) || []

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      {/* Mobile Search Bar - Between Header and Categories */}
      <div className="lg:hidden sticky top-[72px] z-30 bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <ProductSearch categories={categories || []} />
        </div>
      </div>

      <CategoriesNav categories={categories || []} currentCategory={currentCategory} />
      <ShopContent
        products={products || []}
        categories={categories || []}
        trendingProducts={trending}
        searchQuery={searchQuery}
      />
    </div>
  )
}

