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
      .select('*, order_items(*, product:products(shop_id))') // Fetch items to identify shops
      .single()

    if (updateError) {
      console.error("[v0] Error updating order:", updateError)
      return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
    }

    if (status === "COMPLETED" || status === "SUCCESS") {
      // Notify Vendors about payment
      // We need to re-fetch or use the returned data to identify shops
      // The update query above returns the order, but we can't easily join deep in update in Supabase JS sometimes depending on version,
      // but let's try to fetch items if needed.

      const { data: orderItems } = await supabase
        .from('order_items')
        .select('shop_id')
        .eq('order_id', orderId)

      if (orderItems) {
        const shopIds = [...new Set(orderItems.map((item: any) => item.shop_id))]

        const { createNotification } = await import("@/lib/notifications")

        for (const shopId of shopIds) {
          const { data: shop } = await supabase
            .from('shops')
            .select('owner_id, name')
            .eq('id', shopId)
            .single()

          if (shop && shop.owner_id) {
            await createNotification({
              userId: shop.owner_id,
              type: "order_status_update",
              title: "Payment Confirmed! \uD83D\uDCB0",
              message: `Payment for order #${orderId.slice(0, 8)} has been confirmed. You can now process the order.`,
              data: {
                orderId: orderId,
                shopId: shopId,
                status: 'paid'
              }
            })
          }
        }
      }
    }

    console.log("[v0] Order updated successfully:", orderId, paymentStatus)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] ClickPesa webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
