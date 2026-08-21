"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Sparkles, Star, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { clientApiGet, clientApiPost } from "@/lib/api-client"
import { useSubscriptionPaymentPoll } from "@/hooks/use-subscription-payment-poll"
import { VendorPaymentStatusOverlay } from "@/components/vendor/payment-status-overlay"
import { VendorSubscriptionUpgradeDialog } from "@/components/vendor/subscription-upgrade-dialog"
import { logger, normalizeError } from "@/lib/logger"
import type { CurrentSubscription, SubscriptionCheckoutResult, SubscriptionPlan } from "@/lib/types/subscription"

const log = logger.child("vendor.vendor-subscription-tab")

interface VendorSubscriptionTabProps {
  vendorId: string
}

export function VendorSubscriptionTab({ vendorId }: VendorSubscriptionTabProps) {
  const router = useRouter()
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
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
      const vendorRes = await clientApiGet<{ vendor: { current_subscription?: CurrentSubscription | null } }>(
        `vendors/${vendorId}/subscription`,
      )
      setCurrentSubscription(vendorRes.vendor?.current_subscription || null)

      const plansRes = await clientApiGet<{ plans: SubscriptionPlan[] }>("subscriptions/plans")
      setPlans(plansRes.plans || [])
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
    accountType: "vendor",
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
      const result = await clientApiPost<SubscriptionCheckoutResult>("subscriptions", {
        planId: selectedPlan.id,
        vendorId,
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
            setPaymentStatusMessage("Control number generated! Please complete the transfer to activate your subscription.")
          }
          startPolling(result.subscription.id)
        } else {
          setPaymentStatusMessage(
            "Payment initiated! Please confirm on your device. Your subscription will activate automatically once confirmed.",
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
        <VendorPaymentStatusOverlay
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
        <Card className={getPlanColor(currentSubscription.plan.name)}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPlanIcon(currentSubscription.plan.name)}
                <div>
                  <CardTitle>Current Plan: {currentSubscription.plan.name}</CardTitle>
                  <CardDescription className="text-inherit opacity-70">
                    {currentSubscription.plan.price === 0 ? "Free forever" : `${currentSubscription.plan.price.toLocaleString()} TZS/month`}
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
            const features = plan.features || {}
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
      <VendorSubscriptionUpgradeDialog
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
