import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { ShopContent } from "@/components/shop/shop-content"
import SiteHeader from "@/components/layout/site-header"
import { redirect } from "next/navigation"
import { CategoriesNav } from "@/components/layout/categories-nav"
import { ProductSearch } from "@/components/layout/product-search"
import { serverApiGet } from "@/lib/api-server"
import { cookies, headers } from "next/headers"
import type { Database } from "@/lib/types"
import type { Metadata } from "next"

export const dynamic = "force-dynamic"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { category?: string }
}): Promise<Metadata> {
  const baseUrl = "https://tolatola.co"
  let title = "Shop | TOLA Digital Trade & Supply Chain Ecosystem"
  let description = "Shop from verified vendors within TOLA, Tanzania's registered Digital Trade and Supply Chain Ecosystem. Secure checkout with M-Pesa & Tigo Pesa, integrated logistics and verified businesses."
  let canonical = `${baseUrl}/shop`

  const currentCategory = searchParams.category
  if (currentCategory) {
    let catName = ""
    let catSlug = currentCategory

    // Static fallback lookup for robustness
    const categoryStaticMap: Record<string, string> = {
      "fast-moving-consumer-goods": "Fast Moving Consumer Goods",
      "agriculture": "Agriculture",
      "construction-hardware": "Construction & Hardware",
      "handicrafts": "Handicrafts",
      "food-beverages": "Food & Beverages",
      "textiles": "Textiles",
      "electronics": "Electronics",
      "home-garden": "Home & Garden",
      "health-beauty": "Health & Beauty",
      "services": "Services",
      "vehicles": "Vehicles",
      "motorcycles": "Motorcycles",
      "bajaj": "Bajaj",
      "bodaboda": "Bodaboda",
      "guta": "Guta",
      "others": "others",
    }

    if (categoryStaticMap[currentCategory]) {
      catName = categoryStaticMap[currentCategory]
    } else {
      try {
        const categoriesRes = await serverApiGet<{ data: any[] }>("categories", { next: { revalidate: 60 } }).catch(() => ({ data: [] }))
        const categories = categoriesRes.data || []
        const cat = categories.find((c: any) => c.slug === currentCategory || c.id === currentCategory)
        if (cat) {
          catName = cat.name
          catSlug = cat.slug
        }
      } catch {
        // ignore
      }
    }

    if (catName) {
      title = `${catName} | Shop | TOLA Tanzania`
      description = `Buy ${catName} from verified vendors on TOLA, Tanzania's registered Digital Trade and Supply Chain Ecosystem. Secure payments & nationwide logistics.`
      canonical = `${baseUrl}/shop?category=${catSlug}`
    }
  }

  return {
    title,
    description,
    alternates: {
      canonical,
    },
  }
}

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

  const categoriesRes = await serverApiGet<{ data: any[] }>("categories", { next: { revalidate: 60 } }).catch(() => ({ data: [] }))
  const categories = categoriesRes.data || []

  let productsUrl = "products"
  const params = new URLSearchParams()
  if (currentCategory) {
    const cat = categories.find((c: any) => c.slug === currentCategory || c.id === currentCategory)
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

