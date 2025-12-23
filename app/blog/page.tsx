import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Calendar, User } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Tips, guides, and updates from the TOLA team. Learn how to sell successfully, understand our platform features, and stay updated with marketplace news.",
  alternates: {
    canonical: "https://tolatola.vercel.app/blog",
  },
  openGraph: {
    title: "TOLA Blog - Tips & Guides",
    description: "Helpful guides for buyers and sellers on Tanzania's marketplace",
    url: "https://tolatola.vercel.app/blog",
  },
}

export default async function BlogPage() {
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

  const blogPosts = [
    {
      id: 1,
      title: "How to Start Selling on TOLA Marketplace",
      excerpt:
        "A comprehensive guide for new vendors on how to set up your shop, list products, and start making sales on our platform.",
      author: "TOLA Team",
      date: "January 15, 2025",
      category: "Vendor Guide",
    },
    {
      id: 2,
      title: "Understanding Our Escrow System",
      excerpt:
        "Learn how our secure escrow payment system protects both buyers and sellers, ensuring safe transactions for everyone.",
      author: "TOLA Team",
      date: "January 10, 2025",
      category: "Security",
    },
    {
      id: 3,
      title: "Tips for Taking Great Product Photos",
      excerpt:
        "Improve your product listings with these simple photography tips that will help your products stand out and attract more customers.",
      author: "TOLA Team",
      date: "January 5, 2025",
      category: "Vendor Tips",
    },
    {
      id: 4,
      title: "Mobile Money Integration: Making Payments Easy",
      excerpt:
        "Discover how we've integrated M-Pesa, Mixx by Yas, and Airtel Money to make buying and selling as convenient as possible.",
      author: "TOLA Team",
      date: "December 28, 2024",
      category: "Payments",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center">Our Blog</h1>
        <p className="text-xl text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Tips, guides, and updates from the TOLA team
        </p>

        <div className="max-w-4xl mx-auto grid gap-6">
          {blogPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                    {post.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.date}
                  </span>
                </div>
                <CardTitle className="text-2xl hover:text-primary transition-colors cursor-pointer">
                  {post.title}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">{post.excerpt}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{post.author}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
