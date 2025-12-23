"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface EscrowManagementTabProps {
  escrows: any[]
}

export function EscrowManagementTab({ escrows }: EscrowManagementTabProps) {
  const statusColors: Record<string, string> = {
    held: "bg-yellow-500",
    released: "bg-green-500",
    refunded: "bg-red-500",
  }

  const totalHeld = escrows.filter((e) => e.status === "held").reduce((sum, e) => sum + e.amount, 0)
  const totalReleased = escrows.filter((e) => e.status === "released").reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Escrow Management</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Held in Escrow</CardTitle>
            <CardDescription>Funds awaiting delivery confirmation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">TZS {totalHeld.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Released</CardTitle>
            <CardDescription>Funds released to vendors</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">TZS {totalReleased.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Escrow List */}
      {escrows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No escrow records</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {escrows.map((escrow) => (
            <Card key={escrow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Order #{escrow.orders?.order_number}</CardTitle>
                    <CardDescription>Shop: {escrow.shops?.name}</CardDescription>
                  </div>
                  <Badge className={statusColors[escrow.status]}>{escrow.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Amount</p>
                    <p className="font-medium text-lg">TZS {escrow.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Created</p>
                    <p className="font-medium">{new Date(escrow.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">{escrow.status === "released" ? "Released" : "Status"}</p>
                    <p className="font-medium">
                      {escrow.released_at
                        ? new Date(escrow.released_at).toLocaleDateString()
                        : escrow.status === "held"
                          ? "Awaiting delivery"
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
