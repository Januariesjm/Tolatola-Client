import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import SiteFooter from "@/components/layout/site-footer"
import { Award, Briefcase, Globe, Mail, Linkedin, Twitter, Quote, ArrowRight, Sparkles, ShieldCheck } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Meet the Founder | Faraja Dastan Mhalale | TOLA",
  description:
    "Faraja Dastan Mhalale is the Founder and CEO of TOLA, a Digital Trade & Supply Chain Ecosystem building the digital infrastructure for inclusive commerce across Africa.",
  alternates: {
    canonical: "https://tolatola.co/founder",
  },
}

export default async function FounderPage() {
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
    <div className="min-h-screen bg-stone-50/50 flex flex-col font-sans">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1 pb-24">
        {/* Editorial Top Hero */}
        <section className="relative overflow-hidden bg-stone-950 text-white py-24 md:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-70" />
          <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
          
          <div className="container mx-auto px-4 max-w-6xl relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 mb-6 px-4.5 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Our Leadership</span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 tracking-tighter leading-none">
                The Visionary Behind <span className="text-primary italic">TOLA</span>
              </h1>
              <p className="text-lg md:text-xl text-stone-300 font-medium italic max-w-2xl leading-relaxed">
                "We are building an ecosystem where trust, technology, and opportunity come together to power the future of African commerce."
              </p>
            </div>
          </div>
        </section>

        {/* Biography & Portrait Section */}
        <section className="py-16 md:py-24 container mx-auto px-4 max-w-6xl -mt-10 relative z-20">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-16">
            
            {/* Left Sidebar: Photo and Key Details */}
            <div className="lg:col-span-4 space-y-8">
              <div className="sticky top-28">
                {/* Portrait Card */}
                <div className="group rounded-[2.5rem] overflow-hidden bg-white border border-stone-200/80 shadow-xl shadow-stone-100/50 p-4 transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl">
                  <div className="aspect-square relative rounded-[2rem] overflow-hidden bg-stone-100 mb-6">
                    <img
                      src="/images/founder.png"
                      alt="Faraja Dastan Mhalale"
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="text-center px-2 pb-2">
                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Faraja Dastan Mhalale</h2>
                    <p className="text-sm font-black text-primary uppercase tracking-widest mt-1">Founder & CEO</p>
                    
                    {/* Social links */}
                    <div className="flex justify-center gap-3 mt-6 border-t border-dashed border-stone-100 pt-5">
                      <a href="#" className="h-10 w-10 rounded-full border border-stone-200 hover:bg-primary hover:text-white hover:border-primary text-stone-500 flex items-center justify-center transition-all" title="LinkedIn Profile">
                        <Linkedin className="h-4.5 w-4.5" />
                      </a>
                      <a href="#" className="h-10 w-10 rounded-full border border-stone-200 hover:bg-primary hover:text-white hover:border-primary text-stone-500 flex items-center justify-center transition-all" title="Twitter Profile">
                        <Twitter className="h-4.5 w-4.5" />
                      </a>
                      <a href="mailto:info@tolatola.co" className="h-10 w-10 rounded-full border border-stone-200 hover:bg-primary hover:text-white hover:border-primary text-stone-500 flex items-center justify-center transition-all" title="Contact Email">
                        <Mail className="h-4.5 w-4.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Key Affiliations Card */}
                <div className="mt-8 rounded-[2rem] bg-white border border-stone-200/60 p-6 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-400">Core Philosophy</h3>
                  <div className="space-y-3.5">
                    <div className="flex gap-3 text-sm">
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-stone-600 font-medium">Building high-trust commerce infrastructures</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <Award className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="text-stone-600 font-medium">AfCFTA trade enablement alignment</span>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <Briefcase className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-stone-600 font-medium">Sustainable digital transformation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: In-depth Vision Narrative */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Vision Block */}
              <div className="prose prose-lg max-w-none text-slate-800 leading-relaxed space-y-6">
                <p className="text-xl font-medium leading-relaxed text-stone-600 italic border-l-4 border-primary pl-6">
                  Faraja Dastan Mhalale is the Founder and Chief Executive Officer of TOLA, a Digital Trade & Supply Chain Ecosystem building the digital infrastructure for trusted, efficient, and inclusive commerce across Africa.
                </p>

                <p>
                  He founded TOLA after recognizing a fundamental challenge: while Africa is one of the world's fastest-growing regions, millions of businesses—from farmers and manufacturers to wholesalers, retailers, and service providers—continue to face fragmented markets, inefficient supply chains, limited market access, high transaction costs, and low levels of trust in digital trade. These structural challenges prevent businesses from reaching their full potential and reduce the continent's economic competitiveness.
                </p>

                <p>
                  Faraja believes that Africa does not simply need more online marketplaces; it needs an integrated digital trade ecosystem capable of connecting every participant in the value chain. This vision gave birth to TOLA.
                </p>

                <p>
                  TOLA is designed to bring together buyers, sellers, manufacturers, farmers, logistics providers, service providers, financial institutions, and business support services within a single technology ecosystem. By integrating digital commerce, supply chain coordination, logistics, business networking, and trusted transactions, TOLA enables businesses to operate more efficiently, expand into new markets, reduce operational costs, and build long-term commercial relationships.
                </p>

                <p>
                  Under Faraja's leadership, TOLA is developing technology that supports businesses from product discovery to order management, payments, fulfilment, customer engagement, and supply chain visibility. The platform is built to strengthen both domestic and cross-border trade while supporting the digital transformation of African commerce.
                </p>

                <p>
                  His long-term vision extends beyond building a successful technology company. He aims to help create a more connected, transparent, and resilient African economy where businesses of every size have equal access to markets, opportunities, and digital tools for growth.
                </p>

                <p>
                  Faraja is committed to positioning TOLA as one of Africa's leading digital trade and supply chain infrastructures—powering trusted transactions, supporting millions of businesses, enabling sustainable economic growth, creating employment opportunities, and contributing to the realization of the African Continental Free Trade Area (AfCFTA) by making cross-border commerce simpler, safer, and more accessible through technology.
                </p>

                <p>
                  His leadership philosophy is built on innovation, integrity, execution, collaboration, and long-term value creation. He believes that the future of Africa will be shaped not only by technology, but by platforms that build trust, remove barriers to trade, and empower entrepreneurs to compete at a global scale.
                </p>
              </div>

              {/* Founder's Message Card */}
              <div className="bg-primary/5 rounded-[2.5rem] p-8 md:p-12 border border-primary/10 relative overflow-hidden group">
                <Quote className="absolute right-8 top-8 h-24 w-24 text-primary/10 select-none group-hover:scale-110 transition-transform duration-700" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-6 text-slate-900 tracking-tight flex items-center gap-2">
                    <Quote className="h-6 w-6 text-primary shrink-0" />
                    Founder's Message
                  </h3>
                  
                  <div className="space-y-4 text-slate-700 italic text-lg leading-relaxed mb-8">
                    <p>
                      "Trade has always been one of the greatest drivers of human progress. Yet millions of African businesses still struggle to access markets, trusted business partners, efficient supply chains, and the digital tools needed to grow. TOLA was created to change that reality."
                    </p>
                    <p>
                      "Our mission is to build the digital infrastructure that enables every business—from the smallest local enterprise to the largest manufacturer—to trade with confidence, operate more efficiently, and unlock new opportunities across Africa and beyond."
                    </p>
                    <p>
                      "We are not simply building a marketplace. We are building an ecosystem where trust, technology, and opportunity come together to power the future of African commerce."
                    </p>
                  </div>

                  <div className="border-t border-primary/10 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h4 className="font-black text-slate-900 text-lg">Faraja Dastan Mhalale</h4>
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Founder & Chief Executive Officer, TOLA</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* CTA: Join the Ecosystem */}
        <section className="py-8 container mx-auto px-4 max-w-6xl">
          <div className="bg-stone-900 rounded-[2.5rem] p-10 md:p-16 text-center text-white relative overflow-hidden group border border-stone-800">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter leading-tight">
                Unlock the Power of <span className="text-primary italic">Digital Trade</span>
              </h2>
              <p className="text-stone-400 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Connect your business to the most trusted, inclusive, and connected trade ecosystem in Tanzania and beyond.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Link href="/vendor/register">
                  <button className="h-12 w-full sm:w-auto px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl hover:scale-[1.03] transition-transform shadow-xl flex items-center justify-center gap-2 text-sm">
                    Become a Vendor <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
                <Link href="/transporter/register">
                  <button className="h-12 w-full sm:w-auto px-8 bg-white hover:bg-stone-50 text-stone-900 font-bold rounded-xl hover:scale-[1.03] transition-transform shadow-md flex items-center justify-center gap-2 text-sm">
                    Join as Transporter
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}

