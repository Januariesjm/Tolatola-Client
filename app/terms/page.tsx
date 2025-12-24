import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Scale, Users, Gavel, Wallet, ShieldAlert, Copyright, MessageCircle, AlertCircle, ShieldCheck, Globe, Zap } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms & Conditions | Tola Marketplace",
  description: "Legal framework for using the Tola marketplace. Our terms ensure a fair, secure, and transparent trading ecosystem for all Tanzanian users.",
  alternates: {
    canonical: "https://tolatola.co/terms",
  },
}

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
      icon: <Gavel />,
      content: "By accessing TOLA, you enter into a legally binding agreement with TOLA Marketplace. These terms govern your use of our digital infrastructure, escrow services, and community interactions."
    },
    {
      title: "User Obligations",
      icon: <Users />,
      content: (
        <div className="space-y-4">
          <p>Users must provide verified credentials, maintain account security, and interact with the ecosystem with integrity. We enforce a strict 'one-human, one-account' policy to prevent platform abuse.</p>
        </div>
      )
    },
    {
      title: "Vendor Standard",
      icon: <Zap />,
      content: "Vendors are required to undergo NIDA & TIN verification. By listing products, vendors guarantee product authenticity, accurate pricing, and commitment to the TOLA delivery timeline."
    },
    {
      title: "Escrow Mastery",
      icon: <Wallet />,
      content: "TOLA facilitates commerce through a secure escrow system. Funds are released only upon delivery confirmation. We act as a neutral intermediary in all transactional flows."
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Vivid Hero */}
        <section className="relative h-[550px] flex items-center justify-center bg-stone-950 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-stone-950" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex p-4 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md mb-8">
              <Scale className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter">Legal <span className="text-primary italic underline decoration-white/20 underline-offset-8">Framework</span></h1>
            <p className="text-stone-400 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed italic">
              Fairness, Security, and Transparency. Our terms are designed to protect every participant in the TOLA ecosystem.
            </p>
            <div className="mt-12 inline-block px-8 py-2.5 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-black tracking-widest uppercase">
              Version 2.4 | Effective Jan 2025
            </div>
          </div>
        </section>

        {/* Highlight Grid */}
        <section className="py-24 container mx-auto px-4 -mt-24 relative z-20">
          <div className="grid md:grid-cols-2 gap-8">
            {sections.map((section, i) => (
              <Card key={i} className="border-none shadow-2xl rounded-[3rem] bg-white p-12 group hover:scale-[1.02] transition-all duration-500">
                <div className="mb-8 p-4 rounded-3xl bg-stone-50 text-stone-900 w-fit group-hover:bg-primary group-hover:text-white transition-colors">
                  {section.icon}
                </div>
                <h2 className="text-3xl font-black mb-6 tracking-tight">{section.title}</h2>
                <div className="text-muted-foreground text-lg leading-relaxed italic">{section.content}</div>
              </Card>
            ))}
          </div>
        </section>

        {/* Detailed Guidelines */}
        <section className="py-24 bg-stone-900 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
          <div className="container mx-auto px-4 max-w-5xl relative z-10">
            <div className="space-y-32">
              <div className="grid md:grid-cols-2 gap-16 items-start">
                <h2 className="text-5xl font-black text-white tracking-tighter sticky top-24">Prohibited Conduct</h2>
                <div className="space-y-8">
                  <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h3 className="text-primary font-black mb-4 uppercase tracking-widest text-xs">Integrity Breach</h3>
                    <p className="text-stone-400 leading-relaxed italic">"Any attempts to circumvent TOLA's internal messaging or payment system will result in permanent account suspension. We maintain a zero-tolerance policy for off-platform transactions."</p>
                  </div>
                  <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-sm">
                    <h3 className="text-primary font-black mb-4 uppercase tracking-widest text-xs">KYC Fraud</h3>
                    <p className="text-stone-400 leading-relaxed italic">"Uploading forged NIDA, TIN, or Business Licenses is a criminal offense under Tanzanian law. We report all fraudulent activities to the relevant authorities."</p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-16 items-start">
                <h2 className="text-5xl font-black text-white tracking-tighter sticky top-24">Dispute Resolution</h2>
                <div className="space-y-8">
                  <p className="text-stone-300 text-xl leading-relaxed italic">
                    TOLA acts as a neutral arbitrator. In the event of a conflict between buyer and vendor, our resolution center uses transactional data and escrow logs to determine a fair outcome.
                  </p>
                  <div className="flex items-center gap-4 py-6 px-8 bg-primary rounded-[2rem]">
                    <ShieldCheck className="h-10 w-10 text-white" />
                    <div className="text-white">
                      <p className="font-black text-xl tracking-tight">Escrow Backed</p>
                      <p className="text-sm opacity-80">Final settlement is governed by delivery proof.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Legal Section */}
        <section className="py-32 bg-stone-50">
          <div className="container mx-auto px-4 text-center max-w-3xl">
            <Copyright className="h-12 w-12 text-stone-300 mx-auto mb-8" />
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Need legal clarification?</h2>
            <p className="text-muted-foreground text-xl mb-12 italic">Our legal council is available to decode any part of our platform framework for you.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="mailto:legal@tolatola.co" className="px-12 py-5 bg-primary text-white rounded-3xl font-black shadow-2xl hover:scale-105 transition-all text-xl">
                legal@tolatola.co
              </a>
              <a href="/faq" className="px-12 py-5 bg-white border border-stone-200 rounded-3xl font-black shadow-xl hover:scale-105 transition-all text-xl">
                Visit FAQ Hub
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
