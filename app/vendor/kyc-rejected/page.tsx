import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Image from "next/image"

export default async function KYCRejectedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get vendor information with rejection reason
  const { data: vendor } = await supabase
    .from("vendors")
    .select("kyc_status, kyc_notes, business_name")
    .eq("user_id", user.id)
    .single()

  // If not rejected, redirect to appropriate page
  if (!vendor || vendor.kyc_status !== "rejected") {
    if (vendor?.kyc_status === "approved") {
      redirect("/vendor/dashboard")
    } else if (vendor?.kyc_status === "pending") {
      redirect("/vendor/kyc-pending")
    } else {
      redirect("/vendor/register")
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 justify-center">
            <Image src="/tolalogo.jpg" alt="TOLA" width={150} height={50} className="h-10 w-auto" />
          </Link>
          <Card className="border-red-200">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center text-red-600">Application Rejected</CardTitle>
              <CardDescription className="text-center">
                Your vendor application for {vendor.business_name} has been rejected
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendor.kyc_notes && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-red-900 mb-2">Rejection Reason:</p>
                  <p className="text-sm text-red-800">{vendor.kyc_notes}</p>
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center">
                Please review the rejection reason above and make the necessary corrections before reapplying.
              </p>

              <div className="flex flex-col gap-2 pt-4">
                <Link href="/vendor/register">
                  <Button className="w-full">Reapply as Vendor</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline" className="w-full bg-transparent">
                    Return to Homepage
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
