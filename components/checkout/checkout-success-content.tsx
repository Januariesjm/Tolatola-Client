"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { clientApiPost, clientApiGet } from "@/lib/api-client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Package, Truck, Home, ShoppingBag, ShieldCheck, MapPin, Phone, User, Building2, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckoutSuccessContentProps {
  order: any
  user: any
}

const STEPS_DETAILS = [
  { id: "ORDER_RECEIVED", label: "Order Received", icon: CheckCircle2 },
  { id: "PAYMENT_CONFIRMED", label: "Payment Confirmed", icon: ShieldCheck },
  { id: "PROCESSING", label: "Processing Order", icon: Package },
  { id: "DISPATCHED", label: "Dispatched & Picked Up", icon: MapPin },
  { id: "IN_TRANSIT", label: "In Transit to You", icon: Truck },
  { id: "DELIVERED", label: "Delivered", icon: Home },
]

const FULL_STATUS_MAP: Record<string, number> = {
  "pending": 0,
  "pending_payment": 0,
  "PAYMENT_CONFIRMED": 1,
  "confirmed": 1,
  "paid": 1,
  "PROCESSING": 2,
  "processing": 2,
  "preparing": 2,
  "DISPATCHED": 3,
  "dispatched": 3,
  "ready_for_pickup": 3,
  "picked_up": 3,
  "IN_TRANSIT": 4,
  "in_transit": 4,
  "shipped": 4,
  "DELIVERED": 5,
  "delivered": 5,
  "completed": 5,
}

function OrderStatusProgress({ status }: { status: string }) {
  const currentIndex = FULL_STATUS_MAP[status] ?? 0
  const isCompleted = status === "DELIVERED" || status === "delivered" || status === "completed"

  return (
    <div className="space-y-8">
      {/* Horizontal Visual Summary - hidden on mobile */}
      <div className="relative hidden sm:flex justify-between w-full max-w-md mx-auto py-8">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-stone-100 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-1000"
          style={{ width: `${Math.min((currentIndex / (STEPS_DETAILS.length - 1)) * 100, 100)}%` }}
        />
        {STEPS_DETAILS.filter((_, idx) => idx % 2 === 0 || idx === STEPS_DETAILS.length - 1).map((step) => {
          const originalIdx = STEPS_DETAILS.findIndex((s) => s.id === step.id)
          const Icon = step.icon
          const isActive = originalIdx <= currentIndex
          const isCurrent = originalIdx === currentIndex
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                  isActive ? "bg-primary border-primary text-white" : "bg-white border-stone-100 text-stone-300",
                  isCurrent && isActive && "animate-pulse ring-4 ring-primary/20"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider text-center max-w-[80px]",
                  isActive ? "text-primary" : "text-stone-400"
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Detailed Vertical Tracking List */}
      <div className="bg-stone-50 rounded-2xl p-6 border border-stone-100">
        <h4 className="text-sm font-black text-stone-900 border-b border-stone-200 pb-3 mb-4">
          Detailed Tracking Events
        </h4>
        <div className="space-y-5">
          {STEPS_DETAILS.map((step, idx) => {
            const isDone = currentIndex > idx || (currentIndex === idx && isCompleted)
            const isCurrent = currentIndex === idx && !isDone
            const Icon = step.icon
            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center border-2 border-white ring-2 ring-transparent shadow-sm flex-shrink-0 z-10",
                      isDone ? "bg-green-500" : isCurrent ? "bg-primary animate-pulse" : "bg-stone-200"
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  {idx !== STEPS_DETAILS.length - 1 && (
                    <div
                      className={cn(
                        "w-0.5 h-full min-h-[20px] -my-1",
                        isDone ? "bg-green-500" : "bg-stone-200"
                      )}
                    />
                  )}
                </div>
                <div className="pt-0.5 pb-2">
                  <p
                    className={cn(
                      "text-sm font-bold",
                      isDone ? "text-stone-900" : isCurrent ? "text-primary" : "text-stone-400"
                    )}
                  >
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-stone-500 mt-1">Currently in progress...</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function CheckoutSuccessContent({ order: initialOrder, user }: CheckoutSuccessContentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState(initialOrder)
  const [isConfirming, setIsConfirming] = useState(false)

  // Payment status tracking
  const [paymentStatus, setPaymentStatus] = useState<"processing" | "paid" | "failed">(
    order.payment_status === "paid" || order.payment_method === "cash-on-delivery" ? "paid" : "processing"
  )

  // Clear cart on mount (safety net in case checkout didn't clear it)
  useEffect(() => {
    localStorage.removeItem("cart")
    window.dispatchEvent(new Event("cartUpdated"))
  }, [])

  // Poll payment status in background if not yet confirmed
  useEffect(() => {
    if (paymentStatus !== "processing") return
    if (order.payment_method === "cash-on-delivery") return

    let attempts = 0
    const maxAttempts = 60 // ~3 minutes

    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await clientApiGet<{ data?: { payment_status?: string; status?: string; click_pesa_error?: string } }>( 
          `payments/status/${order.id}`
        )
        const payload = (res as any)?.data ?? res
        const pStatus = payload?.payment_status
        const oStatus = payload?.status

        if (pStatus === "paid" || ["confirmed", "processing", "preparing"].includes(String(oStatus))) {
          setPaymentStatus("paid")
          setOrder((prev: any) => ({ ...prev, payment_status: "paid", status: oStatus || prev.status }))
          clearInterval(interval)
          toast({
            title: "Payment Confirmed ✓",
            description: "Your payment has been verified successfully.",
          })
        } else if (pStatus === "failed") {
          setPaymentStatus("failed")
          clearInterval(interval)
          toast({
            title: "Payment Issue",
            description: payload?.click_pesa_error || "There was an issue with your payment. Please contact support.",
            variant: "destructive",
          })
        }
      } catch {
        // Silently continue polling
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        // Don't mark as failed — the webhook may still arrive
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [paymentStatus, order.id, order.payment_method, toast])

  const handleConfirmDelivery = async () => {
    setIsConfirming(true)
    try {
      await clientApiPost(`orders/${order.id}/confirm-delivery`)
      toast({
        title: "Delivery Confirmed",
        description: "Thank you for confirming the delivery! Funds have been released to the vendor and transporter.",
      })
      setOrder({ ...order, status: "delivered" })
    } catch (err) {
      console.error("Error confirming delivery:", err)
      toast({
        title: "Error",
        description: "Failed to confirm delivery. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card className="border-none shadow-2xl shadow-stone-200/50 rounded-[3rem] overflow-hidden bg-white">
            <div className="bg-primary p-12 text-white text-center space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

              <div className="inline-flex h-24 w-24 bg-white/20 backdrop-blur-md rounded-3xl items-center justify-center animate-in zoom-in duration-700 mx-auto">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>

              <div className="space-y-2 relative z-10">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  Order <span className="opacity-80">Confirmed.</span>
                </h1>
                <p className="text-white/80 font-medium text-lg max-w-md mx-auto">
                  {order.payment_method === "cash-on-delivery"
                    ? "Success! We've received your order. Please prepare cash for delivery."
                    : paymentStatus === "paid"
                    ? "Your order has been successfully placed and payment is secured."
                    : "Your order has been placed! Payment is being processed."}
                </p>
              </div>
            </div>

            <CardContent className="p-8 md:p-12 space-y-12">
              {/* Payment Status Banner */}
              {paymentStatus === "processing" && order.payment_method !== "cash-on-delivery" && (
                <div className="flex items-center gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-200 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-amber-900">Payment Processing</p>
                    <p className="text-xs text-amber-700">
                      {["m-pesa", "airtel-money", "halopesa", "mixx-by-yas", "ezypesa", "tigo-pesa"].includes(order.payment_method)
                        ? "Please check your phone and approve the USSD prompt to complete payment."
                        : ["crdb-simbanking", "crdb-internet-banking", "crdb-wakala", "crdb-branch-otc"].includes(order.payment_method)
                        ? "Use the control number to complete payment through your bank."
                        : "Your payment is being verified. This usually takes a moment."}
                    </p>
                  </div>
                </div>
              )}

              {paymentStatus === "paid" && order.payment_method !== "cash-on-delivery" && (
                <div className="flex items-center gap-4 p-5 bg-green-50 rounded-2xl border border-green-200 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-green-900">Payment Confirmed</p>
                    <p className="text-xs text-green-700">Your payment has been verified and secured successfully.</p>
                  </div>
                </div>
              )}

              {paymentStatus === "failed" && (
                <div className="flex items-center gap-4 p-5 bg-red-50 rounded-2xl border border-red-200 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-900">Payment Issue</p>
                    <p className="text-xs text-red-700">There was an issue processing your payment. Please contact support or try again.</p>
                  </div>
                </div>
              )}

              {/* Bank Control Number (for bank payments with pending status) */}
              {paymentStatus !== "paid" &&
                ["crdb-simbanking", "crdb-internet-banking", "crdb-wakala", "crdb-branch-otc"].includes(order.payment_method) &&
                order.clickpesa_transaction_id && (
                <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-dashed border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <p className="text-sm font-black text-stone-900">Complete Bank Payment</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Control Number</p>
                    <p className="text-3xl font-black text-primary tracking-tight tabular-nums select-all">
                      {order.clickpesa_transaction_id}
                    </p>
                  </div>
                  <div className="text-left space-y-2 bg-white p-4 rounded-xl border border-stone-100">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Instructions</p>
                    <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                      <li>Dial *150*03# (CRDB SimBanking)</li>
                      <li>Select &apos;Bill Payment&apos;</li>
                      <li>Enter the Control Number above</li>
                      <li>Follow prompts to complete payment</li>
                    </ul>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">
                  Live Order Tracking
                </h3>
                <OrderStatusProgress status={order.status} />
              </div>

              <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-stone-50">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Order Number</p>
                    <p className="text-lg font-black text-stone-900 tabular-nums">
                      {order.order_number || `TOLA-${new Date().getFullYear()}-${String(order.id || "").slice(-8).toUpperCase().padStart(8, "0")}`}
                    </p>
                  </div>

                  {order.tracking_code && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Tracking Code</p>
                      <p className="text-lg font-black text-stone-900 tabular-nums">{order.tracking_code}</p>
                    </div>
                  )}

                  <div className="space-y-1 pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Estimated Delivery</p>
                    <p className="text-sm font-bold text-stone-900">1-3 Business Days</p>
                  </div>

                  <div className="space-y-4 bg-stone-50 rounded-[2rem] p-6 border border-stone-100">
                    <h4 className="text-sm font-black text-stone-900 border-b border-stone-200 pb-3 mb-4">
                      Receipt Items
                    </h4>
                    <div className="space-y-4 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex gap-4 items-center">
                          <div className="h-14 w-14 rounded-xl bg-white border border-stone-100 overflow-hidden flex-shrink-0">
                            {item.products?.images?.[0] ? (
                              <img
                                src={item.products.images[0]}
                                alt={item.products.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-stone-50">
                                <ShoppingBag className="h-5 w-5 text-stone-300" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-stone-900 text-sm truncate">
                              {item.products?.name || "Product"}
                            </p>
                            <p className="text-[10px] font-bold text-stone-400 uppercase">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-black text-stone-900 text-sm whitespace-nowrap">
                            {(item.unit_price * item.quantity).toLocaleString()} TZS
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 mt-4 border-t border-stone-200 space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-wider">
                        <span>Subtotal</span>
                        <span className="text-stone-900">{order.subtotal?.toLocaleString() || "0"} TZS</span>
                      </div>
                      <div className="flex justify-between items-center text-xs font-bold text-stone-500 uppercase tracking-wider">
                        <span>Delivery</span>
                        <span className="text-stone-900">{order.delivery_fee?.toLocaleString() || "0"} TZS</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-stone-200">
                        <span className="text-[10px] font-black uppercase text-primary tracking-[0.1em]">Total</span>
                        <span className="text-xl font-black text-stone-900">
                          {order.total_amount?.toLocaleString()} TZS
                        </span>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="space-y-6">

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Shipping To</h4>
                    <div className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-stone-500" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-stone-400 uppercase">Recipient</p>
                          <p className="font-black text-stone-900">
                            {order.shipping_address?.full_name || user?.email || "Guest"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-5 w-5 text-stone-500" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-stone-400 uppercase">Phone</p>
                          <p className="font-black text-stone-900">{order.shipping_address?.phone || "N/A"}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="h-5 w-5 text-stone-500" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-stone-400 uppercase">Address</p>
                          <p className="font-bold text-stone-900 leading-tight">
                            {order.shipping_address?.street && `${order.shipping_address?.street},`}{" "}
                            {order.shipping_address?.ward}
                            <br />
                            {order.shipping_address?.district}, {order.shipping_address?.region}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8">
                    <div className="p-6 bg-stone-900 rounded-[2.5rem] text-white flex items-center gap-4 relative overflow-hidden group">
                      <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                          Purchase Shield Active
                        </p>
                        <p className="text-sm font-bold leading-tight">
                          Your order is protected by TOLA&apos;s buyer protection.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-8">
                <Button
                  onClick={() => {
                    const code = order.tracking_code || order.order_number || ""
                    router.push(`/track?code=${encodeURIComponent(code)}`)
                  }}
                  className="flex-1 h-14 rounded-2xl bg-primary hover:bg-stone-900 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group"
                >
                  Track Order
                </Button>
                {order.status === "dispatched" || order.status === "shipped" || order.status === "on_the_way" ? (
                  <Button
                    onClick={handleConfirmDelivery}
                    disabled={isConfirming}
                    className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-xl shadow-green-200/20 transition-all active:scale-[0.98] group"
                  >
                    {isConfirming ? "Confirming..." : "Confirm Delivery"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push(user ? `/orders` : "/shop")}
                    className="flex-1 h-14 rounded-2xl border-2 border-stone-200 hover:bg-stone-50 text-stone-900 font-bold text-lg transition-all active:scale-[0.98]"
                  >
                    {user ? "View Order History" : "Continue Shopping"}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  onClick={() => router.push("/")}
                  className="flex-1 h-14 rounded-2xl border-2 border-stone-200 hover:bg-stone-50 text-stone-900 font-bold text-lg transition-all active:scale-[0.98]"
                >
                  Return Home
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-center gap-3 animate-pulse">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
              {user ? `Updates sent to ${user.email}` : "Order confirmation sent"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
