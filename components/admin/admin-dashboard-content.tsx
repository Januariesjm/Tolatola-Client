"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LogOut, Users, Package, ShoppingCart, DollarSign,
  MessageSquare, ShoppingBag, ShieldCheck
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"

import { AnalyticsTab } from "./analytics-tab"
import { KYCApprovalTab } from "./kyc-approval-tab"
import { TransporterKYCApprovalTab } from "./transporter-kyc-approval-tab"
import { ProductApprovalTab } from "./product-approval-tab"
import { OrdersManagementTab } from "./orders-management-tab"
import { SecureFundsManagementTab } from "./secure-funds-tab"
import { PayoutApprovalTab } from "./payout-approval-tab"
import { SupportTicketsTab } from "./support-tickets-tab"
import { PromotionsManagementTab } from "./promotions-management-tab"
import { VendorManagementTab } from "./vendor-management-tab"
import { TransporterManagementTab } from "./transporter-management-tab"
import { CustomerManagementTab } from "./customer-management-tab"
import { CustomerKYCApprovalTab } from "./customer-kyc-approval-tab"
import { VendorSubscriptionsTab } from "./vendor-subscriptions-tab"
import { AdminUsersManagementTab } from "./admin-users-management-tab"

interface AdminDashboardContentProps {
  adminRole: any
  pendingVendors: any[]
  pendingTransporters: any[]
  pendingCustomerKyc: any[]
  pendingProducts: any[]
  orders: any[]
  transactions: any[]
  tickets: any[]
  payouts: any[]
  stats: any
  promotions: any[]
  subscriptions: any[]
  vendorTypesAnalytics?: any
}

export function AdminDashboardContent({
  adminRole,
  pendingVendors,
  pendingTransporters,
  pendingCustomerKyc,
  pendingProducts,
  orders,
  transactions,
  tickets,
  payouts,
  stats,
  promotions,
  subscriptions,
  vendorTypesAnalytics = {},
}: AdminDashboardContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("analytics")

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const pendingTickets = tickets.filter((t) => t.status === "open")
  const showAdminManagement = adminRole?.permissions.includes("manage_admins")

  // Filter out the meta-info added to promotions array if present
  const actualPromotions = promotions.filter(p => !p._adminUsers && !p.id?.includes('_'))

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/40">
      {/* Header */}
      <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-center">
                <ShoppingBag className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-semibold tracking-tight text-slate-900">
                TOLATOLA <span className="text-primary">ADMIN</span>
              </span>
            </Link>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {adminRole?.roleName || "Administrator"}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm rounded-xl border border-primary/20 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Total GMV
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                TZS {stats.totalGMV?.toLocaleString() || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-xl border border-primary/15 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Active Orders
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {orders.filter(o => !["delivered", "cancelled"].includes(o.status)).length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-xl border border-amber-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Pending KYC
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                <Users className="h-4 w-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {pendingVendors.length + pendingTransporters.length}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm rounded-xl border border-red-100 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Open Tickets
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {pendingTickets.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex whitespace-nowrap bg-white/80 border border-slate-200 rounded-full px-1 py-1 h-auto shadow-sm">
              <TabsTrigger
                value="analytics"
                className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
              >
                Analytics
              </TabsTrigger>
              {adminRole?.permissions.includes("manage_kyc") && (
                <TabsTrigger
                  value="kyc"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Vendor KYC ({pendingVendors.length})
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_kyc") && (
                <TabsTrigger
                  value="transporter-kyc"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Transporter KYC ({pendingTransporters.length})
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_kyc") && (
                <TabsTrigger
                  value="customer-kyc"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  User KYC ({pendingCustomerKyc.length})
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_products") && (
                <TabsTrigger
                  value="products"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Products ({pendingProducts.length})
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_orders") && (
                <TabsTrigger
                  value="orders"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Orders
                </TabsTrigger>
              )}
              {(adminRole?.permissions.includes("manage_transactions")) && (
                <TabsTrigger
                  value="transactions"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Secure Settlements
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_payouts") && (
                <TabsTrigger
                  value="payouts"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Payouts ({payouts.filter(p => p.status === "pending").length})
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_support") && (
                <TabsTrigger
                  value="support"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Support ({pendingTickets.length})
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_promotions") && (
                <TabsTrigger
                  value="promotions"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Promotions
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_vendors") && (
                <TabsTrigger
                  value="vendors"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Vendors
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_transporters") && (
                <TabsTrigger
                  value="transporters"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Transporters
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_customers") && (
                <TabsTrigger
                  value="customers"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Customers
                </TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_subscriptions") && (
                <TabsTrigger
                  value="subscriptions"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Subscriptions
                </TabsTrigger>
              )}
              {showAdminManagement && (
                <TabsTrigger
                  value="admins"
                  className="px-5 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white text-xs font-semibold"
                >
                  Admin Users
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <TabsContent value="analytics" className="border-none p-0 outline-none">
            <AnalyticsTab stats={stats} vendorTypesAnalytics={vendorTypesAnalytics} />
          </TabsContent>

          <TabsContent value="kyc" className="border-none p-0 outline-none">
            <KYCApprovalTab vendors={pendingVendors} />
          </TabsContent>

          <TabsContent value="transporter-kyc" className="border-none p-0 outline-none">
            <TransporterKYCApprovalTab transporters={pendingTransporters} />
          </TabsContent>

          <TabsContent value="customer-kyc" className="border-none p-0 outline-none">
            <CustomerKYCApprovalTab customers={pendingCustomerKyc} />
          </TabsContent>

          <TabsContent value="products" className="border-none p-0 outline-none">
            <ProductApprovalTab products={pendingProducts} />
          </TabsContent>

          <TabsContent value="orders" className="border-none p-0 outline-none">
            <OrdersManagementTab orders={orders} />
          </TabsContent>

          <TabsContent value="transactions" className="border-none p-0 outline-none">
            <SecureFundsManagementTab transactions={transactions} />
          </TabsContent>

          <TabsContent value="payouts" className="border-none p-0 outline-none">
            <PayoutApprovalTab payouts={payouts} />
          </TabsContent>

          <TabsContent value="support" className="border-none p-0 outline-none">
            <SupportTicketsTab tickets={tickets} />
          </TabsContent>

          <TabsContent value="promotions" className="border-none p-0 outline-none">
            <PromotionsManagementTab promotions={actualPromotions} />
          </TabsContent>

          <TabsContent value="vendors" className="border-none p-0 outline-none">
            <VendorManagementTab />
          </TabsContent>

          <TabsContent value="transporters" className="border-none p-0 outline-none">
            <TransporterManagementTab />
          </TabsContent>

          <TabsContent value="customers" className="border-none p-0 outline-none">
            <CustomerManagementTab />
          </TabsContent>

          <TabsContent value="subscriptions" className="border-none p-0 outline-none">
            <VendorSubscriptionsTab subscriptions={subscriptions} />
          </TabsContent>

          {showAdminManagement && (
            <TabsContent value="admins" className="border-none p-0 outline-none">
              <AdminUsersManagementTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
