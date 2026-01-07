"use client"

import { useState } from "react"
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

interface ProductDetailContentProps {
  product: any
  reviews: any[]
  isLiked: boolean
}

export function ProductDetailContent({ product, reviews, isLiked: initialIsLiked }: ProductDetailContentProps) {
  const [quantity, setQuantity] = useState(1)
  const [isLiked, setIsLiked] = useState(initialIsLiked)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const router = useRouter()

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0

  const handleLike = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (isLiked) {
        await supabase.from("product_likes").delete().eq("user_id", user.id).eq("product_id", product.id)
        setIsLiked(false)
      } else {
        await (supabase.from("product_likes") as any).insert({
          user_id: user.id,
          product_id: product.id,
        })
        setIsLiked(true)
      }
    } catch (error) {
      console.error("[v0] Error toggling like:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddToCart = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    const cartItems = JSON.parse(localStorage.getItem("cart") || "[]")
    const existingItem = cartItems.find((item: any) => item.product_id === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cartItems.push({
        product_id: product.id,
        quantity,
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
            {product.images?.[0] ? (
              <Image
                src={product.images[selectedImageIndex]}
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
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative h-24 w-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-500",
                    selectedImageIndex === index
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
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-stone-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">
                {averageRating.toFixed(1)} Rating / {reviews.length} Client Reviews
              </span>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl text-stone-950 leading-tight tracking-tight">
              {product.name}
            </h1>

            <p className="text-stone-500 text-lg leading-relaxed font-medium">
              {product.description}
            </p>
          </div>

          <div className="p-8 rounded-[2.5rem] bg-white border-2 border-stone-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] space-y-8">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-stone-950 tracking-tighter">
                {product.price.toLocaleString()}
              </span>
              <span className="text-stone-400 font-black uppercase text-xs tracking-widest">TZS</span>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100">
                <span className="text-[10px] font-black uppercase tracking-widest text-stone-400">Order Quantity</span>
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-md transition-all"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-black w-8 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-white hover:shadow-md transition-all"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-center font-bold text-stone-400 italic">
                {product.stock_quantity} Units remaining in secure inventory
              </p>
            </div>

            <div className="grid gap-3">
              <Button
                className="h-16 rounded-2xl bg-stone-950 hover:bg-stone-800 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-stone-200 transition-all hover:-translate-y-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5 text-primary" />
                Initiate Secure Purchase
              </Button>

              <div className="flex gap-3">
                <ChatButton
                  shopId={product.shops?.id}
                  shopName={product.shops?.name || "Seller"}
                  productId={product.id}
                  productName={product.name}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-2xl border-stone-200 hover:border-primary hover:text-primary transition-all"
                  onClick={handleLike}
                  disabled={isLoading}
                >
                  <Heart className={cn("h-6 w-6", isLiked && "fill-primary text-primary")} />
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-stone-50 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-black text-stone-900 uppercase tracking-tight">Tola Protect Enabled</p>
                  <p className="text-[10px] text-stone-400 font-medium">100% Payment Protection Guaranteed.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-3xl bg-stone-50 border border-stone-100 group hover:border-primary/20 transition-all">
              <Truck className="h-5 w-5 text-primary mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Logistics</p>
              <p className="text-xs font-bold text-stone-900 mt-1">Door-to-Door Delivery</p>
            </div>
            <div className="p-6 rounded-3xl bg-stone-50 border border-stone-100 group hover:border-primary/20 transition-all">
              <RotateCcw className="h-5 w-5 text-primary mb-3" />
              <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Return Policy</p>
              <p className="text-xs font-bold text-stone-900 mt-1">7-Day Verification</p>
            </div>
          </div>
        </div>
      </div>

      {/* Merchant Spotlight & Specification Tab */}
      <div className="mt-24 grid md:grid-cols-12 gap-12">

        <div className="md:col-span-4 space-y-8">
          <div className="p-8 rounded-[2.5rem] bg-stone-950 text-white space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl overflow-hidden ring-4 ring-stone-900 shadow-2xl">
                {product.shops?.logo_url ? (
                  <Image src={product.shops.logo_url} alt="Shop" width={64} height={64} className="object-cover" />
                ) : (
                  <div className="h-full w-full bg-stone-900 flex items-center justify-center">
                    <Store className="h-8 w-8 text-primary" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Verified Merchant</p>
                <h3 className="text-xl font-black tracking-tight">{product.shops?.vendors?.business_name || product.shops?.name}</h3>
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">
                <span>Identity Status</span>
                <span className="text-white">Approved</span>
              </div>
              <Link href={`/shop/${product.shops?.id}`}>
                <Button className="w-full h-12 rounded-xl bg-stone-800 hover:bg-white hover:text-stone-950 transition-all font-black text-[10px] uppercase tracking-widest">
                  View Merchant Showroom
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4 px-4">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-400">Metadata Architecture</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-stone-50">
                <span className="text-xs font-bold text-stone-400">Identifier (SKU)</span>
                <span className="text-xs font-black text-stone-900 uppercase">{product.sku || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-50">
                <span className="text-xs font-bold text-stone-400">Category Node</span>
                <span className="text-xs font-black text-stone-900 uppercase">{product.categories?.name || "Inventory"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 space-y-8">
          <div className="flex items-center gap-4">
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
    </div>
  )
}
