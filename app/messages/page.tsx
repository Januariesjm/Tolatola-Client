import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"
import { MessagesContent } from "@/components/messaging/messages-content"

export const metadata = {
  title: "Messages - TOLA",
  description: "View and manage your conversations with sellers",
}

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

  const { data: kycData } = await supabase
    .from("customer_kyc")
    .select("kyc_status")
    .eq("user_id", user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycData?.kyc_status} />
      <MessagesContent />
    </div>
  )
}
