"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Truck, DollarSign, Package, TrendingUp, MapPin, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"
import { TransporterAssignmentsTab } from "./transporter-assignments-tab"
import { TransporterPaymentsTab } from "./transporter-payments-tab"
import { TransporterWithdrawalsTab } from "./transporter-withdrawals-tab"

interface TransporterDashboardContentProps {
  transporter: any
  assignments: any[]
  payments: any[]
  withdrawals: any[]
}

export function TransporterDashboardContent({
  transporter,
  assignments,
  payments,
  withdrawals,
}: TransporterDashboardContentProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Clear Supabase session on client side first
      const { createClient } = await import("@/lib/supabase/client")
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
    } finally {
      // Force redirect to home page
      window.location.href = "/"
    }
  }

  const activeAssignments = assignments.filter((a) => ["assigned", "picked_up", "in_transit"].includes(a.status))
  const completedAssignments = assignments.filter((a) => a.status === "delivered")
  const availableBalance = payments
    .filter((p) => p.status === "available")
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const pendingBalance = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0)

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
            <span className="text-sm text-muted-foreground capitalize">{transporter.vehicle_type} Driver</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Transporter Dashboard</h1>
          <p className="text-muted-foreground">{transporter.business_name || "Welcome to your dashboard"}</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{activeAssignments.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{transporter.total_deliveries || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">{availableBalance.toLocaleString()} TZS</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                <span className="text-2xl font-bold">{transporter.rating || "5.00"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="assignments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="assignments">
              <MapPin className="h-4 w-4 mr-2" />
              Deliveries
              {activeAssignments.length > 0 && (
                <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {activeAssignments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="payments">
              <DollarSign className="h-4 w-4 mr-2" />
              Payments
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              <Clock className="h-4 w-4 mr-2" />
              Withdrawals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments">
            <TransporterAssignmentsTab assignments={assignments} transporterId={transporter.id} />
          </TabsContent>

          <TabsContent value="payments">
            <TransporterPaymentsTab
              payments={payments}
              availableBalance={availableBalance}
              pendingBalance={pendingBalance}
              transporterId={transporter.id}
            />
          </TabsContent>

          <TabsContent value="withdrawals">
            <TransporterWithdrawalsTab withdrawals={withdrawals} availableBalance={availableBalance} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
