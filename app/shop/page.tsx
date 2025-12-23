import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { ShopContent } from "@/components/shop/shop-content"
import SiteHeader from "@/components/layout/site-header"
import { redirect } from "next/navigation"
import { CategoriesNav } from "@/components/layout/categories-nav"
import { serverApiGet } from "@/lib/api-server"
import { cookies, headers } from "next/headers"
import type { Database } from "@/lib/types"

export default async function ShopPage({
  searchParams,
}: {
  searchParams: { category?: string }
}) {
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
      if (profile?.user_type === "admin") {
        redirect("/admin")
      }
    } catch {
      // ignore profile fetch errors
    }
  }

  const currentCategory = searchParams.category

  const categoriesRes = await serverApiGet<{ data: any[] }>("categories").catch(() => ({ data: [] }))
  const categories = categoriesRes.data || []

  let productsUrl = "products"
  if (currentCategory) {
    const cat = categories.find((c: any) => c.slug === currentCategory)
    if (cat) {
      productsUrl += `?category=${encodeURIComponent(cat.id)}`
    }
  }
  const productsRes = await serverApiGet<{ data: any[] }>(productsUrl).catch(() => ({ data: [] }))
  const products = productsRes.data || []

  const trending = products?.slice(0, 8) || []

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <CategoriesNav categories={categories || []} currentCategory={currentCategory} />
      <ShopContent products={products || []} categories={categories || []} trendingProducts={trending} />
    </div>
  )
}
