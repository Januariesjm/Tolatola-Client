import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, User, ArrowRight, BookOpen, Clock, Tag, Search, Eye } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { serverApiGet } from "@/lib/api-server"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  post_count?: number
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  author_name: string
  published_at: string | null
  reading_time_minutes: number
  is_featured: boolean
  view_count: number
  blog_categories: Category | null
}

interface PostsResponse {
  data: BlogPost[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export const metadata: Metadata = {
  title: "Blog | TOLA Tanzania - Marketplace, Selling & Ecommerce Tips",
  description:
    "Announcements, insights, selling guides, and updates from TOLA Tanzania. Grow your online business, master logistics, and keep up with trade innovations.",
  alternates: {
    canonical: "https://tolatola.co/blog",
  },
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string; category?: string; tag?: string }
}) {
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

  // Extract query parameters
  const currentPage = searchParams.page || "1"
  const searchQuery = searchParams.search || ""
  const selectedCategory = searchParams.category || ""
  const selectedTag = searchParams.tag || ""

  // Fetch blog data server-side
  let postsData: PostsResponse = { data: [], total: 0, page: 1, limit: 12, totalPages: 0 }
  let categories: Category[] = []
  let featuredPosts: BlogPost[] = []

  try {
    const queryString = new URLSearchParams({
      page: currentPage,
      limit: "12",
      search: searchQuery,
      category: selectedCategory,
      tag: selectedTag,
    }).toString()

    postsData = await serverApiGet<PostsResponse>(`blog/posts?${queryString}`)
    const catsRes = await serverApiGet<{ data: Category[] }>("blog/categories")
    categories = catsRes.data || []
    
    const featuredRes = await serverApiGet<{ data: BlogPost[] }>("blog/posts/featured?limit=1")
    featuredPosts = featuredRes.data || []
  } catch (error) {
    console.error("[BLOG PUBLIC] Error loading blog server data:", error)
  }

  // Get the featured post (fallback to first latest post if no explicitly featured post exists)
  const featured = featuredPosts[0] || postsData.data[0]
  // Filter featured post out of the general listing if it exists
  const listPosts = featured 
    ? postsData.data.filter(post => post.id !== featured.id) 
    : postsData.data

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col">
      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1 pb-24">
        {/* Magazine Header */}
        <section className="py-20 container mx-auto px-4 border-b">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <BookOpen className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">The TOLA Journal</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">Insights & <span className="text-primary italic">Growth</span></h1>
            <p className="text-lg text-muted-foreground font-medium italic">Your daily source of news, announcements, e-commerce strategies, and success stories.</p>
          </div>
        </section>

        {/* Categories Bar & Search */}
        <section className="py-8 bg-white border-b sticky top-[108px] lg:top-[96px] z-40 shadow-sm shadow-stone-100">
          <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
              <Link href="/blog">
                <span className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer border transition-all ${
                  !selectedCategory ? "bg-primary border-primary text-white" : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                }`}>
                  All Articles
                </span>
              </Link>
              {categories.map((cat) => (
                <Link key={cat.id} href={`/blog?category=${cat.slug}`}>
                  <span className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer border transition-all ${
                    selectedCategory === cat.slug ? "bg-primary border-primary text-white" : "bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100"
                  }`}>
                    {cat.name} ({cat.post_count || 0})
                  </span>
                </Link>
              ))}
            </div>

            {/* Search Input Form */}
            <form action="/blog" method="GET" className="w-full md:w-80 relative flex items-center">
              {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search journal..."
                className="w-full h-11 pl-10 pr-4 rounded-full border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </form>
          </div>
        </section>

        {/* Featured Post */}
        {featured && !searchQuery && !selectedCategory && !selectedTag && (
          <section className="py-16 container mx-auto px-4 max-w-6xl">
            <div className="group relative rounded-[2.5rem] overflow-hidden bg-stone-950 shadow-2xl transition-all duration-500 hover:scale-[1.01] border border-stone-900">
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="aspect-[4/3] lg:aspect-auto relative overflow-hidden min-h-[300px]">
                  <img
                    src={featured.cover_image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026"}
                    alt={featured.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent lg:hidden" />
                </div>
                <div className="p-8 md:p-16 flex flex-col justify-center text-white relative">
                  <div className="flex items-center gap-4 mb-6">
                    <span className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest">
                      {featured.blog_categories?.name || "Featured"}
                    </span>
                    <span className="text-stone-400 text-xs font-bold flex items-center gap-1.5">
                      <Clock className="h-4 w-4" /> {featured.reading_time_minutes} min read
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight group-hover:text-primary transition-colors leading-tight">
                    {featured.title}
                  </h2>
                  <p className="text-stone-400 text-lg mb-8 leading-relaxed italic line-clamp-3">
                    "{featured.excerpt || "Dive into this article from the TOLA Editorial team..."}"
                  </p>
                  <div className="flex items-center justify-between border-t border-white/10 pt-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-white/10 shrink-0">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="font-bold block text-sm">{featured.author_name}</span>
                        {featured.published_at && (
                          <span className="text-stone-500 text-xs">{new Date(featured.published_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <Link href={`/blog/${featured.slug}`}>
                      <button className="h-12 w-12 rounded-full bg-white text-stone-900 flex items-center justify-center hover:scale-110 transition-transform shadow-xl">
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Latest Feed Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-end justify-between mb-12 border-l-8 border-primary pl-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight">
                  {searchQuery || selectedCategory || selectedTag ? "Search Results" : "Latest Feed"}
                </h2>
                <p className="text-muted-foreground font-medium italic mt-1 text-sm">
                  {searchQuery ? `Matching "${searchQuery}"` : selectedCategory ? `Category: ${selectedCategory}` : "Announcements, insights and strategies."}
                </p>
              </div>
            </div>

            {listPosts.length === 0 && (
              <div className="text-center py-20 bg-white border border-stone-200 rounded-[2.5rem] p-12">
                <BookOpen className="h-12 w-12 mx-auto text-stone-300 mb-4" />
                <h3 className="text-xl font-bold mb-2">No Articles Found</h3>
                <p className="text-muted-foreground text-sm italic">We couldn't find any articles matching your search filters.</p>
                <Link href="/blog">
                  <Button className="mt-6 bg-primary text-white rounded-full px-6">Back to All Articles</Button>
                </Link>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listPosts.map((post) => (
                <Card key={post.id} className="border-none shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2rem] bg-white overflow-hidden group hover:-translate-y-2 flex flex-col justify-between">
                  <div>
                    <div className="aspect-[16/10] relative overflow-hidden bg-stone-100">
                      <img
                        src={post.cover_image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026"}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm text-[10px] font-black uppercase tracking-widest text-primary">
                          {post.blog_categories?.name || "Journal"}
                        </span>
                      </div>
                    </div>
                    <CardHeader className="p-6">
                      <Link href={`/blog/${post.slug}`}>
                        <CardTitle className="text-xl font-black mb-3 group-hover:text-primary transition-colors cursor-pointer leading-tight line-clamp-2">
                          {post.title}
                        </CardTitle>
                      </Link>
                      <CardDescription className="text-muted-foreground leading-relaxed line-clamp-3 italic text-xs">
                        "{post.excerpt || "Dive in to learn more about this announcement from TOLA..."}"
                      </CardDescription>
                    </CardHeader>
                  </div>
                  <CardContent className="px-6 pb-6 flex items-center justify-between border-t border-dashed border-stone-100 pt-5">
                    <div className="flex flex-col text-[10px] font-bold text-muted-foreground gap-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {post.published_at ? new Date(post.published_at).toLocaleDateString() : "Draft"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Eye className="h-3 w-3" />
                        {post.view_count || 0} views
                      </span>
                    </div>
                    <Link href={`/blog/${post.slug}`} className="flex items-center justify-center h-10 w-10 rounded-full bg-stone-50 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            {postsData.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-16">
                {Array.from({ length: postsData.totalPages }).map((_, idx) => {
                  const pageNum = idx + 1
                  const active = String(pageNum) === currentPage
                  const urlParams = new URLSearchParams({
                    page: String(pageNum),
                    ...(searchQuery ? { search: searchQuery } : {}),
                    ...(selectedCategory ? { category: selectedCategory } : {}),
                    ...(selectedTag ? { tag: selectedTag } : {}),
                  }).toString()

                  return (
                    <Link key={pageNum} href={`/blog?${urlParams}`}>
                      <span className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold border transition-all cursor-pointer ${
                        active ? "bg-primary border-primary text-white" : "bg-white border-stone-200 hover:bg-stone-50"
                      }`}>
                        {pageNum}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-8 container mx-auto px-4 max-w-6xl">
          <div className="bg-primary rounded-[2.5rem] p-10 md:p-20 text-center text-primary-foreground relative overflow-hidden group border border-primary/40">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <Tag className="h-10 w-10 mx-auto mb-6 opacity-60" />
              <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tighter">Stay Ahead of the Curve</h2>
              <p className="text-primary-foreground/80 text-lg mb-10 italic">Subscribe to our monthly briefing for market insights, trade innovations, and growth tips.</p>
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 h-12 rounded-xl px-5 bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 text-sm"
                />
                <button className="h-12 px-8 bg-white text-primary rounded-xl font-bold hover:scale-105 transition-transform shadow-xl text-sm shrink-0">
                  Join Now
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
