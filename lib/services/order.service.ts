import { createClient } from "@/lib/supabase/server"
import type { ShippingAddress } from "@/lib/schemas/order"
import { logger, normalizeError } from "@/lib/logger"

const log = logger.child("lib.services.order.service")

/**
 * Order Service - Handles all order-related business logic
 * This service can be extracted to a separate microservice when needed
 */
/**
 * A transporter row considered for auto-assignment, with the joined
 * subscription used to rank them.
 */
interface EligibleTransporter {
  id: string
  rating?: number | string | null
  transporter_subscriptions?: Array<{
    status?: string | null
    plan?: { display_order?: number | null } | null
  }> | null
  [key: string]: unknown
}

export class OrderService {
  async createOrder(params: {
    userId: string
    items: Array<{
      product_id: string
      quantity: number
      price: number
      shop_id: string
    }>
    shippingAddress: ShippingAddress
    totalAmount: number
    paymentMethod: string
    transportMethodId: string | null
    deliveryFee: number
  }) {
    const supabase = await createClient()

    try {
      const orderStatus = params.paymentMethod === "cash-on-delivery" ? "pending" : "pending_payment"
      const paymentStatus = params.paymentMethod === "cash-on-delivery" ? "pending" : "pending"

      // Calculate subtotal
      const subtotal = params.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: params.userId,
          order_number: `ORD-${Date.now()}`,
          status: orderStatus,
          subtotal,
          vat_amount: 0,
          total_amount: params.totalAmount,
          payment_method: params.paymentMethod,
          payment_status: paymentStatus,
          transport_method_id: params.transportMethodId,
          delivery_fee: params.deliveryFee,
          shipping_address: params.shippingAddress,
        })
        .select()
        .single()

      if (orderError) {
        throw new Error(`Failed to create order: ${orderError.message}`)
      }

      // Create order items and handle inventory
      for (const item of params.items) {
        // Create order item
        const { error: itemError } = await supabase.from("order_items").insert({
          order_id: order.id,
          product_id: item.product_id,
          shop_id: item.shop_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
        })

        if (itemError) {
          throw new Error(`Failed to create order item: ${itemError.message}`)
        }

        // Create secure transaction record for vendor payout
        const itemTotal = item.price * item.quantity
        const { error: escrowError } = await supabase.from("escrows").insert({
          order_id: order.id,
          shop_id: item.shop_id,
          amount: itemTotal,
          status: "held",
        })

        if (escrowError) {
          throw new Error(`Failed to create transaction record: ${escrowError.message}`)
        }

        // Update product stock
        const { data: product } = await supabase.from("products").select("stock_quantity").eq("id", item.product_id).single()

        if (product) {
          const newStock = product.stock_quantity - item.quantity
          await supabase.from("products").update({ stock_quantity: newStock }).eq("id", item.product_id)
        }
      }

      // Auto-assign transporter if transport method is selected
      if (params.transportMethodId) {
        await this.assignTransporter(order.id, params.transportMethodId)
      }

      return { success: true, order }
    } catch (error) {
      log.error("order creation error", error)
      return { success: false, error: normalizeError(error).message }
    }
  }

  async getOrder(orderId: string) {
    const supabase = await createClient()

    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          products (
            *,
            shops (name, logo_url)
          )
        ),
        users (
          email,
          full_name
        )
      `,
      )
      .eq("id", orderId)
      .single()

    if (error) {
      throw new Error(`Failed to get order: ${normalizeError(error).message}`)
    }

    return order
  }

  async updateOrderStatus(orderId: string, status: string) {
    const supabase = await createClient()

    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)

    if (error) {
      throw new Error(`Failed to update order status: ${normalizeError(error).message}`)
    }

    return { success: true }
  }

  async assignTransporter(orderId: string, transportMethodId: string) {
    const supabase = await createClient()

    try {
      // 1. Get transport method details
      const { data: transportMethod } = await supabase.from("transport_methods").select("vehicle_type").eq("id", transportMethodId).single()

      if (!transportMethod) {
        throw new Error("Transport method not found")
      }

      // 2. Fetch eligible transporters with active subscriptions
      const { data: eligibleTransporters, error: fetchError } = await supabase
        .from("transporters")
        .select(
          `
          *,
          transporter_subscriptions(
            status,
            plan:subscription_plans(
              name,
              display_order
            )
          )
        `,
        )
        .eq("vehicle_type", transportMethod.vehicle_type)
        .eq("kyc_status", "approved")
        .eq("availability_status", "available")

      if (fetchError) throw fetchError

      if (!eligibleTransporters || eligibleTransporters.length === 0) {
        log.info("no available transporter for vehicle type", { vehicleType: transportMethod.vehicle_type })
        return { success: false, message: "No available transporter" }
      }

      // 3. Sort by Subscription Tier (display_order) then Rating
      const sortedTransporters = eligibleTransporters
        .map((t: EligibleTransporter) => {
          const activeSub = t.transporter_subscriptions?.find((s) => s.status === "active")
          const planOrder = activeSub?.plan?.display_order ?? 999
          return { ...t, planOrder }
        })
        .sort((a, b) => {
          if (a.planOrder !== b.planOrder) return a.planOrder - b.planOrder
          return (Number(b.rating) || 5) - (Number(a.rating) || 5)
        })

      const bestTransporter = sortedTransporters[0]

      // 4. Create assignment
      await supabase.from("transporter_assignments").insert({
        order_id: orderId,
        transporter_id: bestTransporter.id,
        status: "assigned",
        assigned_at: new Date().toISOString(),
      })

      // 5. Mark transporter as busy
      await supabase.from("transporters").update({ availability_status: "busy" }).eq("id", bestTransporter.id)

      return { success: true, transporter: bestTransporter }
    } catch (error) {
      log.error("transporter assignment error", error)
      return { success: false, error: normalizeError(error).message }
    }
  }
}
