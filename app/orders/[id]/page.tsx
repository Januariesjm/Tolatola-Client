import { createClient } from "@/lib/supabase/server"
import { OrderDetailContent } from "@/components/orders/order-detail-content"
import { redirect, notFound } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // Get order with items
  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        products (
          name,
          price,
          shops (
            name,
            vendors (
              business_name
            )
          )
        )
      )
    `,
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .single()

  if (!order) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycData?.kyc_status} />
      <OrderDetailContent order={order} />
    </div>
  )
}
