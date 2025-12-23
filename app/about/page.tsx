import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Store, Users, Shield, TrendingUp } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about TOLA - Tanzania's premier multivendor Trade & Supply Chain Ecosystem. Discover our mission to empower local entrepreneurs and connect verified vendors with customers across Tanzania.",
  alternates: {
    canonical: "https://tolatola.co/about",
  },
  openGraph: {
    title: "About TOLA - Tanzania's Premier Trade & Supply Chain Ecosystem",
    description: "Empowering Tanzanian entrepreneurs with a secure, accessible platform",
    url: "https://tolatola.co/about",
  },
}

export default async function AboutPage() {
  const supabase = await createClient()
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
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">About TOLA</h1>

        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Our Story</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                TOLA is Tanzania's premier multivendor Trade & Supply Chain Ecosystem, dedicated to connecting local producers, vendors,
                and artisans with customers across the country. Founded with a vision to empower Tanzanian entrepreneurs
                and provide customers with access to quality products, we've built a platform that prioritizes trust,
                security, and convenience.
              </p>
              <p>
                Our Trade & Supply Chain Ecosystem serves as a bridge between traditional commerce and modern e-commerce, making it easy
                for vendors of all sizes to reach a wider audience while ensuring customers have access to verified,
                quality products from trusted sellers.
              </p>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Store className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Our Mission</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                To empower Tanzanian entrepreneurs by providing a secure, accessible platform that enables them to grow
                their businesses and reach customers nationwide.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Our Vision</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground leading-relaxed">
                To become East Africa's most trusted multivendor Trade & Supply Chain Ecosystem, known for security, reliability, and
                supporting local businesses.
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">What Makes Us Different</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Secure Escrow System</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We protect both buyers and sellers with our escrow payment system. Funds are held securely until
                    delivery is confirmed, ensuring fair transactions for everyone.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Users className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Verified Vendors</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All vendors undergo thorough KYC verification including TIN and NIDA validation. We ensure you're
                    buying from legitimate, verified businesses.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <Store className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">Local Payment Methods</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Pay using the methods you already trust - M-Pesa, Tigo Pesa, and Airtel Money. No need for credit
                    cards or complicated payment systems.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Our Offices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Dodoma Headquarters</h3>
                <p className="text-muted-foreground">Phone: +255 678 227 227</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Dar Es Salaam Office</h3>
                <p className="text-muted-foreground">Phone: +255 625 377 978</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
