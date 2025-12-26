import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content"
import { redirect } from "next/navigation"
import { serverApiGet } from "@/lib/api-server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import type { Database } from "@/lib/types"

export default async function AdminDashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies, headers })

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
  let pendingProducts: any[] = []
  let orders: any[] = []
  let escrows: any[] = []
  let tickets: any[] = []
  let payouts: any[] = []
  let promotions: any[] = []
  let vendorTypesAnalytics: any = {}
  let stats = {
    totalVendors: 0,
    activeVendors: 0,
    totalProducts: 0,
    approvedProducts: 0,
    totalOrders: 0,
    completedOrders: 0,
    totalGMV: 0,
    totalEscrow: 0,
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
    const roleRes = await serverApiGet<{ roles: any[] }>("admin/roles")
    adminRole = roleRes?.roles?.[0] || null
    if (!adminRole) {
      return <div>You need admin access to view this page.</div>
    }

    const [vendorsRes, productsRes, ordersRes, escrowsRes, ticketsRes, payoutsRes, promosRes, statsRes, adminsRes, revokeRes, transportersRes, vendorTypesRes] =
      await Promise.all([
      serverApiGet<{ data: any[] }>("vendors").catch(() => ({ data: [] })),
      serverApiGet<{ data: any[] }>("products").catch(() => ({ data: [] })),
      serverApiGet<{ data: any[] }>("admin/orders").catch(() => ({ data: [] })),
      serverApiGet<{ data: any[] }>("admin/escrows").catch(() => ({ data: [] })),
      serverApiGet<{ data: any[] }>("admin/tickets").catch(() => ({ data: [] })),
      serverApiGet<{ data: any[] }>("payouts/request").catch(() => ({ data: [] })),
      serverApiGet<{ data: any[] }>("promotions").catch(() => ({ data: [] })),
        serverApiGet<{ stats: any }>("admin/stats").catch(() => ({ stats: {} })),
        serverApiGet<{ admins: any[] }>("admin/users").catch(() => ({ admins: [] })),
        serverApiGet<{ data: any[] }>("admin/revoke-history").catch(() => ({ data: [] })),
        serverApiGet<{ data: any[] }>("admin/transporters").catch(() => ({ data: [] })),
        serverApiGet<{ analytics: any }>("admin/vendor-types").catch(() => ({ analytics: {} })),
    ])

    pendingVendors = vendorsRes.data?.filter((v) => v.kyc_status === "pending") || []
    pendingTransporters = transportersRes.data?.filter((t) => t.kyc_status === "pending") || []
    pendingProducts = productsRes.data?.filter((p) => p.status === "pending") || []
    orders = ordersRes.data || []
    escrows = escrowsRes.data || []
    tickets = ticketsRes.data || []
    payouts = payoutsRes.data || []
    promotions = promosRes.data || []

    stats = statsRes.stats || stats
    vendorTypesAnalytics = vendorTypesRes.analytics || {}
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
    console.error("[v0] Admin page API error:", error)
    return <div>Failed to load admin data.</div>
  }

  return (
    <AdminDashboardContent
      adminRole={{
        roleName: adminRole.role_name,
        permissions: adminRole.permissions || [],
        accessLevel: adminRole.access_level || 0,
      }}
      pendingVendors={pendingVendors}
      pendingTransporters={pendingTransporters}
      pendingProducts={pendingProducts}
      orders={orders}
      escrows={escrows}
      tickets={tickets}
      payouts={payouts}
      stats={stats}
      promotions={promotions}
      vendorTypesAnalytics={vendorTypesAnalytics}
    />
  )
}
