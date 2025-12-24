import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, TrendingUp, Users, Zap, Globe, Wallet, Sparkles, ArrowRight, Store, ShoppingBag } from "lucide-react"
import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import SiteHeader from "@/components/layout/site-header"
import { HomeProductsSection } from "@/components/home/home-products-section"
import { CategoriesNav } from "@/components/layout/categories-nav"
import { HeroSlider } from "@/components/home/hero-slider"
import type { Metadata } from "next"
import { serverApiGet } from "@/lib/api-server"
import type { Database } from "@/lib/types"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "TOLA Marketplace | Tanzania's Premier Trading Platform",
  description:
    "Experience the future of trade in Tanzania. TOLA combines secure escrow, verified vendors, and mobile money convenience in one premium marketplace.",
  alternates: {
    canonical: "https://tolatola.co",
  },
}

export default async function HomePage() {
  const supabase = createServerComponentClient<Database>({ cookies, headers } as any)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  let kycStatus = null

  if (user) {
    try {
      const profileRes = await serverApiGet<{ profile: any }>("profile")
      profile = profileRes.profile
      kycStatus = profileRes.profile?.kyc_status || null
      // Redirect logged-in users to shop per requirement
      redirect("/shop")
    } catch {
      // ignore
    }
  }

  const categoriesRes = await serverApiGet<{ data: any[] }>("categories").catch(() => ({ data: [] }))
  const promotionsRes = await serverApiGet<{ data: any[] }>("promotions").catch(() => ({ data: [] }))
  const productsRes = await serverApiGet<{ data: any[] }>("products").catch(() => ({ data: [] }))

  const categories = categoriesRes.data || []
  const promotions = promotionsRes.data || []
  const allProducts = productsRes.data || []

  const productsWithDiscount = allProducts.map((product: any) => {
    let discountPercent = 0
    if (product.compare_at_price && product.compare_at_price > product.price) {
      discountPercent = Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    }
    return { ...product, discountPercent }
  }) || []

  const featuredProducts = productsWithDiscount.slice(0, 10)
  const bestDeals = productsWithDiscount.filter((p) => p.discountPercent > 0).slice(0, 10)

  const features = [
    {
      title: "Escrow Secured",
      desc: "Your funds are held in trust until you verify delivery. Total peace of mind.",
      icon: <Wallet className="h-8 w-8" />,
      color: "bg-blue-500"
    },
    {
      title: "NIDA Verified",
      desc: "Every vendor undergoes rigorous identity and business vetting before listing.",
      icon: <Shield className="h-8 w-8" />,
      color: "bg-primary"
    },
    {
      title: "Swift Delivery",
      desc: "Local logistics partners ensure your orders reach you in record time.",
      icon: <Zap className="h-8 w-8" />,
      color: "bg-amber-500"
    }
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "TOLA",
            url: "https://tolatola.co",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://tolatola.co/search?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
            description: "Tanzania's premier multivendor marketplace",
          }),
        }}
      />

      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <CategoriesNav categories={categories || []} />

      <main className="flex-1">
        <HeroSlider promotions={promotions || []} />

        {/* Benefits Strip */}
        <section className="bg-stone-900 overflow-hidden py-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center md:justify-around gap-8 text-white/60">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-sm font-black tracking-widest uppercase italic">Secure Escrow</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-black tracking-widest uppercase italic">Verified Vendors</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-primary" />
                <span className="text-sm font-black tracking-widest uppercase italic">Pan-Tanzania Reach</span>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Categories */}
        <section className="py-24 container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="space-y-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-primary font-black uppercase tracking-widest text-xs">
                <Sparkles className="h-4 w-4" />
                <span>Selections for you</span>
              </div>
              <h2 className="text-4xl md:text-7xl font-black tracking-tighter">Shop by <span className="text-primary italic">Category</span></h2>
            </div>
            <Link href="/shop" className="group flex items-center justify-center gap-2 text-lg font-bold hover:text-primary transition-colors">
              View Entire Catalog <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {categories.slice(0, 8).map((cat, i) => (
              <Link key={cat.id} href={`/shop?category=${cat.id}`} className="group relative aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-stone-100 border border-stone-100 hover:shadow-2xl transition-all duration-500">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-stone-100">
                    <ShoppingBag className="h-12 w-12 text-stone-300" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent flex flex-col justify-end h-1/2">
                  <h3 className="text-white text-xl md:text-2xl font-black tracking-tight">{cat.name}</h3>
                  <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-2 group-hover:text-primary transition-colors">Explore Now →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <HomeProductsSection featuredProducts={featuredProducts} bestDeals={bestDeals} />

        {/* Why Tola - Modern Cards */}
        <section className="py-32 bg-stone-50 overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter">Engineered for <span className="text-primary italic">Trust</span></h2>
              <p className="text-muted-foreground text-xl italic font-medium">We've built a multi-layered security framework to protect both the buyer and the merchant.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <Card key={i} className="border-none shadow-2xl rounded-[3rem] p-12 bg-white group hover:-translate-y-4 transition-all duration-500">
                  <div className={`mb-8 w-20 h-20 rounded-3xl ${f.color} flex items-center justify-center text-white shadow-xl group-hover:rotate-12 transition-transform`}>
                    {f.icon}
                  </div>
                  <h3 className="text-3xl font-black mb-6 tracking-tight">{f.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed italic">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seller CTA */}
        <section className="py-24 container mx-auto px-4">
          <div className="bg-primary rounded-[4rem] p-12 md:p-24 relative overflow-hidden text-center md:text-left">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
            <div className="relative z-10 grid md:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white text-primary text-sm font-black tracking-widest uppercase">
                  Open for Enrollment
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-white leading-[1.1] tracking-tighter">Grow Your Brand <br />Across <span className="text-white/40">Tanzania</span></h2>
                <p className="text-primary-foreground/80 text-xl font-medium italic">Join 500+ verified merchants. Secure mobile money payouts, managed logistics, and escrow protection for every sale.</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/vendor/register">
                    <Button size="lg" className="w-full sm:w-auto text-xl font-black rounded-2xl bg-stone-900 text-white hover:bg-stone-950 shadow-2xl transition-all py-8 px-10">
                      Become a seller
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-xl font-bold rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary backdrop-blur-md py-8 px-10">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:flex justify-end relative">
                <div className="absolute -inset-1 bg-white/20 rounded-[3rem] blur-2xl animate-pulse" />
                <div className="relative p-12 bg-white/10 backdrop-blur-3xl rounded-[3rem] border border-white/20 transform -rotate-6 transition-transform hover:rotate-0 duration-700">
                  <Store className="h-32 w-32 text-white" />
                  <div className="mt-8 space-y-2">
                    <div className="h-2 w-32 bg-white/20 rounded-full" />
                    <div className="h-2 w-24 bg-white/10 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
