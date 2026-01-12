import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCcw, CheckCircle2, XCircle, Truck, HelpCircle, Mail, Phone, Calendar, ClipboardCheck, ArrowRight, ShieldCheck } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Return Policy | Tola Digital trade and Supply Chain Ecosystem",
  description: "Learn about Tola's hassle-free return policy. We protect our buyers with a secure payment system and clear return guidelines for every transaction.",
  alternates: {
    canonical: "https://tolatola.co/return-policy",
  },
}

export default async function ReturnPolicyPage() {
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

  const steps = [
    { title: "Initiate Request", desc: "Start the process via your dashboard within 7 days.", icon: <Mail /> },
    { title: "Review & Verify", desc: "Vendors review photos and details of your claim.", icon: <ClipboardCheck /> },
    { title: "Secure Return", desc: "Ship the item back in its original condition.", icon: <RefreshCcw /> },
    { title: "Instant Payout", desc: "Funds are released to your wallet.", icon: <CheckCircle2 /> }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Premium Banner */}
        <section className="relative h-[550px] flex items-center justify-center bg-stone-950 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 grayscale" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">Buyer Protection</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter">Hassle-Free <span className="text-primary underline decoration-primary decoration-4 underline-offset-8">Returns</span></h1>
            <p className="text-stone-300 text-xl md:text-2xl max-w-3xl mx-auto font-medium leading-relaxed italic">
              Shopping on TOLA is risk-free. Our protected payment system guarantees your money is safe until you're satisfied.
            </p>
          </div>
        </section>

        {/* Eligibility Section */}
        <section className="py-24 container mx-auto px-4 max-w-6xl -mt-24 relative z-20">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-none shadow-2xl rounded-[3rem] bg-white p-12 group hover:-translate-y-2 transition-all duration-500">
              <div className="mb-8 p-5 rounded-3xl bg-green-50 text-green-600 w-fit group-hover:bg-green-600 group-hover:text-white transition-colors duration-500">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="text-4xl font-black mb-6 tracking-tight">Return Eligibility</h2>
              <p className="text-muted-foreground text-lg mb-8 italic">You can return items within <span className="text-foreground font-black underline underline-offset-4 decoration-green-500">7 days</span> if:</p>
              <ul className="space-y-4">
                {["Defective or damaged items", "Description mismatch", "Incorrect item delivered", "Missing accessories"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg font-bold group/item">
                    <span className="h-2 w-2 rounded-full bg-green-500 group-hover/item:scale-150 transition-transform" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="border-none shadow-2xl rounded-[3rem] bg-stone-900 text-stone-100 p-12 group hover:-translate-y-2 transition-all duration-500">
              <div className="mb-8 p-5 rounded-3xl bg-white/5 text-primary w-fit group-hover:bg-primary group-hover:text-white transition-colors duration-500">
                <XCircle className="h-10 w-10" />
              </div>
              <h2 className="text-4xl font-black mb-6 tracking-tight text-white">Non-Returnable</h2>
              <p className="text-stone-400 text-lg mb-8 italic">For hygiene and safety, we cannot accept returns on:</p>
              <ul className="space-y-4">
                {["Perishables & Food", "Personal Care & Beauty", "Customized Goods", "Digital Vouchers"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-lg font-bold text-stone-300 group/item">
                    <span className="h-2 w-2 rounded-full bg-primary/40 group-hover/item:bg-primary transition-colors" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </section>

        {/* The Process - Premium UI */}
        <section className="py-24 bg-muted/20">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-5xl font-black mb-20 tracking-tight">The Tola Process</h2>
            <div className="grid md:grid-cols-4 gap-4 relative">
              <div className="hidden md:block absolute top-[60px] left-[10%] right-[10%] h-0.5 bg-stone-200 border-t border-dashed border-stone-300" />

              {steps.map((step, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center text-center p-8 bg-white border border-stone-100 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all group">
                  <div className="mb-8 w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 transform group-hover:rotate-12">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-black mb-4">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed italic line-clamp-2">"{step.desc}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Refund Mechanism */}
        <section className="py-24 container mx-auto px-4">
          <div className="bg-stone-900 rounded-[4rem] p-12 md:p-24 overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px] translate-x-1/3 -translate-y-1/3" />
            <div className="grid lg:grid-cols-2 gap-16 relative z-10 items-center">
              <div>
                <h2 className="text-5xl font-black text-white mb-8 tracking-tighter">Secure Payouts</h2>
                <p className="text-stone-400 text-xl leading-relaxed mb-12 italic">
                  Your refund isn't just a promise. It's built into our code. Once a return is verified, funds are automatically released back to your mobile money wallet.
                </p>
                <div className="flex items-center gap-4 p-8 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-md">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                    <Calendar className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-white font-black text-xl">3-5 Business Days</p>
                    <p className="text-stone-500 text-sm">Typical processing time for all mobile wallets.</p>
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-stone-500 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                <div className="relative p-8 bg-stone-950 rounded-[3rem] border border-white/10 text-center">
                  <RefreshCcw className="h-20 w-20 text-primary mx-auto mb-8 animate-spin-slow" />
                  <h3 className="text-3xl font-black text-white mb-4">Real-time Tracking</h3>
                  <p className="text-stone-500 mb-8 italic">Monitor your return status every step of the way in your TOLA dashboard.</p>
                  <a href="/orders" className="inline-flex items-center gap-2 group-hover:text-primary transition-colors text-white font-bold uppercase tracking-widest text-xs">
                    Manage Orders <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <HelpCircle className="h-16 w-16 text-primary mx-auto mb-8 opacity-50" />
            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Need a customized solution?</h2>
            <p className="text-muted-foreground text-xl mb-12 italic max-w-2xl mx-auto">Our support team handles complex disputes personally to ensure fair outcomes for all.</p>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="mailto:support@tolatola.co" className="px-10 py-5 bg-white border border-stone-200 rounded-3xl font-black shadow-xl hover:-translate-y-1 transition-all"> support@tolatola.co </a>
              <a href="/contact" className="px-10 py-5 bg-stone-900 text-white rounded-3xl font-black shadow-xl hover:-translate-y-1 transition-all"> Open Support Ticket </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
