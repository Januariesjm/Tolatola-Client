import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.log("[v0] ClickPesa webhook received:", payload)

    const { transaction_id, merchant_reference, status, amount, phone_number } = payload

    // Extract order ID from merchant reference
    const orderId = merchant_reference?.replace("ORDER-", "")

    if (!orderId) {
      return NextResponse.json({ error: "Invalid merchant reference" }, { status: 400 })
    }

    const supabase = await createClient()

    // Map ClickPesa status to our payment status
    let paymentStatus = "pending"
    let orderStatus = "pending"

    if (status === "COMPLETED" || status === "SUCCESS") {
      paymentStatus = "paid"
      orderStatus = "processing"
    } else if (status === "FAILED") {
      paymentStatus = "failed"
      orderStatus = "cancelled"
    } else if (status === "PENDING") {
      paymentStatus = "pending"
      orderStatus = "pending"
    }

    // Update order
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status: orderStatus,
        clickpesa_transaction_id: transaction_id,
        paid_at: status === "COMPLETED" || status === "SUCCESS" ? new Date().toISOString() : null,
      })
      .eq("id", orderId)

    if (updateError) {
      console.error("[v0] Error updating order:", updateError)
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    console.log("[v0] Order updated successfully:", orderId, paymentStatus)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] ClickPesa webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
