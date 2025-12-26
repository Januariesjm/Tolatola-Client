import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, Users, TrendingUp, Heart, Sparkles, MapPin, ArrowRight, Zap, Mail } from "lucide-react"

export default async function CareersPage() {
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

  const jobs = [
    {
      title: "Senior Software Engineer",
      loc: "Dar Es Salaam / Remote",
      dept: "Engineering",
      desc: "Help architect and scale our core Digital trade and Supply Chain Ecosystem engine and logistics systems using Next.js and Go.",
      tags: ["Full-time", "Hybrid"]
    },
    {
      title: "Brand Marketing Lead",
      loc: "Dar Es Salaam",
      dept: "Marketing",
      desc: "Shape the Tola brand identity and lead our digital acquisition strategies across East Africa.",
      tags: ["Full-time", "On-site"]
    },
    {
      title: "Customer Success Manager",
      loc: "Dodoma",
      dept: "Operations",
      desc: "Ensure our vendors and customers have a world-class experience on the Tola platform.",
      tags: ["Full-time", "On-site"]
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Animated Hero Section */}
        <section className="relative h-[500px] flex items-center justify-center overflow-hidden bg-stone-950">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-widest">We're Growing Fast</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
              Careers at <span className="text-primary italic">TOLA</span>
            </h1>
            <p className="text-stone-400 text-xl max-w-2xl mx-auto leading-relaxed">
              We're building the infrastructure of East African commerce. Join our mission to empower local entrepreneurs.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="rounded-full px-8 h-12 font-bold group">
                View Openings
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 font-bold text-white border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10">
                Our Culture
              </Button>
            </div>
          </div>
        </section>

        {/* Perks Section */}
        <section className="py-24 container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: <TrendingUp />, title: "Hyper Growth", desc: "Plentiful paths for career advancement." },
              { icon: <Users />, title: "True Diversity", desc: "Collaborate with top talent globally." },
              { icon: <Heart />, title: "Mission Driven", desc: "Impact thousands of local businesses." },
              { icon: <Zap />, title: "Modern Tech", desc: "Ship fast with the latest technologies." }
            ].map((perk, i) => (
              <div key={i} className="space-y-4 text-center md:text-left">
                <div className="inline-flex p-3 rounded-2xl bg-primary/5 text-primary">
                  {perk.icon}
                </div>
                <h3 className="text-xl font-bold tracking-tight">{perk.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{perk.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Job Listings */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
              <div>
                <h2 className="text-4xl font-bold tracking-tighter mb-4">Open Positions</h2>
                <p className="text-muted-foreground text-lg">Help us shape the future of African e-commerce.</p>
              </div>
            </div>

            <div className="space-y-6">
              {jobs.map((job, i) => (
                <div key={i} className="group p-8 rounded-[2rem] bg-white border shadow-sm hover:shadow-xl transition-all hover:border-primary/30 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                      {job.tags.map((tag, ti) => (
                        <span key={ti} className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="text-2xl font-black mb-2 group-hover:text-primary transition-colors">{job.title}</h3>
                    <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground font-medium mb-4">
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        {job.dept}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.loc}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed md:max-w-2xl italic">"{job.desc}"</p>
                  </div>
                  <Button className="rounded-full px-8 py-6 font-black h-auto group-hover:scale-110 transition-transform">
                    Apply
                  </Button>
                </div>
              ))}
            </div>

            {/* General Inquiry */}
            <div className="mt-20 p-12 rounded-[3rem] bg-primary text-primary-foreground text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-3xl font-black mb-4">Don't see the right role?</h3>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                We're always on the lookout for exceptional talent. If you're passionate about Digital trade and Supply Chain Ecosystems, send us your resume.
              </p>
              <a href="mailto:careers@tolatola.co" className="inline-flex h-14 items-center gap-3 px-10 bg-white text-primary rounded-2xl font-black shadow-xl hover:scale-105 transition-all">
                <Mail className="h-5 w-5" />
                careers@tolatola.co
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
