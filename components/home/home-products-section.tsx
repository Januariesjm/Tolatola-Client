"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ProductCard } from "@/components/product/product-card"

interface HomeProductsSectionProps {
  featuredProducts: any[]
  bestDeals: any[]
}

export function HomeProductsSection({ featuredProducts, bestDeals }: HomeProductsSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const featuredScrollRef = useRef<HTMLDivElement>(null)
  const dealsScrollRef = useRef<HTMLDivElement>(null)
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  // copiedProductId state is moved to ProductCard or handled via onCopyLink if we want to bubble up, 
  // currently HomeProductsSection handles logic but ProductCard has internal state for "Copied!" text if we don't pass it?
  // Actually my ProductCard implementation uses internal state for 'copied' if onCopyLink IS NOT provided.
  // If onCopyLink IS provided, the parent is responsible for feedback/state if it wants to show "Copied!".
  // But wait, the `ProductCard` component I wrote:
  /*
  const handleCopyLinkInternal = async () => {
    if (onCopyLink) {
      onCopyLink(product)
      return
    }
    // ... default implementation with toast and setCopied(true)
  }
  */
  // So if I pass onCopyLink, I must handle the UI feedback (changing icon to checkmark) myself?
  // My ProductCard implementation DOES NOT expose 'copied' prop. It only uses internal 'copied' state.
  // This means if I pass `onCopyLink`, the internal `tick` state won't trigger unless I ALSO pass a way to control it, which I didn't.
  // Mistake in my plan/implementation?
  // If I want the "Copied!" UI checkmark to appear, I should probably rely on the internal implementation of ProductCard 
  // UNLESS `home-products-section` does something specific.
  // `home-products-section` handles toast and state.
  // To keep it simple and fix the bug, I should probably rely on the `ProductCard`'s internal logic for copy/share 
  // unless there is a specific reason to lift it up.
  // The original code in HomeProductsSection had `handleCopyLink` and `handleSocialShare`.
  // It seems generic.
  // I will REMOVE `handleCopyLink` and `handleSocialShare` from `HomeProductsSection` and rely on `ProductCard`'s default implementation.
  // This simplifies `HomeProductsSection`. 
  // I will still pass `handleAddToCart` and `handleToggleLike` because those interact with global/parent state (cart, auth).

  // Checking `handleAddToCart`: pushes to localstorage and router.push('/cart'). Safe to pass or move?
  // Passing it is fine.

  // Checking `handleToggleLike`: checks auth, updates supabase. Safe to pass.

  useEffect(() => {
    const fetchUserAndLikes = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        setUserId(user.id)
        const { data: likes } = await supabase.from("product_likes").select("product_id").eq("user_id", user.id)

        if (likes) {
          setLikedProducts(new Set(likes.map((like) => like.product_id)))
        }
      }
    }

    fetchUserAndLikes()
  }, [])

  const handleAddToCart = (product: any) => {
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = cartItems.find((item: any) => item.product_id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cartItems.push({
        product_id: product.id,
        quantity: 1,
        product: {
          ...product,
          shops: product.shops,
        },
      })
    }

    localStorage.setItem("cart", JSON.stringify(cartItems))
    router.push("/cart")
  }

  const handleToggleLike = async (productId: string) => {
    if (!userId) {
      toast({
        title: "Login Required",
        description: "Please login to add products to your wishlist",
        variant: "destructive",
      })
      router.push("/auth/login?returnUrl=" + window.location.pathname)
      return
    }

    const supabase = createClient()
    const isLiked = likedProducts.has(productId)

    // Optimistic update
    const newLikedProducts = new Set(likedProducts)
    if (isLiked) {
      newLikedProducts.delete(productId)
    } else {
      newLikedProducts.add(productId)
    }
    setLikedProducts(newLikedProducts)

    try {
      if (isLiked) {
        await supabase.from("product_likes").delete().eq("user_id", userId).eq("product_id", productId)
        toast({
          title: "Removed from wishlist",
          description: "Product removed from your wishlist",
        })
      } else {
        await supabase.from("product_likes").insert({ user_id: userId, product_id: productId })
        toast({
          title: "Added to wishlist",
          description: "Product added to your wishlist",
        })
      }
    } catch (error) {
      // Revert on error
      setLikedProducts(likedProducts)
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive",
      })
    }
  }

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -300 : 300
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <>
      {/* Featured Products Section */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Featured Products</h2>
            <Link href="/shop">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                View All →
              </Button>
            </Link>
          </div>
          <div className="relative group/scroll">
            {/* Left scroll button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-lg bg-background/95 backdrop-blur opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:flex"
              onClick={() => scroll(featuredScrollRef, "left")}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Scrollable container */}
            <div
              ref={featuredScrollRef}
              className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {featuredProducts.map((product) => (
                <div key={product.id} className="snap-start w-[160px] sm:w-[180px] md:w-[210px] lg:w-[240px]">
                  <ProductCard
                    product={product}
                    badge={{ text: "NEW", variant: "new" }}
                    isLiked={likedProducts.has(product.id)}
                    onAddToCart={handleAddToCart}
                    onToggleLike={handleToggleLike}
                  />
                </div>
              ))}
            </div>

            {/* Right scroll button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-lg bg-background/95 backdrop-blur opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:flex"
              onClick={() => scroll(featuredScrollRef, "right")}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Scroll indicator for mobile */}
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
          </div>
        </section>
      )}

      {/* Best Deals Section */}
      {bestDeals && bestDeals.length > 0 && (
        <section className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Best Deals</h2>
            <Link href="/shop">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
                View All →
              </Button>
            </Link>
          </div>
          <div className="relative group/scroll">
            {/* Left scroll button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-lg bg-background/95 backdrop-blur opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:flex"
              onClick={() => scroll(dealsScrollRef, "left")}
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Scrollable container */}
            <div
              ref={dealsScrollRef}
              className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-4"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {bestDeals.map((product) => (
                <div key={product.id} className="snap-start w-[160px] sm:w-[180px] md:w-[210px] lg:w-[240px]">
                  <ProductCard
                    product={product}
                    badge={
                      product.discountPercent > 0
                        ? { text: `${product.discountPercent}% OFF`, variant: "deal" }
                        : undefined
                    }
                    isLiked={likedProducts.has(product.id)}
                    onAddToCart={handleAddToCart}
                    onToggleLike={handleToggleLike}
                  />
                </div>
              ))}
            </div>

            {/* Right scroll button */}
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 sm:h-10 sm:w-10 rounded-full shadow-lg bg-background/95 backdrop-blur opacity-0 group-hover/scroll:opacity-100 transition-opacity hidden sm:flex"
              onClick={() => scroll(dealsScrollRef, "right")}
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Scroll indicator for mobile */}
            <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
          </div>
        </section>
      )}
    </>
  )
}
