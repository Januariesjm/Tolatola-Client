"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Package, ShoppingCart, DollarSign, Store, Truck } from "lucide-react"

interface AnalyticsTabProps {
  stats: {
    totalVendors: number
    activeVendors: number
    totalCustomers?: number
    activeCustomers?: number
    totalProducts: number
    approvedProducts: number
    totalOrders: number
    completedOrders: number
    totalGMV: number
    totalEscrow: number
    totalPayouts: number
    totalTransporters: number
    activeTransporters: number
    approvedTransporters: number
    totalDeliveries: number
    completedDeliveries: number
    totalDeliveryFees: number
    totalTransporterEarnings: number
  }
}

export function AnalyticsTab({ stats }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Platform Analytics</h2>
        <p className="text-muted-foreground">Overview of marketplace performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Vendors / Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{stats.totalVendors}</p>
              <p className="text-sm text-muted-foreground">
                {stats.activeVendors} active • {stats.activeCustomers ?? 0} active customers
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Transporters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{stats.totalTransporters}</p>
              <p className="text-sm text-muted-foreground">{stats.activeTransporters} active</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
              <p className="text-sm text-muted-foreground">{stats.approvedProducts} approved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
              <p className="text-sm text-muted-foreground">{stats.completedOrders} completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">{stats.totalDeliveries}</p>
              <p className="text-sm text-muted-foreground">{stats.completedDeliveries} completed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Gross Merchandise Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">TZS {stats.totalGMV.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total sales volume</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Escrow Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">TZS {stats.totalEscrow.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Funds held in escrow</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Store className="h-4 w-4" />
              Vendor Payouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">TZS {stats.totalPayouts.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Paid to vendors</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Transporter Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">
                TZS {(stats.totalTransporterEarnings ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">Paid to transporters</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Indicators</CardTitle>
          <CardDescription>Key marketplace health metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Order Completion Rate</p>
                <p className="text-sm text-muted-foreground">Percentage of orders successfully delivered</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Delivery Completion Rate</p>
                <p className="text-sm text-muted-foreground">Percentage of successful transporter deliveries</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {stats.totalDeliveries > 0
                    ? Math.round((stats.completedDeliveries / stats.totalDeliveries) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Product Approval Rate</p>
                <p className="text-sm text-muted-foreground">Percentage of products approved</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {stats.totalProducts > 0 ? Math.round((stats.approvedProducts / stats.totalProducts) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Vendor Activation Rate</p>
                <p className="text-sm text-muted-foreground">Percentage of vendors with approved KYC</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {stats.totalVendors > 0 ? Math.round((stats.activeVendors / stats.totalVendors) * 100) : 0}%
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Transporter Activation Rate</p>
                <p className="text-sm text-muted-foreground">Percentage of transporters with approved KYC</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {stats.totalTransporters > 0
                    ? Math.round((stats.approvedTransporters / stats.totalTransporters) * 100)
                    : 0}
                  %
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Average Order Value</p>
                <p className="text-sm text-muted-foreground">Average transaction size</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  TZS {stats.totalOrders > 0 ? Math.round(stats.totalGMV / stats.totalOrders).toLocaleString() : 0}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Average Delivery Fee</p>
                <p className="text-sm text-muted-foreground">Average cost per delivery</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  TZS{" "}
                  {stats.totalDeliveries > 0
                    ? Math.round(stats.totalDeliveryFees / stats.totalDeliveries).toLocaleString()
                    : 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
