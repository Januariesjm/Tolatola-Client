"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { ProductCard } from "@/components/product/product-card"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

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
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())
  const [cartItems, setCartItems] = useState<{ product_id: string; quantity: number }[]>([])
  const [userId, setUserId] = useState<string | null>(null)

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
          setLikedProducts(new Set(likes.map((like: any) => like.product_id)))
        }
      }
    }

    const loadCart = () => {
      const items = JSON.parse(localStorage.getItem("cart") || "[]")
      setCartItems(items)
    }

    fetchUserAndLikes()
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
        await (supabase.from("product_likes") as any).insert({ user_id: userId, product_id: productId })
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


  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-6">
        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isLiked={likedProducts.has(product.id)}
                  isInCart={cartItems.some((item) => item.product_id === product.id)}
                  onAddToCart={handleAddToCart}
                  onToggleLike={handleToggleLike}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

