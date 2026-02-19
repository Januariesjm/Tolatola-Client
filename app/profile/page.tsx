import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ProfileContent from "@/components/profile/profile-content"
import SiteHeader from "@/components/layout/site-header"
import { serverApiGet } from "@/lib/api-server"

export const dynamic = "force-dynamic"

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch profile from backend API (GET /api/profile) — returns { profile, editableFields?, readOnlyFields? }
  let profile: any = null
  let editableFields: string[] | undefined
  let readOnlyFields: string[] | undefined
  try {
    const res = await serverApiGet<{ profile: any; editableFields?: string[]; readOnlyFields?: string[] }>("profile")
    profile = res.profile
    editableFields = res.editableFields
    readOnlyFields = res.readOnlyFields
  } catch (err) {
    // 401 or network: redirect to login
    redirect("/auth/login")
  }

  if (!profile) {
    redirect("/auth/login")
  }

  // Fetch KYC status (from Supabase; not part of profile API)
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

  // Fetch support tickets
  const { data: tickets } = await (supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", user.id) as any)
    .order("created_at", { ascending: false })


  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SiteHeader user={user} profile={profile} kycStatus={kyc?.kyc_status} />
      <ProfileContent
        user={user}
        profile={profile}
        kyc={kyc}
        orders={orders || []}
        transactions={transactions || []}
        tickets={tickets || []}
        editableFields={editableFields}
        readOnlyFields={readOnlyFields}
      />
    </div>
  )
}
