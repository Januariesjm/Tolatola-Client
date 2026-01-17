import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"

export default async function TransporterKYCRejectedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: transporter } = await supabase
    .from("transporters")
    .select("kyc_status, kyc_notes, business_name, vehicle_type")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!transporter || transporter.kyc_status !== "rejected") {
    if (transporter?.kyc_status === "approved") {
      redirect("/transporter/dashboard")
    } else if (transporter?.kyc_status === "pending") {
      redirect("/transporter/kyc-pending")
    }
    redirect("/transporter/register")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-xl">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-3 justify-center hover:scale-105 transition-transform">
            <Image src="/logo-new.png" alt="TOLA" width={120} height={40} className="h-12 w-auto" />
            <HeaderAnimatedText />
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-red-100 p-4">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center text-red-600">KYC Verification Rejected</CardTitle>
              <CardDescription className="text-center">Your transporter application needs attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {transporter.kyc_notes && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</p>
                  <p className="text-sm text-red-800">{transporter.kyc_notes}</p>
                </div>
              )}

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm text-muted-foreground">
                  Please review the feedback above and re-submit your application with the correct information.
                </p>
              </div>

              <Button asChild className="w-full">
                <Link href="/transporter/register">Re-submit Application</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
