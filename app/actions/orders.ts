"use server"

import { OrderService } from "@/lib/services/order.service"
import { createClient } from "@/lib/supabase/server"

const orderService = new OrderService()

export async function createOrder(
  userId: string,
  items: Array<{
    product_id: string
    quantity: number
    price: number
    shop_id: string
  }>,
  shippingAddress: any,
  totalAmount: number,
  paymentMethod: string,
  transportMethodId: string | null,
  deliveryFee: number,
) {
  return await orderService.createOrder({
    userId,
    items,
    shippingAddress,
    totalAmount,
    paymentMethod,
    transportMethodId,
    deliveryFee,
  })
}

export async function getOrder(orderId: string) {
  return await orderService.getOrder(orderId)
}

export async function updateOrderStatus(orderId: string, status: string) {
  return await orderService.updateOrderStatus(orderId, status)
}

export async function getUserOrders(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (
          *,
          shops (name)
        )
      )
    `)
    .eq("customer_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data || []
}
