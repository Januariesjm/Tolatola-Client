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
  // ... (keep handleLogout)

  const pendingTickets = tickets.filter((t) => t.status === "open")
  const showAdminManagement = adminRole?.permissions.includes("manage_admins")

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ... header ... */}

      {/* Stats Overview */}
      {/* ... other cards ... */}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-purple-600" />
            <span className="text-2xl font-bold">{transactions.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* ... other cards ... */}

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList>
          {/* ... other tabs ... */}
          {adminRole?.permissions.includes("manage_orders") && <TabsTrigger value="orders">Orders</TabsTrigger>}
          {(adminRole?.permissions.includes("manage_escrow") || adminRole?.permissions.includes("manage_transactions")) && (
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          )}
          {/* ... other tabs ... */}
        </TabsList>

        <TabsContent value="analytics">
          <AnalyticsTab stats={stats} vendorTypesAnalytics={vendorTypesAnalytics} />
        </TabsContent>

        {/* ... other content ... */}

        {(adminRole?.permissions.includes("manage_escrow") || adminRole?.permissions.includes("manage_transactions")) && (
          <TabsContent value="transactions">
            <EscrowManagementTab escrows={transactions} />
          </TabsContent>
        )}

        {/* ... other content ... */}
      </Tabs>
    </div>
    </div >
  )
}
