import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about TOLA marketplace. Find answers about buying, selling, payments, escrow system, KYC verification, and more.",
  alternates: {
    canonical: "https://tolatola.vercel.app/faq",
  },
  openGraph: {
    title: "TOLA FAQ - Your Questions Answered",
    description: "Common questions about Tanzania's multivendor marketplace",
    url: "https://tolatola.vercel.app/faq",
  },
}

export default async function FAQPage() {
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
        <h1 className="text-4xl font-bold mb-4 text-center">Frequently Asked Questions</h1>
        <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Find answers to common questions about TOLA marketplace
        </p>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>For Buyers</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>How do I create an account?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Click on "Sign Up" in the top right corner, fill in your details including email, password, and
                    phone number. You'll receive a confirmation email to verify your account.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    We accept M-Pesa, Tigo Pesa, and Airtel Money. All payments are processed through our secure escrow
                    system to protect both buyers and sellers.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger>How does the escrow system work?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    When you make a purchase, your payment is held securely in escrow. The funds are only released to
                    the vendor after you confirm that you've received your order. This protects you from fraud and
                    ensures you get what you paid for.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger>What if I don't receive my order?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    If you don't receive your order within the expected timeframe, contact our support team. Since your
                    payment is held in escrow, we can investigate and issue a refund if necessary.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger>Can I return a product?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Return policies vary by vendor. Check the vendor's return policy on their shop page before making a
                    purchase. Generally, items can be returned within 7 days if they're defective or not as described.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>For Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="vendor-1">
                  <AccordionTrigger>How do I become a vendor?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Click "Become a Vendor" on the homepage, create an account, and complete the KYC verification
                    process. You'll need to provide your TIN, NIDA, and business license. Once approved, you can start
                    listing products.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vendor-2">
                  <AccordionTrigger>What documents do I need for KYC verification?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    You need: (1) Tax Identification Number (TIN), (2) National ID (NIDA), and (3) Business License. All
                    documents must be valid and clearly legible.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vendor-3">
                  <AccordionTrigger>How long does KYC verification take?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    KYC verification typically takes 1-3 business days. You'll receive an email notification once your
                    account is approved or if additional information is needed.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vendor-4">
                  <AccordionTrigger>What are the fees for selling?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    We charge a small commission on each sale to maintain the platform. The exact percentage depends on
                    your product category. There are no upfront fees or monthly charges.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vendor-5">
                  <AccordionTrigger>When do I receive payment for my sales?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Payments are released from escrow after the buyer confirms delivery. You can then request a payout
                    to your mobile money account. Payouts are typically processed within 24-48 hours.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="vendor-6">
                  <AccordionTrigger>Can I edit or delete my products?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    Yes! You have full control over your product listings. You can edit product details, update prices
                    and stock, mark items as out of stock, or delete products entirely from your vendor dashboard.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
