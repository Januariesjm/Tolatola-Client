"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SecureFundsManagementTabProps {
    transactions: any[]
}

// Renaming component to SecureFundsManagementTab (conceptually)
export function SecureFundsManagementTab({ transactions }: SecureFundsManagementTabProps) {
    const statusColors: Record<string, string> = {
        held: "bg-yellow-500",
        released: "bg-green-500",
        refunded: "bg-red-500",
    }

    const totalHeld = transactions.filter((e) => e.status === "held").reduce((sum, e) => sum + e.amount, 0)
    const totalReleased = transactions.filter((e) => e.status === "released").reduce((sum, e) => sum + e.amount, 0)

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Secure Settlement Monitoring</h2>
            </div>

            {/* Summary Cards */}
            <div className="grid md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Securely Held Funds</CardTitle>
                        <CardDescription>Protected assets awaiting fulfillment</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-yellow-600">TZS {(totalHeld || 0).toLocaleString()}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Settled Funds</CardTitle>
                        <CardDescription>Funds successfully released to vendors</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-green-600">TZS {(totalReleased || 0).toLocaleString()}</p>
                    </CardContent>
                </Card>
            </div>

            {/* List */}
            {transactions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">No transaction records</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {transactions.map((transaction) => (
                        <Card key={transaction.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Ref #{transaction.orders?.order_number}</CardTitle>
                                        <CardDescription>Merchant: {transaction.shops?.name}</CardDescription>
                                    </div>
                                    <Badge className={statusColors[transaction.status]}>{transaction.status === 'held' ? 'Protected' : transaction.status}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground mb-1">Amount</p>
                                        <p className="font-medium text-lg">TZS {(transaction.amount || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">Created</p>
                                        <p className="font-medium">{new Date(transaction.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground mb-1">{transaction.status === "released" ? "Settled On" : "Status"}</p>
                                        <p className="font-medium">
                                            {transaction.released_at
                                                ? new Date(transaction.released_at).toLocaleDateString()
                                                : transaction.status === "held"
                                                    ? "Secured"
                                                    : "-"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
