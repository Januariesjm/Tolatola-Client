"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Sparkles, Star, Zap, ShieldCheck, Building2, Loader2, Phone, CreditCard } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { clientApiGet, clientApiPost } from "@/lib/api-client"

interface VendorSubscriptionTabProps {
  vendorId: string
}

export function VendorSubscriptionTab({ vendorId }: VendorSubscriptionTabProps) {
  const router = useRouter()
  const [currentSubscription, setCurrentSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState("airtel-money")
  const [upgrading, setUpgrading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false)
  const [controlNumber, setControlNumber] = useState("")
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadSubscriptionData()
  }, [vendorId])

  const loadSubscriptionData = async () => {
    try {
      const vendorRes = await clientApiGet<{ vendor: any }>(`vendors/${vendorId}/subscription`)
      setCurrentSubscription(vendorRes.vendor?.current_subscription || null)

      const plansRes = await clientApiGet<{ plans: any[] }>("subscriptions/plans")
      setPlans(plansRes.plans || [])
    } catch (error) {
      console.error("Error loading subscription data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradeClick = (plan: any) => {
    setSelectedPlan(plan)
    setShowUpgradeDialog(true)
  }

  const handleUpgrade = async () => {
    if (!selectedPlan) return

    setUpgrading(true)
    setPaymentStatusMessage(
      paymentMethod === "crdb-simbanking"
        ? "Generating your bank control number..."
        : paymentMethod.includes("visa") || paymentMethod.includes("master")
          ? "Authorizing your card securely..."
          : "Sending payment request to your phone..."
    )
    setIsAwaitingPayment(true)

    try {
      const result = await clientApiPost<any>("subscriptions", {
        planId: selectedPlan.id,
        vendorId,
        paymentMethod,
        paymentDetails: {
          phoneNumber: ["m-pesa", "airtel-money", "halopesa", "mixx-by-yas", "ezypesa", "tigo-pesa"].includes(paymentMethod) ? phoneNumber : undefined,
          cardNumber: ["visa", "mastercard", "unionpay"].includes(paymentMethod) ? cardNumber : undefined,
          expiryDate: ["visa", "mastercard", "unionpay"].includes(paymentMethod) ? expiryDate : undefined,
          cvv: ["visa", "mastercard", "unionpay"].includes(paymentMethod) ? cvv : undefined,
        }
      })

      if (result.success) {
        if (result.controlNumber) {
          setControlNumber(result.controlNumber)
          setPaymentStatusMessage("Control number generated! Please complete the transfer to activate your subscription.")
        } else {
          setPaymentStatusMessage("Payment initiated! Please confirm on your device. Your subscription will activate automatically once confirmed.")

          // For mobile/card, we can auto-reload after a delay or poll
          setTimeout(() => {
            setShowUpgradeDialog(false)
            setIsAwaitingPayment(false)
            loadSubscriptionData()
          }, 5000)
        }
      } else {
        throw new Error(result.message || "Payment initiation failed")
      }
    } catch (error: any) {
      console.error("Error upgrading subscription:", error)
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate payment. Please try again.",
        variant: "destructive"
      })
      setIsAwaitingPayment(false)
    } finally {
      setUpgrading(false)
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return <Zap className="h-5 w-5" />
      case "basic":
        return <Check className="h-5 w-5" />
      case "premium":
        return <Sparkles className="h-5 w-5" />
      case "pro":
        return <Crown className="h-5 w-5" />
      default:
        return <Star className="h-5 w-5" />
    }
  }

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return "bg-gray-100 text-gray-900 border-gray-200"
      case "basic":
        return "bg-blue-50 text-blue-900 border-blue-200"
      case "premium":
        return "bg-purple-50 text-purple-900 border-purple-200"
      case "pro":
        return "bg-amber-50 text-amber-900 border-amber-200"
      default:
        return "bg-muted"
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading subscription information...</div>
  }

  return (
    <div className="space-y-6">
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
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {controlNumber ? (
                  <Button
                    className="w-full h-12 rounded-xl bg-stone-900 text-white font-bold"
                    onClick={() => {
                      setIsAwaitingPayment(false)
                      setShowUpgradeDialog(false)
                      loadSubscriptionData()
                    }}
                  >
                    I have completed payment
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

      {/* Current Plan Card */}
      {currentSubscription && (
        <Card className={getPlanColor(currentSubscription.plan.name)}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPlanIcon(currentSubscription.plan.name)}
                <div>
                  <CardTitle>Current Plan: {currentSubscription.plan.name}</CardTitle>
                  <CardDescription className="text-inherit opacity-70">
                    {currentSubscription.plan.price === 0
                      ? "Free forever"
                      : `${currentSubscription.plan.price.toLocaleString()} TZS/month`}
                  </CardDescription>
                </div>
              </div>
              {currentSubscription.plan.has_verification_badge && (
                <Badge variant="secondary" className="bg-white/50">
                  <Check className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentSubscription.expires_at && (
                <p className="text-sm">Expires: {new Date(currentSubscription.expires_at).toLocaleDateString()}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Available Plans</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const features = plan.features as any
            const isCurrent = currentSubscription?.plan?.id === plan.id

            return (
              <Card key={plan.id} className={`relative ${isCurrent ? "border-primary shadow-lg" : ""}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>Current Plan</Badge>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {getPlanIcon(plan.name)}
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </div>
                  <div className="text-3xl font-bold">
                    {plan.price === 0 ? (
                      "Free"
                    ) : (
                      <>
                        {plan.price.toLocaleString()}
                        <span className="text-base font-normal text-muted-foreground"> TZS/mo</span>
                      </>
                    )}
                  </div>
                  <CardDescription>{features.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    {plan.product_limit ? (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Up to {plan.product_limit} products</span>
                      </li>
                    ) : (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Unlimited products</span>
                      </li>
                    )}
                    {plan.has_verification_badge && (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Verification badge</span>
                      </li>
                    )}
                    {plan.has_analytics && (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{plan.analytics_level} analytics</span>
                      </li>
                    )}
                    {plan.has_promotions && (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Promotions & discounts</span>
                      </li>
                    )}
                    {plan.has_consultation && (
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Business consultation</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="capitalize">{plan.support_level} support</span>
                    </li>
                  </ul>

                  {!isCurrent && plan.price > 0 && (
                    <Button onClick={() => handleUpgradeClick(plan)} className="w-full">
                      Upgrade to {plan.name}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to {selectedPlan?.name}</DialogTitle>
            <DialogDescription>Choose your payment method to upgrade your subscription</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">{selectedPlan?.name} Plan</span>
                <span className="text-2xl font-bold">{selectedPlan?.price?.toLocaleString()} TZS</span>
              </div>
              <p className="text-sm text-muted-foreground">Billed monthly</p>
            </div>

            <div>
              <Label className="mb-3 block font-bold">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 gap-3">
                <div className={`flex items-center space-x-3 border-2 rounded-[1.25rem] p-4 transition-all ${paymentMethod === "airtel-money" ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"}`}>
                  <RadioGroupItem value="airtel-money" id="airtel" />
                  <Label htmlFor="airtel" className="flex-1 cursor-pointer font-bold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-red-600" /> Airtel Money
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 border-2 rounded-[1.25rem] p-4 transition-all ${paymentMethod === "tigo-pesa" ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"}`}>
                  <RadioGroupItem value="tigo-pesa" id="tigo" />
                  <Label htmlFor="tigo" className="flex-1 cursor-pointer font-bold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" /> Tigo Pesa
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 border-2 rounded-[1.25rem] p-4 transition-all ${paymentMethod === "halopesa" ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"}`}>
                  <RadioGroupItem value="halopesa" id="halopesa" />
                  <Label htmlFor="halopesa" className="flex-1 cursor-pointer font-bold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-orange-600" /> HaloPesa
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 border-2 rounded-[1.25rem] p-4 transition-all ${paymentMethod === "visa" ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"}`}>
                  <RadioGroupItem value="visa" id="visa" />
                  <Label htmlFor="visa" className="flex-1 cursor-pointer font-bold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-stone-900" /> Visa / Mastercard
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 border-2 rounded-[1.25rem] p-4 transition-all ${paymentMethod === "crdb-simbanking" ? "border-primary bg-primary/5" : "border-stone-100 hover:border-stone-200"}`}>
                  <RadioGroupItem value="crdb-simbanking" id="bank" />
                  <Label htmlFor="bank" className="flex-1 cursor-pointer font-bold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-stone-900" /> Bank Transfer
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 border-2 rounded-[1.25rem] p-4 opacity-50 cursor-not-allowed border-stone-100`}>
                  <RadioGroupItem value="m-pesa" id="mpesa" disabled />
                  <Label htmlFor="mpesa" className="flex-1 cursor-not-allowed font-bold flex items-center gap-2">
                    <Phone className="h-4 w-4 text-stone-400" /> M-Pesa (Maintenance)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Method-specific inputs */}
            <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
              {["airtel-money", "tigo-pesa", "halopesa"].includes(paymentMethod) && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="07XXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-xl h-12"
                  />
                  <p className="text-[10px] text-stone-500 font-medium">You will receive a USSD push to authorize</p>
                </div>
              )}

              {["visa", "mastercard", "visa"].includes(paymentMethod) && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="card">Card Number</Label>
                    <Input
                      id="card"
                      placeholder="XXXX XXXX XXXX XXXX"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="rounded-xl h-12"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="XXX"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="rounded-xl h-12"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === "crdb-simbanking" && (
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 text-xs text-stone-600">
                  Selecting Bank Transfer will generate a control number for use with CRDB SimBanking or any TISS transfer.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)} disabled={upgrading}>
              Cancel
            </Button>
            <Button onClick={handleUpgrade} disabled={upgrading}>
              {upgrading ? "Processing..." : `Pay ${selectedPlan?.price?.toLocaleString()} TZS`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
