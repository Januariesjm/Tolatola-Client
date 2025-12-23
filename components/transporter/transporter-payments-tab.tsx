"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Clock, CheckCircle } from "lucide-react"

interface TransporterPaymentsTabProps {
  payments: any[]
  availableBalance: number
  pendingBalance: number
  transporterId: string
}

export function TransporterPaymentsTab({ payments, availableBalance, pendingBalance }: TransporterPaymentsTabProps) {
  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: "secondary",
      available: "default",
      withdrawn: "outline",
    }
    const colors: any = {
      pending: "text-yellow-600",
      available: "text-green-600",
      withdrawn: "text-gray-600",
    }
    return (
      <Badge variant={variants[status] || "secondary"} className={colors[status]}>
        {status === "pending" && <Clock className="h-3 w-3 mr-1" />}
        {status === "available" && <CheckCircle className="h-3 w-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-700">{availableBalance.toLocaleString()} TZS</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <span className="text-2xl font-bold text-yellow-700">{pendingBalance.toLocaleString()} TZS</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Being processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="py-12 text-center">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{payment.description || `${payment.payment_type} payment`}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(payment.created_at).toLocaleDateString()} at{" "}
                      {new Date(payment.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-green-600">+{Number(payment.amount).toLocaleString()} TZS</span>
                    {getStatusBadge(payment.status)}
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
