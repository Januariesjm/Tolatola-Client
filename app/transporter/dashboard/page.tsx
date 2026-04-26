import { redirect } from "next/navigation"
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { TransporterDashboardContent } from "@/components/transporter/transporter-dashboard-content"
import { serverApiGet } from "@/lib/api-server"

export const dynamic = "force-dynamic"

export default async function TransporterDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  try {
    // Fetch transporter from backend
    const transporterRes = await serverApiGet<{ transporter: any }>("transporters/me")
    const transporter = transporterRes.transporter

    if (!transporter) {
      redirect("/transporter/register")
    }

    if (transporter.kyc_status === "pending") {
      redirect("/transporter/kyc-pending")
    }

    if (transporter.kyc_status === "rejected") {
      redirect("/transporter/kyc-rejected")
    }

    // Fetch assignments, payments, withdrawals, and available open trips from backend
    const [assignmentsRes, paymentsRes, withdrawalsRes, availableTripsRes] = await Promise.all([
      serverApiGet<{ assignments: any[] }>("assignments"),
      serverApiGet<{ payments: any[] }>("transporters/payments"),
      serverApiGet<{ withdrawals: any[] }>("transporters/withdrawals"),
      serverApiGet<{ orders: any[] }>("available-trips").catch(() => ({ orders: [] })),
    ])

    return (
      <Suspense fallback={<div className="flex h-screen items-center justify-center p-4"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>}>
        <TransporterDashboardContent
          transporter={transporter}
          assignments={assignmentsRes.assignments || []}
          availableOrders={availableTripsRes.orders || []}
          payments={paymentsRes.payments || []}
          withdrawals={withdrawalsRes.withdrawals || []}
          user={user}
        />
      </Suspense>
    )
  } catch (error) {
    console.error("Error loading transporter dashboard:", error)
    redirect("/transporter/register")
  }
}
