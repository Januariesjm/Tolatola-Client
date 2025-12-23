import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function TermsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let kycStatus = null

  if (user) {
    const { data: profileData } = await supabase.from("users").select("*").eq("id", user.id).maybeSingle()
    profile = profileData

    if (profileData) {
      const { data: kycData } = await supabase
        .from("customer_kyc")
        .select("kyc_status")
        .eq("user_id", user.id)
        .maybeSingle()
      kycStatus = kycData?.kyc_status
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">Terms and Conditions</h1>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agreement to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                By accessing and using Dan'g 31 marketplace platform, you agree to be bound by these Terms and
                Conditions. If you do not agree with any part of these terms, you may not use our services.
              </p>
              <p className="text-sm italic">Last Updated: January 2025</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Accounts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>To use certain features of our platform, you must create an account. You agree to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Be responsible for all activities under your account</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>Vendors must:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Complete KYC verification with valid TIN, NIDA, and business license</li>
                <li>Provide accurate product descriptions and pricing</li>
                <li>Fulfill orders in a timely manner</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not sell prohibited or illegal items</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buyer Responsibilities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>Buyers agree to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Provide accurate delivery information</li>
                <li>Pay for orders in a timely manner</li>
                <li>Confirm delivery once orders are received</li>
                <li>Follow the return policy for any disputes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Escrow Payment System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                All transactions are processed through our secure escrow system. Payments are held until the buyer
                confirms delivery. By using our platform, you agree to this payment process.
              </p>
              <p>
                Dan'g 31 acts as an intermediary and is not responsible for disputes between buyers and vendors, though
                we will assist in resolution when possible.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prohibited Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>Users may not:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Engage in fraudulent activities</li>
                <li>Sell counterfeit or illegal products</li>
                <li>Manipulate reviews or ratings</li>
                <li>Harass or abuse other users</li>
                <li>Attempt to circumvent our payment system</li>
                <li>Use the platform for money laundering or other illegal purposes</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fees and Commissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Dan'g 31 charges vendors a commission on each sale. Commission rates vary by product category and are
                clearly disclosed before listing products.
              </p>
              <p>We reserve the right to modify our fee structure with 30 days notice to vendors.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                All content on the Dan'g 31 platform, including logos, designs, and text, is owned by Dan'g 31 or its
                licensors. Users may not copy, reproduce, or distribute this content without permission.
              </p>
              <p>
                Vendors retain ownership of their product images and descriptions but grant us a license to display them
                on our platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Dan'g 31 is not liable for any indirect, incidental, or consequential damages arising from your use of
                the platform. Our total liability is limited to the amount of fees paid by you in the past 12 months.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms or engage in prohibited
                activities. Users may also close their accounts at any time.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                We may update these Terms and Conditions from time to time. Continued use of the platform after changes
                constitutes acceptance of the new terms.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              <p>For questions about these Terms and Conditions, contact us:</p>
              <div className="mt-4 space-y-2">
                <p>
                  <strong className="text-foreground">Email:</strong>{" "}
                  <a href="mailto:legal@danggroup.co.tz" className="text-primary hover:underline">
                    legal@danggroup.co.tz
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">Phone:</strong> +255 678 227 227 (Dodoma) | +255 625 377 978 (Dar
                  Es Salaam)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
