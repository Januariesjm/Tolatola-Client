"use client"

import { useCallback } from "react"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { createCheckoutSession } from "@/app/actions/stripe"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripePaymentProps {
  orderId: string
  amount: number
  customerEmail: string
}

export function StripePayment({ orderId, amount, customerEmail }: StripePaymentProps) {
  const fetchClientSecret = useCallback(() => {
    return createCheckoutSession(orderId, amount, customerEmail)
  }, [orderId, amount, customerEmail])

  return (
    <div id="stripe-checkout">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
