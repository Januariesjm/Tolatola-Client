"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { ClickPesaPayment } from "@/components/payment/clickpesa-payment"
import type { PaymentMethod } from "@/lib/clickpesa"

interface PaymentContentProps {
  order: any
  user: any
}

export function PaymentContent({ order, user }: PaymentContentProps) {
  const router = useRouter()
  const [paymentCompleted, setPaymentCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePaymentSuccess = (transactionId: string) => {
    console.log("[v0] Payment successful:", transactionId)
    setPaymentCompleted(true)
  }

  const handlePaymentError = (backendError: string) => {
    console.error("[v0] Payment error:", backendError)
    // Extract cleaner message if possible
    let message = backendError
    if (backendError.includes("Failed to generate ClickPesa token")) {
      message = "Payment service is temporarily unavailable. Please try again later."
    }
    setError(message)
  }

  const handleCashOnDelivery = () => {
    setPaymentCompleted(true)
  }

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">
                {order.payment_method === "cash-on-delivery" ? "Order Confirmed!" : "Payment Successful!"}
              </h2>
              <p className="text-muted-foreground">
                Your order #{order.order_number} has been{" "}
                {order.payment_method === "cash-on-delivery" ? "placed" : "confirmed"} and is being processed.
              </p>
              {order.payment_method === "cash-on-delivery" && (
                <p className="text-sm text-muted-foreground mt-2">
                  Please have TZS {order.total_amount.toLocaleString()} ready when your order arrives.
                </p>
              )}
            </div>
            <Button onClick={() => router.push(`/orders/${order.id}`)} className="w-full">
              View Order Details
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Payment</h1>
          <p className="text-muted-foreground">Order #{order.order_number}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payment Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {order.payment_method === "cash-on-delivery" ? (
              <Card>
                <CardHeader>
                  <CardTitle>Cash on Delivery</CardTitle>
                  <CardDescription>Pay with cash when your order is delivered</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                    <p className="text-sm">
                      Your order has been placed successfully. You will pay{" "}
                      <span className="font-bold">TZS {order.total_amount.toLocaleString()}</span> in cash when you
                      receive your delivery.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Please have the exact amount ready when the delivery arrives.
                    </p>
                  </div>
                  <Button onClick={handleCashOnDelivery} className="w-full">
                    Confirm Order
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ClickPesaPayment
                orderId={order.id}
                amount={order.total_amount}
                paymentMethod={order.payment_method as PaymentMethod}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>
                        {item.product?.name || "Product"} x {item.quantity}
                      </span>
                      <span>TZS {(item.unit_price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>TZS {order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery Fee</span>
                    <span>TZS {order.delivery_fee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>TZS {order.total_amount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
