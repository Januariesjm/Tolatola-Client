import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import { PaymentContent } from "@/components/payment/payment-content"
import { serverApiGet } from "@/lib/api-server"
import type { Database } from "@/lib/types"
import SiteHeader from "@/components/layout/site-header"

export default async function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = createServerComponentClient<Database>({ cookies })

  const {
    data: { user },
  } = await supabase.auth.getUser()


  try {
    // Fetch order details from backend API
    const orderRes = await serverApiGet<{ data: any }>(`orders/${orderId}`)
    const order = orderRes.data

    if (!order) {
      redirect("/")
    }

    let profile = null
    let kycStatus = null
    if (user) {
      const { data: profileData } = await (supabase.from("users").select("*").eq("id", user.id) as any).single()
      profile = profileData
      const { data: kyc } = await (supabase.from("customer_kyc").select("kyc_status").eq("user_id", user.id) as any).maybeSingle()
      kycStatus = kyc?.kyc_status
    }

    return (
      <div className="min-h-screen bg-background">
        <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
        <PaymentContent order={order} user={user} />
      </div>
    )
  } catch (error) {
    console.error("Error fetching order:", error)
    redirect("/")
  }
}
