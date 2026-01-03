"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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

export function PaymentContent({ order, user }: PaymentContentProps) {
  const router = useRouter()
  // If order is already paid or it's COD, we consider payment "completed" visually for this page
  const [paymentCompleted, setPaymentCompleted] = useState(order.payment_status === "paid" || order.payment_method === "cash-on-delivery")
  const [error, setError] = useState<string | null>(null)

  const handlePaymentSuccess = (transactionId: string) => {
    setPaymentCompleted(true)
  }

  const handlePaymentError = (backendError: string) => {
    setError(backendError)
  }

  const handleCashOnDelivery = () => {
    setPaymentCompleted(true)
  }

  const OrderStatusProgress = ({ status }: { status: string }) => {
    const steps = [
      { id: "pending", label: "Confirmed", icon: CheckCircle2 },
      { id: "preparing", label: "Preparing", icon: Package },
      { id: "dispatched", label: "On the Way", icon: Truck },
      { id: "delivered", label: "Delivered", icon: Home },
    ]

    // Manual mapping for status displayed to user
    const statusMap: Record<string, number> = {
      "pending": 0,
      "pending_payment": 0,
      "confirmed": 0,
      "processing": 1,
      "preparing": 1,
      "shipped": 2,
      "dispatched": 2,
      "on_the_way": 2,
      "delivered": 3,
      "completed": 3
    }

    const currentStepIndex = statusMap[status] || 0

    return (
      <div className="relative flex justify-between w-full max-w-md mx-auto py-8">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-stone-100 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-1000"
          style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
        />
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isActive = idx <= currentStepIndex
          const isCurrent = idx === currentStepIndex
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                isActive ? "bg-primary border-primary text-white" : "bg-white border-stone-100 text-stone-300",
                isCurrent && "animate-pulse ring-4 ring-primary/20"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider",
                isActive ? "text-primary" : "text-stone-400"
              )}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  if (paymentCompleted) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] pb-20">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Success Hero Card */}
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
                      : "Payment verified successfully. Your package is now in safe hands!"}
                  </p>
                </div>
              </div>

              <CardContent className="p-8 md:p-12 space-y-12">
                {/* Progress Tracker */}
                <div className="space-y-4">
                  <h3 className="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Order Milestone</h3>
                  <OrderStatusProgress status={order.status} />
                </div>

                <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-stone-50">
                  {/* Order Details */}
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Transaction ID</p>
                      <p className="text-lg font-black text-stone-900">#{order.order_number}</p>
                    </div>

                    <div className="space-y-4 bg-stone-50 rounded-[2rem] p-6 border border-stone-100">
                      <h4 className="text-sm font-black text-stone-900 border-b border-stone-200 pb-3 mb-4">Receipt Items</h4>
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
                              <p className="font-bold text-stone-900 text-sm truncate">{item.products?.name || "Product"}</p>
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
                          <span className="text-[10px] font-black uppercase text-primary tracking-[0.1em]">Total Paid</span>
                          <span className="text-xl font-black text-stone-900">{order.total_amount?.toLocaleString()} TZS</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Details */}
                  <div className="space-y-6">
                    {/* Bank Transfer Details (if applicable) */}
                    {(order.payment_status !== "paid" && ["crdb-simbanking", "crdb-internet-banking", "crdb-wakala", "crdb-branch-otc"].includes(order.payment_method)) && (
                      <div className="p-6 bg-primary/5 rounded-[2.5rem] border-2 border-dashed border-primary/20 space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <p className="text-sm font-black text-stone-900">Payment Required via Bank</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Control Number</p>
                          <p className="text-3xl font-black text-primary tracking-tight tabular-nums select-all">
                            {order.clickpesa_transaction_id}
                          </p>
                        </div>
                        <div className="text-left space-y-2 bg-white/50 p-4 rounded-xl border border-stone-100">
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Instructions</p>
                          <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                            <li>Dial *150*03# (CRDB SimBanking)</li>
                            <li>Select 'Bill Payment'</li>
                            <li>Enter this Control Number</li>
                          </ul>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Shipping To</h4>
                      <div className="space-y-5">
                        <div className="flex items-start gap-4">
                          <div className="h-10 w-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 text-stone-500" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-[10px] font-bold text-stone-400 uppercase">Recipient</p>
                            <p className="font-black text-stone-900">{order.shipping_address?.full_name || user.email}</p>
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
                              {order.shipping_address?.street}, {order.shipping_address?.ward}<br />
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
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Purchase Shield Active</p>
                          <p className="text-sm font-bold leading-tight">Your payment is protected by TOLA's escrow system.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-8">
                  <Button
                    onClick={() => router.push(`/dashboard`)}
                    className="flex-1 h-14 rounded-2xl bg-primary hover:bg-stone-900 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group"
                  >
                    View Order Details
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/")}
                    className="flex-1 h-14 rounded-2xl border-2 border-stone-200 hover:bg-stone-50 text-stone-900 font-bold text-lg transition-all active:scale-[0.98]"
                  >
                    Continue Shopping
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Email Notification Hint */}
            <div className="flex items-center justify-center gap-3 animate-pulse">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
                Confirmation email dispatched to {user.email}
              </p>
            </div>
          </div>
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
                        <span className="text-xs font-bold uppercase tracking-widest text-white/40 italic">Escrow protection deactivated for COD</span>
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
