import { createClient } from "@/lib/supabase/server"
import { FavoritesContent } from "@/components/favorites/favorites-content"
import { redirect } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"

export const dynamic = "force-dynamic"

export default async function FavoritesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let kycData = null
  let likes: any[] = []

  if (user) {
    const { data: profileData } = await (supabase.from("users").select("*").eq("id", user.id as string) as any).single()
    profile = profileData

    const { data: kyc } = await (supabase
      .from("customer_kyc")
      .select("kyc_status")
      .eq("user_id", user.id as string) as any)
      .maybeSingle()
    kycData = kyc

    // Get user's liked products from DB
    const { data: dbLikes } = await (supabase
      .from("product_likes")
      .select(`
        *,
        products (
          *,
          shops (
            name,
            vendors (
              business_name
            )
          )
        )
      `) as any)
      .eq("user_id", user.id as string)
      .order("created_at", { ascending: false })
    likes = dbLikes || []
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycData?.kyc_status} />
      <FavoritesContent likes={likes} />
    </div>
  )
}
