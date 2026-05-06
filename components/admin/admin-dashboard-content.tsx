"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LogOut,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  BarChart3,
  Truck,
  Store,
  UserCircle2,
  CreditCard,
  LifeBuoy,
  Percent,
  Briefcase,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Badge } from "@/components/ui/badge"
import { NotificationPopover } from "../layout/notification-popover"

import { AnalyticsTab } from "./analytics-tab"
import { ActivityLogsTab } from "./activity-logs-tab"
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
import { HRApplicationsTab } from "./hr-applications-tab"

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
  careerApplications?: any[]
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
  careerApplications = [],
}: AdminDashboardContentProps) {
  const router = useRouter()
  
  const getInitialTab = () => {
    if (!adminRole?.permissions) return "analytics"
    const p = adminRole.permissions
    if (p.includes("view_analytics")) return "analytics"
    if (p.includes("manage_support")) return "support"
    if (p.includes("manage_hr")) return "hr"
    if (p.includes("manage_system")) return "admins"
    return "analytics"
  }
  const initialTab = getInitialTab()

  const [activeTab, setActiveTab] = useState(initialTab)

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
              <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-primary/20 bg-white">
                <Image
                  src="/logo-new.png"
                  alt="TolaTola"
                  fill
                  className="object-contain p-1.5"
                  priority
                />
              </div>
              <span className="text-2xl font-semibold tracking-tight text-slate-900 uppercase">
                TOLA <span className="text-primary">{adminRole?.roleName || "ADMIN"}</span>
              </span>
            </Link>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              {adminRole?.roleName || "Administrator"}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <NotificationPopover />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminRole?.permissions.includes("manage_transactions") && (
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
        )}

          {adminRole?.permissions.includes("manage_orders") && (
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
        )}

          {adminRole?.permissions.includes("manage_kyc") && (
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
        )}

          {adminRole?.permissions.includes("manage_support") && (
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
        )}
        </div>

        <div className="flex gap-6 items-start">
          {/* Sidebar navigation (desktop) */}
          <aside className="hidden md:block w-60 shrink-0">
            <div className="sticky top-24 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Dashboard Sections
              </p>
              <div className="space-y-1">
                {adminRole?.permissions.includes("view_analytics") && (
                  <Button
                    variant={activeTab === "analytics" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "analytics"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("analytics")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <BarChart3 className="h-4 w-4" />
                      <span>Analytics</span>
                    </span>
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_kyc") && (
                  <Button
                    variant={activeTab === "kyc" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "kyc"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("kyc")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Vendor KYC</span>
                    </span>
                    {pendingVendors.length > 0 && (
                      <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                        {pendingVendors.length}
                      </span>
                    )}
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_kyc") && (
                  <Button
                    variant={activeTab === "transporter-kyc" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "transporter-kyc"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("transporter-kyc")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Truck className="h-4 w-4" />
                      <span>Transporter KYC</span>
                    </span>
                    {pendingTransporters.length > 0 && (
                      <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                        {pendingTransporters.length}
                      </span>
                    )}
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_kyc") && (
                  <Button
                    variant={activeTab === "customer-kyc" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "customer-kyc"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("customer-kyc")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <UserCircle2 className="h-4 w-4" />
                      <span>User KYC</span>
                    </span>
                    {pendingCustomerKyc.length > 0 && (
                      <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                        {pendingCustomerKyc.length}
                      </span>
                    )}
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_products") && (
                  <Button
                    variant={activeTab === "products" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "products"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("products")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Package className="h-4 w-4" />
                      <span>Products</span>
                    </span>
                    {pendingProducts.length > 0 && (
                      <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                        {pendingProducts.length}
                      </span>
                    )}
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_orders") && (
                  <Button
                    variant={activeTab === "orders" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "orders"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("orders")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <ShoppingCart className="h-4 w-4" />
                      <span>Orders</span>
                    </span>
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_transactions") && (
                  <Button
                    variant={activeTab === "transactions" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "transactions"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("transactions")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <ShieldCheck className="h-4 w-4" />
                      <span>Secure Settlements</span>
                    </span>
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_payouts") && (
                  <Button
                    variant={activeTab === "payouts" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "payouts"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("payouts")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="h-4 w-4" />
                      <span>Payouts</span>
                    </span>
                    {payouts.filter(p => p.status === "pending").length > 0 && (
                      <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                        {payouts.filter(p => p.status === "pending").length}
                      </span>
                    )}
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_support") && (
                  <Button
                    variant={activeTab === "support" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "support"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("support")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <LifeBuoy className="h-4 w-4" />
                      <span>Support</span>
                    </span>
                    {pendingTickets.length > 0 && (
                      <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                        {pendingTickets.length}
                      </span>
                    )}
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_promotions") && (
                  <Button
                    variant={activeTab === "promotions" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "promotions"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("promotions")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Percent className="h-4 w-4" />
                      <span>Promotions</span>
                    </span>
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_vendors") && (
                  <Button
                    variant={activeTab === "vendors" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "vendors"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("vendors")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Store className="h-4 w-4" />
                      <span>Vendors</span>
                    </span>
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_transporters") && (
                  <Button
                    variant={activeTab === "transporters" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "transporters"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("transporters")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Truck className="h-4 w-4" />
                      <span>Transporters</span>
                    </span>
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_customers") && (
                  <Button
                    variant={activeTab === "customers" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "customers"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("customers")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      <span>Customers</span>
                    </span>
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_subscriptions") && (
                  <Button
                    variant={activeTab === "subscriptions" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "subscriptions"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("subscriptions")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <CreditCard className="h-4 w-4" />
                      <span>Subscriptions</span>
                    </span>
                  </Button>
                )}

                {adminRole?.permissions.includes("manage_hr") && (
                  <Button
                    variant={activeTab === "hr" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "hr"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("hr")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Briefcase className="h-4 w-4" />
                      <span>Human Resource</span>
                    </span>
                    {careerApplications.filter(a => a.status === "pending").length > 0 && (
                      <span className="text-xs font-semibold rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">
                        {careerApplications.filter(a => a.status === "pending").length}
                      </span>
                    )}
                  </Button>
                )}

                {adminRole?.permissions.includes("view_logs") && (
                  <Button
                    variant={activeTab === "logs" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "logs"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("logs")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <BarChart3 className="h-4 w-4" />
                      <span>Activity Logs</span>
                    </span>
                  </Button>
                )}

                {showAdminManagement && (
                  <Button
                    variant={activeTab === "admins" ? "default" : "ghost"}
                    size="sm"
                    className={`w-full justify-between rounded-xl ${activeTab === "admins"
                        ? "bg-primary text-white"
                        : "text-slate-700 hover:bg-slate-100"
                      }`}
                    onClick={() => setActiveTab("admins")}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <UserCircle2 className="h-4 w-4" />
                      <span>Admin Users</span>
                    </span>
                  </Button>
                )}
              </div>
            </div>
          </aside>

          {/* Main tab content */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              {/* Mobile nav: keep horizontal tabs for small screens */}
              <div className="overflow-x-auto pb-2 md:hidden">
                <TabsList className="inline-flex whitespace-nowrap bg-white/80 border border-slate-200 rounded-full px-1 py-1 h-auto shadow-sm">
                  {adminRole?.permissions.includes("view_analytics") && (
                    <TabsTrigger value="analytics" className="px-5 rounded-full text-xs font-semibold">
                      Analytics
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_kyc") && (
                    <TabsTrigger value="kyc" className="px-5 rounded-full text-xs font-semibold">
                      Vendor KYC ({pendingVendors.length})
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_kyc") && (
                    <TabsTrigger value="transporter-kyc" className="px-5 rounded-full text-xs font-semibold">
                      Transporter KYC ({pendingTransporters.length})
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_kyc") && (
                    <TabsTrigger value="customer-kyc" className="px-5 rounded-full text-xs font-semibold">
                      User KYC ({pendingCustomerKyc.length})
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_products") && (
                    <TabsTrigger value="products" className="px-5 rounded-full text-xs font-semibold">
                      Products ({pendingProducts.length})
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_orders") && (
                    <TabsTrigger value="orders" className="px-5 rounded-full text-xs font-semibold">
                      Orders
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_transactions") && (
                    <TabsTrigger value="transactions" className="px-5 rounded-full text-xs font-semibold">
                      Secure Settlements
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_payouts") && (
                    <TabsTrigger value="payouts" className="px-5 rounded-full text-xs font-semibold">
                      Payouts ({payouts.filter(p => p.status === "pending").length})
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_support") && (
                    <TabsTrigger value="support" className="px-5 rounded-full text-xs font-semibold">
                      Support ({pendingTickets.length})
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_promotions") && (
                    <TabsTrigger value="promotions" className="px-5 rounded-full text-xs font-semibold">
                      Promotions
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_vendors") && (
                    <TabsTrigger value="vendors" className="px-5 rounded-full text-xs font-semibold">
                      Vendors
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_transporters") && (
                    <TabsTrigger value="transporters" className="px-5 rounded-full text-xs font-semibold">
                      Transporters
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_customers") && (
                    <TabsTrigger value="customers" className="px-5 rounded-full text-xs font-semibold">
                      Customers
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_subscriptions") && (
                    <TabsTrigger value="subscriptions" className="px-5 rounded-full text-xs font-semibold">
                      Subscriptions
                    </TabsTrigger>
                  )}
                  {adminRole?.permissions.includes("manage_hr") && (
                    <TabsTrigger value="hr" className="px-5 rounded-full text-xs font-semibold">
                      HR ({careerApplications.filter(a => a.status === "pending").length})
                    </TabsTrigger>
                  )}
                  {showAdminManagement && (
                    <TabsTrigger value="admins" className="px-5 rounded-full text-xs font-semibold">
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

              <TabsContent value="hr" className="border-none p-0 outline-none">
                <HRApplicationsTab applications={careerApplications} />
              </TabsContent>

              {adminRole?.permissions.includes("view_logs") && (
                <TabsContent value="logs" className="border-none p-0 outline-none">
                  <ActivityLogsTab />
                </TabsContent>
              )}

              {showAdminManagement && (
                <TabsContent value="admins" className="border-none p-0 outline-none">
                  <AdminUsersManagementTab />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
