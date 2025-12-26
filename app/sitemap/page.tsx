import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function SitemapPage() {
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

  const sitemapSections = [
    {
      title: "Main Pages",
      links: [
        { name: "Home", href: "/" },
        { name: "Shop", href: "/shop" },
        { name: "Cart", href: "/cart" },
        { name: "Favorites", href: "/favorites" },
        { name: "Orders", href: "/orders" },
      ],
    },
    {
      title: "Account",
      links: [
        { name: "Login", href: "/auth/login" },
        { name: "Sign Up", href: "/auth/sign-up" },
        { name: "Profile", href: "/profile" },
      ],
    },
    {
      title: "Vendor",
      links: [
        { name: "Become a Vendor", href: "/vendor/register" },
        { name: "Vendor Dashboard", href: "/vendor/dashboard" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Careers", href: "/careers" },
        { name: "Our Blog", href: "/blog" },
        { name: "Privacy Policy", href: "/privacy" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "FAQ", href: "/faq" },
        { name: "Contact Us", href: "/contact" },
        { name: "Return Policy", href: "/return-policy" },
        { name: "Terms and Conditions", href: "/terms" },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-black mb-4 text-center tracking-tight uppercase">Site Map</h1>
        <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto italic">
          Navigate through all pages on TOLA Digital trade and Supply Chain Ecosystem
        </p>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sitemapSections.map((section) => (
            <Card key={section.title} className="border-none shadow-xl rounded-[2rem] overflow-hidden group">
              <CardHeader className="bg-primary/5 group-hover:bg-primary transition-colors duration-500">
                <CardTitle className="group-hover:text-primary-foreground transition-colors">{section.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold flex items-center gap-2 group/link"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary/20 group-hover/link:bg-primary transition-colors" />
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
