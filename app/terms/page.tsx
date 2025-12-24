import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Scale, Users, Gavel, Wallet, ShieldAlert, Cpu, Copyright, MessageCircle, AlertCircle } from "lucide-react"

export default async function TermsPage() {
  const supabase = (await createClient()) as any
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

  const sections = [
    {
      title: "Agreement to Terms",
      icon: <Gavel className="h-6 w-6 text-primary" />,
      content: (
        <p>
          By accessing and using the <strong>Tola</strong> marketplace platform, you agree to be bound by these Terms and
          Conditions. If you do not agree with any part of these terms, you may not use our services. These terms apply to all visitors, users, and others who access the Platform.
        </p>
      ),
    },
    {
      title: "User Accounts",
      icon: <Users className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <p>To use specific features of our platform, you must create a secure account. By doing so, you agree to:</p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none">
            {[
              "Provide accurate and complete information",
              "Maintain credential security",
              "Notify us of unauthorized access",
              "Take responsibility for all account activity",
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span className="text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    },
    {
      title: "Vendor & Buyer Responsibilities",
      icon: <Scale className="h-6 w-6 text-primary" />,
      content: (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <h3 className="font-bold text-foreground inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-primary text-primary-foreground text-xs">VENDORS</span>
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Complete KYC (TIN, NIDA, License)</li>
              <li>• Accurate product pricing & details</li>
              <li>• Timely order fulfillment</li>
              <li>• Compliance with local trade laws</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-foreground inline-flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-xs">BUYERS</span>
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Provide valid delivery addresses</li>
              <li>• Timely payment for orders</li>
              <li>• Confirm delivery upon receipt</li>
              <li>• Follow dispute resolution protocols</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Escrow Payment System",
      icon: <Wallet className="h-6 w-6 text-primary" />,
      content: (
        <>
          <p>
            All transactions are processed through our proprietary <strong>Escrow System</strong>. Payments are held securely by Tola until the buyer
            confirms receipt of goods. This protects investors and consumers alike.
          </p>
          <p>
            Tola acts as a neutral intermediary and is not liable for inherent product quality issues, but we facilitate a fair dispute resolution process.
          </p>
        </>
      ),
    },
    {
      title: "Prohibited Activities",
      icon: <ShieldAlert className="h-6 w-6 text-primary" />,
      content: (
        <div className="bg-red-50/50 border border-red-100 p-6 rounded-xl">
          <p className="text-red-900 font-medium mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Strictly Forbidden:
          </p>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-red-800">
            <li>• Fraudulent or deceptive behavior</li>
            <li>• Selling counterfeit or illegal goods</li>
            <li>• Platform or review manipulation</li>
            <li>• Money laundering or illegal financing</li>
            <li>• Circumventing Tola's payment system</li>
            <li>• Harassment of users or staff</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Intellectual Property",
      icon: <Copyright className="h-6 w-6 text-primary" />,
      content: (
        <p>
          All content on Tola, including logos, designs, software, and text, is owned by <strong>Tola Marketplace</strong>. Unauthorized reproduction or distribution of these assets is strictly prohibited. Vendors grant Tola a non-exclusive license to display their product media for marketing purposes.
        </p>
      ),
    },
    {
      title: "Contact Legal Team",
      icon: <MessageCircle className="h-6 w-6 text-primary" />,
      content: (
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 space-y-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Legal Inquiries</p>
            <a href="mailto:legal@tolatola.co" className="text-primary hover:underline font-medium text-lg">
              legal@tolatola.co
            </a>
          </div>
          <div className="flex-1 space-y-1 text-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Customer Support</p>
            <p className="font-medium">+255 678 227 227 (Dodoma HQ)</p>
            <p className="font-medium">+255 625 377 978 (Dar Office)</p>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-muted/30 py-20 border-b">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex p-3 rounded-full bg-white shadow-sm border mb-6">
              <Scale className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight">Terms & Conditions</h1>
            <p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed">
              Legal framework for using the Tola marketplace. Please read carefully before using our platform.
            </p>
            <div className="mt-8 text-sm font-medium text-muted-foreground bg-white inline-block px-4 py-1.5 rounded-full border shadow-sm">
              Version 2.1 | Effective January 2025
            </div>
          </div>
        </section>

        {/* Dynamic Section Mapping */}
        <section className="py-20 container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            {sections.map((section, idx) => (
              <div key={idx} className="group flex flex-col md:flex-row gap-8">
                <div className="md:w-1/4">
                  <div className="sticky top-24 inline-flex flex-col items-center md:items-start">
                    <div className="p-4 rounded-2xl bg-primary/5 text-primary mb-4 transition-colors group-hover:bg-primary group-hover:text-white">
                      {section.icon}
                    </div>
                    <h2 className="text-xl font-bold tracking-tight text-center md:text-left">{section.title}</h2>
                  </div>
                </div>
                <div className="md:w-3/4 bg-white md:bg-transparent p-6 md:p-0 rounded-2xl border md:border-0 shadow-sm md:shadow-none">
                  <div className="text-muted-foreground leading-relaxed space-y-4">
                    {section.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <section className="py-20 border-t bg-stone-50">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h3 className="text-2xl font-bold mb-4">Questions about these Terms?</h3>
          <p className="text-muted-foreground mb-8 text-lg">Our legal and support teams are here to help you navigate our platform safely and fairly.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:legal@tolatola.co" className="px-8 py-3 bg-primary text-white rounded-full font-bold shadow-lg hover:shadow-primary/20 hover:scale-105 transition-all">
              Contact Legal
            </a>
            <a href="/contact" className="px-8 py-3 bg-white border border-stone-200 rounded-full font-bold shadow-sm hover:bg-stone-50 transition-all">
              Help Center
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
