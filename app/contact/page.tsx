import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Phone, Mail, MapPin, Send, MessageSquare, Clock, Globe } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us | Tola Marketplace",
  description:
    "Get in touch with Tola customer support. We're here to help with your questions about buying, selling, or using our marketplace. Contact us via phone or email.",
  alternates: {
    canonical: "https://tolatola.co/contact",
  },
}

export default async function ContactPage() {
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
        {/* Simple Header */}
        <section className="bg-primary pt-24 pb-48 text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">Get in Touch</h1>
            <p className="text-primary-foreground/80 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
              Have questions or feedback? Our team is dedicated to providing you with the best support experience across Tanzania.
            </p>
          </div>
        </section>

        {/* Main Contact Section (Floating Cards) */}
        <section className="container mx-auto px-4 -mt-32 relative z-20 pb-24">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">

            {/* Contact Form */}
            <Card className="lg:col-span-3 border-none shadow-2xl rounded-[2.5rem] bg-white p-4 md:p-8">
              <CardHeader className="pb-8">
                <CardTitle className="text-3xl font-black flex items-center gap-3">
                  <MessageSquare className="h-8 w-8 text-primary" />
                  Send a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                    <Input id="name" placeholder="John Doe" className="rounded-xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                    <Input id="email" type="email" placeholder="john@example.com" className="rounded-xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                    <Input id="phone" placeholder="+255 XXX XXX XXX" className="rounded-xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</Label>
                    <Input id="subject" placeholder="Partner Inquiry" className="rounded-xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 h-12" />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Message</Label>
                    <Textarea id="message" placeholder="How can we help you?" rows={6} className="rounded-xl bg-muted/30 border-none focus-visible:ring-2 focus-visible:ring-primary/20 p-4 resize-none" />
                  </div>
                  <div className="sm:col-span-2 pt-4">
                    <Button type="submit" className="w-full rounded-2xl h-14 font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                      Send Message
                      <Send className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Sidebar Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Information Card */}
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-stone-900 text-stone-100 p-8">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-black underline decoration-primary decoration-4 underline-offset-8 mb-4">Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-10">
                  <div className="flex gap-4 group">
                    <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary transition-colors">
                      <Phone className="h-6 w-6 text-primary group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Call Us</p>
                      <p className="font-bold">+255 678 227 227</p>
                      <p className="text-sm text-stone-400">+255 625 377 978</p>
                    </div>
                  </div>

                  <div className="flex gap-4 group">
                    <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary transition-colors">
                      <Mail className="h-6 w-6 text-primary group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Email Us</p>
                      <p className="font-bold">info@tolatola.co</p>
                      <p className="text-sm text-stone-400">support@tolatola.co</p>
                    </div>
                  </div>

                  <div className="flex gap-4 group">
                    <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary transition-colors">
                      <Clock className="h-6 w-6 text-primary group-hover:text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">Office Hours</p>
                      <p className="font-bold">Mon - Fri: 8 AM - 6 PM</p>
                      <p className="text-sm text-stone-400">Sat: 9 AM - 4 PM</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Locations Card */}
              <Card className="border-none shadow-xl rounded-[2.5rem] bg-white p-8 overflow-hidden relative group">
                <Globe className="absolute -bottom-10 -right-10 h-48 w-48 text-muted/20 opacity-20 group-hover:scale-110 transition-transform" />
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="text-2xl font-black mb-6">Our Presence</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0 space-y-6">
                  <div className="flex gap-3 relative z-10">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-bold">Dodoma Headquarters</p>
                      <p className="text-sm text-muted-foreground">Main Business Hub, TZ</p>
                    </div>
                  </div>
                  <div className="flex gap-3 relative z-10">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="font-bold">Dar Es Salaam Office</p>
                      <p className="text-sm text-muted-foreground">Logistics Center, TZ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
