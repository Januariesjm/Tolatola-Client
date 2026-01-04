"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CheckCircle, Clock, XCircle } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface TransporterWithdrawalsTabProps {
  withdrawals: any[]
  availableBalance: number
}

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
      console.error("Withdrawal error:", error)
      alert(error instanceof Error ? error.message : "Failed to submit withdrawal request")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const config: any = {
      pending: { variant: "secondary", icon: Clock, color: "text-yellow-600" },
      approved: { variant: "default", icon: CheckCircle, color: "text-blue-600" },
      completed: { variant: "default", icon: CheckCircle, color: "text-green-600" },
      rejected: { variant: "destructive", icon: XCircle, color: "text-red-600" },
    }
    const { variant, icon: Icon, color } = config[status] || config.pending
    return (
      <Badge variant={variant} className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Withdrawal Request Form */}
      <Card>
        <CardHeader>
          <CardTitle>Request Withdrawal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleWithdrawal} className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-bold text-green-700">{availableBalance.toLocaleString()} TZS</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Withdraw *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                max={availableBalance}
                min={1}
              />
            </div>

            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <div className="bg-green-50/50 p-4 rounded-lg space-y-2 text-sm border border-green-100">
                <div className="flex justify-between text-stone-600">
                  <span>Requested:</span>
                  <span>TZS {Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Service Fee (5%):</span>
                  <span>- TZS {(Number(amount) * 0.05).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-green-200">
                  <span>You Receive:</span>
                  <span className="text-green-700">TZS {(Number(amount) * 0.95).toLocaleString()}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airtel-money">Airtel Money</SelectItem>
                  <SelectItem value="tigo-pesa">Tigo Pesa</SelectItem>
                  <SelectItem value="halopesa">HaloPesa</SelectItem>
                  <SelectItem value="ezypesa">EzyPesa</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="m-pesa" disabled>M-Pesa (Under Maintenance)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number *</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+255 XXX XXX XXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting || availableBalance <= 0}>
              <DollarSign className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Request Withdrawal"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="py-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No withdrawal requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{withdrawal.payment_method.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(withdrawal.created_at).toLocaleDateString()} at{" "}
                      {new Date(withdrawal.created_at).toLocaleTimeString()}
                    </p>
                    {withdrawal.notes && <p className="text-xs text-muted-foreground mt-1">{withdrawal.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold">{Number(withdrawal.amount).toLocaleString()} TZS</span>
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
