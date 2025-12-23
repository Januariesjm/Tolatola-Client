"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Wallet, TrendingUp, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { clientApiGet, clientApiPost } from "@/lib/api-client"

interface VendorWalletTabProps {
  vendorId: string
}

export function VendorWalletTab({ vendorId }: VendorWalletTabProps) {
  const [balance, setBalance] = useState(0)
  const [pendingBalance, setPendingBalance] = useState(0)
  const [payouts, setPayouts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [requestingPayout, setRequestingPayout] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("m-pesa")
  const [paymentDetails, setPaymentDetails] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadWalletData()
  }, [vendorId])

  const loadWalletData = async () => {
    try {
      const res = await clientApiGet<{ balance: number; pendingBalance: number; payouts: any[] }>(
        `vendors/${vendorId}/wallet`,
      )
      setBalance(res.balance || 0)
      setPendingBalance(res.pendingBalance || 0)
      setPayouts(res.payouts || [])
    } catch (err) {
      console.error("Failed to load wallet data", err)
      toast({
        title: "Error",
        description: "Could not load wallet data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRequestPayout = async () => {
    if (!payoutAmount || Number(payoutAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payout amount",
        variant: "destructive",
      })
      return
    }

    if (Number(payoutAmount) > balance) {
      toast({
        title: "Insufficient balance",
        description: "Payout amount exceeds available balance",
        variant: "destructive",
      })
      return
    }

    if (!paymentDetails) {
      toast({
        title: "Missing details",
        description: "Please enter payment details (phone number)",
        variant: "destructive",
      })
      return
    }

    setRequestingPayout(true)

    try {
      await clientApiPost(`vendors/${vendorId}/payouts`, {
        amount: Number(payoutAmount),
        paymentMethod,
        paymentDetails,
      })

      toast({
        title: "Payout requested",
        description: "Your payout request has been submitted for approval",
      })
      setPayoutAmount("")
      setPaymentDetails("")
      loadWalletData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request payout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRequestingPayout(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading wallet data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Balance Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-600" />
              Available Balance
            </CardTitle>
            <CardDescription>Ready to withdraw</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">TZS {balance.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              Pending Balance
            </CardTitle>
            <CardDescription>In escrow (awaiting delivery)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">TZS {pendingBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Request Payout */}
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
          <CardDescription>Withdraw your available balance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (TZS)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                max={balance}
              />
              <p className="text-xs text-muted-foreground">Available: TZS {balance.toLocaleString()}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="m-pesa">M-Pesa</SelectItem>
                  <SelectItem value="tigo-pesa">Tigo Pesa</SelectItem>
                  <SelectItem value="airtel-money">Airtel Money</SelectItem>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Phone Number / Account Details</Label>
            <Input
              id="details"
              placeholder="e.g., +255 XXX XXX XXX"
              value={paymentDetails}
              onChange={(e) => setPaymentDetails(e.target.value)}
            />
          </div>

          <Button onClick={handleRequestPayout} disabled={requestingPayout || balance <= 0} className="w-full">
            <DollarSign className="h-4 w-4 mr-2" />
            {requestingPayout ? "Requesting..." : "Request Payout"}
          </Button>
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Your withdrawal history</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payouts yet</p>
          ) : (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    {payout.status === "completed" && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {payout.status === "pending" && <Clock className="h-5 w-5 text-yellow-600" />}
                    {payout.status === "processing" && <TrendingUp className="h-5 w-5 text-blue-600" />}
                    {payout.status === "failed" && <XCircle className="h-5 w-5 text-red-600" />}
                    <div>
                      <p className="font-semibold">TZS {Number(payout.amount).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(payout.created_at).toLocaleDateString()} via {payout.payment_method}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-medium ${
                        payout.status === "completed"
                          ? "text-green-600"
                          : payout.status === "failed"
                            ? "text-red-600"
                            : "text-yellow-600"
                      }`}
                    >
                      {payout.status}
                    </span>
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
