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

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await (supabase.from("users").select("*").eq("id", user.id) as any).single()

  const { data: kycData } = await (supabase
    .from("customer_kyc")
    .select("kyc_status")
    .eq("user_id", user.id) as any)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycData?.kyc_status} />
      <CartContent />
    </div>
  )
}
