"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, Eye } from "lucide-react"
import Link from "next/link"

interface OrderHistoryTabProps {
  orders: any[]
}

export default function OrderHistoryTab({ orders }: OrderHistoryTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-600"
      case "shipped":
        return "bg-blue-600"
      case "processing":
        return "bg-yellow-600"
      case "cancelled":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  return (

    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="bg-white dark:bg-zinc-950 p-4 rounded-full inline-flex mb-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
            <Package className="h-8 w-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            You haven't placed any orders yet. Start exploring our marketplace to find amazing products.
          </p>
          <Link href="/shop">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8">
              Start Shopping
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900 dark:text-gray-100">#{order.order_number}</span>
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    Placed on {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">TZS {order.total_amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="p-5">
                <div className="space-y-4">
                  {order.order_items?.slice(0, 2).map((item: any) => (
                    <div key={item.id} className="flex items-start gap-4">
                      <div className="h-16 w-16 flex-shrink-0 bg-zinc-100 dark:bg-zinc-900 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
                        {item.product?.images?.[0] ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-zinc-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">{item.product?.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Qty: {item.quantity} × TZS {item.product?.price?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900 dark:text-gray-100 py-1">TZS {item.total_price.toLocaleString()}</p>
                    </div>
                  ))}

                  {order.order_items?.length > 2 && (
                    <div className="pl-20 pt-1">
                      <p className="text-sm text-muted-foreground italic">
                        +{order.order_items.length - 2} more items in this order
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-end pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Link href={`/orders/${order.id}`}>
                    <Button variant="outline" className="group-hover:border-indigo-200 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/10 dark:group-hover:border-indigo-800 dark:group-hover:text-indigo-300 transition-colors">
                      <Eye className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      View Order Details
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
