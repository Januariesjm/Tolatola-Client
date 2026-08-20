"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/product/product-card"
import { useToast } from "@/hooks/use-toast"
import { useFavorites } from "@/hooks/use-favorites"
import { useLanguage } from "@/lib/i18n/language-context"
import { Camera, Loader2, Sparkles, X } from "lucide-react"
import { logger } from "@/lib/logger"

const log = logger.child("shop.shop-content")

interface ShopContentProps {
  products: any[]
  categories: any[]
  trendingProducts: any[]
  searchQuery?: string
}

export function ShopContent({ products, categories, trendingProducts, searchQuery = "" }: ShopContentProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { isFavorite, toggleFavorite } = useFavorites()
  const [cartItems, setCartItems] = useState<{ product_id: string; quantity: number }[]>([])

  // Image search state
  const [isImageSearching, setIsImageSearching] = useState(false)
  const [imageSearchResults, setImageSearchResults] = useState<any[] | null>(null)
  const [imageAnalysis, setImageAnalysis] = useState<string>("")
  const [imageSearchKeywords, setImageSearchKeywords] = useState<string[]>([])
  const imageSearchRan = useRef(false)

  useEffect(() => {
    const loadCart = () => {
      const items = JSON.parse(localStorage.getItem("cart") || "[]")
      setCartItems(items)
    }

    loadCart()

    window.addEventListener("cartUpdated", loadCart)
    return () => window.removeEventListener("cartUpdated", loadCart)
  }, [])

  // Image search effect: pick up image from sessionStorage and call API
  useEffect(() => {
    const imageSearchParam = searchParams.get("imageSearch")
    if (imageSearchParam !== "pending" || imageSearchRan.current) return
    imageSearchRan.current = true

    const storedImage = typeof window !== "undefined" ? sessionStorage.getItem("tolatola_image_search") : null
    if (!storedImage) {
      // No image data — clean up the URL
      router.replace("/shop", { scroll: false })
      return
    }

    const runImageSearch = async () => {
      setIsImageSearching(true)
      setImageSearchResults(null)
      setImageAnalysis("")
      setImageSearchKeywords([])

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"}/products/search-by-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: storedImage }),
        })
        const data = await res.json()
        setImageSearchResults(data.data || [])
        if (data.analysis) setImageAnalysis(data.analysis)
        if (data.keywords) setImageSearchKeywords(data.keywords)
      } catch (err) {
        log.error("error", err)
        setImageSearchResults([])
        toast({
          title: "Image search failed",
          description: "Could not analyze your image. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsImageSearching(false)
        // Clean up sessionStorage
        sessionStorage.removeItem("tolatola_image_search")
      }
    }

    runImageSearch()
  }, [searchParams, router, toast])

  const handleClearImageSearch = () => {
    setImageSearchResults(null)
    setImageAnalysis("")
    setImageSearchKeywords([])
    setIsImageSearching(false)
    imageSearchRan.current = false
    sessionStorage.removeItem("tolatola_image_search")
    router.replace("/shop", { scroll: false })
  }

  const handleAddToCart = (product: any) => {
    const currentCart = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = currentCart.find((item: any) => item.product_id === product.id)
    const quantityToAdd = product.quantity || 1

    if (existingItem) {
      existingItem.quantity += quantityToAdd
    } else {
      currentCart.push({
        product_id: product.id,
        quantity: quantityToAdd,
        product: {
          ...product,
          shops: product.shops,
          categories: product.categories,
        },
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

  const categorySlug = searchParams.get("category")
  const activeCategory = categorySlug ? categories.find((c) => c.slug === categorySlug || c.id === categorySlug) : null
  const parentCategory = activeCategory?.parent_id ? categories.find((c) => c.id === activeCategory.parent_id) : activeCategory
  const subCategories = parentCategory ? categories.filter((c) => c.parent_id === parentCategory.id) : []

  // Determine if we're in image search mode
  const isImageSearchMode = searchParams.get("imageSearch") === "pending" || imageSearchResults !== null

  // Determine which products to display
  const displayProducts = isImageSearchMode ? imageSearchResults || [] : products

  return (
    <div className="min-h-screen bg-white dark:bg-stone-950 transition-colors duration-300">
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
        {/* Image Search Loading State */}
        {isImageSearching && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-yellow-950/40 border border-amber-200/50 dark:border-amber-800/50 p-6 md:p-10">
              <div className="flex flex-col items-center justify-center space-y-5">
                {/* Animated icon */}
                <div className="relative">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-white shadow-md flex items-center justify-center">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" />
                  </div>
                  <div className="absolute -bottom-1 -left-1 h-5 w-5 rounded-full bg-amber-200 animate-ping" />
                </div>

                <div className="text-center space-y-2 max-w-md">
                  <h2 className="text-lg md:text-xl font-black text-stone-900 dark:text-stone-100 tracking-tight flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                    AI is Analyzing Your Image...
                  </h2>
                  <p className="text-sm font-medium text-stone-500 dark:text-stone-400 leading-relaxed">
                    TOLATOLA AI is identifying product features, category, and visual details to find matching products for you.
                  </p>
                </div>

                {/* Animated progress bar */}
                <div className="w-64 h-2 bg-stone-200/50 dark:bg-stone-800/50 rounded-full overflow-hidden relative">
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 rounded-full animate-[shimmer_2s_ease-in-out_infinite]"
                    style={{ backgroundSize: "200% 100%", animation: "shimmer 2s ease-in-out infinite" }}
                  />
                </div>
              </div>

              {/* Loading skeleton grid */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white/60 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800 overflow-hidden animate-pulse"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="aspect-square bg-stone-100 dark:bg-stone-800" />
                    <div className="p-3 space-y-2">
                      <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full w-3/4" />
                      <div className="h-3 bg-stone-100 dark:bg-stone-800 rounded-full w-1/2" />
                      <div className="h-4 bg-amber-100 dark:bg-amber-900/40 rounded-full w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Search Results Header */}
        {!isImageSearching && isImageSearchMode && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-400">
            <div className="rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50 p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-amber-500/20">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <h2 className="text-base md:text-lg font-black text-stone-900 dark:text-stone-100 tracking-tight">
                        Image Search Results
                      </h2>
                    </div>
                    {imageAnalysis && (
                      <p className="text-sm font-medium text-stone-600 dark:text-stone-300 leading-relaxed">
                        AI identified: <span className="font-bold text-stone-800 dark:text-stone-100">{imageAnalysis}</span>
                      </p>
                    )}
                    {imageSearchKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {imageSearchKeywords.slice(0, 6).map((keyword, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-stone-400 dark:text-stone-400 mt-2 font-semibold">
                      {displayProducts.length} {displayProducts.length === 1 ? "product" : "products"} found
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClearImageSearch}
                  className="flex-shrink-0 h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center transition-colors"
                  title="Clear image search"
                >
                  <X className="h-4 w-4 text-stone-500 dark:text-stone-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Header */}
        {!isImageSearchMode && searchQuery && (
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {products.length} {products.length === 1 ? t("products.found") : t("products.found_plural")} "{searchQuery}"
            </h1>
          </div>
        )}

        {/* Subcategories Filter Bar */}
        {!isImageSearchMode && subCategories.length > 0 && parentCategory && activeCategory && (
          <div className="flex items-center gap-2 overflow-x-auto py-2 mb-6 border-b border-stone-100 dark:border-stone-800 scrollbar-hide">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set("category", parentCategory.slug)
                router.push(`/shop?${params.toString()}`, { scroll: false })
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory.id === parentCategory.id
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-100 dark:border-stone-800"
              }`}
            >
              All {parentCategory.name}
            </button>
            {subCategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString())
                  params.set("category", sub.slug)
                  router.push(`/shop?${params.toString()}`, { scroll: false })
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory.id === sub.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "bg-stone-50 dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-100 dark:border-stone-800"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {!isImageSearching && (
          <main className="w-full">
            {displayProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  {isImageSearchMode ? (
                    <>
                      <div className="h-16 w-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                        <Camera className="h-7 w-7 text-stone-300" />
                      </div>
                      {imageAnalysis && (
                        <p className="text-sm font-medium text-stone-500 mb-2">
                          We identified: <span className="font-bold text-stone-700">{imageAnalysis}</span>
                        </p>
                      )}
                      <p className="text-base font-bold text-stone-400">No similar products found</p>
                      <p className="text-sm text-stone-300 mt-1">Try uploading a different photo</p>
                      <button
                        onClick={handleClearImageSearch}
                        className="mt-4 px-6 py-2 rounded-full bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors"
                      >
                        Back to Shop
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-600">{t("products.none")}</p>
                      {searchQuery && <p className="text-sm text-gray-500 mt-2">{t("products.adjust")}</p>}
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isLiked={isFavorite(product.id)}
                    isInCart={cartItems.some((item) => item.product_id === product.id)}
                    onAddToCart={handleAddToCart}
                    onToggleLike={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </main>
        )}
      </div>

      {/* Shimmer animation keyframes */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  )
}
