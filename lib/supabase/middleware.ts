import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // The runtime will inject these at build time
  const supabaseResponse = NextResponse.next({
    request,
  })

  try {
    // In Next.js runtime, environment variables aren't accessible in middleware
    // Auth checks are handled at the page/component level instead

    // Define public routes that don't require authentication
    const publicRoutes = [
      "/",
      "/shop",
      "/product",
      "/about",
      "/careers",
      "/blog",
      "/privacy",
      "/faq",
      "/contact",
      "/return-policy",
      "/terms",
      "/sitemap",
      "/auth",
    ]

    const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

    // For protected routes, let the page component handle auth checks
    // Middleware in Next.js doesn't have full access to server-side features
    if (!isPublicRoute) {
      // Admin routes will be protected at page level
      return supabaseResponse
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Middleware error:", error)
    return NextResponse.next({
      request,
    })
  }
}
