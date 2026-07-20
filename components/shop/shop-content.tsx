"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/product/product-card"
import { useToast } from "@/hooks/use-toast"
import { useFavorites } from "@/hooks/use-favorites"
import { useLanguage } from "@/lib/i18n/language-context"

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
  const activeCategory = categorySlug ? categories.find(c => c.slug === categorySlug || c.id === categorySlug) : null
  const parentCategory = activeCategory?.parent_id ? categories.find(c => c.id === activeCategory.parent_id) : activeCategory
  const subCategories = parentCategory ? categories.filter(c => c.parent_id === parentCategory.id) : []

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {products.length} {products.length === 1 ? t("products.found") : t("products.found_plural")} "{searchQuery}"
            </h1>
          </div>
        )}

        {/* Subcategories Filter Bar */}
        {subCategories.length > 0 && parentCategory && activeCategory && (
          <div className="flex items-center gap-2 overflow-x-auto py-2 mb-6 border-b border-stone-100 scrollbar-hide">
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.set("category", parentCategory.slug)
                router.push(`/shop?${params.toString()}`, { scroll: false })
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory.id === parentCategory.id
                  ? "bg-primary text-white shadow-md shadow-primary/20"
                  : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100"
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
                    : "bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100"
                }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Products Grid */}
        <main className="w-full">
          {products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">{t("products.none")}</p>
                {searchQuery && (
                  <p className="text-sm text-gray-500 mt-2">{t("products.adjust")}</p>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4">
              {products.map((product) => (
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
      </div>
    </div>
  )
}

