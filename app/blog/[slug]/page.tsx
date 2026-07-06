import { createClient } from "@/lib/supabase/server"
import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, User, Clock, ArrowRight, ArrowLeft, Eye, MessageSquare, Share2, Copy } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { serverApiGet } from "@/lib/api-server"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  author_name: string
  published_at: string | null
  reading_time_minutes: number
  view_count: number
  is_featured: boolean
  seo_title: string | null
  meta_description: string | null
  seo_keywords: string[]
  blog_categories: Category | null
}

interface PageProps {
  params: { slug: string }
}

// Dynamic metadata generation for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const response = await serverApiGet<{ data: BlogPost }>(`blog/posts/${params.slug}`)
    const post = response.data

    if (!post) return {}

    const title = post.seo_title || `${post.title} | TOLA Tanzania Journal`
    const description = post.meta_description || post.excerpt || "Read this story on TOLA Tanzania."
    const ogImage = post.cover_image_url || "https://tolatola.co/logo-new.png"

    return {
      title,
      description,
      alternates: {
        canonical: `https://tolatola.co/blog/${post.slug}`,
      },
      openGraph: {
        type: "article",
        title,
        description,
        url: `https://tolatola.co/blog/${post.slug}`,
        publishedTime: post.published_at || undefined,
        images: [{ url: ogImage }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [ogImage],
      },
    }
  } catch (err) {
    return {}
  }
}

export default async function BlogPostPage({ params }: PageProps) {
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

  let post: BlogPost | null = null
  let relatedPosts: BlogPost[] = []

  try {
    const postRes = await serverApiGet<{ data: BlogPost }>(`blog/posts/${params.slug}`)
    post = postRes.data

    if (post) {
      const relatedRes = await serverApiGet<{ data: BlogPost[] }>(`blog/posts/${params.slug}/related?limit=3`)
      relatedPosts = relatedRes.data || []
    }
  } catch (error) {
    console.error("[BLOG PUBLIC] Error fetching single article:", error)
  }

  if (!post) {
    notFound()
  }

  // Construct structured data schema markup
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": post.title,
    "image": [post.cover_image_url || "https://tolatola.co/logo-new.png"],
    "datePublished": post.published_at,
    "dateModified": post.published_at,
    "author": [{
      "@type": "Person",
      "name": post.author_name,
      "url": "https://tolatola.co/blog"
    }]
  }

  const shareUrl = encodeURIComponent(`https://tolatola.co/blog/${post.slug}`)
  const shareText = encodeURIComponent(post.title)

  return (
    <div className="min-h-screen bg-stone-50/50 flex flex-col">
      {/* Dynamic SEO JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader user={user} profile={profile} kycStatus={kycStatus} />

      <main className="flex-1 pb-24">
        {/* Back Button */}
        <div className="container mx-auto px-4 max-w-4xl pt-12">
          <Link href="/blog">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-stone-500 hover:text-primary transition-colors cursor-pointer group">
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Back to Journal
            </span>
          </Link>
        </div>

        {/* Article Hero */}
        <article className="container mx-auto px-4 max-w-4xl pt-8">
          <div className="space-y-6 text-center lg:text-left mb-8">
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
              <span className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-black uppercase tracking-widest">
                {post.blog_categories?.name || "Journal"}
              </span>
              <span className="text-stone-400 text-xs font-bold flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {post.reading_time_minutes} min read
              </span>
              <span className="text-stone-400 text-xs font-bold flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {post.view_count || 0} views
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-slate-900">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-xl text-stone-500 leading-relaxed italic max-w-3xl">
                "{post.excerpt}"
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-y border-stone-200/60 py-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center border shrink-0">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <span className="font-black text-slate-900 block">{post.author_name}</span>
                  {post.published_at && (
                    <span className="text-stone-400 text-xs flex items-center gap-1.5 mt-0.5">
                      <Calendar className="h-3.5 w-3.5" /> {new Date(post.published_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Social Sharing Icons */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-stone-400 mr-2 flex items-center gap-1.5">
                  <Share2 className="h-3.5 w-3.5" /> Share Article:
                </span>
                <a
                  href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center text-xs font-bold transition-all"
                  title="Share on X"
                >
                  X
                </a>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center text-xs font-bold transition-all"
                  title="Share on Facebook"
                >
                  FB
                </a>
                <a
                  href={`https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${shareText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center text-xs font-bold transition-all"
                  title="Share on LinkedIn"
                >
                  LN
                </a>
                <a
                  href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 w-10 rounded-full border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 flex items-center justify-center text-xs font-bold transition-all"
                  title="Share on WhatsApp"
                >
                  WA
                </a>
              </div>
            </div>
          </div>

          {/* Full Cover Image */}
          {post.cover_image_url && (
            <div className="aspect-[21/9] rounded-[2rem] overflow-hidden shadow-xl border mb-12 bg-stone-100 relative">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}

          {/* Render HTML Body Content */}
          <div className="prose prose-lg max-w-none text-slate-800 leading-relaxed mb-16 px-2 prose-headings:font-black prose-headings:tracking-tight prose-img:rounded-3xl prose-a:text-primary">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          {/* Related Articles Feed */}
          {relatedPosts.length > 0 && (
            <div className="border-t border-stone-200 pt-16 mt-16">
              <h3 className="text-3xl font-black tracking-tight mb-8">Related Articles</h3>
              <div className="grid md:grid-cols-3 gap-8">
                {relatedPosts.map((related) => (
                  <Card key={related.id} className="border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] bg-white overflow-hidden group hover:-translate-y-1 flex flex-col justify-between">
                    <div>
                      <div className="aspect-[16/10] relative overflow-hidden bg-stone-100">
                        <img
                          src={related.cover_image_url || "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2026"}
                          alt={related.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      </div>
                      <div className="p-5">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-2 block">
                          {related.blog_categories?.name || "Journal"}
                        </span>
                        <Link href={`/blog/${related.slug}`}>
                          <h4 className="font-bold text-slate-900 leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer text-base">
                            {related.title}
                          </h4>
                        </Link>
                      </div>
                    </div>
                    <CardContent className="px-5 pb-5 pt-3 border-t border-dashed border-stone-100 flex items-center justify-between text-xs text-stone-400">
                      <span>{related.reading_time_minutes} min read</span>
                      <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>
    </div>
  )
}
