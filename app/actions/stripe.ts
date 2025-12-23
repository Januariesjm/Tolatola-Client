"use server"

import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function createCheckoutSession(orderId: string, amount: number, customerEmail: string) {
  const session = await stripe.checkout.sessions.create({
    ui_mode: "embedded",
    redirect_on_completion: "never",
    customer_email: customerEmail,
    line_items: [
      {
        price_data: {
          currency: "tzs",
          product_data: {
            name: `TOLA Order #${orderId}`,
            description: "Marketplace order payment",
          },
          unit_amount: Math.round(amount), // Amount in minor units (cents/senti)
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      order_id: orderId,
    },
  })

  return session.client_secret
}

export async function verifyPaymentStatus(orderId: string) {
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select("payment_status, stripe_payment_intent_id")
    .eq("id", orderId)
    .single()

  if (!order) {
    return { success: false, status: null }
  }

  if (order.stripe_payment_intent_id) {
    const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_intent_id)
    return {
      success: true,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    }
  }

  return { success: true, status: order.payment_status }
}
