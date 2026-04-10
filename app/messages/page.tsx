import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SiteHeader from "@/components/layout/site-header"
import { MessagesContent } from "@/components/messaging/messages-content"

export const metadata = {
  title: "Messages | TOLA Tanzania",
  description: "View and manage your conversations with vendors. TOLA Tanzania marketplace.",
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
      <Suspense fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Messages</h1>
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        </div>
      }>
        <MessagesContent />
      </Suspense>
    </div>
  )
}
