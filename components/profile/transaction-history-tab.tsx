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

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case "escrow_hold": return "Payment Protected"
      case "escrow_release": return "Payment Released"
      default: return type.replace("_", " ")
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

    <div className="space-y-6">
      {transactions.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="bg-white dark:bg-zinc-950 p-4 rounded-full inline-flex mb-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <CreditCard className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No transactions yet</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Your financial transactions will appear here once you start buying or selling.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-muted-foreground border-b border-zinc-100 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Transaction</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-900/20">
                          {getTransactionIcon(transaction.transaction_type)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {getTransactionLabel(transaction.transaction_type)}
                          </p>
                          {transaction.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                      <p className="font-medium">{new Date(transaction.created_at).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{new Date(transaction.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(transaction.status)}>{transaction.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        {transaction.currency} {transaction.amount.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
