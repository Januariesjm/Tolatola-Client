"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Package } from "lucide-react"
import Link from "next/link"

interface OrdersListContentProps {
  orders: any[]
}

export function OrdersListContent({ orders }: OrdersListContentProps) {
  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    processing: "bg-purple-500",
    shipped: "bg-indigo-500",
    delivered: "bg-green-500",
    cancelled: "bg-red-500",
    refunded: "bg-gray-500",
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">TZ Marketplace</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/shop">
              <Button variant="ghost">Browse Products</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Orders</h1>
          <p className="text-muted-foreground">Track and manage your orders</p>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">No orders yet</p>
              <Link href="/shop">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                      <CardDescription>Placed on {new Date(order.created_at).toLocaleDateString()}</CardDescription>
                    </div>
                    <Badge className={statusColors[order.status]}>{order.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items Preview */}
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {order.order_items.slice(0, 3).map((item: any) => (
                        <div key={item.id} className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={`/.jpg?height=64&width=64&query=${encodeURIComponent(item.products.name)}`}
                            alt={item.products.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {order.order_items.length > 3 && (
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-sm text-muted-foreground">+{order.order_items.length - 3}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {order.order_items.length} {order.order_items.length === 1 ? "item" : "items"}
                        </p>
                        <p className="text-lg font-semibold">TZS {order.total_amount.toLocaleString()}</p>
                      </div>
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
