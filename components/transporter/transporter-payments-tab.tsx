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
        <Card className="rounded-2xl border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card shadow-xs hover:shadow-md transition-all">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-300">Available Balance</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{availableBalance.toLocaleString()} TZS</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Ready to withdraw</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card to-card shadow-xs hover:shadow-md transition-all">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-300">Pending Balance</CardTitle>
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 text-amber-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{pendingBalance.toLocaleString()} TZS</span>
            </div>
            <p className="text-xs text-muted-foreground font-medium">Being processed</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="rounded-2xl border-border/80 shadow-xs">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b border-border/60">
          <CardTitle className="text-base sm:text-lg font-bold text-foreground">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 py-4 sm:py-5">
          {payments.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="h-14 w-14 mx-auto rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
                <DollarSign className="h-7 w-7" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 p-3.5 sm:p-4 rounded-xl border border-border/70 hover:border-border hover:bg-muted/30 transition-all"
                >
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="font-semibold text-sm text-foreground truncate">{payment.description || `${payment.payment_type} payment`}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(payment.created_at).toLocaleDateString()} at {new Date(payment.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm sm:text-base">+{Number(payment.amount).toLocaleString()} TZS</span>
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
