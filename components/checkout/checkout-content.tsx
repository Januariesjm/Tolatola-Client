"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Smartphone, Truck, MapPin, Loader2, CheckCircle2,
  CreditCard, Banknote, Building2, ChevronDown,
  ShieldCheck, Wallet, ArrowRight, ShoppingBag,
  Zap, Info
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { calculateDeliveryDistance, calculateDeliveryDistanceByCoords } from "@/app/actions/maps"
import type { TransportMethod } from "@/app/actions/maps"
import { useToast } from "@/hooks/use-toast"
import { TanzaniaAddressForm } from "@/components/checkout/tanzania-address-form"
import { clientApiGet, clientApiPost } from "@/lib/api-client"

interface CheckoutContentProps {
  user: any
}

export function CheckoutContent({ user }: CheckoutContentProps) {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [fullName, setFullName] = useState(user?.full_name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [addressData, setAddressData] = useState({
    country: "Tanzania",
    region: "",
    district: "",
    ward: "",
    village: "",
    street: "",
  })
  const [fullAddress, setFullAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<string>("m-pesa")
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState(user?.phone || "")
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
  })
  const [transportMethods, setTransportMethods] = useState<TransportMethod[]>([])
  const [selectedTransportId, setSelectedTransportId] = useState<string>("")
  const [deliveryInfo, setDeliveryInfo] = useState<{
    distanceKm: number
    deliveryFee: number
    duration?: string
    transportMethod?: string
    transportMethodId?: string
  } | null>(null)
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false)
  const [deliveryError, setDeliveryError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("cart") || "[]")
    if (items.length === 0) {
      router.push("/cart")
    }
    setCartItems(items)

    clientApiGet<{ data: TransportMethod[] }>("transport-methods")
      .then((res) => {
        const methods = res.data || []
        setTransportMethods(methods)
        if (methods.length > 0 && !selectedTransportId) {
          setSelectedTransportId(methods[0].id)
        }
      })
      .catch(() => {
        setTransportMethods([])
      })
  }, [router])

  const handleAddressComplete = async (address: string, coordinates?: { lat: number; lng: number }) => {
    setFullAddress(address)
    setDeliveryError(null)

    if (!coordinates) {
      // Manual entry or incomplete data - do not calculate delivery fee
      // We rely on the autocomplete for accurate logistics
      return
    }

    setIsCalculatingDelivery(true)

    try {
      const result = await calculateDeliveryDistanceByCoords(coordinates.lat, coordinates.lng)

      if (result) {
        if (selectedTransportId) {
          const totalWeight = cartItems.reduce((sum, item) => sum + (item.product.weight || 1) * item.quantity, 0)
          const method =
            transportMethods.find((m) => m.id === selectedTransportId || m.name === selectedTransportId) ||
            transportMethods[0]
          let deliveryFeeCalc = 0
          if (method?.rate_per_kg) {
            deliveryFeeCalc = totalWeight * (method.rate_per_kg || 0)
          } else if (method?.rate_per_km) {
            deliveryFeeCalc = result.distanceKm * (method.rate_per_km || 0)
          }
          setDeliveryInfo({
            ...result,
            deliveryFee: Math.round(deliveryFeeCalc),
            transportMethod: method?.name,
            transportMethodId: method?.id,
          })
        } else {
          setDeliveryInfo(result)
        }
      } else {
        setDeliveryError("Logistics Engine could not determine a route to this coordinate bundle.")
        setDeliveryInfo(null)
      }
    } catch (error) {
      setDeliveryError("Logistics calculation failed. Please retry location selection.")
      setDeliveryInfo(null)
    } finally {
      setIsCalculatingDelivery(false)
    }
  }

  useEffect(() => {
    if (deliveryInfo && selectedTransportId && cartItems.length > 0) {
      const totalWeight = cartItems.reduce((sum, item) => sum + (item.product.weight || 1) * item.quantity, 0)
      const method =
        transportMethods.find((m) => m.id === selectedTransportId || m.name === selectedTransportId) ||
        transportMethods[0]
      let deliveryFeeCalc = 0
      if (method?.rate_per_kg) {
        deliveryFeeCalc = totalWeight * (method.rate_per_kg || 0)
      } else if (method?.rate_per_km) {
        deliveryFeeCalc = deliveryInfo.distanceKm * (method.rate_per_km || 0)
      }
      setDeliveryInfo((prev) =>
        prev
          ? {
            ...prev,
            deliveryFee: Math.round(deliveryFeeCalc),
            transportMethod: method?.name,
            transportMethodId: method?.id,
          }
          : null,
      )
    }
  }, [selectedTransportId, cartItems])

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const deliveryFee = deliveryInfo?.deliveryFee || 0
  const total = subtotal + deliveryFee

  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false)
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("")

  const pollPaymentStatus = async (orderId: string) => {
    let attempts = 0
    const maxAttempts = 40 // ~2 mins polling

    const checkStatus = async () => {
      try {
        const res = await clientApiGet<{ data: { payment_status: string; status: string; click_pesa_error?: string } }>(
          `payments/status/${orderId}`
        )
        const { payment_status, status } = res.data

        if (payment_status === "paid" || status === "confirmed") {
          setIsAwaitingPayment(false)
          toast({
            title: "Payment Successful",
            description: "Your order has been confirmed successfully!",
          })
          localStorage.removeItem("cart")
          window.dispatchEvent(new Event("cartUpdated"))
          router.push(`/payment/${orderId}`)
          return true
        }

        if (payment_status === "failed") {
          setIsAwaitingPayment(false)
          toast({
            title: "Payment Failed",
            description: res.data.click_pesa_error || "The transaction was unsuccessful. Please check your balance or try another method.",
            variant: "destructive",
          })
          return true
        }

        return false
      } catch (err) {
        console.error("Polling error:", err)
        return false
      }
    }

    const interval = setInterval(async () => {
      attempts++
      const finished = await checkStatus()
      if (finished || attempts >= maxAttempts) {
        clearInterval(interval)
        if (attempts >= maxAttempts) {
          setIsAwaitingPayment(false)
          toast({
            title: "Payment Timeout",
            description: "We haven't received confirmation yet. Please check your order status later.",
            variant: "destructive",
          })
        }
      }
    }, 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (paymentMethod === "m-pesa") {
      toast({
        title: "Maintenance",
        description: "M-Pesa Vodacom is currently under maintenance. Please try another payment method.",
        variant: "destructive",
      })
      return
    }

    if (!addressData.region || !addressData.district || !addressData.ward || !addressData.street) {
      toast({
        title: "Address Required",
        description: "Please complete all required address fields",
        variant: "destructive",
      })
      return
    }

    if (!deliveryInfo) {
      toast({
        title: "Delivery Fee Not Calculated",
        description: "Please wait for delivery fee calculation to complete",
        variant: "destructive",
      })
      return
    }

    if (!selectedTransportId) {
      toast({
        title: "Transport Method Required",
        description: "Please select a transport method for your delivery",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const items = cartItems.map((item) => ({
        product_id: item.product_id || item.product?.id,
        quantity: item.quantity,
        price: item.product.price,
        shop_id: item.product.shop_id,
      }))

      const orderPayload = {
        items,
        shippingAddress: {
          full_name: fullName,
          phone,
          address: fullAddress,
          country: addressData.country,
          region: addressData.region,
          district: addressData.district,
          ward: addressData.ward,
          village: addressData.village,
          street: addressData.street,
          delivery_distance_km: deliveryInfo.distanceKm,
          delivery_duration: deliveryInfo.duration,
          delivery_fee: deliveryFee,
        },
        totalAmount: total,
        paymentMethod,
        paymentDetails: {
          phoneNumber: ["m-pesa", "airtel-money", "halopesa", "mixx-by-yas", "ezypesa"].includes(paymentMethod)
            ? paymentPhoneNumber
            : undefined,
          cardNumber: ["visa", "mastercard", "unionpay"].includes(paymentMethod) ? cardDetails.number : undefined,
          expiryDate: ["visa", "mastercard", "unionpay"].includes(paymentMethod) ? cardDetails.expiry : undefined,
          cvv: ["visa", "mastercard", "unionpay"].includes(paymentMethod) ? cardDetails.cvv : undefined,
        },
        transportMethodId: deliveryInfo?.transportMethodId || selectedTransportId || null,
        deliveryFee,
      }

      const orderRes = await clientApiPost<{ order: any; success?: boolean }>("orders", orderPayload)
      const orderId = (orderRes as any)?.order?.id || (orderRes as any)?.id

      if (!orderId) {
        throw new Error("Order ID not returned from API")
      }

      if (paymentMethod === "cash-on-delivery") {
        localStorage.removeItem("cart")
        window.dispatchEvent(new Event("cartUpdated"))
        router.push(`/payment/${orderId}`)
        return
      }

      // Initiate Payment
      setPaymentStatusMessage("Initiating secure payment request...")
      setIsAwaitingPayment(true)

      const payRes = await clientApiPost<{ success: boolean; message: string; transactionId?: string }>(
        "payments/clickpesa/initiate",
        {
          orderId,
          paymentMethod,
          paymentDetails: {
            phoneNumber: paymentPhoneNumber,
          },
        }
      )

      if (payRes.success) {
        setPaymentStatusMessage("Awaiting Payment... Please check your phone for the USSD prompt.")
        pollPaymentStatus(orderId)
      } else {
        throw new Error(payRes.message || "Failed to initiate payment")
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred during checkout")
      setIsAwaitingPayment(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (cartItems.length === 0) return null

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-10">
      {/* Payment Loading Overlay */}
      {isAwaitingPayment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
          <Card className="max-w-md w-full mx-4 border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
            <div className="bg-primary p-8 text-white text-center space-y-4">
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">Confirming Payment</h2>
            </div>
            <CardContent className="p-8 text-center space-y-6">
              <p className="text-stone-600 font-medium leading-relaxed">
                {paymentStatusMessage}
              </p>
              <div className="flex flex-col gap-3">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-left">
                    Encrypted secure transaction protocol active
                  </span>
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Do not refresh this page
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-[10px]">
                <ShieldCheck className="h-4 w-4" />
                <span>Secure Checkout</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-stone-900 leading-none">
                Complete <span className="text-primary">Order.</span>
              </h1>
              <p className="text-stone-600 text-base font-medium max-w-xl">
                Complete your purchase securely below.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-1 p-4 bg-white rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Total Amount</p>
              <p className="text-2xl font-black text-primary tracking-tight">TZS {total.toLocaleString()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 space-y-12">

              {/* Shipping Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">1</div>
                  <h2 className="text-xl font-bold tracking-tight text-stone-900">Enter Location</h2>
                </div>

                <Card className="border-none shadow-xl shadow-stone-200/40 rounded-3xl bg-white group hover:shadow-2xl transition-all duration-300">
                  <CardContent className="p-6 md:p-8 space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wide text-stone-600 ml-1">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
                          placeholder="Enter name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wide text-stone-600 ml-1">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
                          placeholder="+255..."
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-stone-50">
                      <TanzaniaAddressForm
                        value={addressData}
                        onChange={setAddressData}
                        onAddressComplete={handleAddressComplete}
                        userId={user.id}
                      />
                    </div>

                    {isCalculatingDelivery && (
                      <div className="flex items-center gap-3 p-4 bg-stone-900 rounded-xl text-white/90">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="font-medium text-sm">Calculating delivery fee...</span>
                      </div>
                    )}

                    {deliveryError && (
                      <div className="flex items-center gap-3 p-6 bg-destructive/5 rounded-[2rem] text-destructive border border-destructive/20">
                        <Info className="h-5 w-5" />
                        <span className="font-bold text-sm">{deliveryError}</span>
                      </div>
                    )}

                    {deliveryInfo && (
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Distance</p>
                          <p className="text-sm font-black text-stone-900">{deliveryInfo.distanceKm} KM</p>
                        </div>
                        <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Time</p>
                          <p className="text-sm font-black text-stone-900">{deliveryInfo.duration || "Fast"}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Fee</p>
                          <p className="text-sm font-black text-primary">TZS {deliveryInfo.deliveryFee.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Transport Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                  <h2 className="text-xl font-bold tracking-tight text-stone-900">Delivery Method</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {transportMethods.map((method) => {
                    const isActive = selectedTransportId === method.id
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedTransportId(method.id)}
                        className={cn(
                          "relative group cursor-pointer transition-all duration-300 rounded-3xl p-5 border-2 flex flex-col gap-4",
                          isActive
                            ? "bg-white border-primary shadow-lg -translate-y-1"
                            : "bg-white border-transparent hover:border-stone-200"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300",
                            isActive ? "bg-primary text-white" : "bg-stone-50 text-stone-400"
                          )}>
                            <Truck className="h-5 w-5" />
                          </div>
                          {isActive && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold tracking-tight text-stone-900">{method.name}</h3>
                          <p className="text-stone-600 text-xs font-medium line-clamp-2 leading-relaxed">{method.description}</p>
                        </div>
                        <div className="mt-auto pt-2 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Rate</span>
                          <span className="text-base font-black text-primary tracking-tight">
                            {method.rate_per_km
                              ? `TZS ${method.rate_per_km.toLocaleString()}/KM`
                              : `TZS ${method.rate_per_kg?.toLocaleString()}/KG`}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Payment Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
                  <h2 className="text-xl font-bold tracking-tight text-stone-900">Choose Payment</h2>
                </div>

                <Card className="border-none shadow-xl shadow-stone-200/40 rounded-3xl overflow-hidden bg-white">
                  <CardContent className="p-6 md:p-8">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <Accordion type="single" collapsible defaultValue="mobile-money" className="w-full space-y-2">
                        <AccordionItem value="mobile-money" className="border-none">
                          <AccordionTrigger className="hover:no-underline p-4 bg-stone-50 rounded-2xl group data-[state=open]:bg-stone-900 data-[state=open]:text-white transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <Smartphone className="h-5 w-5" />
                              <span className="text-lg font-bold tracking-tight">Mobile Money</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-4 mt-2 space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="paymentPhone" className="text-xs font-bold uppercase tracking-wide text-stone-500 ml-1">Phone Number</Label>
                              <Input
                                id="paymentPhone"
                                type="tel"
                                value={paymentPhoneNumber}
                                onChange={(e) => setPaymentPhoneNumber(e.target.value)}
                                className="h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
                                placeholder="e.g. 2557..."
                              />
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                              {[
                                { id: "airtel-money", name: "Airtel Money", provider: "Airtel" },
                                { id: "mixx-by-yas", name: "Mixx by Yas", provider: "Tigo Pesa" },
                                { id: "halopesa", name: "HaloPesa", provider: "Halotel" },
                                { id: "ezypesa", name: "EzyPesa", provider: "Zantel" },
                                { id: "m-pesa", name: "M-Pesa", provider: "Vodacom", maintenance: true },
                              ].map((p) => (
                                <Label
                                  key={p.id}
                                  htmlFor={p.id}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300",
                                    paymentMethod === p.id ? "bg-primary/5 border-primary shadow-sm" : "border-stone-100 hover:border-stone-300",
                                    p.maintenance && "opacity-60 grayscale-[0.5]"
                                  )}
                                >
                                  <RadioGroupItem value={p.id} id={p.id} className="sr-only" />
                                  <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                    paymentMethod === p.id ? "bg-primary text-white" : "bg-stone-100 text-stone-500"
                                  )}>
                                    <Smartphone className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                      <p className="font-bold text-stone-900 text-sm">{p.name}</p>
                                      {p.maintenance && (
                                        <span className="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-black uppercase">Service Down</span>
                                      )}
                                    </div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{p.provider}</p>
                                  </div>
                                </Label>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="cards" className="border-none">
                          <AccordionTrigger className="hover:no-underline p-4 bg-stone-50 rounded-2xl group data-[state=open]:bg-stone-900 data-[state=open]:text-white transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-5 w-5" />
                              <span className="text-lg font-bold tracking-tight">Card Payment</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-6 mt-4 space-y-6">
                            <div className="grid grid-cols-3 gap-2">
                              {["visa", "mastercard", "unionpay"].map((c) => (
                                <Label key={c} htmlFor={c} className={cn(
                                  "flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center",
                                  paymentMethod === c ? "bg-primary/5 border-primary shadow-sm" : "border-stone-100 hover:border-stone-300"
                                )}>
                                  <RadioGroupItem value={c} id={c} className="sr-only" />
                                  <div className={cn(
                                    "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                                    paymentMethod === c ? "bg-primary text-white" : "bg-stone-100 text-stone-500"
                                  )}>
                                    <CreditCard className="h-5 w-5" />
                                  </div>
                                  <span className="font-bold uppercase tracking-wide text-[10px] text-stone-900">{c}</span>
                                </Label>
                              ))}
                            </div>
                            <div className="space-y-3 pt-3 border-t border-stone-100">
                              <div className="space-y-2">
                                <Label htmlFor="cardNumber" className="text-xs font-bold uppercase tracking-wide text-stone-500 ml-1">Card Number</Label>
                                <Input
                                  id="cardNumber"
                                  value={cardDetails.number}
                                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                  className="h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
                                  placeholder="0000 0000 0000 0000"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor="expiry" className="text-xs font-bold uppercase tracking-wide text-stone-500 ml-1">Expiry</Label>
                                  <Input
                                    id="expiry"
                                    value={cardDetails.expiry}
                                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                    className="h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
                                    placeholder="MM/YY"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="cvv" className="text-xs font-bold uppercase tracking-wide text-stone-500 ml-1">CVV / CVC</Label>
                                  <Input
                                    id="cvv"
                                    value={cardDetails.cvv}
                                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                                    className="h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
                                    placeholder="123"
                                  />
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="bank" className="border-none">
                          <AccordionTrigger className="hover:no-underline p-4 bg-stone-50 rounded-2xl group data-[state=open]:bg-stone-900 data-[state=open]:text-white transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <Building2 className="h-5 w-5" />
                              <span className="text-lg font-bold tracking-tight">Bank Transfer</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-6 space-y-3 mt-4">
                            {["crdb-simbanking", "crdb-internet-banking", "crdb-wakala", "crdb-branch-otc"].map((b) => (
                              <Label key={b} htmlFor={b} className={cn(
                                "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                                paymentMethod === b ? "bg-primary/5 border-primary shadow-lg" : "border-stone-100 hover:border-stone-300"
                              )}>
                                <RadioGroupItem value={b} id={b} className="sr-only" />
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                  paymentMethod === b ? "bg-primary text-white" : "bg-stone-50 text-stone-400"
                                )}>
                                  <Building2 className="h-5 w-5" />
                                </div>
                                <span className="font-black text-stone-900 capitalize">{b.replace(/-/g, ' ')}</span>
                              </Label>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Sidebar / Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
              <Card className="border-none shadow-xl shadow-stone-200/50 rounded-3xl overflow-hidden bg-white">
                <div className="bg-stone-900 p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                  <h3 className="text-xl font-black tracking-tight relative z-10">Order Summary</h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mt-0.5 relative z-10">Your items</p>
                </div>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-6 max-h-[300px] overflow-y-auto scrollbar-hide pr-2">
                    {cartItems.map((item) => (
                      <div key={item.product_id} className="flex gap-4">
                        <div className="h-16 w-16 rounded-xl bg-stone-50 overflow-hidden border border-stone-100 flex-shrink-0 animate-in fade-in zoom-in duration-500">
                          {item.product.images?.[0] ? (
                            <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="h-6 w-6 text-stone-200" /></div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <p className="font-black text-stone-900 leading-tight truncate">{item.product.name}</p>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-stone-400 font-bold">Qty: {item.quantity}</span>
                            <span className="text-stone-900 font-black">{(item.product.price * item.quantity).toLocaleString()} TZS</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-stone-100 space-y-2">
                    <div className="flex justify-between items-center group">
                      <span className="text-stone-500 text-sm font-bold flex items-center gap-2">
                        Subtotal
                      </span>
                      <span className="text-stone-900 font-bold tracking-tight">{subtotal.toLocaleString()} TZS</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-stone-500 text-sm font-bold flex items-center gap-2">
                        Delivery
                      </span>
                      <span className={cn(
                        "font-bold tracking-tight",
                        deliveryInfo ? "text-stone-900" : "text-primary italic animate-pulse"
                      )}>
                        {deliveryInfo ? `${deliveryFee.toLocaleString()} TZS` : "Awaiting Address"}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-stone-100 flex justify-between items-end">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Total Amount</p>
                        <p className="text-2xl font-black text-stone-900 tracking-tight">
                          {total.toLocaleString()} <span className="text-[10px] uppercase">TZS</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-stone-900 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group"
                    disabled={isLoading || !deliveryInfo || isCalculatingDelivery || paymentMethod === "m-pesa"}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        {paymentMethod === "m-pesa" ? "Service Unavailable" : "Complete Order"}
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-4 pt-2">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-green-600" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Protected</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-stone-300" />
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-primary" />
                      <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Secure</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {error && (
                <div className="p-6 bg-destructive/10 border-2 border-destructive/20 rounded-[2.5rem] text-destructive text-center space-y-2 animate-in slide-in-from-top-4 duration-500">
                  <p className="text-xs font-black uppercase tracking-widest">Protocol Error</p>
                  <p className="font-bold">{error}</p>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
