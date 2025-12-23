"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ProductCard } from "@/components/product/product-card"

interface ShopContentProps {
  products: any[]
  categories: any[]
  trendingProducts: any[]
}

export function ShopContent({ products, categories, trendingProducts }: ShopContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [likedProducts, setLikedProducts] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

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

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category_id === selectedCategory
    return matchesSearch && matchesCategory
  })

  const productsPerRow = 10
  const productRows = []
  for (let i = 0; i < filteredProducts.length; i += productsPerRow) {
    productRows.push(filteredProducts.slice(i, i + productsPerRow))
  }

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
          categories: product.categories,
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

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-8">
        {trendingProducts && trendingProducts.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Trending Products</h2>
              <span className="text-sm text-muted-foreground ml-2">Best sellers this month</span>
            </div>
            <ProductCarousel
              products={trendingProducts}
              onAddToCart={handleAddToCart}
              onToggleLike={handleToggleLike}
              likedProducts={likedProducts}
              isTrending
            />
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <h1 className="text-3xl font-bold">Browse Products</h1>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No products found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {productRows.map((rowProducts, rowIndex) => (
              <div key={rowIndex}>
                <h3 className="text-lg font-semibold mb-4">
                  Products {rowIndex * productsPerRow + 1} -{" "}
                  {Math.min((rowIndex + 1) * productsPerRow, filteredProducts.length)}
                </h3>
                <ProductCarousel
                  products={rowProducts}
                  onAddToCart={handleAddToCart}
                  onToggleLike={handleToggleLike}
                  likedProducts={likedProducts}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

type ProductCarouselProps = {
  products: any[]
  onAddToCart: (product: any) => void
  onToggleLike: (productId: string) => void
  likedProducts: Set<string>
  isTrending?: boolean
}

function ProductCarousel(props: ProductCarouselProps) {
  const { products, onAddToCart, onToggleLike, likedProducts, isTrending = false } = props

  return (
    <div className="relative">
      {/* Grid container for products */}
      <div
        className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-4"
      >
        {products.map((product) => {
          return (
            <div key={product.id} className="w-full">
              <ProductCard
                product={product}
                isLiked={likedProducts.has(product.id)}
                isTrending={isTrending}
                onAddToCart={onAddToCart}
                onToggleLike={onToggleLike}
              // onCopyLink and onSocialShare are not passed, so ProductCard uses default internal impl
              />
            </div>
          )
        })}
      </div>

      {/* Mobile scroll indicator */}
      <div className="md:hidden absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-muted/30 to-transparent pointer-events-none" />
    </div>
  )
}
