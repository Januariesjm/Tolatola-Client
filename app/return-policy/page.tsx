import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function ReturnPolicyPage() {
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
        <h1 className="text-4xl font-bold mb-8 text-center">Return Policy</h1>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Our Return Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                At Dan'g 31, we want you to be completely satisfied with your purchase. If you're not happy with your
                order, we're here to help.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Return Eligibility</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>You may return items within 7 days of delivery if:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>The item is defective or damaged</li>
                <li>The item is significantly different from the description</li>
                <li>You received the wrong item</li>
                <li>The item is missing parts or accessories</li>
              </ul>
              <p className="font-semibold text-foreground mt-4">Items that cannot be returned:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Perishable goods (food, flowers, etc.)</li>
                <li>Personal care items that have been opened</li>
                <li>Custom or personalized items</li>
                <li>Digital products or downloads</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>How to Return an Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <ol className="list-decimal list-inside space-y-3">
                <li>
                  <strong className="text-foreground">Contact the vendor:</strong> Reach out to the vendor through your
                  order page to initiate a return request.
                </li>
                <li>
                  <strong className="text-foreground">Wait for approval:</strong> The vendor will review your request
                  and provide return instructions.
                </li>
                <li>
                  <strong className="text-foreground">Package the item:</strong> Return the item in its original
                  packaging with all accessories and documentation.
                </li>
                <li>
                  <strong className="text-foreground">Ship the item:</strong> Follow the vendor's return shipping
                  instructions.
                </li>
                <li>
                  <strong className="text-foreground">Receive your refund:</strong> Once the vendor receives and
                  inspects the return, your refund will be processed.
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Refund Process</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Refunds are processed through our escrow system. If your return is approved, the funds will be released
                back to your original payment method (M-Pesa, Tigo Pesa, or Airtel Money).
              </p>
              <p>Refunds typically take 3-5 business days to appear in your mobile money account.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vendor-Specific Policies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Individual vendors may have their own return policies that provide additional benefits or restrictions.
                Always check the vendor's return policy on their shop page before making a purchase.
              </p>
              <p>
                If a vendor's policy conflicts with our general policy, the more customer-friendly policy will apply.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              <p>
                If you have questions about returns or need assistance with a return request, contact our support team:
              </p>
              <div className="mt-4 space-y-2">
                <p>
                  <strong className="text-foreground">Email:</strong>{" "}
                  <a href="mailto:support@danggroup.co.tz" className="text-primary hover:underline">
                    support@danggroup.co.tz
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
