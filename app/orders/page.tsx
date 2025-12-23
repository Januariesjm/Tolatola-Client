import { createClient } from "@/lib/supabase/server"
import { OrdersListContent } from "@/components/orders/orders-list-content"
import { redirect } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"

export default async function OrdersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  const { data: kycData } = await supabase
    .from("customer_kyc")
    .select("kyc_status")
    .eq("user_id", user.id)
    .maybeSingle()

  // Get user's orders
  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        products (
          name,
          images
        )
      )
    `,
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycData?.kyc_status} />
      <OrdersListContent orders={orders || []} />
    </div>
  )
}
