import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Lock, Eye, FileText, UserCheck, Mail, Globe, ShieldAlert, Fingerprint } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Tola Marketplace",
  description: "Transparency, trust, and security. Learn how Tola protects your data and ensures a safe trading environment for all Tanzanian entrepreneurs and consumers.",
  alternates: {
    canonical: "https://tolatola.co/privacy",
  },
}

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
      title: "Data Sovereignty",
      icon: <Globe className="h-8 w-8 text-primary" />,
      content: "At TOLA, we believe your data is your own. We collect only what is necessary to facilitate secure trade and provide you with a seamless marketplace experience within the Tanzanian digital landscape."
    },
    {
      title: "Consent & Usage",
      icon: <Fingerprint className="h-8 w-8 text-primary" />,
      content: "By using our platform, you explicitly consent to the collection of transactional and profile data. We use this strictly for order fulfillment, fraud prevention, and platform optimization. We never sell your data to third parties."
    },
    {
      title: "Escrow & Financial Safety",
      icon: <Lock className="h-8 w-8 text-primary" />,
      content: "Our integrated escrow system ensures that financial data is handled with the highest level of security. We partner with verified mobile money providers (M-Pesa, Tigo Pesa, Airtel Money) to maintain a transparent audit trail."
    },
    {
      title: "KYC Compliance",
      icon: <ShieldAlert className="h-8 w-8 text-primary" />,
      content: "For the safety of our ecosystem, we verify vendor identities through NIDA and TIN validation. This minimizes risk and builds a marketplace of verified, trustworthy professionals."
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Premium Hero */}
        <section className="relative py-32 bg-stone-950 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-stone-950/50" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter">Your Privacy, <span className="text-primary italic">Our Core</span></h1>
            <p className="text-stone-400 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed italic">
              Transparency isn't just a policy—it's how we build the future of trade in Tanzania.
            </p>
            <div className="mt-12 inline-block px-6 py-2 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm font-bold tracking-widest uppercase">
              Last Updated: Jan 2025
            </div>
          </div>
        </section>

        {/* Highlight Grid */}
        <section className="py-24 container mx-auto px-4 -mt-24 relative z-20">
          <div className="grid md:grid-cols-2 gap-8">
            {sections.map((section, i) => (
              <Card key={i} className="border-none shadow-2xl rounded-[3rem] bg-white p-12 group hover:scale-[1.02] transition-all duration-500">
                <div className="mb-8 p-4 rounded-3xl bg-primary/5 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                  {section.icon}
                </div>
                <h2 className="text-3xl font-black mb-6 tracking-tight">{section.title}</h2>
                <p className="text-muted-foreground text-lg leading-relaxed italic">{section.content}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Detailed Clauses */}
        <section className="py-24 bg-muted/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-24">
              <div>
                <h2 className="text-4xl font-black mb-8 border-l-8 border-primary pl-8 tracking-tight">Personal Data Collection</h2>
                <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                  <p>We collect identifiable information such as your <strong>Full Name, Email, Phone Number, and Delivery Address</strong>. This data is used solely to facilitate the marketplace lifecycle.</p>
                  <p>For vendors, our <strong>KYC Process</strong> requires Tax Identification Numbers (TIN) and National ID (NIDA) data. This information is stored in encrypted offshore and local servers to ensure maximum resilience and compliance.</p>
                </div>
              </div>

              <div>
                <h2 className="text-4xl font-black mb-8 border-l-8 border-primary pl-8 tracking-tight">Third-Party Safeguard</h2>
                <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                  <p>We partner with leading payment processors and logistics entities. Data shared with these partners is restricted to the bare minimum required for execution (e.g., sharing your address with a delivery transporter).</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-24 container mx-auto px-4">
          <div className="bg-stone-900 rounded-[3.5rem] p-12 md:p-24 text-center relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -translate-x-1/2 translate-y-1/2" />
            <div className="relative z-10">
              <Mail className="h-16 w-16 text-primary mx-auto mb-8" />
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">Privacy Questions?</h2>
              <p className="text-stone-400 text-xl mb-12 italic max-w-2xl mx-auto">Our Data Protection Officer is available for any inquiries regarding your information.</p>
              <a href="mailto:privacy@tolatola.co" className="inline-flex items-center gap-4 px-12 py-6 bg-primary text-white rounded-3xl font-black text-xl shadow-2xl hover:scale-105 transition-all">
                Contact Privacy Team
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
