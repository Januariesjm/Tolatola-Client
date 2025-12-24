import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Store, Users, Shield, TrendingUp, Target, Heart, Globe, Award, Zap } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us | Tola Marketplace",
  description:
    "Learn about Tola - Tanzania's premier Trade & Supply Chain Ecosystem. Discover our mission to empower local entrepreneurs and connect verified vendors with customers across Tanzania.",
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
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Premium Hero Section */}
        <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-stone-950">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542361345-89e58247f2d5?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-950/20 via-stone-950/80 to-stone-950" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="text-xs font-black uppercase tracking-widest">Our Story</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              Empowering <span className="text-primary underline decoration-primary decoration-4 underline-offset-8">Tanzania</span>
            </h1>
            <p className="text-stone-300 text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-700 delay-200">
              TOLA is more than a marketplace. It's a digital ecosystem designed to accelerate trade and supply chains for every entrepreneur in the region.
            </p>
          </div>
        </section>

        {/* Vision & Mission Cards */}
        <section className="py-24 container mx-auto px-4 max-w-6xl -mt-24 relative z-20">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-8 md:p-12 group hover:scale-[1.02] transition-transform duration-500">
              <div className="p-4 rounded-3xl bg-primary/5 text-primary w-fit mb-8 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                <Target className="h-10 w-10" />
              </div>
              <h2 className="text-4xl font-black mb-6 tracking-tight">Our Mission</h2>
              <p className="text-muted-foreground text-lg leading-relaxed italic">
                "To empower Tanzanian entrepreneurs by providing a secure, transparent, and high-performance platform that enables them to reach a global scale from local roots."
              </p>
            </Card>

            <Card className="border-none shadow-2xl rounded-[3rem] bg-stone-900 text-stone-100 p-8 md:p-12 group hover:scale-[1.02] transition-transform duration-500">
              <div className="p-4 rounded-3xl bg-white/5 text-primary w-fit mb-8 group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                <Globe className="h-10 w-10" />
              </div>
              <h2 className="text-4xl font-black mb-6 tracking-tight">Our Vision</h2>
              <p className="text-stone-400 text-lg leading-relaxed italic">
                "To become East Africa's most trusted trade infrastructure, bridging the gap between traditional commerce and the borderless digital economy."
              </p>
            </Card>
          </div>
        </section>

        {/* Narrative Section */}
        <section className="py-24 bg-muted/20">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-12 text-center md:text-left">
              <h2 className="text-5xl font-black tracking-tight mb-8 text-center underline decoration-primary decoration-8 underline-offset-4">Building Trust in Trade</h2>
              <div className="grid gap-10">
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Founded on the principles of <strong>transparency and accessibility</strong>, TOLA emerged from a need to solve the fundamental challenges facing Tanzanian commerce. We recognized that small and medium enterprises (SMEs) were often excluded from the digital revolution due to payment complexities and lack of trust.
                </p>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  By integrating a <strong>secure escrow system</strong> and high-vetted <strong>KYC protocols</strong>, we've created a safe haven for both buyers and sellers. Today, TOLA serves as a vital bridge, connecting artisans from Dodoma to traders in Dar Es Salaam, and beyond.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Core Values - Modern Grid */}
        <section className="py-24 container mx-auto px-4">
          <h2 className="text-center text-4xl font-black mb-16 tracking-tight">Our Core Values</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Shield />, title: "Trust First", desc: "Our escrow system ensures transactions are safe and verified every single time." },
              { icon: <Heart />, title: "Local Impact", desc: "We prioritize the growth of Tanzanian entrepreneurs and local artisans." },
              { icon: <Zap />, title: "Agility", desc: "We ship fast, adapt quickly, and use the latest tech to stay at the forefront." },
              { icon: <Award />, title: "Excellence", desc: "We maintain high standards for product quality and vendor participation." }
            ].map((value, i) => (
              <div key={i} className="p-8 rounded-[2.5rem] bg-white border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="mb-6 p-4 rounded-2xl bg-primary/5 text-primary w-fit">
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Offices Section */}
        <section className="py-24 bg-stone-900 text-stone-100 overflow-hidden relative">
          <div className="absolute inset-0 bg-primary opacity-5 mix-blend-overlay" />
          <div className="container mx-auto px-4 max-w-5xl relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="md:w-1/2">
                <h2 className="text-5xl font-black mb-8 tracking-tighter">Our Presence</h2>
                <p className="text-stone-400 text-lg mb-8 leading-relaxed">
                  While our platform is digital, our roots are firmly planted in Tanzania. We operate from multiple hubs to ensure local support and efficient logistics.
                </p>
                <div className="space-y-6">
                  <div className="flex items-center gap-4 py-4 px-6 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-primary font-bold">HQ</span>
                    <div>
                      <p className="font-bold">Dodoma Central</p>
                      <p className="text-sm text-stone-400">+255 678 227 227</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 py-4 px-6 bg-white/5 rounded-2xl border border-white/10">
                    <span className="text-primary font-bold">OPS</span>
                    <div>
                      <p className="font-bold">Dar Es Salaam Hub</p>
                      <p className="text-sm text-stone-400">+255 625 377 978</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 relative group">
                <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-2xl group-hover:bg-primary/30 transition-colors" />
                <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1577412647305-991150c7d163?q=80&w=2070&auto=format&fit=crop" alt="Office Culture" className="w-full scale-105 group-hover:scale-110 transition-transform duration-700" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
