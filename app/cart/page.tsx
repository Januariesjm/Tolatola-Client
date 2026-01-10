import { createClient } from "@/lib/supabase/server"
import { CartContent } from "@/components/cart/cart-content"
import { redirect } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"

export const dynamic = "force-dynamic"

export default async function CartPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let kycStatus = null

  if (user) {
    const { data: profileData } = await (supabase.from("users").select("*").eq("id", user.id as string) as any).single()
    profile = profileData

    const { data: kycData } = await (supabase
      .from("customer_kyc")
      .select("kyc_status")
      .eq("user_id", user.id as string) as any)
      .maybeSingle()
    kycStatus = kycData?.kyc_status
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <CartContent />
    </div>
  )
}
