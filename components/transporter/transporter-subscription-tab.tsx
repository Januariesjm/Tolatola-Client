"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Sparkles, Star, Zap, ShieldCheck, Building2, Loader2, Phone, CreditCard, Truck, Users, Percent } from "lucide-react"
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

interface TransporterSubscriptionTabProps {
    transporterId: string
}

export function TransporterSubscriptionTab({ transporterId }: TransporterSubscriptionTabProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [currentSubscription, setCurrentSubscription] = useState<any>(null)
    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<any>(null)
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
            const res = await clientApiGet<{ plans: any[] }>("subscriptions/plans?type=transporter")
            setPlans(res.plans || [])

            // Fetch transporter's current subscription
            const transRes = await clientApiGet<{ transporter: any }>(`transporters/me`)
            setCurrentSubscription(transRes.transporter?.current_subscription || null)
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
            const result = await clientApiPost<any>("subscriptions/transporters", {
                planId: selectedPlan.id,
                transporterId,
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
                    setPaymentStatusMessage("Control number generated! Please complete the transfer to activate your account.")
                } else {
                    setPaymentStatusMessage("Payment initiated! Please confirm on your phone. Your account will automatically upgrade once confirmed.")

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
                        </CardContent>
                    </Card>
                </div>
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
                                        {currentSubscription.plan.price === 0
                                            ? "Free Access"
                                            : `${currentSubscription.plan.price.toLocaleString()} TZS/month`}
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
                    const features = plan.features || {}

                    return (
                        <Card key={plan.id} className={`relative flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl ${isCurrent ? "border-2 border-primary" : "border-stone-100"}`}>
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
                                        <span>{plan.name === "Free" ? "1 Active Delivery" : plan.name === "Elite" ? "Unlimited Deliveries" : "Multi-Delivery (3 Active)"}</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-medium text-stone-600">
                                        <Users className="h-4 w-4 text-primary" />
                                        <span>{plan.name === "Free" ? "Normal Priority" : plan.name === "Elite" ? "Immediate Pickup" : "High Job Priority"}</span>
                                    </li>
                                    <li className="flex items-center gap-3 text-sm font-medium text-stone-600">
                                        <Percent className="h-4 w-4 text-primary" />
                                        <span>{plan.name === "Free" ? "15% Service Fee" : plan.name === "Elite" ? "5% Service Fee" : "10% Service Fee"}</span>
                                    </li>
                                    {plan.has_verification_badge && (
                                        <li className="flex items-center gap-3 text-sm font-medium text-stone-600">
                                            <ShieldCheck className="h-4 w-4 text-green-500" />
                                            <span>Verified Elite Badge</span>
                                        </li>
                                    )}
                                </ul>

                                {!isCurrent && plan.price > 0 && (
                                    <Button onClick={() => handleUpgradeClick(plan)} className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:scale-[1.02] active:scale-[0.98] transition-all">
                                        Upgrade to {plan.name}
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Upgrade Dialog */}
            <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in duration-300">
                    <div className="bg-primary p-6 py-8 text-white">
                        <DialogHeader className="space-y-1">
                            <DialogTitle className="text-2xl font-black text-white">Upgrade Account</DialogTitle>
                            <DialogDescription className="text-white/80 font-medium">
                                Elevate your earnings and priority status.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto p-6 scrollbar-hide py-4 space-y-6">
                        <div className="bg-stone-50 p-6 rounded-[1.5rem] border border-stone-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-stone-900">{selectedPlan?.name} Member</span>
                                <span className="text-2xl font-black text-primary">{selectedPlan?.price?.toLocaleString()} TZS</span>
                            </div>
                            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Billed Monthly</p>
                        </div>

                        <div className="space-y-3">
                            <Label className="font-black text-stone-900 ml-1">Select Payment Method</Label>
                            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid gap-3">
                                {[
                                    { id: "airtel-money", name: "Airtel Money", icon: <Phone className="h-4 w-4 text-red-600" /> },
                                    { id: "tigo-pesa", name: "Tigo Pesa", icon: <Phone className="h-4 w-4 text-blue-600" /> },
                                    { id: "halopesa", name: "HaloPesa", icon: <Phone className="h-4 w-4 text-orange-600" /> },
                                    { id: "visa", name: "Visa / Mastercard", icon: <CreditCard className="h-4 w-4 text-stone-900" /> },
                                    { id: "crdb-simbanking", name: "Bank Transfer", icon: <Building2 className="h-4 w-4 text-stone-900" /> },
                                ].map((method) => (
                                    <div key={method.id} className={`flex items-center space-x-3 border-2 rounded-2xl p-4 transition-all duration-200 cursor-pointer ${paymentMethod === method.id ? "border-primary bg-primary/5 shadow-sm" : "border-stone-100 hover:border-stone-200"}`}>
                                        <RadioGroupItem value={method.id} id={method.id} />
                                        <Label htmlFor={method.id} className="flex-1 cursor-pointer font-bold flex items-center gap-3">
                                            {method.icon} {method.name}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Method Specific Inputs */}
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            {["airtel-money", "tigo-pesa", "halopesa"].includes(paymentMethod) && (
                                <div className="space-y-2">
                                    <Label className="font-bold text-stone-800 ml-1">Phone Number</Label>
                                    <Input
                                        placeholder="07XXXXXXXX"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        className="h-12 rounded-xl border-stone-200"
                                    />
                                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest ml-1">USSD push will be sent</p>
                                </div>
                            )}

                            {paymentMethod === "visa" && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-stone-800 ml-1">Card Number</Label>
                                        <Input
                                            placeholder="XXXX XXXX XXXX XXXX"
                                            value={cardNumber}
                                            onChange={(e) => setCardNumber(e.target.value)}
                                            className="h-12 rounded-xl border-stone-200"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="font-bold text-stone-800 ml-1">Expiry</Label>
                                            <Input
                                                placeholder="MM/YY"
                                                value={expiryDate}
                                                onChange={(e) => setExpiryDate(e.target.value)}
                                                className="h-12 rounded-xl border-stone-200"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="font-bold text-stone-800 ml-1">CVV</Label>
                                            <Input
                                                placeholder="XXX"
                                                value={cvv}
                                                onChange={(e) => setCvv(e.target.value)}
                                                className="h-12 rounded-xl border-stone-200"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === "crdb-simbanking" && (
                                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-left leading-relaxed">
                                        Selecting Bank Transfer will generate a GePG Control Number for use with CRDB SimBanking or any TISS transfer.
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="p-6 pt-2 flex-col sm:flex-col gap-3">
                        <Button
                            onClick={handleUpgrade}
                            disabled={upgrading}
                            className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                        >
                            {upgrading ? "Processing..." : `Pay ${selectedPlan?.price?.toLocaleString()} TZS`}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowUpgradeDialog(false)}
                            disabled={upgrading}
                            className="w-full h-12 rounded-2xl border-stone-200 text-stone-500 font-bold"
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
