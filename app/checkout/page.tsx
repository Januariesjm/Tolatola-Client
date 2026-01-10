import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { CheckoutContent } from "@/components/checkout/checkout-content"
import { redirect } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"
import { cookies, headers } from "next/headers"
import type { Database } from "@/lib/types"
import { serverApiGet } from "@/lib/api-server"

export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  const supabase = createServerComponentClient<Database>({ cookies, headers } as any)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  let userData = null
  let kycStatus = null
  try {
    const profileRes = await serverApiGet<{ profile: any }>("profile")
    userData = profileRes.profile
    kycStatus = profileRes.profile?.kyc_status || null
  } catch {
    userData = null
    kycStatus = null
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={userData} kycStatus={kycStatus} />
      <CheckoutContent user={userData} />
    </div>
  )
}
