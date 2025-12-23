"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import type { PaymentMethod } from "@/lib/clickpesa"

interface ClickPesaPaymentProps {
  orderId: string
  amount: number
  paymentMethod: PaymentMethod
  onSuccess: (transactionId: string) => void
  onError: (error: string) => void
}

export function ClickPesaPayment({ orderId, amount, paymentMethod, onSuccess, onError }: ClickPesaPaymentProps) {
  const [loading, setLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [cvv, setCvv] = useState("")

  const isMobileMoney = ["m-pesa", "airtel-money", "halopesa", "mixx-by-yas", "ezypesa"].includes(paymentMethod)
  const isCard = ["visa", "mastercard", "unionpay"].includes(paymentMethod)
  const isBank = ["crdb-simbanking", "crdb-internet-banking", "crdb-wakala", "crdb-branch-otc"].includes(paymentMethod)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { clientApiPost } = await import("@/lib/api-client")

      const result = await clientApiPost<{
        success: boolean
        transactionId?: string
        controlNumber?: string
        error?: string
        message?: string
        requiresPayment?: boolean
      }>("payments/clickpesa/initiate", {
        orderId,
        paymentMethod,
        paymentDetails: {
          phoneNumber: isMobileMoney ? phoneNumber : undefined,
          cardNumber: isCard ? cardNumber : undefined,
          expiryDate: isCard ? expiryDate : undefined,
          cvv: isCard ? cvv : undefined,
        },
      })

      if (result.success) {
        if (result.controlNumber) {
          alert(
            `Payment control number: ${result.controlNumber}\nUse this number to complete payment through your bank.`,
          )
        }
        onSuccess(result.transactionId || "pending")
      } else {
        onError(result.error || result.message || "Payment failed")
      }
    } catch (error: any) {
      onError(error.message || "Payment failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
        <CardDescription>Amount: {amount.toLocaleString()} TZS</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isMobileMoney && (
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="0712345678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                You will receive a USSD prompt on your phone to complete the payment
              </p>
            </div>
          )}

          {isCard && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry">Expiry Date</Label>
                  <Input
                    id="expiry"
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            </>
          )}

          {isBank && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Click "Pay Now" to generate a control number. You can then use this number to complete payment through
                your CRDB bank service.
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Pay Now"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
