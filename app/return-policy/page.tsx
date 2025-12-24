import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { RefreshCcw, CheckCircle2, XCircle, Truck, HelpCircle, Mail, Phone, Calendar, ClipboardCheck } from "lucide-react"

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
    {
      title: "Contact Vendor",
      desc: "Reach out to the vendor through your order management page to initiate a return request.",
      icon: <Mail className="h-6 w-6" />
    },
    {
      title: "Vendor Approval",
      desc: "The vendor will review your request and provide specific return or replacement instructions.",
      icon: <ClipboardCheck className="h-6 w-6" />
    },
    {
      title: "Safe Packaging",
      desc: "Return the item in its original packaging with all included accessories and documentation.",
      icon: <RefreshCcw className="h-6 w-6" />
    },
    {
      title: "Refund Issued",
      desc: "Once received and inspected, your refund will be released back to your mobile money wallet.",
      icon: <CheckCircle2 className="h-6 w-6" />
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Banner Section */}
        <section className="bg-primary text-primary-foreground py-20 overflow-hidden relative">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-white/10 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Hassle-Free Returns</h1>
            <p className="text-primary-foreground/80 text-xl max-w-2xl mx-auto font-medium">
              At Tola, buyer protection is our standard. If you're not happy with your order, we've got you covered.
            </p>
          </div>
        </section>

        {/* Policy Grid */}
        <section className="py-20 container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Eligibility */}
            <Card className="border-none shadow-xl bg-muted/50 p-2">
              <CardContent className="pt-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-green-100 text-green-700 rounded-2xl">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold">Return Eligibility</h2>
                </div>
                <p className="mb-6 text-muted-foreground">You may return items within <span className="text-foreground font-bold underline">7 days of delivery</span> if:</p>
                <ul className="space-y-4">
                  {[
                    "Item is defective or damaged upon arrival",
                    "Significant difference from product description",
                    "Received the wrong item entirely",
                    "Missing critical parts or accessories"
                  ].map((text, i) => (
                    <li key={i} className="flex gap-3 text-sm font-medium">
                      <span className="text-green-500 font-bold">✓</span>
                      {text}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Exclusions */}
            <Card className="border-none shadow-xl bg-orange-50/50 p-2">
              <CardContent className="pt-8">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-orange-100 text-orange-700 rounded-2xl">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <h2 className="text-2xl font-bold text-orange-950">Non-Returnable Items</h2>
                </div>
                <p className="mb-6 text-orange-900/60 font-medium">To maintain hygiene and safety standards, the following cannot be returned:</p>
                <ul className="space-y-4">
                  {[
                    "Perishable goods (fresh food, flowers)",
                    "Opened personal care or beauty items",
                    "Customized or personalized products",
                    "Digital products or software keys"
                  ].map((text, i) => (
                    <li key={i} className="flex gap-3 text-sm font-medium text-orange-900">
                      <span className="text-orange-400 font-bold">✕</span>
                      {text}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* How it Works - Timeline UI */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center mb-12">The Return Process</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {steps.map((step, i) => (
                <div key={i} className="relative group p-8 rounded-3xl bg-white border hover:border-primary transition-all hover:shadow-2xl hover:-translate-y-1">
                  <div className="absolute -top-4 -right-4 w-12 h-12 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-black text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                    {i + 1}
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-6 group-hover:text-primary transition-colors">
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Refund Info */}
          <div className="mt-32 bg-stone-900 text-stone-100 rounded-[3rem] p-8 md:p-16 flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-4xl font-bold mb-6">Secured Refunds</h2>
              <div className="space-y-6 text-stone-400">
                <p className="text-lg leading-relaxed">
                  Refunds are processed through our <strong>escrow system</strong>. If your return is approved, funds are released back to your mobile money account (M-Pesa, Tigo Pesa, or Airtel Money).
                </p>
                <div className="flex items-center gap-4 py-4 px-6 bg-white/5 rounded-2xl border border-white/10">
                  <Calendar className="h-6 w-6 text-primary" />
                  <p className="text-sm font-medium"><span className="text-white">Timeline:</span> Refunds typically take 3-5 business days.</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 grid grid-cols-2 gap-4">
              <div className="aspect-square rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <RefreshCcw className="h-8 w-8 text-primary" />
                <span className="text-xs uppercase font-bold tracking-widest text-stone-500 underline decoration-primary decoration-2 underline-offset-4">Escrow Backed</span>
              </div>
              <div className="aspect-square rounded-3xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <span className="text-xs uppercase font-bold tracking-widest text-stone-500 underline decoration-primary decoration-2 underline-offset-4">Verified Items</span>
              </div>
            </div>
          </div>
        </section>

        {/* Support CTA */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-xl mx-auto">
              <div className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-6">
                <HelpCircle className="h-8 w-8" />
              </div>
              <h2 className="text-3xl font-black mb-4">Still need assistance?</h2>
              <p className="text-muted-foreground mb-10 text-lg">Our customer success team is here to help you resolve any issues with your order.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="mailto:support@tolatola.co" className="flex items-center justify-center gap-3 px-8 py-4 bg-white border border-stone-200 rounded-2xl font-bold shadow-sm hover:bg-muted transition-all">
                  <Mail className="h-5 w-5 text-primary" />
                  support@tolatola.co
                </a>
                <a href="tel:+255678227227" className="flex items-center justify-center gap-3 px-8 py-4 bg-white border border-stone-200 rounded-2xl font-bold shadow-sm hover:bg-muted transition-all">
                  <Phone className="h-5 w-5 text-primary" />
                  +255 678 227 227
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
