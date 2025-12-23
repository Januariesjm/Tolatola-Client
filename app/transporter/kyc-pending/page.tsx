import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"

export default async function TransporterKYCPendingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: transporter } = await supabase
    .from("transporters")
    .select("kyc_status, business_name, vehicle_type")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!transporter) {
    redirect("/transporter/register")
  }

  if (transporter.kyc_status === "approved") {
    redirect("/transporter/dashboard")
  } else if (transporter.kyc_status === "rejected") {
    redirect("/transporter/kyc-rejected")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-xl">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-3 justify-center hover:scale-105 transition-transform">
            <Image src="/tolalogo.jpg" alt="TOLA" width={120} height={40} className="h-12 w-auto" />
            <HeaderAnimatedText />
          </Link>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="rounded-full bg-yellow-100 p-4">
                  <Clock className="h-12 w-12 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">KYC Under Review</CardTitle>
              <CardDescription className="text-center">Your transporter application is being reviewed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Business Name:</p>
                <p className="text-sm text-muted-foreground">{transporter.business_name || "N/A"}</p>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Vehicle Type:</p>
                <p className="text-sm text-muted-foreground capitalize">{transporter.vehicle_type}</p>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Our admin team is reviewing your documents. This typically takes 1-3 business days. You'll receive an
                  email notification once your account is verified.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
