"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  ArrowDownToLine,
  Wallet,
  Smartphone,
  ShieldCheck,
  Receipt,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { logger } from "@/lib/logger"

const log = logger.child("transporter.transporter-withdrawals-tab")

interface TransporterWithdrawalsTabProps {
  withdrawals: any[]
  availableBalance: number
}

const COMMISSION_RATE = 0.1

const QUICK_PERCENTAGES = [
  { label: "25%", value: 0.25 },
  { label: "50%", value: 0.5 },
  { label: "75%", value: 0.75 },
  { label: "Max", value: 1.0 },
]

export function TransporterWithdrawalsTab({ withdrawals, availableBalance }: TransporterWithdrawalsTabProps) {
  const [amount, setAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const withdrawalAmount = Number(amount)
      if (withdrawalAmount <= 0 || withdrawalAmount > availableBalance) {
        alert("Invalid withdrawal amount")
        return
      }

      if (!paymentMethod || !phoneNumber) {
        alert("Please fill in all required fields")
        return
      }

      const { clientApiPost } = await import("@/lib/api-client")
      await clientApiPost("transporters/withdrawals", {
        amount: withdrawalAmount,
        payment_method: paymentMethod,
        payment_details: { phone_number: phoneNumber },
      })

      alert("Withdrawal request submitted successfully!")
      setAmount("")
      setPhoneNumber("")
      setPaymentMethod("")
      router.refresh()
    } catch (error) {
      log.error("withdrawal error", error)
      alert(error instanceof Error ? error.message : "Failed to submit withdrawal request")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickPercent = (pct: number) => {
    if (availableBalance <= 0) return
    const calculated = Math.floor(availableBalance * pct)
    setAmount(calculated > 0 ? calculated.toString() : "")
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "secondary" | "default" | "destructive"; icon: typeof Clock; className: string }> = {
      pending: {
        variant: "secondary",
        icon: Clock,
        className: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60",
      },
      approved: {
        variant: "default",
        icon: CheckCircle,
        className: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60",
      },
      completed: {
        variant: "default",
        icon: CheckCircle,
        className:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60",
      },
      rejected: {
        variant: "destructive",
        icon: XCircle,
        className: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60",
      },
    }
    const { variant, icon: Icon, className } = config[status] || config.pending
    return (
      <Badge variant={variant} className={`inline-flex items-center gap-1 font-semibold text-xs px-2.5 py-0.5 rounded-full ${className}`}>
        <Icon className="h-3.5 w-3.5" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const numericAmount = Number(amount)
  const isAmountValid = amount !== "" && !isNaN(numericAmount) && numericAmount > 0

  return (
    <div className="space-y-6">
      {/* Withdrawal Request Form Card */}
      <Card className="border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-stone-100 dark:border-stone-800/60">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                <ArrowDownToLine className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight">Request Withdrawal</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-stone-500">
                  Instant mobile money and bank payout powered by ClickPesa
                </CardDescription>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 text-xs font-medium">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verified Payout Channel</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleWithdrawal} className="space-y-5">
            {/* Balance Banner */}
            <div className="relative overflow-hidden p-5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-br from-emerald-50 via-teal-50/40 to-white dark:from-emerald-950/30 dark:via-emerald-900/10 dark:to-stone-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      Available Balance
                    </p>
                  </div>
                  <p className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight">
                    {availableBalance.toLocaleString()} TZS
                  </p>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-center">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Ready for withdrawal</span>
                </div>
              </div>
            </div>

            {/* Amount input & Quick Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount" className="font-semibold text-stone-800 dark:text-stone-200">
                  Amount to Withdraw *
                </Label>
                {availableBalance > 0 && (
                  <div className="flex items-center gap-1.5">
                    {QUICK_PERCENTAGES.map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => handleQuickPercent(chip.value)}
                        className="px-2.5 py-0.5 text-xs font-medium rounded-md border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 transition-colors"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  max={availableBalance}
                  min={1}
                  className="h-11 text-base font-medium rounded-xl border-stone-200 dark:border-stone-800 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {/* Live Fee Calculation Breakdown */}
            {isAmountValid && (
              <div className="bg-gradient-to-br from-emerald-50/70 via-stone-50 to-emerald-50/30 dark:from-stone-900 dark:via-stone-900 dark:to-emerald-950/30 p-4 rounded-xl space-y-2.5 text-sm border border-emerald-200/70 dark:border-emerald-900/50">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  <Receipt className="h-3.5 w-3.5" />
                  <span>Fee Breakdown</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Requested:</span>
                  <span className="font-medium text-stone-800 dark:text-stone-200">TZS {numericAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-600 dark:text-stone-400">
                  <span>Service Fee (10%):</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    - TZS {(numericAmount * COMMISSION_RATE).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center font-bold text-base pt-2 border-t border-emerald-200/80 dark:border-emerald-800/60">
                  <span className="text-stone-900 dark:text-stone-100">You Receive:</span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-lg">
                    TZS {(numericAmount * (1 - COMMISSION_RATE)).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod" className="font-semibold text-stone-800 dark:text-stone-200">
                Payment Method *
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger className="h-11 rounded-xl border-stone-200 dark:border-stone-800">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="airtel-money">Airtel Money</SelectItem>
                  <SelectItem value="tigo-pesa">Tigo Pesa</SelectItem>
                  <SelectItem value="halopesa">HaloPesa</SelectItem>
                  <SelectItem value="ezypesa">EzyPesa</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="m-pesa" disabled>
                    M-Pesa (Under Maintenance)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="font-semibold text-stone-800 dark:text-stone-200">
                Phone Number *
              </Label>
              <div className="relative">
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="+255 XXX XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  className="h-11 rounded-xl border-stone-200 dark:border-stone-800 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all duration-200 disabled:opacity-50"
              disabled={isSubmitting || availableBalance <= 0}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Request Withdrawal"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Withdrawal History Card */}
      <Card className="border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-stone-100 dark:border-stone-800/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">Withdrawal History</CardTitle>
                <CardDescription className="text-xs text-stone-500">
                  Track your previous payout requests and settlement status
                </CardDescription>
              </div>
            </div>
            {withdrawals.length > 0 && (
              <Badge variant="outline" className="rounded-full text-xs font-semibold px-2.5 py-0.5">
                {withdrawals.length} {withdrawals.length === 1 ? "Record" : "Records"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {withdrawals.length === 0 ? (
            <div className="py-14 text-center">
              <div className="h-14 w-14 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-400">
                <DollarSign className="h-6 w-6" />
              </div>
              <p className="font-semibold text-stone-700 dark:text-stone-300">No withdrawal requests yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Once you submit a withdrawal request, its status and details will be logged here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-stone-200/70 dark:border-stone-800 bg-stone-50/40 dark:bg-stone-900/40 hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-xl transition-all"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <p className="font-semibold text-sm capitalize text-stone-900 dark:text-stone-100">
                        {withdrawal.payment_method.replace("_", " ")}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(withdrawal.created_at).toLocaleDateString()} at {new Date(withdrawal.created_at).toLocaleTimeString()}
                    </p>
                    {withdrawal.notes && (
                      <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{withdrawal.notes}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200/60 dark:border-stone-800 shrink-0">
                    <span className="font-extrabold text-base text-stone-900 dark:text-stone-100">
                      {Number(withdrawal.amount).toLocaleString()} TZS
                    </span>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
