import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, TrendingUp, Users, Zap, Globe, Wallet, Sparkles, ArrowRight, Store, ShoppingBag } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import SiteHeader from "@/components/layout/site-header"
import { HomeProductsSection } from "@/components/home/home-products-section"
import { CategoriesNav } from "@/components/layout/categories-nav"
import { HeroSlider } from "@/components/home/hero-slider"
import { ProductSearch } from "@/components/layout/product-search"
import type { Metadata } from "next"
import { serverApiGet } from "@/lib/api-server"
import type { Database } from "@/lib/types"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "TOLA Digital trade and Supply Chain Ecosystem | Tanzania's Premier Trading Platform",
  description:
    "Experience the future of trade in Tanzania. TOLA combines secure payments, verified vendors, and mobile money convenience in one premium Digital trade and Supply Chain Ecosystem.",
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

  // Category background images mapping - Using local downloaded images
  const categoryImages: Record<string, string> = {
    "fast-moving-consumer-goods": "/category-fmcg.jpg",
    fmcg: "/category-fmcg.jpg",
    agriculture: "/category-agriculture.jpg",
    farming: "/category-agriculture.jpg",
    crops: "/category-agriculture.jpg",
    vegetables: "/category-agriculture.jpg",
    "construction-hardware": "/category-hardware.jpg",
    construction: "/category-hardware.jpg",
    hardware: "/category-hardware.jpg",
    handicrafts: "/category-handicrafts.jpg",
    crafts: "/category-handicrafts.jpg",
    "food-beverages": "/category-food-beverages.jpg",
    food: "/category-food-beverages.jpg",
    beverages: "/category-food-beverages.jpg",
    textiles: "/category-textiles.jpg",
    fabric: "/category-textiles.jpg",
    clothing: "/category-textiles.jpg",
    electronics: "/category-electronics.jpg",
    gadgets: "/category-electronics.jpg",
    "home-garden": "/category-home-garden.jpg",
    home: "/category-home-garden.jpg",
    garden: "/category-home-garden.jpg",
    "health-beauty": "/category-health-beauty.jpg",
    beauty: "/category-health-beauty.jpg",
    health: "/category-health-beauty.jpg",
    services: "/category-services.jpg",
    business: "/category-services.jpg",
    vehicles: "/category-vehicles.jpg",
    cars: "/category-vehicles.jpg",
    transport: "/category-vehicles.jpg",
    // Fallback to local images if category doesn't match
    default: "/abstract-categories.png",
  }

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
      title: "Secure Payments",
      desc: "Your payments are protected and processed securely by licensed PSPs.",
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
            description: "Tanzania's premier multivendor Digital trade and Supply Chain Ecosystem",
          }),
        }}
      />

      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      {/* Mobile Search Bar - Between Header and Categories */}
      <div className="lg:hidden sticky top-[72px] z-30 bg-white/95 backdrop-blur-xl border-b border-stone-100 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <ProductSearch categories={categories || []} />
        </div>
      </div>

      <CategoriesNav categories={categories || []} />

      <main className="flex-1">
        {/* Promotions Banner Section */}
        <HeroSlider promotions={promotions || []} />

        {/* Featured Products Section - Handpicked for You */}
        <HomeProductsSection featuredProducts={featuredProducts} bestDeals={bestDeals} />

        {/* Benefits Strip */}
        <section className="bg-stone-900 overflow-hidden py-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center md:justify-around gap-8 text-white/60">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-sm font-black tracking-widest uppercase italic">Secure Payments</span>
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

        {/* Trending Categories - Redesigned for density */}
        <section className="py-2 md:py-4 container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-2 md:mb-4 gap-2">
            <div className="space-y-0.5 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-1 text-primary font-bold uppercase tracking-wider text-[8px]">
                <Sparkles className="h-2.5 w-2.5" />
                <span>Selections for you</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Shop by <span className="text-primary italic">Category</span></h2>
            </div>
            <Link href="/shop" className="group flex items-center justify-center gap-1 text-xs font-semibold hover:text-primary transition-colors">
              View Entire Catalog <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {categories.slice(0, 12).map((cat: any, i) => {
              // Get background image based on category slug, name, or use image_url from database
              const getCategoryImage = () => {
                // First try database image_url
                if (cat.image_url) return cat.image_url

                // Try matching by slug
                if (cat.slug && categoryImages[cat.slug.toLowerCase()]) {
                  return categoryImages[cat.slug.toLowerCase()]
                }

                // Try matching by name (normalized)
                const categoryName = (cat.name || "").toLowerCase().replace(/\s+/g, "-")
                if (categoryImages[categoryName]) {
                  return categoryImages[categoryName]
                }

                // Try partial matches for common category names
                const nameLower = (cat.name || "").toLowerCase()
                if (nameLower.includes("agriculture") || nameLower.includes("farm")) {
                  return categoryImages.agriculture
                }
                if (nameLower.includes("handicraft") || nameLower.includes("craft")) {
                  return categoryImages.handicrafts
                }
                if (nameLower.includes("food") || nameLower.includes("beverage")) {
                  return categoryImages.food
                }
                if (nameLower.includes("textile") || nameLower.includes("fabric") || nameLower.includes("cloth")) {
                  return categoryImages.textiles
                }
                if (nameLower.includes("electronic") || nameLower.includes("gadget")) {
                  return categoryImages.electronics
                }
                if (nameLower.includes("home") || nameLower.includes("garden")) {
                  return categoryImages["home-garden"]
                }
                if (nameLower.includes("health") || nameLower.includes("beauty")) {
                  return categoryImages["health-beauty"]
                }
                if (nameLower.includes("service") || nameLower.includes("business")) {
                  return categoryImages.services
                }
                if (nameLower.includes("construction") || nameLower.includes("hardware")) {
                  return categoryImages["construction-hardware"]
                }
                if (nameLower.includes("fast moving") || nameLower.includes("consumer goods") || nameLower.includes("fmcg")) {
                  return categoryImages["fast-moving-consumer-goods"]
                }

                // Default fallback
                return categoryImages.default || "/abstract-categories.png"
              }

              const backgroundImage = getCategoryImage()

              return (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.id}`}
                  className="group relative aspect-[3/1.5] rounded-xl overflow-hidden border border-stone-100 hover:border-primary/50 hover:shadow-md transition-all duration-300"
                >
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500 opacity-80"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                  />

                  {/* Stronger Overlay for text readability on small cards */}
                  <div className="absolute inset-0 bg-stone-950/40 group-hover:bg-stone-950/50 transition-colors" />

                  {/* Content - Centered for menu-like feel */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                    <h3 className="text-white text-[10px] md:text-xs font-semibold tracking-tight leading-tight">{cat.name}</h3>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Why Tola - Compact Cards */}
        <section className="py-4 md:py-6 bg-stone-50 overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8 space-y-1">
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">Engineered for <span className="text-primary italic">Trust</span></h2>
              <p className="text-muted-foreground text-[10px] font-medium">We've built a multi-layered security framework to protect both the buyer and the merchant.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-3 md:gap-4">
              {features.map((f, i) => (
                <Card key={i} className="border-none shadow-md rounded-xl p-4 bg-white group hover:-translate-y-1 transition-all duration-300">
                  <div className={`mb-3 w-10 h-10 rounded-lg ${f.color} flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform`}>
                    {React.cloneElement(f.icon as any, { className: "h-5 w-5" })}
                  </div>
                  <h3 className="text-base font-bold mb-1 tracking-tight">{f.title}</h3>
                  <p className="text-muted-foreground text-[10px] leading-relaxed">{f.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Seller CTA - Compact */}
        <section className="py-4 md:py-8 container mx-auto px-4">
          <div className="bg-primary rounded-2xl md:rounded-3xl p-6 md:p-12 relative overflow-hidden text-center md:text-left">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[80px] translate-x-1/2 -translate-y-1/2" />
            <div className="relative z-10 grid md:grid-cols-2 gap-6 md:gap-10 items-center">
              <div className="space-y-4 md:space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-primary text-xs font-bold tracking-widest uppercase">
                  Open for Enrollment
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight tracking-tight">Grow Your Brand <br />Across <span className="text-white/40">Tanzania</span></h2>
                <p className="text-primary-foreground/80 text-base font-medium">Join 500+ verified merchants. Secure mobile money payouts, managed logistics, and payment protection for every sale.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/vendor/register">
                    <Button size="lg" className="w-full sm:w-auto text-base font-bold rounded-xl bg-stone-900 text-white hover:bg-stone-950 shadow-lg transition-all py-6 px-8">
                      Become a seller
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto text-base font-bold rounded-xl bg-white/10 border-white/20 text-white hover:bg-white hover:text-primary backdrop-blur-md py-6 px-8">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center md:justify-end relative mt-8 md:mt-0">
                <div className="absolute -inset-4 bg-white/20 rounded-[3rem] blur-2xl animate-pulse" />
                <div className="relative w-full max-w-[320px] md:max-w-md aspect-[16/10] bg-white/10 backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] border border-white/20 overflow-hidden shadow-2xl transition-all duration-700 hover:scale-[1.02] md:hover:-rotate-1">
                  <Image
                    src="/payment-flow.png"
                    alt="Tola Payment Flow"
                    fill
                    className="object-cover opacity-90 hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
