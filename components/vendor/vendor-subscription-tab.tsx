"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Sparkles, Star, Zap } from "lucide-react"
import { useRouter } from "next/navigation"
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
  const [paymentMethod, setPaymentMethod] = useState("mixx")
  const [upgrading, setUpgrading] = useState(false)

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

    try {
      await clientApiPost("subscriptions", { planId: selectedPlan.id, vendorId, paymentMethod })
      setShowUpgradeDialog(false)
      router.refresh()
      await loadSubscriptionData()
    } catch (error) {
      console.error("Error upgrading subscription:", error)
      alert("Failed to upgrade subscription. Please try again.")
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
              <Label className="mb-3 block">Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="mixx" id="mixx" />
                  <Label htmlFor="mixx" className="flex-1 cursor-pointer">
                    Mixx by Yas
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="credit_card" id="credit_card" />
                  <Label htmlFor="credit_card" className="flex-1 cursor-pointer">
                    Credit Card
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer">
                    Bank Transfer
                  </Label>
                </div>
              </RadioGroup>
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
