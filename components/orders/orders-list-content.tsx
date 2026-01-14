"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, ChevronRight, Calendar, CreditCard, Box } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface OrdersListContentProps {
  orders: any[]
}

export function OrdersListContent({ orders }: OrdersListContentProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/15 text-yellow-600 border-yellow-200"
      case "confirmed":
        return "bg-blue-500/15 text-blue-600 border-blue-200"
      case "processing":
        return "bg-purple-500/15 text-purple-600 border-purple-200"
      case "shipped":
        return "bg-indigo-500/15 text-indigo-600 border-indigo-200"
      case "delivered":
        return "bg-green-500/15 text-green-600 border-green-200"
      case "cancelled":
        return "bg-red-500/15 text-red-600 border-red-200"
      case "refunded":
        return "bg-gray-500/15 text-gray-600 border-gray-200"
      default:
        return "bg-gray-100 text-gray-600 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Orders</h1>
          <p className="text-muted-foreground text-lg">
            Track and manage your recent purchases
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border shadow-sm">
            <div className="bg-primary/5 p-6 rounded-full mb-6">
              <Package className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              It looks like you haven't placed any orders yet. Start exploring our marketplace to find great products.
            </p>
            <Link href="/shop">
              <Button size="lg" className="rounded-full px-8">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="group hover:shadow-md transition-all duration-200 border-border/60 overflow-hidden bg-white"
              >
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 bg-gray-50/50 border-b">
                  <div className="flex flex-col sm:gap-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base font-semibold">
                        Order #{order.order_number}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={cn("capitalize font-medium border", getStatusColor(order.status))}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(order.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-gray-300" />
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>TZS {order.total_amount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="w-full sm:w-auto gap-2 group-hover:border-primary/50 group-hover:text-primary transition-colors">
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardHeader>

                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide py-1">
                        {order.order_items.map((item: any) => {
                          // Handle case where product might use images array or primary_image_url
                          const imageUrl = item.products?.images?.[0] || item.products?.primary_image_url || "/placeholder-product.png";

                          return (
                            <div key={item.id} className="relative group/item flex-shrink-0">
                              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-lg overflow-hidden border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imageUrl}
                                  alt={item.products?.name || "Product"}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://placehold.co/100x100?text=${encodeURIComponent(item.products?.name?.substring(0, 2) || 'PR')}`
                                  }}
                                />
                              </div>
                              <div className="mt-1.5 w-20 sm:w-24 text-xs font-medium truncate text-gray-600">
                                {item.products?.name}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-4 sm:pt-0 gap-2 sm:min-w-[120px]">
                      <div className="sm:hidden block">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-semibold text-lg">TZS {order.total_amount.toLocaleString()}</p>
                      </div>

                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                        <p className="text-xl font-bold text-gray-900">TZS {order.total_amount.toLocaleString()}</p>
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-gray-50 px-3 py-1.5 rounded-full">
                        <Box className="h-4 w-4" />
                        <span>{order.order_items.length} {order.order_items.length === 1 ? "Item" : "Items"}</span>
                      </div>
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
