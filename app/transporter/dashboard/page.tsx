import { redirect } from "next/navigation"
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

    // Fetch assignments, payments, and withdrawals from backend
    const [assignmentsRes, paymentsRes, withdrawalsRes] = await Promise.all([
      serverApiGet<{ assignments: any[] }>("assignments"),
      serverApiGet<{ payments: any[] }>("transporters/payments"),
      serverApiGet<{ withdrawals: any[] }>("transporters/withdrawals"),
    ])

    return (
      <TransporterDashboardContent
        transporter={transporter}
        assignments={assignmentsRes.assignments || []}
        payments={paymentsRes.payments || []}
        withdrawals={withdrawalsRes.withdrawals || []}
      />
    )
  } catch (error) {
    console.error("Error loading transporter dashboard:", error)
    redirect("/transporter/register")
  }
}
