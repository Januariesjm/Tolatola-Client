import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

import { api } from "@/lib/api"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { orderId } = await request.json()

  // Verify order belongs to user and fetch assignments
  const { data: order } = await supabase
    .from("orders")
    .select("*, transporter_assignments(id, status)")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .single()

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const session = await supabase.auth.getSession()
  const token = session.data.session?.access_token

  // If we have transporter assignments, verify them via the backend service
  // This handles fund release for both Transporter and Vendor
  if (order.transporter_assignments && order.transporter_assignments.length > 0) {
    const results = []
    for (const assignment of order.transporter_assignments) {
      if (assignment.status === "delivered") {
        try {
          // Verify via backend API
          const res = await api.post(`assignments/${assignment.id}/verify`, {}, token)
          results.push(res)
        } catch (err) {
          console.error(`Failed to verify assignment ${assignment.id}:`, err)
        }
      }
    }

    // Also update main order status if not already done by backend logic
    await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId)

    return NextResponse.json({ success: true, results })
  }

  // Fallback: If no assignments (legacy or self-delivery), release escrows directly
  console.log("No assignments found, using legacy release logic")

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
