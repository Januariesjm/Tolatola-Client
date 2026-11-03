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
import { logger } from "@/lib/logger"

const log = logger.child("transporter.transporter-dashboard-content")

interface TransporterDashboardContentProps {
  transporter: any
  assignments: any[]
  payments: any[]
  withdrawals: any[]
  user: any
}

export function TransporterDashboardContent({ transporter, assignments, payments, withdrawals, user }: TransporterDashboardContentProps) {
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
  const fetchAssignments = useCallback(
    async (silent = false) => {
      if (silent) setIsRefreshing(true)
      try {
        const [assignmentsRes, availableRes] = await Promise.all([
          clientApiGet<{ assignments: any[] }>("assignments"),
          clientApiGet<{ availableOrders: any[] }>("assignments/available").catch(() => ({ availableOrders: [] })),
        ])

        const allAssignments = [...(assignmentsRes.assignments || []), ...(availableRes.availableOrders || [])]

        const newAvailableCount = (availableRes.availableOrders || []).length

        if (silent && newAvailableCount > prevAvailableCountRef.current && prevAvailableCountRef.current > 0) {
          const diff = newAvailableCount - prevAvailableCountRef.current
          toast({
            title: `New Delivery Available! 📦`,
            description: `${diff} new order${diff > 1 ? "s" : ""} ready for pickup.`,
          })
        }

        prevAvailableCountRef.current = newAvailableCount
        setLocalAssignments(allAssignments)
      } catch (err) {
        log.error("failed to load transporter assignments", err)
      } finally {
        setIsRefreshing(false)
      }
    },
    [toast],
  )

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
          log.error("error updating location", error)
          setLocationStatus("error")
        } finally {
          setIsUpdatingLocation(false)
        }
      },
      (error) => {
        log.error("geolocation error", error)
        setLocationStatus("error")
        setIsUpdatingLocation(false)
      },
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
        log.error("backend logout error", apiError)
      }
    } catch (error) {
      log.error("logout error", error)
    } finally {
      // Force redirect to home page
      window.location.href = "/"
    }
  }

  const dateFilteredAssignments = useMemo(() => filterByDateRange(localAssignments, period), [localAssignments, period])
  const dateFilteredPayments = useMemo(() => filterByDateRange(payments, period), [payments, period])
  const dateFilteredWithdrawals = useMemo(() => filterByDateRange(withdrawals, period), [withdrawals, period])

  const activeAssignments = dateFilteredAssignments.filter((a) => {
    const isAccepted = ["accepted", "picked_up", "in_transit"].includes(a.status) || (a.status === "assigned" && a.accepted_at)
    const isReady = a.status === "ready_for_pickup"
    return isAccepted || isReady
  })
  const completedAssignments = dateFilteredAssignments.filter((a) => a.status === "delivered")
  const availableBalance = dateFilteredPayments.filter((p) => p.status === "available").reduce((sum, p) => sum + Number(p.amount), 0)
  const pendingBalance = dateFilteredPayments.filter((p) => p.status === "pending").reduce((sum, p) => sum + Number(p.amount), 0)

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950/40">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
            <Image
              src="/logo-new.png"
              alt="TOLA"
              width={150}
              height={50}
              className="h-10 sm:h-14 md:h-16 w-auto transition-transform group-hover:scale-105"
            />
            <span className="hidden sm:inline-block">
              <HeaderAnimatedText />
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-border/60 text-xs font-medium text-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="capitalize">{transporter.vehicle_type || "Logistics"} Driver</span>
            </div>
            <NotificationPopover userType="transporter" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs sm:text-sm px-2.5 sm:px-3.5 rounded-lg border-border/80 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <LogOut className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
        {/* Cockpit Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                <Truck className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">Transporter Dashboard</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Verified Driver
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  {transporter.business_name || "Welcome to your logistics cockpit"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
              <DateRangeFilter value={period} onChange={setPeriod} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchAssignments(true)}
                disabled={isRefreshing}
                className="gap-1.5 shrink-0 text-xs sm:text-sm rounded-lg border-border/80 hover:bg-accent/60 shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Refresh Trips</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="rounded-xl border-border/80 shadow-xs hover:shadow-md hover:border-blue-500/40 transition-all group">
            <CardHeader className="pb-1 sm:pb-2 px-3.5 sm:px-5 pt-3.5 sm:pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Active Deliveries</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Truck className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3.5 sm:px-5 pb-3.5 sm:pb-5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{activeAssignments.length}</span>
              <p className="text-[11px] text-muted-foreground mt-1">In progress or ready</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/80 shadow-xs hover:shadow-md hover:border-emerald-500/40 transition-all group">
            <CardHeader className="pb-1 sm:pb-2 px-3.5 sm:px-5 pt-3.5 sm:pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Package className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3.5 sm:px-5 pb-3.5 sm:pb-5">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{completedAssignments.length}</span>
              <p className="text-[11px] text-muted-foreground mt-1">Successful drops</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/80 shadow-xs hover:shadow-md hover:border-purple-500/40 transition-all group">
            <CardHeader className="pb-1 sm:pb-2 px-3.5 sm:px-5 pt-3.5 sm:pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Available Balance</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3.5 sm:px-5 pb-3.5 sm:pb-5">
              <div className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground truncate">
                {availableBalance.toLocaleString()} <span className="text-xs sm:text-sm font-medium text-muted-foreground">TZS</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-medium mt-1">Ready to withdraw</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/80 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all group">
            <CardHeader className="pb-1 sm:pb-2 px-3.5 sm:px-5 pt-3.5 sm:pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Rating</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3.5 sm:px-5 pb-3.5 sm:pb-5">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">{transporter.rating || "5.00"}</span>
                <span className="text-amber-500 text-sm">★</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Driver score</p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-primary/30 bg-gradient-to-b from-primary/5 to-transparent col-span-2 md:col-span-1 shadow-xs hover:shadow-md hover:border-primary/50 transition-all">
            <CardHeader className="pb-1 px-3.5 sm:px-5 pt-3.5 sm:pt-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs sm:text-sm font-medium text-foreground">My Location</CardTitle>
                <MapPin className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="px-3.5 sm:px-5 pb-3.5 sm:pb-5 flex flex-col justify-between">
              <Button
                size="sm"
                className="w-full text-xs font-semibold rounded-lg shadow-xs hover:shadow transition-all"
                onClick={updateLocation}
                disabled={isUpdatingLocation}
              >
                {isUpdatingLocation ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    Update Location
                  </>
                )}
              </Button>
              {locationStatus === "updated" && (
                <p className="text-[11px] text-emerald-600 mt-2 text-center font-semibold animate-in fade-in">✓ Location synced</p>
              )}
              {locationStatus === "error" && (
                <p className="text-[11px] text-rose-600 mt-2 text-center font-semibold animate-in fade-in">Failed to sync location</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5 sm:space-y-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
            <TabsList className="inline-flex w-auto min-w-full sm:w-full p-1.5 rounded-xl bg-card border border-border/80 shadow-xs">
              <TabsTrigger
                value="assignments"
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-lg gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all font-medium"
              >
                <MapPin className="h-4 w-4" />
                <span className="hidden xs:inline">Deliveries</span>
                <span className="xs:hidden">Trips</span>
                {activeAssignments.length > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                    {activeAssignments.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-lg gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all font-medium"
              >
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
                <span className="sm:hidden">Pay</span>
              </TabsTrigger>
              <TabsTrigger
                value="withdrawals"
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-lg gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all font-medium"
              >
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Withdrawals</span>
                <span className="sm:hidden">Withdraw</span>
              </TabsTrigger>
              <TabsTrigger
                value="subscription"
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-lg gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all font-medium"
              >
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Membership</span>
                <span className="sm:hidden">Plan</span>
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="flex-1 text-xs sm:text-sm px-3 py-2 rounded-lg gap-1.5 sm:gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xs transition-all font-medium"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="assignments" className="focus-visible:outline-none">
            <TransporterAssignmentsTab
              assignments={dateFilteredAssignments}
              transporterId={transporter.id}
              initialOrderId={initialOrderId}
            />
          </TabsContent>

          <TabsContent value="payments" className="focus-visible:outline-none">
            <TransporterPaymentsTab
              payments={dateFilteredPayments}
              availableBalance={availableBalance}
              pendingBalance={pendingBalance}
              transporterId={transporter.id}
            />
          </TabsContent>

          <TabsContent value="withdrawals" className="focus-visible:outline-none">
            <TransporterWithdrawalsTab withdrawals={dateFilteredWithdrawals} availableBalance={availableBalance} />
          </TabsContent>

          <TabsContent value="subscription" className="focus-visible:outline-none">
            <TransporterSubscriptionTab transporterId={transporter.id} />
          </TabsContent>

          <TabsContent value="profile" className="focus-visible:outline-none">
            <TransporterProfileTab user={user} transporter={transporter} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
