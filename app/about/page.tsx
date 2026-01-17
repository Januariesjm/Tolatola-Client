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
        <section className="relative pt-16 pb-12 md:pt-24 md:pb-16 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.03]" />
          </div>

          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary border border-primary/20 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Sparkles className="h-3 w-3" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Precision Engineered in Tanzania</span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                About <span className="text-primary italic">TOLA</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                A digital trade and supply chain ecosystem designed to simplify, connect, and empower businesses across Tanzania and beyond.
              </p>
            </div>

            <div className="mt-12 grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-none shadow-lg bg-primary text-primary-foreground rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-500">
                  <Target className="h-8 w-8 mb-4" />
                  <h3 className="text-xl font-black mb-2">Our Mission</h3>
                  <p className="text-primary-foreground/90 text-sm leading-snug">
                    To create a trusted digital ecosystem that simplifies trade, enhances transparency, and empowers businesses to grow efficiently.
                  </p>
                </Card>

                <Card className="border-none shadow-lg bg-stone-900 text-stone-100 rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-500">
                  <Globe className="h-8 w-8 mb-4 text-primary" />
                  <h3 className="text-xl font-black mb-2">Our Vision</h3>
                  <p className="text-stone-400 text-sm leading-snug">
                    To become a leading digital trade and supply chain platform in Africa, enabling seamless and secure commerce for businesses of all sizes.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 2. OWNERSHIP & COMPANY INFORMATION */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-10">
              <div className="max-w-xl">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 leading-none">Ownership & Information</h2>
                <p className="text-muted-foreground text-base italic">Legal Trust Page</p>
              </div>
              <Building2 className="h-12 w-12 text-primary/20 hidden md:block" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 border-none shadow-xl rounded-[2rem] bg-white p-6 md:p-10 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6">
                  <div className="bg-primary/5 p-3 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  </div>
                </div>

                <div className="space-y-6 relative z-10">
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Company Information</h3>
                    <p className="text-xl font-bold leading-tight">
                      TOLA is owned and operated by <span className="underline decoration-primary/30 decoration-2 underline-offset-4">Dan’G Group of Companies Limited</span>, a legally registered company in the United Republic of Tanzania.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                    {[
                      { label: "Legal Company Name", value: "Dan’G Group of Companies Limited" },
                      { label: "Business Name", value: "TOLA" },
                      { label: "Company Registration (BRELA)", value: "165214285" },
                      { label: "Business Name Registration", value: "627634" },
                      { label: "TIN", value: "165-214-285" },
                      { label: "NSSF Number", value: "1042932" },
                      { label: "Country of Incorporation", value: "United Republic of Tanzania" }
                    ].map((item, i) => (
                      <div key={i} className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</p>
                        <p className="font-bold text-base leading-tight">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="border-none shadow-xl rounded-[2rem] bg-primary text-primary-foreground p-6 md:p-10 flex flex-col justify-between">
                <div>
                  <MapPin className="h-10 w-10 mb-6" />
                  <h3 className="text-xl font-black mb-4">Registered Address</h3>
                  <div className="space-y-1 text-base">
                    <p className="font-bold">P.O. Box 372</p>
                    <p>Kibaha-Pwani</p>
                    <p>Tanzania</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-primary-foreground/20">
                  <p className="text-[10px] italic opacity-80 leading-snug">
                    TOLA operates in compliance with applicable laws and regulations of the United Republic of Tanzania.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 3. CONTACT US */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-black mb-2">Contact Us</h2>
              <p className="text-lg text-muted-foreground">We’re here to support you.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Phone className="h-5 w-5" />,
                  title: "Dodoma HQ",
                  detail: "+255 678 227 227",
                  desc: "Head Office"
                },
                {
                  icon: <Phone className="h-5 w-5" />,
                  title: "Dar es Salaam Office",
                  detail: "+255 625 377 978",
                  desc: "Regional Branch"
                },
                {
                  icon: <Mail className="h-5 w-5" />,
                  title: "Email Support",
                  detail: "support@tolatola.co",
                  desc: "Available during business hours"
                }
              ].map((contact, i) => (
                <div key={i} className="p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-center">
                  <div className="inline-flex p-3 rounded-xl bg-primary/5 text-primary mb-4">
                    {contact.icon}
                  </div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{contact.title}</h3>
                  <p className="text-lg font-bold mb-1">{contact.detail}</p>
                  <p className="text-xs text-muted-foreground">{contact.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. TRUST & TRANSPARENCY SECTION (Anti-Scam Signal) */}
        <section className="py-16 bg-stone-950 text-stone-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,var(--primary)_0%,transparent_50%)] opacity-10" />

          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight italic text-primary leading-none">Trust & Transparency</h2>
                <p className="text-lg md:text-xl font-medium text-stone-300 leading-relaxed mb-6">
                  At TOLA, trust is a core principle of our platform. We maintain operational systems designed to ensure reliability, security, and accountability.
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    "Legally registered in Tanzania",
                    "Publicly available details",
                    "Security-focused systems",
                    "Governed by clear policies"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      <p className="text-base text-stone-400">{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-[2rem] blur-2xl opacity-50" />
                <Card className="relative bg-white/5 border-white/10 rounded-[2rem] p-8 backdrop-blur-xl">
                  <Shield className="h-16 w-16 text-primary mb-6" />
                  <h3 className="text-2xl font-black mb-4">Security First</h3>
                  <p className="text-stone-400 leading-relaxed text-base">
                    Our platform is built to protect every stakeholder. From verified business entities to secure transaction protocols, we ensure that digital trade is as safe as it is efficient.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 5. LEGAL DISCLAIMER */}
        <section className="py-12 border-t border-stone-100">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex p-2 rounded-xl bg-muted text-muted-foreground mb-4">
              <AlertCircle className="h-4 w-4" />
            </div>
            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Legal Disclaimer</h2>
            <div className="space-y-4 text-muted-foreground/80 leading-relaxed text-xs">
              <p>
                TOLA is a digital trade and supply chain ecosystem operated by Dan’G Group of Companies Limited. All information provided on this website is for general informational purposes only and does not constitute legal, financial, or professional advice.
              </p>
              <p className="font-bold underline underline-offset-2 decoration-primary/20">
                Use of the platform is subject to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
