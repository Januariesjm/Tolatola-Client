"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Truck, DollarSign, Package, TrendingUp, MapPin, Clock, Crown, User, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"
import { clientApiGet } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { TransporterAssignmentsTab } from "./transporter-assignments-tab"
import { TransporterPaymentsTab } from "./transporter-payments-tab"
import { TransporterWithdrawalsTab } from "./transporter-withdrawals-tab"
import { TransporterSubscriptionTab } from "./transporter-subscription-tab"
import { TransporterProfileTab } from "./transporter-profile-tab"
import { NotificationPopover } from "@/components/layout/notification-popover"
import { DateRangeFilter, filterByDateRange, type DatePeriod } from "../admin/date-range-filter"

interface TransporterDashboardContentProps {
  transporter: any
  assignments: any[]
  payments: any[]
  withdrawals: any[]
  user: any
}

export function TransporterDashboardContent({
  transporter,
  assignments,
  payments,
  withdrawals,
  user,
}: TransporterDashboardContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get("tab") || "assignments"
  const initialOrderId = searchParams.get("orderId") || undefined
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState(initialTab)
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false)
  const [locationStatus, setLocationStatus] = useState<"updated" | "error" | "idle">("idle")
  
  const [localAssignments, setLocalAssignments] = useState(assignments)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [period, setPeriod] = useState<DatePeriod>("all")
  const prevAvailableCountRef = useRef(0)

  // Auto-refresh mechanism
  const fetchAssignments = useCallback(async (silent = false) => {
    if (silent) setIsRefreshing(true)
    try {
      const [assignmentsRes, availableRes] = await Promise.all([
        clientApiGet<{ assignments: any[] }>("assignments"),
        clientApiGet<{ availableOrders: any[] }>("assignments/available").catch(() => ({ availableOrders: [] }))
      ])
      
      const allAssignments = [
        ...(assignmentsRes.assignments || []),
        ...(availableRes.availableOrders || []),
      ]

      const newAvailableCount = (availableRes.availableOrders || []).length
      
      if (silent && newAvailableCount > prevAvailableCountRef.current && prevAvailableCountRef.current > 0) {
        const diff = newAvailableCount - prevAvailableCountRef.current
        toast({
          title: `New Delivery Available! 📦`,
          description: `${diff} new order${diff > 1 ? 's' : ''} ready for pickup.`,
        })
      }
      
      prevAvailableCountRef.current = newAvailableCount
      setLocalAssignments(allAssignments)
    } catch (err) {
      console.error("Failed to load transporter assignments", err)
    } finally {
      setIsRefreshing(false)
    }
  }, [toast])

  // Poll every 30 seconds
  useEffect(() => {
    // Initial ref count setup
    prevAvailableCountRef.current = assignments.filter((a) => a.is_available_order).length

    const interval = setInterval(() => {
      fetchAssignments(true)
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchAssignments, assignments])

  const updateLocation = async () => {
    setIsUpdatingLocation(true)
    setLocationStatus("idle")

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      setIsUpdatingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { clientApiPut } = await import("@/lib/api-client")
          await clientApiPut("transporters/me/location", {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          setLocationStatus("updated")
          router.refresh()
        } catch (error) {
          console.error("Error updating location:", error)
          setLocationStatus("error")
        } finally {
          setIsUpdatingLocation(false)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        setLocationStatus("error")
        setIsUpdatingLocation(false)
      }
    )
  }

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

  const dateFilteredAssignments = useMemo(() => filterByDateRange(localAssignments, period), [localAssignments, period])
  const dateFilteredPayments = useMemo(() => filterByDateRange(payments, period), [payments, period])
  const dateFilteredWithdrawals = useMemo(() => filterByDateRange(withdrawals, period), [withdrawals, period])

  const activeAssignments = dateFilteredAssignments.filter((a) => {
    const isAccepted = ["accepted", "picked_up", "in_transit"].includes(a.status) ||
      (a.status === "assigned" && a.accepted_at);
    const isReady = a.status === "ready_for_pickup";
    return isAccepted || isReady;
  })
  const completedAssignments = dateFilteredAssignments.filter((a) => a.status === "delivered")
  const availableBalance = dateFilteredPayments
    .filter((p) => p.status === "available")
    .reduce((sum, p) => sum + Number(p.amount), 0)
  const pendingBalance = dateFilteredPayments.filter((p) => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Image src="/logo-new.png" alt="TOLA" width={150} height={50} className="h-10 sm:h-16 md:h-20 w-auto" />
            <span className="hidden sm:inline-block"><HeaderAnimatedText /></span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-muted-foreground capitalize hidden sm:inline">{transporter.vehicle_type} Driver</span>
            <NotificationPopover userType="transporter" />
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm px-2 sm:px-3">
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">Transporter Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">{transporter.business_name || "Welcome to your dashboard"}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DateRangeFilter value={period} onChange={setPeriod} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchAssignments(true)}
              disabled={isRefreshing}
              className="gap-1.5 shrink-0 text-xs sm:text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Trips
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-8">
          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Active Deliveries</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                <span className="text-xl sm:text-2xl font-bold">{activeAssignments.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                <span className="text-xl sm:text-2xl font-bold">{completedAssignments.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span className="text-lg sm:text-2xl font-bold">{availableBalance.toLocaleString()} <span className="text-xs sm:text-base">TZS</span></span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Rating</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />
                <span className="text-xl sm:text-2xl font-bold">{transporter.rating || "5.00"}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/50 bg-primary/5 col-span-2 md:col-span-1">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium">My Location</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <Button
                size="sm"
                className="w-full text-xs sm:text-sm"
                onClick={updateLocation}
                disabled={isUpdatingLocation}
              >
                <MapPin className="h-4 w-4 mr-1 sm:mr-2" />
                {isUpdatingLocation ? "Updating..." : "Update Location"}
              </Button>
              {locationStatus === "updated" && (
                <p className="text-[10px] text-green-600 mt-2 text-center font-medium">✓ Location synced</p>
              )}
              {locationStatus === "error" && (
                <p className="text-[10px] text-red-600 mt-2 text-center font-medium">Failed to sync location</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full sm:w-full">
              <TabsTrigger value="assignments" className="text-xs sm:text-sm px-2 sm:px-3 gap-1 sm:gap-2">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Deliveries</span>
                <span className="xs:hidden">Trips</span>
                {activeAssignments.length > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] sm:text-xs px-1.5 py-0 sm:py-0.5 rounded-full">
                    {activeAssignments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs sm:text-sm px-2 sm:px-3 gap-1 sm:gap-2">
                <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Payments</span>
                <span className="sm:hidden">Pay</span>
              </TabsTrigger>
              <TabsTrigger value="withdrawals" className="text-xs sm:text-sm px-2 sm:px-3 gap-1 sm:gap-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Withdrawals</span>
                <span className="sm:hidden">Withdraw</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="text-xs sm:text-sm px-2 sm:px-3 gap-1 sm:gap-2">
                <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Membership</span>
                <span className="sm:hidden">Plan</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="text-xs sm:text-sm px-2 sm:px-3 gap-1 sm:gap-2">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Profile
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="assignments">
            <TransporterAssignmentsTab 
              assignments={dateFilteredAssignments} 
              transporterId={transporter.id} 
              initialOrderId={initialOrderId}
            />
          </TabsContent>

          <TabsContent value="payments">
            <TransporterPaymentsTab
              payments={dateFilteredPayments}
              availableBalance={availableBalance}
              pendingBalance={pendingBalance}
              transporterId={transporter.id}
            />
          </TabsContent>

          <TabsContent value="withdrawals">
            <TransporterWithdrawalsTab withdrawals={dateFilteredWithdrawals} availableBalance={availableBalance} />
          </TabsContent>

          <TabsContent value="subscription">
            <TransporterSubscriptionTab transporterId={transporter.id} />
          </TabsContent>

          <TabsContent value="profile">
            <TransporterProfileTab user={user} transporter={transporter} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
