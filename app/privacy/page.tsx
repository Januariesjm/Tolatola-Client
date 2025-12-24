import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, Eye, FileText, UserCheck, Mail } from "lucide-react"

export default async function PrivacyPage() {
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
      title: "Introduction",
      icon: <FileText className="h-6 w-6 text-primary" />,
      content: (
        <>
          <p>
            At <strong>Tola</strong>, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose,
            and safeguard your information when you use our multivendor marketplace platform.
          </p>
          <p>
            By using Tola, you agree to the collection and use of information in accordance with this policy. We are committed to ensuring that your personal data is protected and used only for the purposes outlined here.
          </p>
        </>
      ),
    },
    {
      title: "Information We Collect",
      icon: <Eye className="h-6 w-6 text-primary" />,
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Personal Information</h3>
            <p>
              We collect personal information that you provide to us, including but not limited to: name, email
              address, phone number, physical address, and payment information.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Vendor Verification</h3>
            <p>
              For vendors, we collect additional information for KYC verification including TIN (Tax Identification
              Number), NIDA (National ID), and business license documentation.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Transaction Data</h3>
            <p>
              We collect information about your transactions on our platform, including purchase history, payment
              methods, and delivery details.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "How We Use Your Information",
      icon: <UserCheck className="h-6 w-6 text-primary" />,
      content: (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none">
          {[
            "Process and fulfill your orders",
            "Verify vendor identities",
            "Maintain platform security",
            "Account communications",
            "Improve user experience",
            "Legal compliance & fraud prevention",
          ].map((item, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: "Data Security",
      icon: <Lock className="h-6 w-6 text-primary" />,
      content: (
        <>
          <p>
            We implement high-level technical and organizational security measures to protect your personal
            information. This includes 256-bit encryption, secure servers, and regular security audits.
          </p>
          <p>
            Our <strong>escrow payment system</strong> ensures that financial transactions are processed securely, protecting both
            buyers and sellers. Funds are only released when both parties are satisfied.
          </p>
        </>
      ),
    },
    {
      title: "Contact Us",
      icon: <Mail className="h-6 w-6 text-primary" />,
      content: (
        <div className="bg-muted/50 p-6 rounded-xl border">
          <p className="mb-4 font-medium">If you have questions about this Privacy Policy, please reach out to our team:</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Email Support</p>
              <a href="mailto:privacy@tolatola.co" className="text-primary hover:underline font-medium">
                privacy@tolatola.co
              </a>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">HQ Address</p>
              <p className="font-medium">Dodoma, Tanzania</p>
            </div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-primary/5 border-b py-16">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex p-3 rounded-2xl bg-white shadow-sm border mb-6">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Privacy Policy</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Transparency, trust, and security. Learn how Tola protects your data.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border text-sm font-medium shadow-sm">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Effective as of January 2025
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            {sections.map((section, index) => (
              <div key={index} className="relative pl-12 sm:pl-16">
                <div className="absolute left-0 top-0 p-2.5 rounded-xl bg-muted border">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-4 tracking-tight text-foreground">{section.title}</h2>
                  <div className="text-muted-foreground leading-relaxed space-y-4">
                    {section.content}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer Note */}
      <section className="py-12 border-t bg-muted/20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <p className="text-sm text-muted-foreground italic">
            "Your privacy is our priority. We continuously update our systems and policies to stay ahead of security threats and remain compliant with Tanzanian data protection laws."
          </p>
        </div>
      </section>
    </div>
  )
}
