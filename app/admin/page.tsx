import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content"
import { redirect } from "next/navigation"
import { serverApiGet } from "@/lib/api-server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import type { Database } from "@/lib/types"
import { logger } from "@/lib/logger"

const log = logger.child("app.admin")

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies, headers } as any)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?returnUrl=/admin")
  }

  // Fetch admin role & data from backend API
  let adminRole: any = null
  let pendingVendors: any[] = []
  let pendingTransporters: any[] = []
  let pendingCustomerKyc: any[] = []
  let pendingProducts: any[] = []
  let allProducts: any[] = []
  let orders: any[] = []
  let transactions: any[] = []
  let tickets: any[] = []
  let payouts: any[] = []
  let promotions: any[] = []
  let subscriptions: any[] = []
  let vendorTypesAnalytics: any = {}
  let careerApplications: any[] = []
  let hrInterviews: any[] = []
  let hrStaffRecords: any[] = []
  let hrContracts: any[] = []
  let hrAttendance: any[] = []
  let incompleteRegistrations: any[] = []
  let initialAgents: any[] = []
  let stats = {
    totalVendors: 0,
    activeVendors: 0,
    totalProducts: 0,
    approvedProducts: 0,
    totalOrders: 0,
    completedOrders: 0,
    totalGMV: 0,
    totalProtectedVolume: 0,
    totalSecureHold: 0,
    totalPayouts: 0,
    totalTransporters: 0,
    activeTransporters: 0,
    approvedTransporters: 0,
    totalDeliveries: 0,
    completedDeliveries: 0,
    totalDeliveryFees: 0,
    totalTransporterEarnings: 0,
  }

  try {
    // Fetch specifically the current user's role and permissions
    adminRole = await serverApiGet<any>("admin/my-role")

    if (!adminRole) {
      return <div>You need admin access to view this page.</div>
    }

    const [
      vendorsRes,
      productsRes,
      ordersRes,
      secureFundsRes,
      ticketsRes,
      payoutsRes,
      promosRes,
      statsRes,
      adminsRes,
      revokeRes,
      transportersRes,
      vendorTypesRes,
      subsRes,
      kycRes,
      careerRes,
      interviewsRes,
      staffRes,
      contractsRes,
      attendanceRes,
      incompleteRegRes,
      agentsRes,
    ] = await Promise.all([
      serverApiGet<{ data: any[] }>("admin/vendors").catch((err) => {
        log.error("error fetching vendors", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/products").catch((err) => {
        log.error("error fetching products", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/orders").catch((err) => {
        log.error("error fetching orders", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/escrows").catch((err) => {
        log.error("error fetching secure funds", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/tickets").catch((err) => {
        log.error("error fetching tickets", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/payouts").catch((err) => {
        log.error("error fetching payouts", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("promotions").catch((err) => {
        log.error("error fetching promotions", err)
        return { data: [] }
      }),
      serverApiGet<{ stats: any }>("admin/stats").catch((err) => {
        log.error("error fetching stats", err)
        return { stats: {} }
      }),
      serverApiGet<{ admins: any[] }>("admin/users").catch((err) => {
        log.error("error fetching admin users", err)
        return { admins: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/revoke-history").catch((err) => {
        log.error("error fetching revoke history", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/transporters").catch((err) => {
        log.error("error fetching transporters", err)
        return { data: [] }
      }),
      serverApiGet<{ analytics: any }>("admin/vendor-types").catch((err) => {
        log.error("error fetching vendor types", err)
        return { analytics: {} }
      }),
      serverApiGet<{ data: any[] }>("admin/subscriptions").catch((err) => {
        log.error("error fetching subscriptions", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/customers-kyc").catch((err) => {
        log.error("error fetching customer kyc", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/career-applications").catch((err) => {
        log.error("error fetching career applications", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/hr/interviews").catch((err) => {
        log.error("error fetching hr interviews", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/hr/staff").catch((err) => {
        log.error("error fetching hr staff", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/hr/contracts").catch((err) => {
        log.error("error fetching hr contracts", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/hr/attendance").catch((err) => {
        log.error("error fetching hr attendance", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/incomplete-registrations").catch((err) => {
        log.error("error fetching incomplete registrations", err)
        return { data: [] }
      }),
      serverApiGet<{ data: any[] }>("admin/agents").catch((err) => {
        log.error("error fetching agents", err)
        return { data: [] }
      }),
    ])

    allProducts = productsRes.data || []
    pendingVendors = vendorsRes.data?.filter((v) => v.kyc_status === "pending") || []
    pendingTransporters = transportersRes.data?.filter((t) => t.kyc_status === "pending") || []
    pendingCustomerKyc = kycRes.data?.filter((k: any) => k.kyc_status === "pending") || []
    pendingProducts = productsRes.data?.filter((p) => p.status === "pending") || []
    orders = ordersRes.data || []
    transactions = secureFundsRes.data || []
    tickets = ticketsRes.data || []
    payouts = payoutsRes.data || []
    promotions = promosRes.data || []
    subscriptions = subsRes.data || []

    stats = { ...stats, ...statsRes.stats }
    // map backend stats.totalEscrow to frontend stats.totalSecureHold if keys differ
    // assuming backend still returns totalEscrow for now
    if ((stats as any).totalEscrow) {
      ;(stats as any).totalSecureHold = (stats as any).totalEscrow
    }

    vendorTypesAnalytics = vendorTypesRes.analytics || {}
    careerApplications = careerRes.data || []
    hrInterviews = interviewsRes.data || []
    hrStaffRecords = staffRes.data || []
    hrContracts = contractsRes.data || []
    hrAttendance = attendanceRes.data || []
    incompleteRegistrations = incompleteRegRes.data || []
    initialAgents = agentsRes.data || []

    const adminUsers = adminsRes.admins || []
    const revokeHistory = revokeRes.data || []

    // include counts from stats fallback if missing
    stats.totalVendors = stats.totalVendors ?? vendorsRes.data?.length ?? 0
    stats.activeVendors = stats.activeVendors ?? vendorsRes.data?.filter((v: any) => v.kyc_status === "approved").length ?? 0
    stats.totalTransporters = stats.totalTransporters ?? transportersRes.data?.length ?? 0
    stats.activeTransporters =
      stats.activeTransporters ??
      transportersRes.data?.filter((t: any) => t.kyc_status === "approved" && t.availability_status === "available").length ??
      0

    // pass admin users and revoke history down via props extension
    promotions = [...promotions, { _adminUsers: adminUsers, _revokeHistory: revokeHistory }]
  } catch (error) {
    log.error("admin page API error", error)
    return <div>Failed to load admin data.</div>
  }

  return (
    <AdminDashboardContent
      adminRole={adminRole}
      pendingVendors={pendingVendors}
      pendingTransporters={pendingTransporters}
      pendingCustomerKyc={pendingCustomerKyc}
      pendingProducts={pendingProducts}
      allProducts={allProducts}
      orders={orders}
      transactions={transactions}
      tickets={tickets}
      payouts={payouts}
      stats={stats}
      promotions={promotions}
      subscriptions={subscriptions}
      vendorTypesAnalytics={vendorTypesAnalytics}
      careerApplications={careerApplications}
      hrInterviews={hrInterviews}
      hrStaffRecords={hrStaffRecords}
      hrContracts={hrContracts}
      hrAttendance={hrAttendance}
      incompleteRegistrations={incompleteRegistrations}
      initialAgents={initialAgents}
    />
  )
}
