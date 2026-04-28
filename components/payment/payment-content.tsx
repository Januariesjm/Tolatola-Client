"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { clientApiPost, clientApiGet } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertCircle, ShoppingBag, Package, Truck, Home, ShieldCheck, MapPin, Phone, User, Building2 } from "lucide-react"
import { ClickPesaPayment } from "@/components/payment/clickpesa-payment"
import type { PaymentMethod } from "@/lib/clickpesa"
import { cn } from "@/lib/utils"

interface PaymentContentProps {
  order: any
  user: any
}

export function PaymentContent({ order: initialOrder, user }: PaymentContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState(initialOrder)
  // If order is already paid or it's COD, we consider payment "completed" visually for this page
  const [paymentCompleted, setPaymentCompleted] = useState(order.payment_status === "paid" || order.payment_method === "cash-on-delivery")
  const [error, setError] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  // Auto-poll payment status if not yet confirmed (handles race condition where checkout redirects before webhook processes)
  useEffect(() => {
    if (paymentCompleted) return
    if (order.payment_method === "cash-on-delivery") return

    let attempts = 0
    const maxAttempts = 40

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await clientApiGet<{ data: { payment_status: string; status: string } }>(
          `payments/status/${order.id}`
        )
        if (res.data?.payment_status === "paid" || res.data?.status === "confirmed") {
          setPaymentCompleted(true)
          setOrder((prev: any) => ({ ...prev, payment_status: "paid", status: res.data.status }))
          clearInterval(interval)
        } else if (res.data?.payment_status === "failed") {
          setError("Payment failed. Please try again.")
          clearInterval(interval)
        }
      } catch (err) {
        // Silently continue polling
      }
      if (attempts >= maxAttempts) {
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [paymentCompleted, order.id, order.payment_method])

  const handlePaymentSuccess = (transactionId: string) => {
    setPaymentCompleted(true)
  }

  const handlePaymentError = (backendError: string) => {
    setError(backendError)
  }

  const handleCashOnDelivery = () => {
    setPaymentCompleted(true)
  }

  useEffect(() => {
    if (paymentCompleted) {
      localStorage.removeItem("cart")
      window.dispatchEvent(new Event("cartUpdated"))
      router.push('/checkout/success/' + order.id)
    }
  }, [paymentCompleted, order.id, router])

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center pb-20">
        <div className="animate-pulse flex items-center gap-3 text-stone-500 bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="font-bold text-sm tracking-wide">Redirecting to order confirmation...</span>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                <ShieldCheck className="h-4 w-4" />
                <span>Protocol Verification</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-stone-900 leading-none">
                Complete <span className="text-primary">Payment.</span>
              </h1>
              <p className="text-stone-500 text-lg font-medium max-w-xl">
                Finalize your order securely. Order Reference: <span className="text-stone-900 font-bold">#{order.order_number}</span>
              </p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-8 border-none bg-destructive/10 text-destructive rounded-3xl p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-destructive/20 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div>
                  <AlertTitle className="text-lg font-black uppercase tracking-tight">Payment Disrupted</AlertTitle>
                  <AlertDescription className="font-bold">{error}</AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-8">
              {order.payment_method === "cash-on-delivery" ? (
                <Card className="border-none shadow-xl shadow-stone-200/40 rounded-[2.5rem] bg-stone-900 text-white overflow-hidden group">
                  <div className="p-8 md:p-12 space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="h-16 w-16 bg-white/20 rounded-3xl flex items-center justify-center flex-shrink-0 rotate-3 transition-transform group-hover:rotate-0">
                        <ShoppingBag className="h-8 w-8 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-3xl font-black tracking-tight">Post-Delivery Settlement</h2>
                        <p className="text-white/60 font-medium">Verify your items before handing over cash.</p>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-[2rem] p-8 space-y-4 border border-white/10">
                      <p className="text-lg leading-relaxed font-medium">
                        You have chosen to pay with cash upon delivery. The total amount due is{" "}
                        <span className="text-primary font-black text-2xl">TZS {order.total_amount.toLocaleString()}</span>
                      </p>
                      <div className="flex items-center gap-2 pt-4">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="text-xs font-bold uppercase tracking-widest text-white/40 italic">Payment protection unavailable for COD</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleCashOnDelivery}
                      className="w-full h-16 rounded-[2rem] bg-white text-stone-900 hover:bg-primary hover:text-white font-black text-xl transition-all shadow-2xl"
                    >
                      Process Order Submission
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ClickPesaPayment
                    orderId={order.id}
                    amount={order.total_amount}
                    paymentMethod={order.payment_method as PaymentMethod}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </div>
              )}
            </div>

            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <Card className="border-none shadow-2xl shadow-stone-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                <div className="bg-stone-900 p-8 text-white">
                  <h3 className="text-xl font-black tracking-tight">Order Verification</h3>
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Snapshot Summary</p>
                </div>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-stone-50 overflow-hidden border border-stone-100 flex-shrink-0 shadow-sm">
                          {item.products?.images?.[0] ? (
                            <img
                              src={item.products.images[0]}
                              alt={item.products.name}
                              className="w-full h-full object-cover grayscale-[0.5] hover:grayscale-0 transition-all duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-stone-50">
                              <ShoppingBag className="h-6 w-6 text-stone-200" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="font-bold text-stone-900 text-sm truncate leading-tight">{item.products?.name || "Product"}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-stone-400">Qty: {item.quantity}</span>
                            <span className="text-stone-900 font-black text-sm">{(item.unit_price * item.quantity).toLocaleString()} TZS</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t-2 border-stone-50 space-y-3">
                    <div className="flex justify-between items-center text-sm font-bold text-stone-500 uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span className="text-stone-900">{order.subtotal?.toLocaleString()} TZS</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold text-stone-500 uppercase tracking-widest">
                      <span>Logistics</span>
                      <span className="text-stone-900">{order.delivery_fee?.toLocaleString()} TZS</span>
                    </div>
                    <div className="pt-6 mt-4 border-t-2 border-stone-100 flex justify-between items-end">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Final Settlement</p>
                        <p className="text-3xl font-black text-stone-900 tracking-tight">
                          {order.total_amount.toLocaleString()} <span className="text-[10px] uppercase">TZS</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
