import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import SiteHeader from "@/components/layout/site-header"
import BackgroundSlider from "@/components/layout/background-slider"
import { HomeProductsSection } from "@/components/home/home-products-section"
import { CategoriesNav } from "@/components/layout/categories-nav"
import { HeroSlider } from "@/components/home/hero-slider"
import type { Metadata } from "next"
import { serverApiGet } from "@/lib/api-server"
import type { Database } from "@/lib/types"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Home",
  description:
    "Shop from thousands of products on TOLA - Tanzania's premier multivendor marketplace. Verified vendors, secure payments, and fast delivery.",
  alternates: {
    canonical: "https://tolatola.vercel.app",
  },
}

export default async function HomePage() {
  const supabase = createServerComponentClient<Database>({ cookies, headers })
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
    } catch {
      // ignore profile fetch errors for unauthenticated scenarios
    }
  }

  const categoriesRes = await serverApiGet<{ data: any[] }>("categories").catch(() => ({ data: [] }))
  const promotionsRes = await serverApiGet<{ data: any[] }>("promotions").catch(() => ({ data: [] }))
  const productsRes = await serverApiGet<{ data: any[] }>("products").catch(() => ({ data: [] }))

  const categories = categoriesRes.data || []
  const promotions = promotionsRes.data || []
  const allProducts = productsRes.data || []

  // Redirect logged-in users to shop per requirement
  if (user) {
    redirect("/shop")
  }

  const productsWithDiscount =
    allProducts.map((product: any) => {
      let discountPercent = 0
      if (product.compare_at_price && product.compare_at_price > product.price) {
        discountPercent = Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
      }
      return {
        ...product,
        discountPercent,
      }
    }) || []

  const featuredProducts = productsWithDiscount.slice(0, 8)
  const bestDeals = productsWithDiscount.filter((p) => p.discountPercent > 0).slice(0, 12)

  return (
    <div className="min-h-screen relative">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "TOLA",
            url: "https://tolatola.vercel.app",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: "https://tolatola.vercel.app/search?q={search_term_string}",
              },
              "query-input": "required name=search_term_string",
            },
            description: "Tanzania's premier multivendor marketplace",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "TOLA",
            url: "https://tolatola.vercel.app",
            logo: "https://tolatola.vercel.app/tolalogo.jpg",
            sameAs: [
              "https://www.facebook.com/tolamarketplace",
              "https://twitter.com/tolamarketplace",
              "https://www.instagram.com/tolamarketplace",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "Customer Service",
              areaServed: "TZ",
              availableLanguage: ["English", "Swahili"],
            },
          }),
        }}
      />

      <BackgroundSlider />
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <CategoriesNav categories={categories || []} />

      <HeroSlider promotions={promotions || []} />

      <HomeProductsSection featuredProducts={featuredProducts} bestDeals={bestDeals} />

      {/* Features Section */}
      <section className="container mx-auto px-4 py-12 relative z-10">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Why Choose TOLA?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Shield className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Secure Escrow System</CardTitle>
              <CardDescription>
                Your payments are held securely until you confirm delivery, protecting both buyers and sellers.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Verified Vendors</CardTitle>
              <CardDescription>
                All vendors undergo KYC verification with TIN and NIDA validation for your peace of mind.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-primary mb-4" />
              <CardTitle>Mobile Money Payments</CardTitle>
              <CardDescription>
                Pay easily with M-Pesa, Tigo Pesa, or Airtel Money - the payment methods you already use.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 relative z-10">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
            <p className="text-lg mb-6 opacity-90">
              Join hundreds of vendors already selling on Tanzania's fastest-growing marketplace
            </p>
            <Link href="/vendor/register">
              <Button size="lg" variant="secondary" className="text-lg">
                Register as Vendor
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
