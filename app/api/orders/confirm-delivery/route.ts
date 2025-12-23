import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { orderId } = await request.json()

  // Verify order belongs to user
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .single()

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // Update order status to delivered
  await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId)

  // Release all escrows for this order
  await supabase
    .from("escrows")
    .update({
      status: "released",
      released_at: new Date().toISOString(),
    })
    .eq("order_id", orderId)

  return NextResponse.json({ success: true })
}
