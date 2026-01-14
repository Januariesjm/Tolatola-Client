"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Heart, ShoppingCart, Trash2, Store, Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useFavorites } from "@/hooks/use-favorites"
import { useState, useEffect } from "react"
import { clientApiGet } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface FavoritesContentProps {
  likes: any[]
}

export function FavoritesContent({ likes: initialLikes }: FavoritesContentProps) {
  const { toggleFavorite, favorites } = useFavorites() // favorites contains product_ids
  // Map product_id -> complete product object (initialized from server data)
  const [productMap, setProductMap] = useState<Record<string, any>>(() => {
    const map: Record<string, any> = {}
    initialLikes.forEach(like => {
      if (like.products) {
        map[like.products.id] = like.products
      }
    })
    return map
  })

  const [displayLikes, setDisplayLikes] = useState<any[]>(initialLikes)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const syncFavorites = async () => {
      // 1. Identify which favorites we already have data for vs missing
      const missingIds = favorites.filter(id => !productMap[id])

      if (missingIds.length > 0) {
        setIsLoading(true)
        try {
          const productPromises = missingIds.map(id => clientApiGet<{ data: any }>(`products/${id}`))
          const results = await Promise.allSettled(productPromises)

          const newProductsMap = { ...productMap }

          results.forEach(r => {
            if (r.status === 'fulfilled') {
              newProductsMap[r.value.data.id] = r.value.data
            }
          })

          setProductMap(newProductsMap)
          // Update display list: Map current favorites IDs to objects derived from our map
          // We use the same structure { id: '...', products: productObj } to match existing render
          const newDisplayList = favorites
            .filter(id => newProductsMap[id]) // Ensure we have the product
            .map(id => ({
              id: id, // or generated ID
              products: newProductsMap[id]
            }))
          setDisplayLikes(newDisplayList)

        } catch (error) {
          console.error("Error syncing favorites:", error)
        } finally {
          setIsLoading(false)
        }
      } else {
        // We have all data, just filter/re-order based on 'favorites' list
        const newDisplayList = favorites
          .filter(id => productMap[id])
          .map(id => ({
            id: id,
            products: productMap[id]
          }))
        setDisplayLikes(newDisplayList)
      }
    }

    syncFavorites()
  }, [favorites]) // Only run when favorites ID list changes specifically

  // Update map if initialLikes changes (e.g. fresh server navigation)
  useEffect(() => {
    setProductMap(prev => {
      const next = { ...prev }
      initialLikes.forEach(like => {
        if (like.products) next[like.products.id] = like.products
      })
      return next
    })
  }, [initialLikes])


  const handleRemove = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault() // Prevent navigation if on card link
    e.stopPropagation()
    await toggleFavorite(productId)
  }

  const handleAddToCart = (e: React.MouseEvent, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = cartItems.find((item: any) => item.product_id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cartItems.push({
        product_id: product.id,
        quantity: 1,
        product,
      })
    }

    localStorage.setItem("cart", JSON.stringify(cartItems))
    // Optional: Show a toast instead of redirecting
    router.push("/cart")
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Favorites</h1>
          <p className="text-muted-foreground text-lg">
            {displayLikes.length} {displayLikes.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : displayLikes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border shadow-sm">
            <div className="bg-red-50 p-6 rounded-full mb-6">
              <Heart className="h-12 w-12 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-8 max-w-sm">
              Start exploring and save items you love. They will appear here for easy access.
            </p>
            <Link href="/shop">
              <Button size="lg" className="rounded-full px-8">Start Exploring</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayLikes.map((like) => {
              const product = like.products
              const imageUrl = product.images?.[0] || product.primary_image_url || "/placeholder-product.png";

              return (
                <Link href={`/products/${product.id}`} key={like.id || product.id} className="group block h-full">
                  <Card className="h-full border-border/60 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group-hover:-translate-y-1">
                    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://placehold.co/400x300?text=${encodeURIComponent(product.name.substring(0, 2))}`
                        }}
                      />
                      <div className="absolute top-3 right-3 z-10">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-9 w-9 rounded-full bg-white/90 shadow-sm hover:bg-red-50 hover:text-red-500 transition-colors"
                          onClick={(e) => handleRemove(e, product.id)}
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </Button>
                      </div>
                      {product.stock_quantity <= 0 && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                          <Badge variant="secondary" className="bg-white/90 text-gray-900 border-gray-200">Out of Stock</Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4 flex flex-col flex-1">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Store className="h-3.5 w-3.5" />
                          <span className="line-clamp-1">{product.shops?.vendors?.business_name || product.shops?.name || "Verified Merchant"}</span>
                        </div>

                        <div className="flex items-baseline gap-2 pt-1">
                          <span className="text-lg font-bold text-primary">TZS {product.price?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="pt-4 mt-auto">
                        <Button
                          className="w-full rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          size="sm"
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={product.stock_quantity <= 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {product.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
