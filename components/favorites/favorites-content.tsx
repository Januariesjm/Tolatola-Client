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
    <div className="min-h-screen bg-stone-50/50 pb-24">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="mb-10 space-y-2 text-center md:text-left">
          <h1 className="text-4xl font-black tracking-tight text-stone-900 bg-gradient-to-r from-stone-950 to-stone-850 bg-clip-text text-transparent">
            Saved Creations
          </h1>
          <p className="text-stone-500 font-medium text-base">
            You have {displayLikes.length} {displayLikes.length === 1 ? 'masterpiece' : 'masterpieces'} curated in your wishlist
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-3xl bg-stone-200/60 animate-pulse" />
            ))}
          </div>
        ) : displayLikes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2.5rem] border border-stone-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)] max-w-2xl mx-auto px-6">
            <div className="bg-rose-50/80 p-8 rounded-full mb-6 animate-bounce">
              <Heart className="h-14 w-14 text-rose-500 fill-rose-500/10" />
            </div>
            <h2 className="text-2xl font-black text-stone-950 mb-3">Your curation is empty</h2>
            <p className="text-stone-500 mb-8 max-w-md text-sm leading-relaxed">
              Explore the marketplace, discover incredible unique products, and tap the heart icon to save them here for later.
            </p>
            <Link href="/shop">
              <Button size="lg" className="rounded-full px-10 py-6 bg-stone-950 text-white hover:bg-stone-900 transition-all duration-300 shadow-lg hover:shadow-stone-950/20 font-bold uppercase tracking-wider text-xs">
                Start Curation <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {displayLikes.map((like) => {
              const product = like.products
              if (!product) return null
              const imageUrl = product.images?.[0] || product.primary_image_url || "/placeholder-product.png";
              
              const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
              const discountPercent = hasDiscount 
                ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
                : 0;

              return (
                <Link href={`/products/${product.id}`} key={like.id || product.id} className="group block h-full">
                  <Card className="h-full rounded-[2rem] border-stone-200/50 hover:border-stone-300 bg-white hover:shadow-[0_30px_60px_rgba(0,0,0,0.06)] transition-all duration-500 overflow-hidden flex flex-col group-hover:-translate-y-2">
                    <div className="aspect-[4/3] relative overflow-hidden bg-stone-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://placehold.co/400x300?text=${encodeURIComponent(product.name.substring(0, 2))}`
                        }}
                      />
                      
                      {/* Glassmorphic Actions */}
                      <div className="absolute top-4 right-4 z-10">
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-10 w-10 rounded-full bg-white/90 backdrop-blur-md border border-stone-100 shadow-md hover:bg-rose-50 text-rose-500 transition-all duration-300 hover:scale-110 active:scale-95"
                          onClick={(e) => handleRemove(e, product.id)}
                          title="Remove from favorites"
                        >
                          <Heart className="h-5 w-5 fill-rose-500 text-rose-500" />
                        </Button>
                      </div>

                      {hasDiscount && (
                        <div className="absolute top-4 left-4 z-10">
                          <span className="px-3.5 py-1.5 rounded-full bg-stone-950 text-white font-black text-[10px] tracking-widest uppercase shadow-sm">
                            {discountPercent}% OFF
                          </span>
                        </div>
                      )}

                      {product.stock_quantity <= 0 && (
                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[2px]">
                          <Badge variant="secondary" className="bg-stone-900 text-white border-transparent px-4 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-lg">
                            Out of Stock
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="p-6 flex flex-col flex-1">
                      <div className="flex-1 space-y-3">
                        <h3 className="font-extrabold text-stone-900 text-lg line-clamp-2 leading-tight group-hover:text-stone-950 transition-colors">
                          {product.name}
                        </h3>

                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-xl font-black text-stone-950">
                            TZS {product.price?.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-stone-400 line-through font-semibold">
                              TZS {Number(product.compare_at_price).toLocaleString()}
                            </span>
                          )}
                          {product.weight_unit && (
                            <span className="text-stone-400 font-bold uppercase text-[10px] tracking-widest ml-1">
                              / {product.weight_unit}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-6 mt-auto">
                        <Button
                          className="w-full rounded-2xl bg-stone-950 text-white hover:bg-stone-900 active:scale-98 transition-all duration-300 font-bold text-xs uppercase tracking-wider py-5.5 h-auto flex items-center justify-center gap-2 border border-transparent"
                          onClick={(e) => handleAddToCart(e, product)}
                          disabled={product.stock_quantity <= 0}
                        >
                          <ShoppingCart className="h-4 w-4" />
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
