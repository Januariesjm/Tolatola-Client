"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Users, Package, ShoppingCart, DollarSign, MessageSquare, Megaphone, Crown, Store } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"
import { KYCApprovalTab } from "./kyc-approval-tab"
import { ProductApprovalTab } from "./product-approval-tab"
import { OrdersManagementTab } from "./orders-management-tab"
import { EscrowManagementTab } from "./escrow-management-tab"
import { SupportTicketsTab } from "./support-tickets-tab"
import { PayoutApprovalTab } from "./payout-approval-tab"
import { AnalyticsTab } from "./analytics-tab"
import { PromotionsManagementTab } from "./promotions-management-tab"
import { AdminUsersManagementTab } from "./admin-users-management-tab"
import { TransporterKYCApprovalTab } from "./transporter-kyc-approval-tab"
import { VendorSubscriptionsTab } from "./vendor-subscriptions-tab"
import { VendorManagementTab } from "./vendor-management-tab"

interface AdminDashboardContentProps {
  adminRole: any
  pendingVendors: any[]
  pendingTransporters: any[]
  pendingProducts: any[]
  orders: any[]
  escrows: any[]
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
  escrows,
  tickets,
  payouts,
  stats,
  promotions,
  vendorTypesAnalytics = {},
}: AdminDashboardContentProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Clear Supabase session on client side first
      const supabase = createClient()
      await supabase.auth.signOut()
      
      // Also call backend logout (optional, but good for consistency)
      try {
        const { clientApiPost } = await import("@/lib/api-client")
        await clientApiPost("auth/logout")
      } catch (apiError) {
        // Backend logout failed, but we've already cleared local session
        console.error("Backend logout error:", apiError)
      }
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback: clear any cached auth data
      if (typeof window !== "undefined") {
        localStorage.removeItem("supabase.auth.token")
      }
    } finally {
      // Force redirect to home page
      window.location.href = "/"
    }
  }

  const pendingTickets = tickets.filter((t) => t.status === "open")
  const showAdminManagement = adminRole?.permissions.includes("manage_admins")

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/tolalogo.jpg" alt="TOLA" width={150} height={50} className="h-16 md:h-20 w-auto" />
            <HeaderAnimatedText />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {adminRole?.roleName} • Access Level: {adminRole?.accessLevel}%
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{adminRole?.roleName} Dashboard</h1>
          <p className="text-muted-foreground">
            {adminRole?.roleName === "Super Admin"
              ? "Full system control and management"
              : `Access Level: ${adminRole?.accessLevel}% - ${adminRole?.permissions.join(", ")}`}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending KYC</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-yellow-600" />
                <span className="text-2xl font-bold">{pendingVendors.length + pendingTransporters.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{pendingProducts.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{orders.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Escrows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{escrows.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-red-600" />
                <span className="text-2xl font-bold">{pendingTickets.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            {adminRole?.permissions.includes("manage_promotions") && (
              <TabsTrigger value="promotions">
                <Megaphone className="h-4 w-4 mr-2" />
                Promotions
              </TabsTrigger>
            )}
            {adminRole?.permissions.includes("manage_vendors") && (
              <TabsTrigger value="vendors">
                <Store className="h-4 w-4 mr-2" />
                All Vendors
              </TabsTrigger>
            )}
            {adminRole?.permissions.includes("manage_vendors") && (
              <TabsTrigger value="subscriptions">
                <Crown className="h-4 w-4 mr-2" />
                Subscriptions
              </TabsTrigger>
            )}
            {adminRole?.permissions.includes("manage_vendors") && (
              <TabsTrigger value="kyc">
                KYC Approval
                {pendingVendors.length + pendingTransporters.length > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingVendors.length + pendingTransporters.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {adminRole?.permissions.includes("manage_products") && (
              <TabsTrigger value="products">
                Products
                {pendingProducts.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingProducts.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {adminRole?.permissions.includes("manage_orders") && <TabsTrigger value="orders">Orders</TabsTrigger>}
            {adminRole?.permissions.includes("manage_escrow") && <TabsTrigger value="escrow">Escrow</TabsTrigger>}
            {adminRole?.permissions.includes("manage_payouts") && (
              <TabsTrigger value="payouts">
                Payouts
                {payouts.filter((p) => p.status === "pending").length > 0 && (
                  <span className="ml-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {payouts.filter((p) => p.status === "pending").length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {adminRole?.permissions.includes("manage_support") && (
              <TabsTrigger value="support">
                Support
                {pendingTickets.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingTickets.length}
                  </span>
                )}
              </TabsTrigger>
            )}
            {showAdminManagement && (
              <TabsTrigger value="admins">
                <Users className="h-4 w-4 mr-2" />
                Admin Users
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsTab stats={stats} vendorTypesAnalytics={vendorTypesAnalytics} />
          </TabsContent>

          {adminRole?.permissions.includes("manage_promotions") && (
            <TabsContent value="promotions">
              <PromotionsManagementTab promotions={promotions} />
            </TabsContent>
          )}

          {adminRole?.permissions.includes("manage_vendors") && (
            <TabsContent value="vendors">
              <VendorManagementTab />
            </TabsContent>
          )}

          {adminRole?.permissions.includes("manage_vendors") && (
            <TabsContent value="subscriptions">
              <VendorSubscriptionsTab />
            </TabsContent>
          )}

          {adminRole?.permissions.includes("manage_vendors") && (
            <TabsContent value="kyc">
              <Tabs defaultValue="vendors" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="vendors">
                    Vendors
                    {pendingVendors.length > 0 && (
                      <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {pendingVendors.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="transporters">
                    Transporters
                    {pendingTransporters.length > 0 && (
                      <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {pendingTransporters.length}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="vendors">
                  <KYCApprovalTab vendors={pendingVendors} />
                </TabsContent>
                <TabsContent value="transporters">
                  <TransporterKYCApprovalTab transporters={pendingTransporters} />
                </TabsContent>
              </Tabs>
            </TabsContent>
          )}

          {adminRole?.permissions.includes("manage_products") && (
            <TabsContent value="products">
              <ProductApprovalTab products={pendingProducts} />
            </TabsContent>
          )}

          {adminRole?.permissions.includes("manage_orders") && (
            <TabsContent value="orders">
              <OrdersManagementTab orders={orders} />
            </TabsContent>
          )}

          {adminRole?.permissions.includes("manage_escrow") && (
            <TabsContent value="escrow">
              <EscrowManagementTab escrows={escrows} />
            </TabsContent>
          )}

          {adminRole?.permissions.includes("manage_payouts") && (
            <TabsContent value="payouts">
              <PayoutApprovalTab payouts={payouts} />
            </TabsContent>
          )}

          {adminRole?.permissions.includes("manage_support") && (
            <TabsContent value="support">
              <SupportTicketsTab tickets={tickets} />
            </TabsContent>
          )}

          {showAdminManagement && (
            <TabsContent value="admins">
              <AdminUsersManagementTab />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  )
}
