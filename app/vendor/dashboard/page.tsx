import { redirect } from "next/navigation"
import { VendorDashboardContent } from "@/components/vendor/vendor-dashboard-content"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import { serverApiGet } from "@/lib/api-server"
import type { Database } from "@/lib/types"

export const dynamic = "force-dynamic"

export default async function VendorDashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies, headers } as any)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login?returnUrl=/vendor/dashboard")
  }

  // Fetch vendor profile via API
  const vendorRes = await serverApiGet<{ data: any[] }>("vendors")
  const vendor = vendorRes.data?.[0] || null

  if (!vendor) {
    redirect("/vendor/register")
  }

  if (vendor.kyc_status === "pending") {
    redirect("/vendor/kyc-pending")
  }

  if (vendor.kyc_status === "rejected") {
    redirect("/vendor/kyc-rejected")
  }

  const shopsRes = await serverApiGet<{ data: any[] }>(`vendors/${vendor.id}/shops`)
  const shop = shopsRes.data?.[0] || null

  let products: any[] = []
  if (shop?.id) {
    const prodsRes = await serverApiGet<{ data: any[] }>(`shops/${shop.id}/products`)
    products = prodsRes.data || []
  }

  return <VendorDashboardContent vendor={vendor} shop={shop} products={products} />
}
