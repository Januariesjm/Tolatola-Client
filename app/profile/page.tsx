import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ProfileContent from "@/components/profile/profile-content"
import SiteHeader from "@/components/layout/site-header"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await (supabase.from("users").select("*").eq("id", user.id) as any).single()

  // Fetch KYC status
  const { data: kyc } = await (supabase.from("customer_kyc").select("*").eq("user_id", user.id) as any).maybeSingle()

  // Fetch orders
  const { data: orders } = await (supabase
    .from("orders")
    .select(
      `
      *,
      order_items (
        *,
        product:products (
          name,
          images
        )
      )
    `,
    )
    .eq("customer_id", user.id) as any)
    .order("created_at", { ascending: false })

  // Fetch transactions
  const { data: transactions } = await (supabase
    .from("transactions")
    .select("*")
    .eq("user_id", user.id) as any)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SiteHeader user={user} profile={profile} kycStatus={kyc?.kyc_status} />
      <ProfileContent user={user} profile={profile} kyc={kyc} orders={orders || []} transactions={transactions || []} />
    </div>
  )
}
