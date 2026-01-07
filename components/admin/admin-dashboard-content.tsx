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
import { EscrowManagementTab } from "./escrow-management-tab"
import { PayoutApprovalTab } from "./payout-approval-tab"
import { SupportTicketsTab } from "./support-tickets-tab"
import { PromotionsManagementTab } from "./promotions-management-tab"
import { VendorManagementTab } from "./vendor-management-tab"
import { TransporterManagementTab } from "./transporter-management-tab"
import { CustomerManagementTab } from "./customer-management-tab"
import { VendorSubscriptionsTab } from "./vendor-subscriptions-tab"
import { AdminUsersManagementTab } from "./admin-users-management-tab"

interface AdminDashboardContentProps {
  adminRole: any
  pendingVendors: any[]
  pendingTransporters: any[]
  pendingProducts: any[]
  orders: any[]
  transactions: any[]
  tickets: any[]
  payouts: any[]
  stats: any
  promotions: any[]
  vendorTypesAnalytics?: any
}

export function AdminDashboardContent({
  adminRole,
  pendingVendors,
  pendingTransporters,
  pendingProducts,
  orders,
  transactions,
  tickets,
  payouts,
  stats,
  promotions,
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold tracking-tighter">TOLATOLA <span className="text-muted-foreground font-light">ADMIN</span></span>
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
          <Card className="border-none shadow-sm bg-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Total GMV</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">TZS {stats.totalGMV?.toLocaleString() || 0}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Lifetime platform volume</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Active Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Currently being processed</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pending KYC</CardTitle>
              <Users className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{pendingVendors.length + pendingTransporters.length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Awaiting verification</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-background">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Open Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{pendingTickets.length}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Requires support attention</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto pb-2">
            <TabsList className="bg-background/50 border h-12 inline-flex whitespace-nowrap">
              <TabsTrigger value="analytics" className="px-6">Analytics</TabsTrigger>
              {adminRole?.permissions.includes("manage_kyc") && <TabsTrigger value="kyc" className="px-6">Vendor KYC ({pendingVendors.length})</TabsTrigger>}
              {adminRole?.permissions.includes("manage_kyc") && <TabsTrigger value="transporter-kyc" className="px-6">Transporter KYC ({pendingTransporters.length})</TabsTrigger>}
              {adminRole?.permissions.includes("manage_products") && <TabsTrigger value="products" className="px-6">Products ({pendingProducts.length})</TabsTrigger>}
              {adminRole?.permissions.includes("manage_orders") && <TabsTrigger value="orders" className="px-6">Orders</TabsTrigger>}
              {(adminRole?.permissions.includes("manage_escrow") || adminRole?.permissions.includes("manage_transactions")) && (
                <TabsTrigger value="transactions" className="px-6">Transactions</TabsTrigger>
              )}
              {adminRole?.permissions.includes("manage_payouts") && <TabsTrigger value="payouts" className="px-6">Payouts ({payouts.filter(p => p.status === 'pending').length})</TabsTrigger>}
              {adminRole?.permissions.includes("manage_support") && <TabsTrigger value="support" className="px-6">Support ({pendingTickets.length})</TabsTrigger>}
              {adminRole?.permissions.includes("manage_promotions") && <TabsTrigger value="promotions" className="px-6">Promotions</TabsTrigger>}
              {adminRole?.permissions.includes("manage_vendors") && <TabsTrigger value="vendors" className="px-6">Vendors</TabsTrigger>}
              {adminRole?.permissions.includes("manage_transporters") && <TabsTrigger value="transporters" className="px-6">Transporters</TabsTrigger>}
              {adminRole?.permissions.includes("manage_customers") && <TabsTrigger value="customers" className="px-6">Customers</TabsTrigger>}
              {adminRole?.permissions.includes("manage_subscriptions") && <TabsTrigger value="subscriptions" className="px-6">Subscriptions</TabsTrigger>}
              {showAdminManagement && <TabsTrigger value="admins" className="px-6">Admin Users</TabsTrigger>}
            </TabsList>
          </div>

          <TabsContent value="analytics" className="border-none p-0 outline-none">
            <AnalyticsTab stats={stats} vendorTypesAnalytics={vendorTypesAnalytics} />
          </TabsContent>

          <TabsContent value="kyc" className="border-none p-0 outline-none">
            <KYCApprovalTab pendingVendors={pendingVendors} />
          </TabsContent>

          <TabsContent value="transporter-kyc" className="border-none p-0 outline-none">
            <TransporterKYCApprovalTab pendingTransporters={pendingTransporters} />
          </TabsContent>

          <TabsContent value="products" className="border-none p-0 outline-none">
            <ProductApprovalTab products={pendingProducts} />
          </TabsContent>

          <TabsContent value="orders" className="border-none p-0 outline-none">
            <OrdersManagementTab orders={orders} />
          </TabsContent>

          <TabsContent value="transactions" className="border-none p-0 outline-none">
            <EscrowManagementTab escrows={transactions} />
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
            <VendorSubscriptionsTab />
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
