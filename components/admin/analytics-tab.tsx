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
    totalSecureHold: number
    totalPayouts: number
    totalTransporters: number
    activeTransporters: number
    approvedTransporters: number
    totalDeliveries: number
    completedDeliveries: number
    totalDeliveryFees: number
    totalTransporterEarnings: number
  }
  vendorTypesAnalytics?: Record<string, {
    count: number
    approvedCount: number
    totalProducts: number
    approvedProducts: number
    totalSales: number
    completedSales: number
    totalOrders: number
    completedOrders: number
    averageOrderValue: number
  }>
}

const vendorTypeLabels: Record<string, string> = {
  producer: "Producer",
  manufacturer: "Manufacturer",
  supplier: "Supplier",
  wholesaler: "Wholesaler",
  retail_trader: "Retail Trader",
}

export function AnalyticsTab({ stats, vendorTypesAnalytics = {} }: AnalyticsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Platform Analytics</h2>
        <p className="text-muted-foreground">Overview of Digital trade and Supply Chain Ecosystem performance</p>
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
              Secure Hold Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold">TZS {stats.totalSecureHold.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Assets secured for fulfillment</p>
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
      </div >

      {/* Performance Indicators */}
      < Card >
        <CardHeader>
          <CardTitle>Performance Indicators</CardTitle>
          <CardDescription>Key Digital trade and Supply Chain Ecosystem health metrics</CardDescription>
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
      </Card >

      {/* Vendor Type Analytics */}
      {
        Object.keys(vendorTypesAnalytics).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Vendor Type Analytics</CardTitle>
              <CardDescription>Performance breakdown by vendor type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(vendorTypesAnalytics).map(([type, analytics]: [string, any]) => (
                  <div key={type} className="border rounded-lg p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold">{vendorTypeLabels[type] || type}</h3>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{analytics.count}</p>
                        <p className="text-sm text-muted-foreground">Total Vendors</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Approved Vendors</p>
                        <p className="text-2xl font-bold">{analytics.approvedCount}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {analytics.count > 0 ? Math.round((analytics.approvedCount / analytics.count) * 100) : 0}% approval rate
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Products</p>
                        <p className="text-2xl font-bold">{analytics.totalProducts}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {analytics.approvedProducts} approved
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
                        <p className="text-2xl font-bold">TZS {analytics.totalSales.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {analytics.completedSales.toLocaleString()} completed
                        </p>
                      </div>

                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Total Orders</p>
                        <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Avg: TZS {analytics.averageOrderValue.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Order Completion Rate</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${analytics.totalOrders > 0 ? (analytics.completedOrders / analytics.totalOrders) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {analytics.totalOrders > 0 ? Math.round((analytics.completedOrders / analytics.totalOrders) * 100) : 0}%
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Sales Contribution</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 transition-all"
                              style={{
                                width: `${stats.totalGMV > 0 ? (analytics.totalSales / stats.totalGMV) * 100 : 0}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium">
                            {stats.totalGMV > 0 ? Math.round((analytics.totalSales / stats.totalGMV) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      }
    </div >
  )
}
