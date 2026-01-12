import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, User, ArrowRight, BookOpen, Clock, Tag } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog | Tola Digital trade and Supply Chain Ecosystem Insights",
  description:
    "Tips, guides, and updates from the Tola team. Learn how to sell successfully, understand our platform features, and stay updated with Digital trade and Supply Chain Ecosystem news.",
  alternates: {
    canonical: "https://tolatola.co/blog",
  },
}

export default async function BlogPage() {
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

  const blogPosts = [
    {
      id: 1,
      title: "The Ultimate Guide to Selling on Tola",
      excerpt: "Expert strategies for new vendors to scale their operations, master the dashboard, and maximize profits in the Tanzanian market.",
      author: "Tola Editorial",
      date: "Jan 15, 2025",
      category: "Strategy",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026&auto=format&fit=crop"
    },
    {
      id: 2,
      title: "Secure Payments: Why Security is Non-Negotiable",
      excerpt: "Deep dive into our payment infrastructure and why we believe safe trade is the backbone of African commerce.",
      author: "Tech Team",
      date: "Jan 10, 2025",
      category: "Security",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
    },
    {
      id: 3,
      title: "Photography Tips for High-Volume Sales",
      excerpt: "You don't need a DSLR. Learn how to use your smartphone to take product shots that actually convert to sales.",
      author: "Creative Dept",
      date: "Jan 05, 2025",
      category: "Optimization",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
    },
    {
      id: 4,
      title: "Mobile Money Revolution in East Africa",
      excerpt: "How integration with M-Pesa and Tigo Pesa is changing the game for rural entrepreneurs across the country.",
      author: "Finance Ops",
      date: "Dec 28, 2024",
      category: "Fintech",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1563013544-824ae1fb9ad8?q=80&w=2070&auto=format&fit=crop"
    }
  ]

  const featured = blogPosts[0];
  const others = blogPosts.slice(1);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1">
        {/* Magazine Header */}
        <section className="py-24 container mx-auto px-4 border-b">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">The Tola Journal</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter">Insights & <span className="text-primary italic">Growth</span></h1>
            <p className="text-xl text-muted-foreground font-medium italic">Our latest stories on trade, technology, and the future of African commerce.</p>
          </div>
        </section>

        {/* Featured Post */}
        <section className="py-24 container mx-auto px-4 max-w-6xl">
          <div className="group relative rounded-[3rem] overflow-hidden bg-stone-900 shadow-2xl transition-all hover:scale-[1.01]">
            <div className="grid lg:grid-cols-2 gap-0">
              <div className="aspect-[4/3] lg:aspect-auto relative overflow-hidden">
                <img src={featured.image} alt={featured.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-stone-900/50 to-transparent lg:hidden" />
              </div>
              <div className="p-12 md:p-20 flex flex-col justify-center text-white relative">
                <div className="flex items-center gap-4 mb-8">
                  <span className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest">{featured.category}</span>
                  <span className="text-stone-400 text-sm font-bold flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {featured.readTime}
                  </span>
                </div>
                <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight group-hover:text-primary transition-colors">{featured.title}</h2>
                <p className="text-stone-400 text-xl mb-12 leading-relaxed italic">"{featured.excerpt}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-white/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-bold">{featured.author}</span>
                  </div>
                  <button className="h-14 w-14 rounded-full bg-white text-stone-900 flex items-center justify-center hover:scale-110 transition-transform">
                    <ArrowRight className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Latest Feed */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-end justify-between mb-16 border-l-8 border-primary pl-8">
              <div>
                <h2 className="text-4xl font-black tracking-tight">Latest Feed</h2>
                <p className="text-muted-foreground font-medium italic mt-2">Updates you might have missed.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {others.map((post) => (
                <Card key={post.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2.5rem] bg-white overflow-hidden group hover:-translate-y-2">
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img src={post.image} alt={post.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-[10px] font-black uppercase tracking-widest text-primary">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <CardHeader className="p-8">
                    <CardTitle className="text-2xl font-black mb-4 group-hover:text-primary transition-colors cursor-pointer leading-tight">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed line-clamp-3 italic">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-8 pb-8 flex items-center justify-between border-t border-dashed pt-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {post.date}
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-2 transition-transform" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-24 container mx-auto px-4 mb-24">
          <div className="bg-primary rounded-[3rem] p-12 md:p-24 text-center text-primary-foreground relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <Tag className="h-12 w-12 mx-auto mb-8 opacity-50" />
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tighter">Stay Ahead of the Curve</h2>
              <p className="text-primary-foreground/80 text-xl mb-12 italic">Subscribe to our monthly briefing for market insights and vendor growth tips.</p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                <input type="email" placeholder="your@email.com" className="flex-1 h-14 rounded-2xl px-6 bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20" />
                <button className="h-14 px-10 bg-white text-primary rounded-2xl font-black hover:scale-105 transition-transform shadow-xl">Join Now</button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
