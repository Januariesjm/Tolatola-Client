"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/product/product-card"
import { useToast } from "@/hooks/use-toast"
import { useFavorites } from "@/hooks/use-favorites"

interface ShopContentProps {
  products: any[]
  categories: any[]
  trendingProducts: any[]
  searchQuery?: string
}

export function ShopContent({ products, categories, trendingProducts, searchQuery = "" }: ShopContentProps) {
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


  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {products.length} {products.length === 1 ? "product" : "products"} found for "{searchQuery}"
            </h1>
          </div>
        )}

        {/* Products Grid */}
        <main className="w-full">
          {products.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600">No products found</p>
                {searchQuery && (
                  <p className="text-sm text-gray-500 mt-2">Try adjusting your search or filters</p>
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

