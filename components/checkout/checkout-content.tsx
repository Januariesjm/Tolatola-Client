"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Smartphone, Truck, MapPin, Loader2, CheckCircle2, CreditCard, Banknote, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
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
  const [paymentMethod, setPaymentMethod] = useState<
    | "m-pesa"
    | "airtel-money"
    | "halopesa"
    | "mixx-by-yas"
    | "ezypesa"
    | "crdb-simbanking"
    | "crdb-internet-banking"
    | "crdb-wakala"
    | "crdb-branch-otc"
    | "visa"
    | "mastercard"
    | "unionpay"
    | "cash-on-delivery"
  >("m-pesa")
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
        // Auto-select first method as default
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
      console.log("[v0] Calculating delivery for:", {
        region: addressData.region,
        district: addressData.district,
        ward: addressData.ward,
      })

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
        console.log("[v0] Delivery calculated:", result)
      } else {
        setDeliveryError("Could not calculate delivery fee for this address. Please try a more specific address.")
        setDeliveryInfo(null)
      }
    } catch (error) {
      console.error("[v0] Delivery calculation error:", error)
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
      console.log("[v0] Starting checkout process via API...")

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

      console.log("[v0] Checkout completed successfully!")

      localStorage.removeItem("cart")
      window.dispatchEvent(new Event("cartUpdated"))

      router.push(`/payment/${orderId}`)
    } catch (error: unknown) {
      console.error("[v0] Checkout error:", error)
      setError(error instanceof Error ? error.message : "An error occurred during checkout")
    } finally {
      setIsLoading(false)
    }
  }

  if (cartItems.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground">Complete your order</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                  <CardDescription>Where should we deliver your order?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </div>
                  </div>

                  <TanzaniaAddressForm
                    value={addressData}
                    onChange={setAddressData}
                    onAddressComplete={handleAddressComplete}
                    userId={user.id}
                  />

                  {isCalculatingDelivery && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Calculating delivery fee from your location...
                    </div>
                  )}

                  {deliveryError && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      <MapPin className="h-4 w-4" />
                      {deliveryError}
                    </div>
                  )}

                  {deliveryInfo && (
                    <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-green-900">
                        <CheckCircle2 className="h-5 w-5" />
                        Delivery Fee Calculated
                      </div>
                      <div className="text-sm text-green-800 space-y-1">
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Distance: <strong>{deliveryInfo.distanceKm} km</strong> from Dar es Salaam
                        </p>
                        {deliveryInfo.duration && (
                          <p className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Estimated delivery: <strong>{deliveryInfo.duration}</strong>
                          </p>
                        )}
                        <p className="text-base font-bold text-green-900 mt-2">
                          Delivery fee: TZS {deliveryInfo.deliveryFee.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Transport Method *
                  </CardTitle>
                  <CardDescription>
                    Choose how your order will be delivered based on distance and weight
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {transportMethods.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading transport options...
                    </div>
                  ) : (
                    <>
                      <RadioGroup value={selectedTransportId} onValueChange={setSelectedTransportId}>
                        {transportMethods.map((method) => (
                          <div
                            key={method.id}
                            className="flex items-start space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50"
                          >
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label htmlFor={method.id} className="cursor-pointer flex-1 space-y-1">
                              <div className="font-medium">{method.name}</div>
                              <div className="text-sm text-muted-foreground">{method.description}</div>
                              <div className="text-xs font-semibold text-primary">
                                {method.rate_per_km
                                  ? `TZS ${method.rate_per_km.toLocaleString()}/km`
                                  : `TZS ${method.rate_per_kg?.toLocaleString()}/kg`}
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      {deliveryInfo && (
                        <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
                          <p className="font-medium">Delivery Details:</p>
                          <p className="text-muted-foreground">
                            Distance: <span className="font-medium text-foreground">{deliveryInfo.distanceKm} km</span>
                          </p>
                          <p className="text-muted-foreground">
                            Package Weight:{" "}
                            <span className="font-medium text-foreground">
                              {cartItems.reduce((sum, item) => sum + (item.product.weight || 1) * item.quantity, 0)} kg
                            </span>
                          </p>
                          {deliveryInfo.transportMethod && (
                            <p className="text-muted-foreground">
                              Selected:{" "}
                              <span className="font-medium text-foreground">{deliveryInfo.transportMethod}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment Method</CardTitle>
                  <CardDescription>Select your preferred payment method</CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                    {/* Mobile Money Options */}
                    <div className="space-y-3 mb-4">
                      <Label className="text-sm font-semibold">Mobile Money</Label>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="m-pesa" id="m-pesa" />
                        <Label htmlFor="m-pesa" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5" />
                          <div>
                            <p className="font-medium">M-Pesa</p>
                            <p className="text-sm text-muted-foreground">Pay with Vodacom M-Pesa</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="airtel-money" id="airtel-money" />
                        <Label htmlFor="airtel-money" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Airtel Money</p>
                            <p className="text-sm text-muted-foreground">Pay with Airtel Money</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="mixx-by-yas" id="mixx-by-yas" />
                        <Label htmlFor="mixx-by-yas" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Mixx by Yas</p>
                            <p className="text-sm text-muted-foreground">Pay with Mixx by Yas (Tigo Pesa)</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="halopesa" id="halopesa" />
                        <Label htmlFor="halopesa" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5" />
                          <div>
                            <p className="font-medium">HaloPesa</p>
                            <p className="text-sm text-muted-foreground">Pay with HaloPesa</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="ezypesa" id="ezypesa" />
                        <Label htmlFor="ezypesa" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Smartphone className="h-5 w-5" />
                          <div>
                            <p className="font-medium">EzyPesa</p>
                            <p className="text-sm text-muted-foreground">Pay with EzyPesa</p>
                          </div>
                        </Label>
                      </div>
                    </div>

                    {/* Card Payment Options */}
                    <div className="space-y-3 mb-4">
                      <Label className="text-sm font-semibold">Card Payments</Label>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="visa" id="visa" />
                        <Label htmlFor="visa" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Visa</p>
                            <p className="text-sm text-muted-foreground">Pay with Visa card</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="mastercard" id="mastercard" />
                        <Label htmlFor="mastercard" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Mastercard</p>
                            <p className="text-sm text-muted-foreground">Pay with Mastercard</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="unionpay" id="unionpay" />
                        <Label htmlFor="unionpay" className="flex items-center gap-3 cursor-pointer flex-1">
                          <CreditCard className="h-5 w-5" />
                          <div>
                            <p className="font-medium">UnionPay</p>
                            <p className="text-sm text-muted-foreground">Pay with UnionPay card</p>
                          </div>
                        </Label>
                      </div>
                    </div>

                    {/* Bank Payment Options */}
                    <div className="space-y-3 mb-4">
                      <Label className="text-sm font-semibold">Bank Payments</Label>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="crdb-simbanking" id="crdb-simbanking" />
                        <Label htmlFor="crdb-simbanking" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Building2 className="h-5 w-5" />
                          <div>
                            <p className="font-medium">CRDB SimBanking</p>
                            <p className="text-sm text-muted-foreground">Pay via CRDB SimBanking</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="crdb-internet-banking" id="crdb-internet-banking" />
                        <Label
                          htmlFor="crdb-internet-banking"
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <Building2 className="h-5 w-5" />
                          <div>
                            <p className="font-medium">CRDB Internet Banking</p>
                            <p className="text-sm text-muted-foreground">Pay via CRDB Internet Banking</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="crdb-wakala" id="crdb-wakala" />
                        <Label htmlFor="crdb-wakala" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Building2 className="h-5 w-5" />
                          <div>
                            <p className="font-medium">CRDB Wakala</p>
                            <p className="text-sm text-muted-foreground">Pay at CRDB Wakala agent</p>
                          </div>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="crdb-branch-otc" id="crdb-branch-otc" />
                        <Label htmlFor="crdb-branch-otc" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Building2 className="h-5 w-5" />
                          <div>
                            <p className="font-medium">CRDB Branch OTC</p>
                            <p className="text-sm text-muted-foreground">Pay at CRDB branch counter</p>
                          </div>
                        </Label>
                      </div>
                    </div>

                    {/* Cash on Delivery */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Other Options</Label>

                      <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <RadioGroupItem value="cash-on-delivery" id="cash-on-delivery" />
                        <Label htmlFor="cash-on-delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                          <Banknote className="h-5 w-5" />
                          <div>
                            <p className="font-medium">Cash on Delivery</p>
                            <p className="text-sm text-muted-foreground">Pay with cash when you receive your order</p>
                          </div>
                        </Label>
                      </div>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              {error && (
                <Card className="border-destructive">
                  <CardContent className="pt-6">
                    <p className="text-sm text-destructive">{error}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.product_id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.product.name} x {item.quantity}
                        </span>
                        <span>TZS {(item.product.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>TZS {subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Truck className="h-4 w-4" />
                        Delivery Fee
                      </span>
                      <span>
                        {deliveryInfo ? (
                          `TZS ${deliveryFee.toLocaleString()}`
                        ) : isCalculatingDelivery ? (
                          <span className="flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Calculating...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Enter address</span>
                        )}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>TZS {total.toLocaleString()}</span>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading || !deliveryInfo || isCalculatingDelivery}
                  >
                    {isLoading ? "Processing..." : "Place Order"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    By placing your order, you agree to our terms and conditions
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
