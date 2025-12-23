import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Image from "next/image"

export default async function KYCPendingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("kyc_status, business_name")
    .eq("user_id", user.id)
    .single()

  if (vendor) {
    if (vendor.kyc_status === "approved") {
      redirect("/vendor/dashboard")
    } else if (vendor.kyc_status === "rejected") {
      redirect("/vendor/kyc-rejected")
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-muted/30">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-2 justify-center">
            <Image src="/tolalogo.jpg" alt="TOLA" width={150} height={50} className="h-10 w-auto" />
          </Link>
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </div>
              <CardTitle className="text-2xl text-center">KYC Under Review</CardTitle>
              <CardDescription className="text-center">
                Your application for {vendor?.business_name} is being reviewed
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Thank you for submitting your vendor application. Our admin team is currently reviewing your documents
                and business information.
              </p>
              <p className="text-sm text-muted-foreground">
                You will receive an email notification once your application is approved or if any additional
                information is needed.
              </p>
              <div className="pt-4">
                <p className="text-xs text-muted-foreground mb-2">Typical review time: 24-48 hours</p>
              </div>
              <Link href="/">
                <Button variant="outline" className="w-full bg-transparent">
                  Return to Homepage
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
