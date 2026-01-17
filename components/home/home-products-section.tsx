"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, TrendingUp, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ProductCard } from "@/components/product/product-card"
import { useFavorites } from "@/hooks/use-favorites"

interface HomeProductsSectionProps {
  featuredProducts: any[]
  bestDeals: any[]
}

export function HomeProductsSection({ featuredProducts, bestDeals }: HomeProductsSectionProps) {
  const router = useRouter()
  const { toast } = useToast()
  const featuredScrollRef = useRef<HTMLDivElement>(null)
  const dealsScrollRef = useRef<HTMLDivElement>(null)
  const { isFavorite, toggleFavorite } = useFavorites()
  const [cartItems, setCartItems] = useState<{ product_id: string; quantity: number }[]>([])

  useEffect(() => {
    const loadCart = () => {
      const items = JSON.parse(localStorage.getItem("cart") || "[]")
      setCartItems(items)
    }

    loadCart()

    window.addEventListener("cartUpdated", loadCart)
    return () => window.removeEventListener("cartUpdated", loadCart)
  }, [])

  const handleAddToCart = (product: any) => {
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = currentCart.find((item: any) => item.product_id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      currentCart.push({
        product_id: product.id,
        quantity: 1,
        product: { ...product, shops: product.shops },
      })
    }

    localStorage.setItem("cart", JSON.stringify(currentCart))
    setCartItems(currentCart)
    window.dispatchEvent(new Event("cartUpdated"))

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const handleToggleLike = async (productId: string) => {
    await toggleFavorite(productId)
  }

  const scroll = (ref: React.RefObject<HTMLDivElement>, direction: "left" | "right") => {
    if (ref.current) {
      const scrollAmount = direction === "left" ? -400 : 400
      ref.current.scrollBy({ left: scrollAmount, behavior: "smooth" })
    }
  }

  return (
    <div className="space-y-8 md:space-y-12 py-4 md:py-8">
      {/* Featured Section */}
      {featuredProducts && featuredProducts.length > 0 && (
        <section className="container mx-auto px-4 relative">


          <div className="relative group/scroll">
            <Button
              variant="outline"
              size="icon"
              className="absolute -left-6 top-1/2 -translate-y-1/2 z-30 h-14 w-14 rounded-2xl shadow-2xl bg-white border-stone-100 opacity-0 group-hover/scroll:opacity-100 transition-all hidden md:flex hover:bg-primary hover:text-white"
              onClick={() => scroll(featuredScrollRef, "left")}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div
              ref={featuredScrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-12 px-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {featuredProducts.map((product) => (
                <div key={product.id} className="snap-start flex-shrink-0 w-[240px] md:w-[280px]">
                  <ProductCard
                    product={product}
                    badge={{ text: "HOT", variant: "new" }}
                    isLiked={isFavorite(product.id)}
                    isInCart={cartItems.some((item) => item.product_id === product.id)}
                    onAddToCart={handleAddToCart}
                    onToggleLike={handleToggleLike}
                  />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 h-14 w-14 rounded-2xl shadow-2xl bg-white border-stone-100 opacity-0 group-hover/scroll:opacity-100 transition-all hidden md:flex hover:bg-primary hover:text-white"
              onClick={() => scroll(featuredScrollRef, "right")}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </section>
      )}

      {/* Hero Interstice */}
      <section className="container mx-auto px-4">
        <div className="bg-stone-950 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-20 relative overflow-hidden text-center md:text-left">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-3 md:space-y-4">
              <h2 className="text-xl md:text-3xl font-bold text-white tracking-tight">Verified Vendors. <br /><span className="text-primary italic">Guaranteed Quality.</span></h2>
              <p className="text-stone-400 text-sm md:text-base font-medium">Every seller on TOLA undergoes rigorous KYC verification for your safety.</p>
              <Link href="/about" className="inline-flex items-center gap-1.5 text-white font-semibold text-sm hover:text-primary transition-colors">
                Learn about our vetting process <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="hidden md:flex justify-end">
              <div className="w-40 h-40 rounded-3xl border-2 border-primary/30 rotate-12 flex items-center justify-center p-6 bg-stone-900 shadow-xl">
                <TrendingUp className="h-full w-full text-primary opacity-50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Best Deals Section */}
      {bestDeals && bestDeals.length > 0 && (
        <section className="container mx-auto px-4 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-12 gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-destructive font-bold uppercase tracking-wider text-[10px]">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Unbeatable Prices</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Best Deals <span className="text-destructive italic">In Town</span></h2>
            </div>
          </div>

          <div className="relative group/scroll">
            <Button
              variant="outline"
              size="icon"
              className="absolute -left-6 top-1/2 -translate-y-1/2 z-30 h-14 w-14 rounded-2xl shadow-2xl bg-white border-stone-100 opacity-0 group-hover/scroll:opacity-100 transition-all hidden md:flex hover:bg-destructive hover:text-white"
              onClick={() => scroll(dealsScrollRef, "left")}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div
              ref={dealsScrollRef}
              className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-12 px-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {bestDeals.map((product) => (
                <div key={product.id} className="snap-start flex-shrink-0 w-[240px] md:w-[280px]">
                  <ProductCard
                    product={product}
                    badge={{ text: "OFFER", variant: "deal" }}
                    isLiked={isFavorite(product.id)}
                    isInCart={cartItems.some((item) => item.product_id === product.id)}
                    onAddToCart={handleAddToCart}
                    onToggleLike={handleToggleLike}
                  />
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute -right-6 top-1/2 -translate-y-1/2 z-30 h-14 w-14 rounded-2xl shadow-2xl bg-white border-stone-100 opacity-0 group-hover/scroll:opacity-100 transition-all hidden md:flex hover:bg-destructive hover:text-white"
              onClick={() => scroll(dealsScrollRef, "right")}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
