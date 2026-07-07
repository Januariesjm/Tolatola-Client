"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ShoppingBag,
  Heart,
  ShoppingCart,
  Star,
  Minus,
  Plus,
  Store,
  ShieldCheck,
  Zap,
  Truck,
  RotateCcw,
  Share2,
  CheckCircle2,
  Lock,
  MessageCircle,
  TrendingUp,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { ChatButton } from "@/components/messaging/chat-button"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Check } from "lucide-react"
import { useFavorites } from "@/hooks/use-favorites"

interface ProductDetailContentProps {
  product: any
  reviews: any[]
  isLiked: boolean
}

export function ProductDetailContent({ product, reviews, isLiked: initialIsLiked }: ProductDetailContentProps) {
  const [quantity, setQuantity] = useState(1)
  const { isFavorite, toggleFavorite } = useFavorites()
  const isLiked = isFavorite(product.id)
  const [isInCart, setIsInCart] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [selectedColor, setSelectedColor] = useState<any>(null)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const testimonyRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api").replace(/\/$/, "")
        const res = await fetch(`${baseUrl}/products/${product.id}/recommendations`)
        if (res.ok) {
          const json = await res.json()
          setRecommendations(json.data || [])
        }
      } catch {}
    }
    fetchRecommendations()
  }, [product.id])

  const scrollToTestimony = () => {
    testimonyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0

  useState(() => {
    // Initial check for cart
    if (typeof window !== "undefined") {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      setIsInCart(cart.some((item: any) => item.product_id === product.id))
    }
  })

  useEffect(() => {
    const loadCart = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      setIsInCart(cart.some((item: any) => item.product_id === product.id))
    }

    window.addEventListener("cartUpdated", loadCart)
    return () => window.removeEventListener("cartUpdated", loadCart)
  }, [product.id])

  const isFashion = product.categories?.name?.toLowerCase() === "fashion" ||
                    product.category_name?.toLowerCase() === "fashion" ||
                    (product.colors && product.colors.length > 0) ||
                    (product.sizes && product.sizes.length > 0)

  useEffect(() => {
    if (isFashion) {
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        setSelectedColor(product.colors[0])
        if (product.colors[0].image) {
          setSelectedImageUrl(product.colors[0].image)
        }
      }
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        setSelectedSize(product.sizes[0])
      }
    }
  }, [product, isFashion, selectedColor, selectedSize])

  const resolvedPrice = (isFashion && selectedSize && product.size_prices?.[selectedSize])
    ? product.size_prices[selectedSize]
    : ((isFashion && selectedColor?.price) ? selectedColor.price : product.price)

  const handleLike = async () => {
    setIsLoading(true)
    await toggleFavorite(product.id)
    setIsLoading(false)
  }

  const handleAddToCart = async () => {
    if (isFashion) {
      if (product.colors && product.colors.length > 0 && !selectedColor) {
        toast({
          title: "Select Color",
          description: "Please select a color option.",
          variant: "destructive"
        })
        return
      }
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        toast({
          title: "Select Size",
          description: "Please select a size option.",
          variant: "destructive"
        })
        return
      }
    }

    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = cartItems.find((item: any) => 
      item.product_id === product.id &&
      (!isFashion || (
        (!item.selected_color || item.selected_color?.name === selectedColor?.name) &&
        (!item.selected_size || item.selected_size === selectedSize)
      ))
    )

    if (existingItem) {
      existingItem.quantity += quantity
      if (existingItem.product) {
        existingItem.product.price = resolvedPrice
      }
    } else {
      cartItems.push({
        product_id: product.id,
        quantity,
        selected_color: selectedColor,
        selected_size: selectedSize,
        product: {
          ...product,
          price: resolvedPrice,
          shops: product.shops,
          categories: product.categories,
        },
      })
    }

    localStorage.setItem("cart", JSON.stringify(cartItems))
    setIsInCart(true)
    window.dispatchEvent(new Event("cartUpdated"))

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-16">

        {/* Cinematic Gallery - High Impact Visuals */}
        <div className="lg:col-span-7 space-y-6">
          <div
            className="relative aspect-square rounded-[3rem] overflow-hidden bg-stone-50 border border-stone-100 shadow-2xl group cursor-zoom-in"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            {product.images?.[0] || selectedImageUrl ? (
              <Image
                src={selectedImageUrl || product.images[selectedImageIndex]}
                alt={product.name}
                fill
                className={cn(
                  "object-cover transition-transform duration-700 ease-out",
                  isZoomed ? "scale-110" : "scale-100"
                )}
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-200">
                <ShoppingBag className="h-32 w-32" />
              </div>
            )}

            {/* Overlay Badges */}
            <div className="absolute top-8 left-8 flex flex-col gap-2">
              <Badge className="bg-white/80 backdrop-blur-xl text-stone-900 border-none px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                <Sparkles className="h-3 w-3 mr-2 text-primary" />
                Premium Inventory
              </Badge>
              {product.stock_quantity > 0 && (
                <Badge className="bg-stone-900/80 backdrop-blur-xl text-white border-none px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                  <Zap className="h-3 w-3 mr-2 text-primary" />
                  Instant Dispatch
                </Badge>
              )}
            </div>
          </div>

          {/* Boutique Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2">
              {product.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedImageIndex(index)
                    setSelectedImageUrl(null)
                  }}
                  className={cn(
                    "relative h-24 w-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-500",
                    selectedImageIndex === index && !selectedImageUrl
                      ? "border-primary ring-4 ring-primary/10 scale-105"
                      : "border-transparent hover:border-stone-200 shadow-sm"
                  )}
                >
                  <Image src={image} alt={`view-${index}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Elite Buy Box & Product Architecture */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 items-center">
              <button 
                onClick={scrollToTestimony} 
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-sm"
              >
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3.5 w-3.5",
                        i < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-stone-200"
                      )}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {averageRating.toFixed(1)} ({reviews.length} reviews)
                </span>
              </button>

              {product.quality_grade && (
                <Badge variant="outline" className="rounded-full font-black text-[10px] uppercase tracking-wider px-3 py-1 border-primary/20 text-primary bg-primary/5">
                  Grade {product.quality_grade}
                </Badge>
              )}

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>Verified Stock</span>
              </div>
            </div>

            <h1 className="font-sans font-black text-4xl md:text-5xl text-stone-900 leading-tight tracking-tight hover:text-stone-950 transition-colors">
              {product.name}
            </h1>

            <p className="text-stone-600 text-base leading-relaxed font-medium bg-stone-50/50 p-4 rounded-2xl border border-stone-100/50">
              {product.description}
            </p>

            {product.stock_quantity === 0 && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-xs font-black text-red-700 uppercase tracking-widest">Sold Out</p>
                  <p className="text-xs font-bold text-red-600/60">This item is currently unavailable.</p>
                </div>
              </div>
            )}
          </div>

          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-white to-stone-50/30 border-2 border-stone-100/80 shadow-[0_20px_50px_rgba(0,0,0,0.03)] space-y-8">
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black text-stone-950 tracking-tighter bg-gradient-to-r from-stone-900 to-stone-800 bg-clip-text text-transparent">
                {resolvedPrice.toLocaleString()}
              </span>
              <span className="text-stone-400 font-black uppercase text-xs tracking-widest">
                TZS{product.weight_unit ? ` / ${product.weight_unit}` : ""}
              </span>
            </div>

            {/* Colors & Sizes Selector */}
            {isFashion && (
              <div className="space-y-6 pt-4 border-t border-stone-100">
                {product.colors && product.colors.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Color Variation</span>
                      <span className="text-xs font-bold text-stone-900">{selectedColor?.name || "Select a color"}{selectedColor?.price ? ` (TZS ${selectedColor.price.toLocaleString()})` : ""}</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((color: any, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedColor(color)
                            if (color.image) {
                              setSelectedImageUrl(color.image)
                            }
                          }}
                          className={cn(
                            "group relative flex items-center justify-center p-0.5 rounded-full border-2 transition-all duration-300",
                            selectedColor?.name === color.name
                              ? "border-primary scale-110 shadow-md"
                              : "border-transparent hover:border-stone-200"
                          )}
                          title={color.name}
                        >
                          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-stone-100 bg-stone-50">
                            {color.image ? (
                              <img
                                src={color.image}
                                alt={color.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span 
                                className="absolute inset-0 rounded-full" 
                                style={{ backgroundColor: color.name.toLowerCase() }}
                              />
                            )}
                            <div className={cn(
                              "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300",
                              selectedColor?.name === color.name ? "opacity-100" : "opacity-0 group-hover:opacity-10"
                            )}>
                              <Check className="h-4 w-4 text-white drop-shadow-md" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes && product.sizes.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Size Option</span>
                      <span className="text-xs font-bold text-stone-900">{selectedSize || "Select a size"}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size: string, idx: number) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            "min-w-[3.5rem] h-12 px-4 rounded-xl border-2 text-xs font-black uppercase transition-all duration-300 flex flex-col items-center justify-center gap-0.5",
                            selectedSize === size
                              ? "border-stone-950 bg-stone-950 text-white shadow-md scale-105"
                              : "border-stone-100 hover:border-stone-200 text-stone-900 bg-stone-50"
                          )}
                        >
                          <span>{size}</span>
                          {product.size_prices?.[size] && (
                            <span className={cn(
                              "text-[8px] font-bold block normal-case",
                              selectedSize === size ? "text-stone-300" : "text-stone-500"
                            )}>
                              TZS {product.size_prices[size].toLocaleString()}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4.5 rounded-2xl bg-stone-50/80 border border-stone-200/40 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">Order Quantity</span>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl bg-white border-stone-200 shadow-sm hover:bg-stone-50 hover:border-stone-300 transition-all duration-300"
                    onClick={() => setQuantity(Math.max(product.moq || 1, quantity - 1))}
                    disabled={quantity <= (product.moq || 1)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-base font-black w-8 text-center text-stone-900">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl bg-white border-stone-200 shadow-sm hover:bg-stone-50 hover:border-stone-300 transition-all duration-300"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center px-1">
                <p className="text-[10px] font-bold text-stone-400 italic">
                  Min Order: {product.moq || 1} {product.weight_unit || product.unit || "Units"}
                </p>
                <p className="text-[10px] font-bold text-stone-400 italic">
                  {product.stock_quantity} {product.weight_unit || product.unit || "Units"} available
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <Button
                className={cn(
                  "h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98]",
                  isInCart
                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm shadow-emerald-500/5"
                    : "bg-[#0B5ED7] hover:bg-[#094cb0] text-white shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5"
                )}
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
              >
                {product.stock_quantity === 0 ? (
                  <>Sold Out</>
                ) : isInCart ? (
                  <>
                    <Check className="h-4.5 w-4.5 text-emerald-600 animate-in fade-in zoom-in-50" />
                    In Your Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4.5 w-4.5 text-primary" />
                    Add Product to Cart
                  </>
                )}
              </Button>

              <div className="flex gap-3">
                <div className="flex-1">
                  <ChatButton
                    shopId={product.shops?.id}
                    shopName={product.shops?.name || "Seller"}
                    productId={product.id}
                    productName={product.name}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn(
                    "h-14 w-14 rounded-2xl border-stone-200 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md",
                    isLiked && "bg-rose-50 border-rose-100 text-rose-600 hover:text-rose-700 hover:border-rose-200"
                  )}
                  onClick={handleLike}
                  disabled={isLoading}
                >
                  <Heart className={cn("h-5.5 w-5.5 transition-transform duration-300", isLiked && "fill-rose-500 text-rose-500 scale-105")} />
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-100 space-y-4">
              <div className="flex items-start gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/30">
                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-black text-stone-900 uppercase tracking-wide">Tola Protect Enabled</p>
                  <p className="text-[10px] text-stone-500 font-medium">100% Payment Protection Guaranteed. Shop with full security.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-stone-50 border border-stone-150 group hover:border-blue-100 hover:bg-blue-50/10 transition-all duration-300">
              <Truck className="h-5 w-5 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Logistics</p>
              <p className="text-xs font-bold text-stone-800 mt-1">
                {product.delivery_available !== false ? "Door-to-Door Delivery" : "Self-Collection Only"}
              </p>
            </div>
            <div className="p-6 rounded-3xl bg-stone-50 border border-stone-150 group hover:border-blue-100 hover:bg-blue-50/10 transition-all duration-300">
              <RotateCcw className="h-5 w-5 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">Return Policy</p>
              <p className="text-xs font-bold text-stone-800 mt-1">7-Day Verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Merchant Spotlight & Specification Tab */}
      <div className="mt-28 grid md:grid-cols-12 gap-12 border-t border-stone-100 pt-16">
        <div className="md:col-span-4 space-y-8">
          <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-stone-900 to-stone-950 text-white space-y-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="h-16 w-16 rounded-2xl bg-stone-800 flex items-center justify-center border border-stone-700 shadow-inner">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Verified Merchant</p>
                <h3 className="text-lg font-black tracking-widest blur-[4px] select-none text-stone-300">XXXXXX XXXXXX</h3>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-stone-800 relative z-10">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-stone-400">
                <span>Identity Status</span>
                <span className="text-primary font-black">Verified by TOLA</span>
              </div>
              <p className="p-4 rounded-2xl bg-stone-800/40 border border-stone-800 text-[11px] font-medium text-stone-400 leading-relaxed italic">
                Seller details are hidden to prevent off-platform deals and ensure secure trade. Identity will be revealed after order placement.
              </p>
            </div>
          </div>

          <div className="space-y-4 bg-stone-50/50 p-6 rounded-[2rem] border border-stone-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Metadata Specifications</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                <span className="text-xs font-semibold text-stone-500">Identifier (SKU)</span>
                <span className="text-xs font-black text-stone-950 uppercase">{product.sku || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-xs font-semibold text-stone-500">Category Node</span>
                <span className="text-xs font-black text-stone-950 uppercase">{product.categories?.name || "Inventory"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 space-y-8">
          <div ref={testimonyRef} className="flex items-center gap-4 scroll-mt-24">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-black tracking-tighter text-stone-950">Client Testimony</h3>
            <div className="h-px flex-1 bg-stone-100" />
          </div>

          <div className="grid gap-6">
            {reviews.length === 0 ? (
              <div className="p-12 text-center rounded-[2.5rem] bg-stone-50 border-2 border-dashed border-stone-200">
                <p className="text-stone-400 font-bold italic">No public testimonials yet for this inventory node.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="p-8 rounded-[2rem] bg-white border border-stone-100 shadow-sm space-y-4 group hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-stone-50 flex items-center justify-center font-black text-xs text-stone-400">
                        {review.users?.full_name?.[0] || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-black text-stone-950">{review.users?.full_name || "Merchant Client"}</p>
                        <p className="text-[10px] font-bold text-stone-400 italic">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn("h-3 w-3", i < review.rating ? "fill-amber-400 text-amber-400" : "text-stone-100")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed font-medium">"{review.comment}"</p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Cross-Selling Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-24">
          <div className="flex items-center gap-4 mb-8">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-black tracking-tighter text-stone-950">You May Also Like</h3>
            <div className="h-px flex-1 bg-stone-100" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendations.map((rec: any) => (
              <Link
                key={rec.id}
                href={`/product/${rec.id}`}
                className="group rounded-[1.5rem] overflow-hidden bg-white border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-50">
                  {rec.images?.[0] ? (
                    <Image
                      src={rec.images[0]}
                      alt={rec.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="h-10 w-10 text-stone-200" />
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-primary">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified by TOLA</span>
                  </div>
                  <h4 className="text-sm font-semibold text-stone-900 line-clamp-2 leading-tight">{rec.name}</h4>
                  <p className="text-base font-bold text-[#0B5ED7] tracking-tight">
                    {rec.price?.toLocaleString()} <span className="text-[10px] font-medium uppercase">TZS{rec.weight_unit ? ` / ${rec.weight_unit}` : ""}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
