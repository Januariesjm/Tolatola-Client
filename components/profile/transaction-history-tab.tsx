"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CreditCard, ArrowUpRight, ArrowDownLeft } from "lucide-react"

interface TransactionHistoryTabProps {
  transactions: any[]
}

export default function TransactionHistoryTab({ transactions }: TransactionHistoryTabProps) {
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "payment":
      case "escrow_hold":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case "refund":
      case "escrow_release":
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      default:
        return <CreditCard className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600"
      case "pending":
        return "bg-yellow-600"
      case "failed":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Transaction History
        </CardTitle>
        <CardDescription>View all your financial transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-full">{getTransactionIcon(transaction.transaction_type)}</div>
                  <div>
                    <p className="font-medium capitalize">{transaction.transaction_type.replace("_", " ")}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleDateString()} at{" "}
                      {new Date(transaction.created_at).toLocaleTimeString()}
                    </p>
                    {transaction.description && (
                      <p className="text-sm text-muted-foreground">{transaction.description}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {transaction.currency} {transaction.amount.toLocaleString()}
                  </p>
                  <Badge className={getStatusColor(transaction.status)} variant="secondary">
                    {transaction.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
