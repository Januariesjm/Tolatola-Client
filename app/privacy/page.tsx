import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function PrivacyPage() {
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
        <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Introduction</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                At Dan'g 31, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose,
                and safeguard your information when you use our multivendor marketplace platform.
              </p>
              <p className="text-sm italic">Last Updated: January 2025</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information We Collect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <div>
                <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                <p>
                  We collect personal information that you provide to us, including but not limited to: name, email
                  address, phone number, physical address, and payment information.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Vendor Verification Information</h3>
                <p>
                  For vendors, we collect additional information for KYC verification including TIN (Tax Identification
                  Number), NIDA (National ID), and business license documentation.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Transaction Information</h3>
                <p>
                  We collect information about your transactions on our platform, including purchase history, payment
                  methods, and delivery details.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <ul className="list-disc list-inside space-y-2">
                <li>To process and fulfill your orders</li>
                <li>To verify vendor identities and maintain platform security</li>
                <li>To communicate with you about your account and transactions</li>
                <li>To improve our services and user experience</li>
                <li>To comply with legal obligations and prevent fraud</li>
                <li>To send you marketing communications (with your consent)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Information Sharing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>We may share your information with:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Vendors when you make a purchase (name, delivery address, contact information)</li>
                <li>Payment processors to facilitate transactions</li>
                <li>Service providers who assist in operating our platform</li>
                <li>Law enforcement or regulatory authorities when required by law</li>
              </ul>
              <p className="font-semibold text-foreground">We never sell your personal information to third parties.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                We implement appropriate technical and organizational security measures to protect your personal
                information. This includes encryption, secure servers, and regular security audits.
              </p>
              <p>
                Our escrow payment system ensures that financial transactions are processed securely, protecting both
                buyers and sellers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground leading-relaxed">
              <p>You have the right to:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your information</li>
                <li>Opt-out of marketing communications</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              <p>
                If you have questions about this Privacy Policy or how we handle your information, please contact us:
              </p>
              <div className="mt-4 space-y-2">
                <p>
                  <strong className="text-foreground">Email:</strong>{" "}
                  <a href="mailto:privacy@danggroup.co.tz" className="text-primary hover:underline">
                    privacy@danggroup.co.tz
                  </a>
                </p>
                <p>
                  <strong className="text-foreground">Dodoma HQ:</strong> +255 678 227 227
                </p>
                <p>
                  <strong className="text-foreground">Dar Es Salaam:</strong> +255 625 377 978
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
