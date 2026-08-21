"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Loader2, Percent, ShieldCheck, Sparkles, Star, Truck, Users, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { clientApiGet, clientApiPost } from "@/lib/api-client"
import { PaymentStatusOverlay } from "@/components/transporter/payment-status-overlay"
import { SubscriptionUpgradeDialog } from "@/components/transporter/subscription-upgrade-dialog"
import { useSubscriptionPaymentPoll } from "@/hooks/use-subscription-payment-poll"
import { logger, normalizeError } from "@/lib/logger"
import type { CurrentSubscription, SubscriptionCheckoutResult, SubscriptionPlan } from "@/lib/types/subscription"

const log = logger.child("transporter.transporter-subscription-tab")

interface TransporterSubscriptionTabProps {
  transporterId: string
}

export function TransporterSubscriptionTab({ transporterId }: TransporterSubscriptionTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("airtel-money")
  const [upgrading, setUpgrading] = useState(false)

  // Payment Details
  const [phoneNumber, setPhoneNumber] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")

  // Payment Status
  const [isAwaitingPayment, setIsAwaitingPayment] = useState(false)
  const [controlNumber, setControlNumber] = useState("")
  const [paymentStatusMessage, setPaymentStatusMessage] = useState("")

  useEffect(() => {
    loadSubscriptionData()
  }, [transporterId])

  const loadSubscriptionData = async () => {
    try {
      const res = await clientApiGet<{ plans: SubscriptionPlan[] }>("subscriptions/plans?type=transporter")
      setPlans(res.plans || [])

      // Fetch transporter's current subscription
      const transRes = await clientApiGet<{ transporter: { current_subscription?: CurrentSubscription | null } }>(`transporters/me`)
      setCurrentSubscription(transRes.transporter?.current_subscription || null)
    } catch (error) {
      log.error("error loading subscription data", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradeClick = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setShowUpgradeDialog(true)
  }

  const { startPolling } = useSubscriptionPaymentPoll({
    accountType: "transporter",
    onActive: () => {
      setIsAwaitingPayment(false)
      toast({ title: "Subscription Activated", description: `You are now on the ${selectedPlan?.name} plan!` })
      setShowUpgradeDialog(false)
      loadSubscriptionData()
    },
    onFailed: (message) => {
      setIsAwaitingPayment(false)
      toast({ title: "Payment Failed", description: message, variant: "destructive" })
    },
    onTimeout: () => {
      setIsAwaitingPayment(false)
      toast({
        title: "Payment Timeout",
        description: "We haven't received confirmation yet. Please check your status later.",
        variant: "destructive",
      })
    },
  })

  const handleUpgrade = async () => {
    if (!selectedPlan) return

    setUpgrading(true)
    setPaymentStatusMessage(
      paymentMethod === "crdb-simbanking"
        ? "Generating your bank control number..."
        : paymentMethod.includes("visa") || paymentMethod.includes("master")
          ? "Authorizing your card securely..."
          : "Sending payment request to your phone...",
    )
    setIsAwaitingPayment(true)

    try {
      const result = await clientApiPost<SubscriptionCheckoutResult>("subscriptions/transporters", {
        planId: selectedPlan.id,
        transporterId,
        paymentMethod,
        paymentDetails: {
          phoneNumber: ["m-pesa", "airtel-money", "halopesa", "mixx-by-yas", "ezypesa", "tigo-pesa"].includes(paymentMethod)
            ? phoneNumber
            : undefined,
          cardNumber: ["visa", "mastercard", "unionpay"].includes(paymentMethod) ? cardNumber : undefined,
          expiryDate: ["visa", "mastercard", "unionpay"].includes(paymentMethod) ? expiryDate : undefined,
          cvv: ["visa", "mastercard", "unionpay"].includes(paymentMethod) ? cvv : undefined,
        },
      })

      if (result.success) {
        if (result.controlNumber) {
          setControlNumber(result.controlNumber)
          if (result.controlNumber.startsWith("http")) {
            setPaymentStatusMessage("Bank payment link generated. Click the button below to complete payment.")
          } else {
            setPaymentStatusMessage("Control number generated! Please complete the transfer to activate your account.")
          }
          startPolling(result.subscription.id)
        } else {
          setPaymentStatusMessage(
            "Payment initiated! Please confirm on your phone. Your account will automatically upgrade once confirmed.",
          )
          startPolling(result.subscription.id)
        }
      } else {
        throw new Error(result.message || "Payment initiation failed")
      }
    } catch (error) {
      log.error("error upgrading subscription", error)
      toast({
        title: "Payment Failed",
        description: normalizeError(error).message || "Failed to initiate payment. Please try again.",
        variant: "destructive",
      })
      setIsAwaitingPayment(false)
    } finally {
      setUpgrading(false)
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return <Truck className="h-5 w-5" />
      case "basic":
        return <Zap className="h-5 w-5" />
      case "pro":
        return <Sparkles className="h-5 w-5" />
      case "elite":
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
      case "pro":
        return "bg-purple-50 text-purple-900 border-purple-200"
      case "elite":
        return "bg-amber-50 text-amber-900 border-amber-200"
      default:
        return "bg-muted"
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Loading carrier plans...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payment Loading Overlay */}
      {isAwaitingPayment && (
        <PaymentStatusOverlay
          controlNumber={controlNumber}
          statusMessage={paymentStatusMessage}
          onDone={() => {
            setIsAwaitingPayment(false)
            setShowUpgradeDialog(false)
            loadSubscriptionData()
          }}
        />
      )}

      {/* Current Plan Card */}
      {currentSubscription && (
        <Card className={`${getPlanColor(currentSubscription.plan.name)} border-none shadow-sm`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/50 flex items-center justify-center">
                  {getPlanIcon(currentSubscription.plan.name)}
                </div>
                <div>
                  <CardTitle className="text-lg">Active Plan: {currentSubscription.plan.name}</CardTitle>
                  <CardDescription className="text-inherit opacity-70">
                    {currentSubscription.plan.price === 0 ? "Free Access" : `${currentSubscription.plan.price.toLocaleString()} TZS/month`}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-white/50 border-none px-4 py-1">
                Active
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrent = currentSubscription?.plan?.id === plan.id

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl ${isCurrent ? "border-2 border-primary" : "border-stone-100"}`}
            >
              {isCurrent && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-primary text-white border-none">Current</Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="h-10 w-10 rounded-lg bg-stone-50 flex items-center justify-center mb-4 text-stone-900">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-black">{plan.price.toLocaleString()}</span>
                  <span className="text-sm font-bold text-stone-400 uppercase tracking-wider">TZS/mo</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-6">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm font-medium text-stone-600">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>
                      {plan.name === "Free"
                        ? "1 Active Delivery"
                        : plan.name === "Elite"
                          ? "Unlimited Deliveries"
                          : "Multi-Delivery (3 Active)"}
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-stone-600">
                    <Users className="h-4 w-4 text-primary" />
                    <span>
                      {plan.name === "Free" ? "Normal Priority" : plan.name === "Elite" ? "Immediate Pickup" : "High Job Priority"}
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-sm font-medium text-stone-600">
                    <Percent className="h-4 w-4 text-primary" />
                    <span>{plan.name === "Free" ? "7.5% Service Fee" : "4% Service Fee"}</span>
                  </li>
                  {plan.has_verification_badge && (
                    <li className="flex items-center gap-3 text-sm font-medium text-stone-600">
                      <ShieldCheck className="h-4 w-4 text-green-500" />
                      <span>Verified Elite Badge</span>
                    </li>
                  )}
                </ul>

                {!isCurrent && plan.price > 0 && (
                  <Button
                    onClick={() => handleUpgradeClick(plan)}
                    className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    Upgrade to {plan.name}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <SubscriptionUpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        selectedPlan={selectedPlan}
        paymentMethod={paymentMethod}
        onPaymentMethodChange={setPaymentMethod}
        phoneNumber={phoneNumber}
        onPhoneNumberChange={setPhoneNumber}
        cardNumber={cardNumber}
        onCardNumberChange={setCardNumber}
        expiryDate={expiryDate}
        onExpiryDateChange={setExpiryDate}
        cvv={cvv}
        onCvvChange={setCvv}
        upgrading={upgrading}
        onUpgrade={handleUpgrade}
      />
    </div>
  )
}
