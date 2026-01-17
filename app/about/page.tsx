import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Target, Globe, Phone, Mail, MapPin, Building2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | TOLA - Digital Trade & Supply Chain Ecosystem",
  description:
    "TOLA is a digital trade and supply chain ecosystem designed to simplify, connect, and empower businesses across Tanzania and beyond.",
  alternates: {
    canonical: "https://tolatola.co/about",
  },
}

export default async function AboutPage() {
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

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/10">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* 1. ABOUT US (About TOLA) - Hero Section */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-36 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.03]" />
          </div>

          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary border border-primary/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-[0.2em]">Precision Engineered in Tanzania</span>
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] md:leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                About <span className="text-primary italic">TOLA</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                A digital trade and supply chain ecosystem designed to simplify, connect, and empower businesses across Tanzania and beyond.
              </p>
            </div>

            <div className="mt-20 grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
                <p>
                  We provide a secure and transparent platform that enables businesses to trade, manage supply chains, and access essential digital tools with confidence and efficiency.
                </p>
                <p>
                  TOLA is built with a strong focus on reliability, compliance, and trust, ensuring that every transaction and interaction is backed by a legally registered and operational business entity.
                </p>
                <p className="font-semibold text-foreground">
                  Our mission is to strengthen local and regional trade by bridging gaps between buyers, suppliers, and logistics through modern digital infrastructure tailored for emerging markets.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card className="border-none shadow-xl bg-primary text-primary-foreground rounded-[2rem] p-8 hover:scale-[1.02] transition-transform duration-500">
                  <Target className="h-10 w-10 mb-6" />
                  <h3 className="text-2xl font-black mb-4">Our Mission</h3>
                  <p className="text-primary-foreground/90 text-sm leading-relaxed">
                    To create a trusted digital ecosystem that simplifies trade, enhances transparency, and empowers businesses to grow efficiently.
                  </p>
                </Card>

                <Card className="border-none shadow-xl bg-stone-900 text-stone-100 rounded-[2rem] p-8 hover:scale-[1.02] transition-transform duration-500">
                  <Globe className="h-10 w-10 mb-6 text-primary" />
                  <h3 className="text-2xl font-black mb-4">Our Vision</h3>
                  <p className="text-stone-400 text-sm leading-relaxed">
                    To become a leading digital trade and supply chain platform in Africa, enabling seamless and secure commerce for businesses of all sizes.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 2. OWNERSHIP & COMPANY INFORMATION */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-16">
              <div className="max-w-xl">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4 leading-none">Ownership & Information</h2>
                <p className="text-muted-foreground text-lg italic">Legal Trust Page</p>
              </div>
              <Building2 className="h-16 w-16 text-primary/20 hidden md:block" />
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 border-none shadow-2xl rounded-[3rem] bg-white p-8 md:p-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8">
                  <div className="bg-primary/5 p-4 rounded-full">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                </div>

                <div className="space-y-10 relative z-10">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-2">Company Information</h3>
                    <p className="text-2xl font-bold leading-tight">
                      TOLA is owned and operated by <span className="underline decoration-primary/30 decoration-4 underline-offset-4">Dan’G Group of Companies Limited</span>, a legally registered company in the United Republic of Tanzania.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8">
                    {[
                      { label: "Legal Company Name", value: "Dan’G Group of Companies Limited" },
                      { label: "Business Name", value: "TOLA" },
                      { label: "Company Registration (BRELA)", value: "165214285" },
                      { label: "Business Name Registration", value: "627634" },
                      { label: "TIN", value: "165-214-285" },
                      { label: "NSSF Number", value: "1042932" },
                      { label: "Country of Incorporation", value: "United Republic of Tanzania" }
                    ].map((item, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                        <p className="font-bold text-lg">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-2xl rounded-[3rem] bg-primary text-primary-foreground p-8 md:p-12 flex flex-col justify-between">
                <div>
                  <MapPin className="h-12 w-12 mb-8" />
                  <h3 className="text-2xl font-black mb-6">Registered Address</h3>
                  <div className="space-y-2 text-lg">
                    <p className="font-bold">P.O. Box 372</p>
                    <p>Kibaha-Pwani</p>
                    <p>Tanzania</p>
                  </div>
                </div>

                <div className="mt-12 pt-12 border-t border-primary-foreground/20">
                  <p className="text-sm italic opacity-80">
                    TOLA operates in compliance with applicable laws and regulations of the United Republic of Tanzania.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 3. CONTACT US */}
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">Contact Us</h2>
              <p className="text-xl text-muted-foreground">We’re here to support you.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Phone className="h-6 w-6" />,
                  title: "Dodoma HQ",
                  detail: "+255 678 227 227",
                  desc: "Head Office"
                },
                {
                  icon: <Phone className="h-6 w-6" />,
                  title: "Dar es Salaam Office",
                  detail: "+255 625 377 978",
                  desc: "Regional Branch"
                },
                {
                  icon: <Mail className="h-6 w-6" />,
                  title: "Email Support",
                  detail: "support@tolatola.co",
                  desc: "Available during business hours"
                }
              ].map((contact, i) => (
                <div key={i} className="p-10 rounded-[2.5rem] border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 text-center">
                  <div className="inline-flex p-4 rounded-2xl bg-primary/5 text-primary mb-6">
                    {contact.icon}
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-4">{contact.title}</h3>
                  <p className="text-xl font-bold mb-2">{contact.detail}</p>
                  <p className="text-sm text-muted-foreground">{contact.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. TRUST & TRANSPARENCY SECTION (Anti-Scam Signal) */}
        <section className="py-24 bg-stone-950 text-stone-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,var(--primary)_0%,transparent_50%)] opacity-10" />

          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter italic text-primary">Trust & Transparency</h2>
                <p className="text-xl md:text-2xl font-medium text-stone-300 leading-relaxed mb-8">
                  At TOLA, trust is a core principle of our platform. We maintain operational systems designed to ensure reliability, security, and accountability.
                </p>

                <div className="space-y-6">
                  {[
                    "Legally registered company operating in Tanzania",
                    "Ownership and contact details are publicly available",
                    "Operational systems focused on security",
                    "All activities governed by clear policies"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <p className="text-lg text-stone-400">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-3xl opacity-50" />
                <Card className="relative bg-white/5 border-white/10 rounded-[3rem] p-12 backdrop-blur-xl">
                  <Shield className="h-24 w-24 text-primary mb-8" />
                  <h3 className="text-3xl font-black mb-6">Security First</h3>
                  <p className="text-stone-400 leading-relaxed text-lg">
                    Our platform is built to protect every stakeholder. From verified business entities to secure transaction protocols, we ensure that digital trade is as safe as it is efficient.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 5. LEGAL DISCLAIMER */}
        <section className="py-20 border-t border-stone-100">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex p-3 rounded-2xl bg-muted text-muted-foreground mb-6">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Legal Disclaimer</h2>
            <div className="space-y-6 text-muted-foreground/80 leading-relaxed text-sm">
              <p>
                TOLA is a digital trade and supply chain ecosystem operated by Dan’G Group of Companies Limited. All information provided on this website is for general informational purposes only and does not constitute legal, financial, or professional advice.
              </p>
              <p className="font-bold underline underline-offset-4 decoration-primary/20">
                Use of the platform is subject to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
