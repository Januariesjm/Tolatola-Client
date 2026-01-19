import { createClient } from "@/lib/supabase/server"
import { OrderDetailContent } from "@/components/orders/order-detail-content"
import { redirect, notFound } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"
import { Metadata } from "next"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Order Details | TOLA",
  description: "View your order details and status.",
}

interface OrderDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  // Await params to handle both Next.js 14 (sync/async transition) and 15 (async) safely
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
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        products (
          name,
          price,
          images,
          primary_image_url,
          shops (
            name,
            logo_url,
            phone,
            address,
            district,
            region,
            vendors (
              business_name,
              contact_phone
            )
          )
        )
      ),
      transport_methods (*)
    `,
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .single()

  if (error || !order) {
    console.error("Error fetching order:", error)
    console.error("Order ID:", id)
    console.error("User ID:", user.id)
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycData?.kyc_status} />
      <OrderDetailContent order={order} />
    </div>
  )
}
