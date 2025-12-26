import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle, ShoppingBag, Store, ShieldCheck, Wallet, Truck, MessageCircle, AlertCircle } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FAQ | Tola Digital trade and Supply Chain Ecosystem Support",
  description:
    "Frequently asked questions about Tola Digital trade and Supply Chain Ecosystem. Find answers about buying, selling, payments, escrow system, KYC verification, and more.",
  alternates: {
    canonical: "https://tolatola.co/faq",
  },
}

export default async function FAQPage() {
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

  const faqCategories = [
    {
      title: "For Buyers",
      icon: <ShoppingBag />,
      questions: [
        { q: "How do I create an account?", a: "Click on 'Sign Up' in the top right corner, fill in your details including email, password, and phone number. You'll receive a confirmation email to verify your account." },
        { q: "What payment methods do you accept?", a: "We accept M-Pesa, Tigo Pesa, and Airtel Money. All payments are processed through our secure escrow system to protect both buyers and sellers." },
        { q: "How does the escrow system work?", a: "When you make a purchase, your payment is held securely in escrow. The funds are only released to the vendor after you confirm that you've received your order. This protects you from fraud and ensures you get what you paid for." },
        { q: "What if I don't receive my order?", a: "If you don't receive your order within the expected timeframe, contact our support team. Since your payment is held in escrow, we can investigate and issue a refund if necessary." }
      ]
    },
    {
      title: "For Vendors",
      icon: <Store />,
      questions: [
        { q: "How do I become a vendor?", a: "Click 'Become a Vendor' on the homepage, create an account, and complete the KYC verification process. You'll need to provide your TIN, NIDA, and business license. Once approved, you can start listing products." },
        { q: "What documents do I need for KYC?", a: "You need: (1) Tax Identification Number (TIN), (2) National ID (NIDA), and (3) Business License. All documents must be valid and clearly legible." },
        { q: "When do I receive payment for my sales?", a: "Payments are released from escrow after the buyer confirms delivery. You can then request a payout to your mobile money account. Payouts are typically processed within 24-48 hours." },
        { q: "What are the fees for selling?", a: "We charge a small commission on each sale to maintain the platform. There are no upfront fees or monthly subscription charges." }
      ]
    },
    {
      title: "Security & Trust",
      icon: <ShieldCheck />,
      questions: [
        { q: "Is my data secure on Tola?", a: "Yes. We use industry-standard encryption and secure servers to protect all your personal and financial information." },
        { q: "How do you verify vendors?", a: "Every vendor must undergo a rigorous KYC (Know Your Customer) process, verifying their government-issued IDs and business documentation before they can sell." }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Support Header */}
        <section className="bg-muted/30 py-24 border-b">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex p-4 rounded-[2rem] bg-white border shadow-sm mb-8 animate-in fade-in zoom-in duration-500">
              <HelpCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">Support Hub</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed italic">
              Find quick answers to common questions about buying, selling, and building trust on TOLA.
            </p>
          </div>
        </section>

        {/* FAQ Grid */}
        <section className="py-24 container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-24">
            {faqCategories.map((category, catIdx) => (
              <div key={catIdx} className="space-y-12">
                <div className="flex items-center gap-6 border-l-8 border-primary pl-8">
                  <div className="p-4 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                    {category.icon}
                  </div>
                  <h2 className="text-4xl font-black tracking-tight">{category.title}</h2>
                </div>

                <div className="grid gap-4">
                  <Accordion type="single" collapsible className="space-y-4">
                    {category.questions.map((faq, qIdx) => (
                      <AccordionItem
                        key={qIdx}
                        value={`item-${catIdx}-${qIdx}`}
                        className="border-none bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
                      >
                        <AccordionTrigger className="px-8 py-6 text-xl font-bold hover:no-underline hover:text-primary text-left">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="px-8 pb-8 text-muted-foreground text-lg leading-relaxed italic border-t border-dashed pt-6">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-24 bg-stone-900 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">Still have questions?</h2>
            <p className="text-stone-400 text-xl mb-12 max-w-2xl mx-auto italic">
              Our customer success team is ready to assist you with any specific inquiry.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="/contact" className="flex items-center gap-3 px-10 py-5 bg-white text-stone-900 rounded-2xl font-black shadow-2xl hover:scale-105 transition-all">
                <MessageCircle className="h-6 w-6 text-primary" />
                Get Personal Support
              </a>
              <a href="mailto:support@tolatola.co" className="flex items-center gap-3 px-10 py-5 bg-white/5 border border-white/10 text-white rounded-2xl font-black backdrop-blur-md hover:bg-white/10 transition-all">
                <Wallet className="h-6 w-6 text-primary" />
                Email Help Center
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
