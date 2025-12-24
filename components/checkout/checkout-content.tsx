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
import { calculateDeliveryDistance } from "@/app/actions/maps"
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

  const handleAddressComplete = async (address: string) => {
    setFullAddress(address)
    setDeliveryError(null)

    if (!addressData.region) {
      setDeliveryInfo(null)
      return
    }

    setIsCalculatingDelivery(true)

    try {
      const result = await calculateDeliveryDistance(
        addressData.region,
        addressData.district || undefined,
        addressData.ward || undefined,
      )

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
        setDeliveryError("Could not calculate delivery fee for this address. Please try a more specific address.")
        setDeliveryInfo(null)
      }
    } catch (error) {
      setDeliveryError("Failed to calculate delivery fee. Please try again.")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

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
        transportMethodId: deliveryInfo?.transportMethodId || selectedTransportId || null,
        deliveryFee,
      }

      const orderRes = await clientApiPost<{ order: any; success?: boolean }>("orders", orderPayload)
      const orderId = (orderRes as any)?.order?.id || (orderRes as any)?.id

      if (!orderId) {
        throw new Error("Order ID not returned from API")
      }

      localStorage.removeItem("cart")
      window.dispatchEvent(new Event("cartUpdated"))

      router.push(`/payment/${orderId}`)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred during checkout")
    } finally {
      setIsLoading(false)
    }
  }

  if (cartItems.length === 0) return null

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20">
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.2em] text-[10px]">
                <ShieldCheck className="h-4 w-4" />
                <span>Secure Checkout Environment</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-stone-900 leading-none">
                Finalize <span className="text-primary italic">Investment.</span>
              </h1>
              <p className="text-stone-500 text-lg md:text-xl font-medium italic max-w-xl">
                You're just a few moments away from securing your selected items with Tola's escrow protection.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-end gap-2 p-6 bg-white rounded-[2rem] shadow-2xl shadow-stone-200/50 border border-stone-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Calculation</p>
              <p className="text-4xl font-black text-primary tracking-tighter">TZS {total.toLocaleString()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8 space-y-12">

              {/* Shipping Section */}
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-stone-950 text-white flex items-center justify-center font-black text-xl shadow-xl">1</div>
                  <h2 className="text-3xl font-black tracking-tight text-stone-900">Shipping Destination</h2>
                </div>

                <Card className="border-none shadow-2xl shadow-stone-200/40 rounded-[3rem] overflow-hidden bg-white group transition-all duration-500">
                  <CardContent className="p-10 space-y-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="fullName" className="text-xs font-black uppercase tracking-widest text-stone-400 ml-1">Full Name *</Label>
                        <Input
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          required
                          className="h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white focus:ring-primary/20 transition-all font-medium text-lg px-6"
                          placeholder="Enter recipient's full name"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="phone" className="text-xs font-black uppercase tracking-widest text-stone-400 ml-1">Phone Number *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="h-14 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white focus:ring-primary/20 transition-all font-medium text-lg px-6"
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
                      <div className="flex items-center gap-3 p-6 bg-stone-900 rounded-[2rem] text-white/80 animate-pulse">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="font-bold text-sm tracking-tight text-white">Engine is optimizing logistics routes...</span>
                      </div>
                    )}

                    {deliveryError && (
                      <div className="flex items-center gap-3 p-6 bg-destructive/5 rounded-[2rem] text-destructive border border-destructive/20">
                        <Info className="h-5 w-5" />
                        <span className="font-bold text-sm">{deliveryError}</span>
                      </div>
                    )}

                    {deliveryInfo && (
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Total Distance</p>
                          <p className="text-xl font-black text-stone-900">{deliveryInfo.distanceKm} KM</p>
                        </div>
                        <div className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Estimated Speed</p>
                          <p className="text-xl font-black text-stone-900">{deliveryInfo.duration || "Prompt Delivery"}</p>
                        </div>
                        <div className="p-6 bg-primary/10 rounded-[2rem] border border-primary/20 space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Logistics Fee</p>
                          <p className="text-xl font-black text-primary">TZS {deliveryInfo.deliveryFee.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Transport Section */}
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-stone-950 text-white flex items-center justify-center font-black text-xl shadow-xl">2</div>
                  <h2 className="text-3xl font-black tracking-tight text-stone-900">Logistics Partner</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {transportMethods.map((method) => {
                    const isActive = selectedTransportId === method.id
                    return (
                      <div
                        key={method.id}
                        onClick={() => setSelectedTransportId(method.id)}
                        className={cn(
                          "relative group cursor-pointer transition-all duration-500 rounded-[2.5rem] p-8 border-2 flex flex-col gap-6",
                          isActive
                            ? "bg-white border-primary shadow-2xl shadow-primary/10 -translate-y-2"
                            : "bg-stone-50/50 border-transparent hover:border-stone-200 hover:bg-white"
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className={cn(
                            "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-500",
                            isActive ? "bg-primary text-white rotate-6" : "bg-white text-stone-400 shadow-sm"
                          )}>
                            <Truck className="h-7 w-7" />
                          </div>
                          {isActive && <CheckCircle2 className="h-6 w-6 text-primary" />}
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black tracking-tight text-stone-900">{method.name}</h3>
                          <p className="text-stone-500 text-sm font-medium line-clamp-2 leading-relaxed italic">{method.description}</p>
                        </div>
                        <div className="mt-auto pt-4 flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-widest text-stone-400">Vivid Logistics Rate</span>
                          <span className="text-lg font-black text-primary tracking-tight">
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
              <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-stone-950 text-white flex items-center justify-center font-black text-xl shadow-xl">3</div>
                  <h2 className="text-3xl font-black tracking-tight text-stone-900">Secure Payment Channel</h2>
                </div>

                <Card className="border-none shadow-2xl shadow-stone-200/40 rounded-[3rem] overflow-hidden bg-white">
                  <CardContent className="p-10">
                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                      <Accordion type="single" collapsible defaultValue="mobile-money" className="w-full space-y-4">
                        <AccordionItem value="mobile-money" className="border-none">
                          <AccordionTrigger className="hover:no-underline p-6 bg-stone-50 rounded-[2rem] group data-[state=open]:bg-stone-900 data-[state=open]:text-white transition-all duration-500">
                            <div className="flex items-center gap-4">
                              <Smartphone className="h-6 w-6" />
                              <span className="text-xl font-black tracking-tight">Mobile Money Escrow</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-6 grid md:grid-cols-2 gap-4 mt-4">
                            {[
                              { id: "m-pesa", name: "M-Pesa", provider: "Vodacom" },
                              { id: "airtel-money", name: "Airtel Money", provider: "Airtel" },
                              { id: "mixx-by-yas", name: "Mixx by Yas", provider: "Tigo Pesa" },
                              { id: "halopesa", name: "HaloPesa", provider: "Halotel" },
                              { id: "ezypesa", name: "EzyPesa", provider: "Zantel" }
                            ].map((p) => (
                              <Label
                                key={p.id}
                                htmlFor={p.id}
                                className={cn(
                                  "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                                  paymentMethod === p.id ? "bg-primary/5 border-primary shadow-lg" : "border-stone-100 hover:border-stone-300"
                                )}
                              >
                                <RadioGroupItem value={p.id} id={p.id} className="sr-only" />
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                                  paymentMethod === p.id ? "bg-primary text-white" : "bg-stone-50 text-stone-400"
                                )}>
                                  <Smartphone className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-black text-stone-900">{p.name}</p>
                                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">{p.provider}</p>
                                </div>
                              </Label>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="cards" className="border-none">
                          <AccordionTrigger className="hover:no-underline p-6 bg-stone-50 rounded-[2rem] group data-[state=open]:bg-stone-900 data-[state=open]:text-white transition-all duration-500">
                            <div className="flex items-center gap-4">
                              <CreditCard className="h-6 w-6" />
                              <span className="text-xl font-black tracking-tight">Global Debit/Credit</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="p-6 grid md:grid-cols-3 gap-4 mt-4">
                            {["visa", "mastercard", "unionpay"].map((c) => (
                              <Label key={c} htmlFor={c} className={cn(
                                "flex flex-col items-center gap-4 p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 text-center",
                                paymentMethod === c ? "bg-primary/5 border-primary shadow-lg" : "border-stone-100 hover:border-stone-300"
                              )}>
                                <RadioGroupItem value={c} id={c} className="sr-only" />
                                <div className={cn(
                                  "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
                                  paymentMethod === c ? "bg-primary text-white" : "bg-stone-50 text-stone-400"
                                )}>
                                  <CreditCard className="h-6 w-6" />
                                </div>
                                <span className="font-black uppercase tracking-widest text-xs text-stone-900">{c}</span>
                              </Label>
                            ))}
                          </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="bank" className="border-none">
                          <AccordionTrigger className="hover:no-underline p-6 bg-stone-50 rounded-[2rem] group data-[state=open]:bg-stone-900 data-[state=open]:text-white transition-all duration-500">
                            <div className="flex items-center gap-4">
                              <Building2 className="h-6 w-6" />
                              <span className="text-xl font-black tracking-tight">Direct Bank Infrastructure</span>
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
            <div className="lg:col-span-4 lg:sticky lg:top-32 space-y-8">
              <Card className="border-none shadow-2xl shadow-stone-200/50 rounded-[3rem] overflow-hidden bg-white">
                <div className="bg-stone-950 p-10 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <h3 className="text-2xl font-black tracking-tight relative z-10">Order Architecture</h3>
                  <p className="text-white/40 text-xs font-black uppercase tracking-widest mt-1 relative z-10">Summary of selections</p>
                </div>
                <CardContent className="p-10 space-y-8">
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

                  <div className="pt-8 border-t border-stone-100 space-y-4">
                    <div className="flex justify-between items-center group">
                      <span className="text-stone-400 text-sm font-bold flex items-center gap-2">
                        <Wallet className="h-4 w-4" /> Subtotal
                      </span>
                      <span className="text-stone-900 font-black tracking-tight">{subtotal.toLocaleString()} TZS</span>
                    </div>
                    <div className="flex justify-between items-center group">
                      <span className="text-stone-400 text-sm font-bold flex items-center gap-2">
                        <Truck className="h-4 w-4" /> Logistics
                      </span>
                      <span className={cn(
                        "font-black tracking-tight",
                        deliveryInfo ? "text-stone-900" : "text-primary italic animate-pulse"
                      )}>
                        {deliveryInfo ? `${deliveryFee.toLocaleString()} TZS` : "Awaiting Address"}
                      </span>
                    </div>
                    <div className="pt-6 border-t border-stone-100 flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Final Investment</p>
                        <p className="text-3xl font-black text-stone-950 tracking-tighter">
                          {total.toLocaleString()} <span className="text-xs uppercase">TZS</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-20 rounded-[2.5rem] bg-primary hover:bg-stone-900 text-white font-black text-xl shadow-2xl shadow-primary/20 transition-all active:scale-[0.97] group"
                    disabled={isLoading || !deliveryInfo || isCalculatingDelivery}
                  >
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-3">
                        Deploy Final Order
                        <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center justify-center gap-4 pt-4">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3 text-green-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Escrow Protect</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-stone-200" />
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Secure Node</span>
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
