import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = await createClient()

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object
      const orderId = session.metadata?.order_id

      if (orderId) {
        // Update order payment status
        await supabase
          .from("orders")
          .update({
            payment_status: "completed",
            payment_method: "credit_card",
            stripe_payment_intent_id: session.payment_intent as string,
            status: "confirmed",
          })
          .eq("id", orderId)

        console.log(`[v0] Payment completed for order ${orderId}`)
      }
      break
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object

      // Find order by payment intent ID
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("stripe_payment_intent_id", paymentIntent.id)
        .single()

      if (order) {
        await supabase
          .from("orders")
          .update({
            payment_status: "failed",
          })
          .eq("id", order.id)

        console.log(`[v0] Payment failed for order ${order.id}`)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
