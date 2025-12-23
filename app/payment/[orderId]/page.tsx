import { redirect } from "next/navigation"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import { PaymentContent } from "@/components/payment/payment-content"
import { serverApiGet } from "@/lib/api-server"
import type { Database } from "@/lib/types"

export default async function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const supabase = createServerComponentClient<Database>({ cookies, headers })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  try {
    // Fetch order details from backend API
    const orderRes = await serverApiGet<{ data: any }>(`orders/${orderId}`)
    const order = orderRes.data

    if (!order) {
      redirect("/orders")
    }

    return <PaymentContent order={order} user={user} />
  } catch (error) {
    console.error("Error fetching order:", error)
    redirect("/orders")
  }
}
