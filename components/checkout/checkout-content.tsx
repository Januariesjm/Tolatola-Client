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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  const [paymentMethod, setPaymentMethod] = useState<string>("airtel-money")
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState(user?.phone || "")
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
  })
  const [transportMethods, setTransportMethods] = useState<TransportMethod[]>([])
  const [selectedTransportId, setSelectedTransportId] = useState<string>("")
  const [shopDeliveries, setShopDeliveries] = useState<Record<string, {
    distanceKm: number
    deliveryFee: number
    duration?: string
    transportMethod?: string
    transportMethodId?: string
    shopName: string
    shopLat: number
    shopLng: number
  }>>({})
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

    if (!coordinates) return

    setIsCalculatingDelivery(true)
    const newShopDeliveries: Record<string, any> = {}

    try {
      // Group items and weight by shop
      const shopsData: Record<string, { weight: number; lat: number; lng: number; name: string }> = {}

      cartItems.forEach((item) => {
        const sId = item.product.shop_id
        if (!shopsData[sId]) {
          const shop = item.product.shops
          shopsData[sId] = {
            weight: 0,
            lat: shop?.latitude || -6.7924, // Default to Dar if missing
            lng: shop?.longitude || 39.2083,
            name: shop?.name || "Unknown Shop",
            deliveryAvailable: true, // Start with true
          }
        }
        shopsData[sId].weight += (item.product.weight || 1) * item.quantity

        // If any product in this shop's cart items doesn't allow delivery, the whole shop portion is pickup only
        if (item.product.delivery_available === false) {
          shopsData[sId].deliveryAvailable = false
        }
      })

      const calculateFee = (method: TransportMethod | undefined, distanceKm: number, weightKg: number, isAvailable: boolean) => {
        if (!isAvailable) return 0
        if (distanceKm < 0.1) return 0

        const rateKm = Number(method?.rate_per_km) || 0
        const rateKg = Number(method?.rate_per_kg) || 0

        let fee = 0
        if (rateKg > 0) {
          fee = weightKg * rateKg
        } else if (rateKm > 0) {
          fee = distanceKm * rateKm
        } else {
          // Fallback to a distance-based baseline only if no method rates are defined
          if (distanceKm <= 5) fee = 3000
          else if (distanceKm <= 15) fee = 5000
          else fee = distanceKm * 500
        }

        return Math.round(fee)
      }

      const method =
        transportMethods.find((m) => m.id === selectedTransportId || m.name === selectedTransportId) ||
        transportMethods[0]

      for (const sId in shopsData) {
        const shop = shopsData[sId]
        const result = await calculateDeliveryDistanceByCoords(
          coordinates.lat,
          coordinates.lng,
          shop.lat,
          shop.lng
        )

        if (result) {
          const fee = calculateFee(method, result.distanceKm, shop.weight, shop.deliveryAvailable)

          newShopDeliveries[sId] = {
            ...result,
            lat: coordinates.lat,
            lng: coordinates.lng,
            deliveryFee: fee,
            transportMethod: shop.deliveryAvailable ? method?.name : "Store Pickup",
            transportMethodId: shop.deliveryAvailable ? method?.id : null,
            shopName: shop.name,
            shopLat: shop.lat,
            shopLng: shop.lng,
            deliveryAvailable: shop.deliveryAvailable,
          }
        }
      }

      if (Object.keys(newShopDeliveries).length > 0) {
        setShopDeliveries(newShopDeliveries)
      } else {
        setDeliveryError("Logistics Engine could not determine routes to your location from the shops.")
      }
    } catch (error) {
      setDeliveryError("Logistics calculation failed. Please retry location selection.")
      setShopDeliveries({})
    } finally {
      setIsCalculatingDelivery(false)
    }
  }

  useEffect(() => {
    if (Object.keys(shopDeliveries).length > 0 && selectedTransportId && cartItems.length > 0) {
      const method =
        transportMethods.find((m) => m.id === selectedTransportId || m.name === selectedTransportId) ||
        transportMethods[0]

      const calculateFee = (method: TransportMethod | undefined, distanceKm: number, weightKg: number, isAvailable: boolean) => {
        if (!isAvailable) return 0
        if (distanceKm < 0.1) return 0

        const rateKm = Number(method?.rate_per_km) || 0
        const rateKg = Number(method?.rate_per_kg) || 0

        let fee = 0
        if (rateKg > 0) {
          fee = weightKg * rateKg
        } else if (rateKm > 0) {
          fee = distanceKm * rateKm
        } else {
          if (distanceKm <= 5) fee = 3000
          else if (distanceKm <= 15) fee = 5000
          else fee = distanceKm * 500
        }

        return Math.round(fee)
      }

      const updatedDeliveries = { ...shopDeliveries }
      const shopsWeight: Record<string, number> = {}

      cartItems.forEach((item) => {
        const sId = item.product.shop_id
        shopsWeight[sId] = (shopsWeight[sId] || 0) + (item.product.weight || 1) * item.quantity
      })

      for (const sId in updatedDeliveries) {
        const isDeliverable = updatedDeliveries[sId].deliveryAvailable !== false
        const fee = calculateFee(method, updatedDeliveries[sId].distanceKm, shopsWeight[sId] || 0, isDeliverable)

        updatedDeliveries[sId] = {
          ...updatedDeliveries[sId],
          deliveryFee: fee,
          transportMethod: isDeliverable ? method?.name : "Store Pickup",
          transportMethodId: isDeliverable ? method?.id : null,
        }
      }
      setShopDeliveries(updatedDeliveries)
    }
  }, [selectedTransportId, cartItems])

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const deliveryFee = Object.values(shopDeliveries).reduce((sum, d) => sum + d.deliveryFee, 0)
  const total = subtotal + deliveryFee

  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false)
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("")
  const [controlNumber, setControlNumber] = useState<string | null>(null)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)

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

    if (!fullName || fullName.trim() === "") {
      toast({
        title: "Name Required",
        description: "Please enter your full name",
        variant: "destructive",
      })
      return
    }

    if (!phone || phone.trim() === "") {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number",
        variant: "destructive",
      })
      return
    }

    if (!addressData.region || !addressData.district || !addressData.ward || !addressData.street) {
      toast({
        title: "Address Required",
        description: "Please search and select your location using the search box above",
        variant: "destructive",
      })
      return
    }

    if (Object.keys(shopDeliveries).length === 0) {
      toast({
        title: "Logistics Required",
        description: "Please select a delivery address using the autocomplete search to calculate shipping costs.",
        variant: "destructive",
      })
      return
    }

    if (!selectedTransportId) {
      toast({
        title: "Transport Method Required",
        description: "Please select a delivery method from the dropdown",
        variant: "destructive",
      })
      return
    }

    // Validate payment details based on payment method
    if (["airtel-money", "halopesa", "mixx-by-yas", "ezypesa"].includes(paymentMethod)) {
      if (!paymentPhoneNumber || paymentPhoneNumber.trim() === "") {
        toast({
          title: "Phone Number Required",
          description: "Please enter your phone number for mobile money payment",
          variant: "destructive",
        })
        return
      }
    }

    if (["visa", "mastercard", "unionpay"].includes(paymentMethod)) {
      if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
        toast({
          title: "Card Details Required",
          description: "Please enter your complete card details",
          variant: "destructive",
        })
        return
      }
    }

    setIsLoading(true)
    setError(null)

    try {
      const shopAssignedFee: Record<string, boolean> = {}

      const items = cartItems.map((item) => {
        const sId = item.product.shop_id
        const dInfo = shopDeliveries[sId]

        // Only assign the fee to the first item from this shop to avoid double counting in totals
        const feeToAssign = !shopAssignedFee[sId] ? (dInfo?.deliveryFee || 0) : 0
        shopAssignedFee[sId] = true

        return {
          product_id: item.product_id || item.product?.id,
          quantity: item.quantity,
          price: item.product.price,
          shop_id: sId,
          delivery_fee: feeToAssign,
          delivery_distance_km: dInfo?.distanceKm || 0,
          pickup_latitude: dInfo?.shopLat,
          pickup_longitude: dInfo?.shopLng,
        }
      })

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
          latitude: Object.values(shopDeliveries)[0]?.lat, // Customer delivery coordinates
          longitude: Object.values(shopDeliveries)[0]?.lng,
          delivery_distance_km: deliveryFee > 0 ? Object.values(shopDeliveries).reduce((sum, d) => sum + d.distanceKm, 0) : 0,
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
        transportMethodId: Object.values(shopDeliveries)[0]?.transportMethodId || selectedTransportId || null,
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
      setCurrentOrderId(orderId)

      const payRes = await clientApiPost<{ success: boolean; message: string; transactionId?: string; controlNumber?: string }>(
        "payments/clickpesa/initiate",
        {
          orderId,
          paymentMethod,
          paymentDetails: {
            phoneNumber: paymentPhoneNumber,
            cardNumber: cardDetails.number,
            expiryDate: cardDetails.expiry,
            cvv: cardDetails.cvv,
          },
        }
      )

      if (payRes.success) {
        if (["visa", "mastercard", "unionpay"].includes(paymentMethod)) {
          setPaymentStatusMessage("Authorizing your card transaction... This may take a moment.")
        } else if (["crdb-simbanking", "crdb-internet-banking", "crdb-wakala", "crdb-branch-otc"].includes(paymentMethod)) {
          setControlNumber(payRes.controlNumber || null)
          setPaymentStatusMessage("Your Control Number has been generated. Use it to complete payment at your bank.")
        } else {
          setPaymentStatusMessage("Awaiting Payment... Please check your phone for the USSD prompt.")
        }
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
          <Card className="max-w-md w-full mx-4 border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-primary p-8 text-white text-center space-y-4">
              <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
                {controlNumber ? (
                  <Building2 className="h-8 w-8 animate-bounce" />
                ) : (
                  <Loader2 className="h-8 w-8 animate-spin" />
                )}
              </div>
              <h2 className="text-2xl font-black tracking-tight">
                {controlNumber ? "Bank Settlement" : "Confirming Payment"}
              </h2>
            </div>
            <CardContent className="p-8 text-center space-y-6">
              <div className="space-y-2">
                <p className="text-stone-600 font-medium leading-relaxed">
                  {paymentStatusMessage}
                </p>
                {controlNumber && (
                  <div className="mt-4 p-6 bg-stone-50 rounded-2xl border-2 border-dashed border-primary/20 space-y-4">
                    {controlNumber.startsWith("http") ? (
                      <div className="space-y-4 text-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Payment Link</p>
                        <Button
                          size="lg"
                          className="w-full rounded-xl bg-primary text-white font-bold h-12 text-base shadow-lg shadow-primary/20 hover:bg-primary/90"
                          onClick={() => window.open(controlNumber, "_blank")}
                        >
                          Complete Payment Now
                        </Button>
                        <p className="text-[10px] text-stone-500 max-w-xs mx-auto">
                          Clicking this button will open a secure payment page in a new tab.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Control Number</p>
                          <p className="text-3xl font-black text-primary tracking-tight tabular-nums select-all">
                            {controlNumber}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-stone-200"
                          onClick={() => {
                            navigator.clipboard.writeText(controlNumber)
                            toast({ title: "Copied!", description: "Control number copied to clipboard." })
                          }}
                        >
                          Copy Number
                        </Button>
                        <div className="text-left space-y-2 bg-white p-4 rounded-xl border border-stone-100">
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Instructions</p>
                          <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                            <li>Dial *150*03# (CRDB SimBanking)</li>
                            <li>Select 'Bill Payment'</li>
                            <li>Enter this Control Number</li>
                            <li>Follow prompts to complete</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {controlNumber ? (
                  <Button
                    className="w-full h-12 rounded-xl bg-stone-900 text-white font-bold"
                    onClick={() => {
                      localStorage.removeItem("cart")
                      window.dispatchEvent(new Event("cartUpdated"))
                      router.push(`/payment/${currentOrderId}`)
                    }}
                  >
                    View Order Details
                  </Button>
                ) : (
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-left">
                      Encrypted secure transaction protocol active
                    </span>
                  </div>
                )}
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
                        userId={user?.id}
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

                    {Object.keys(shopDeliveries).length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
                          <MapPin className="h-3 w-3" />
                          <span>Delivery Logistics Breakdown</span>
                        </div>
                        {Object.entries(shopDeliveries).map(([shopId, info]) => (
                          <div key={shopId} className="p-6 bg-stone-50 rounded-[2rem] border border-stone-100 space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#2563EB]">From Shop</p>
                                <p className="text-sm font-black text-stone-900">{info.shopName}</p>
                              </div>
                              <div className="px-2 py-1 rounded-lg bg-white border border-stone-100 shadow-sm text-[10px] font-black text-stone-500 uppercase">
                                {info.transportMethod}
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div className="p-3 bg-white rounded-2xl border border-stone-50 space-y-1">
                                <p className="text-[8px] font-bold uppercase tracking-wide text-stone-400">Distance</p>
                                <p className="text-xs font-black text-stone-800">{info.distanceKm} KM</p>
                              </div>
                              <div className="p-3 bg-white rounded-2xl border border-stone-50 space-y-1">
                                <p className="text-[8px] font-bold uppercase tracking-wide text-stone-400">Status</p>
                                <p className={cn("text-xs font-black", info.deliveryAvailable !== false ? "text-stone-800" : "text-amber-600")}>
                                  {info.deliveryAvailable !== false ? (info.duration || "Fast") : "Pickup"}
                                </p>
                              </div>
                              <div className={cn("p-3 rounded-2xl border space-y-1", info.deliveryAvailable !== false ? "bg-[#2563EB]/5 border-[#2563EB]/10" : "bg-stone-100 border-stone-200")}>
                                <p className={cn("text-[8px] font-bold uppercase tracking-wide", info.deliveryAvailable !== false ? "text-[#2563EB]" : "text-stone-400")}>Fee</p>
                                <p className={cn("text-xs font-black", info.deliveryAvailable !== false ? "text-[#2563EB]" : "text-stone-500")}>
                                  {info.deliveryAvailable !== false ? `TZS ${info.deliveryFee.toLocaleString()}` : "FREE"}
                                </p>
                              </div>
                            </div>
                            {info.deliveryAvailable === false && (
                              <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100">
                                Info: One or more items from this merchant are "Store Pickup Only". Please visit the shop location after payment.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </section>

              {/* Transport Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="h-8 w-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
                  <h2 className="text-xl font-bold tracking-tight text-stone-900 ">Delivery Method</h2>
                </div>

                <div className="w-full">
                  <Select
                    value={selectedTransportId}
                    onValueChange={setSelectedTransportId}
                  >
                    <SelectTrigger className="w-full h-24 rounded-[2.5rem] border-2 border-stone-100 bg-white px-10 focus:ring-primary/20 transition-all hover:bg-stone-50 hover:border-[#22C55E]/30 shadow-sm hover:shadow-xl group relative">
                      <div className="flex items-center gap-8">
                        <div className="h-14 w-14 rounded-[1.25rem] bg-[#22C55E]/10 text-[#22C55E] flex items-center justify-center transition-all duration-300 group-hover:bg-[#22C55E] group-hover:text-white group-hover:scale-110 shadow-inner">
                          <Truck className="h-7 w-7" />
                        </div>
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-stone-400 group-hover:text-[#22C55E] transition-colors">Delivery Logistics</span>
                          <div className="flex items-center gap-2">
                            <SelectValue placeholder="Please select delivery method" className="font-black text-stone-900 text-xl" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-stone-50 flex items-center justify-center border border-stone-100 transition-all group-hover:bg-[#22C55E] group-hover:text-white group-hover:rotate-180 group-hover:shadow-lg">
                        <ChevronDown className="h-5 w-5" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-[2.5rem] border-stone-100 shadow-2xl p-4 bg-white/98 backdrop-blur-2xl mt-2">
                      {transportMethods.map((method) => (
                        <SelectItem
                          key={method.id}
                          value={method.id}
                          className="rounded-[1.5rem] py-5 px-8 focus:bg-[#22C55E]/5 cursor-pointer mb-3 last:mb-0 transition-all hover:pl-10"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between gap-10">
                              <span className="font-black text-stone-900 text-lg tracking-tight">{method.name}</span>
                              <div className="px-4 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/20">
                                <span className="text-[#22C55E] font-black text-xs">
                                  {method.rate_per_km
                                    ? `TZS ${method.rate_per_km.toLocaleString()}/KM`
                                    : `TZS ${method.rate_per_kg?.toLocaleString()}/KG`}
                                </span>
                              </div>
                            </div>
                            <span className="text-sm text-stone-500 font-bold leading-relaxed max-w-md">
                              {method.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                          <AccordionTrigger className="hover:no-underline p-4 bg-stone-50 rounded-2xl group data-[state=open]:bg-[#22C55E] data-[state=open]:text-white transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <Smartphone className="h-5 w-5" />
                              <span className="text-lg font-bold tracking-tight">TOLA Pay</span>
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
                <div className="bg-[#22C55E] p-6 text-white relative overflow-hidden">
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
                        (Object.keys(shopDeliveries).length > 0) ? "text-stone-900" : "text-primary italic animate-pulse"
                      )}>
                        {(Object.keys(shopDeliveries).length > 0) ? `${deliveryFee.toLocaleString()} TZS` : "Awaiting Address"}
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
                    disabled={isLoading || isCalculatingDelivery || paymentMethod === "m-pesa"}
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
