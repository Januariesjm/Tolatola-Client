"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Check,
  CheckCircle2,
  Heart,
  Lock,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Truck,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChatButton } from "@/components/messaging/chat-button"
import { cn } from "@/lib/utils"
import type { ProductColor, RecommendedProduct } from "@/lib/types/product"
import type { ProductDetailViewModel } from "./view-model"

/**
 * Price, variant pickers, quantity, add-to-cart and the trust panels.
 *
 * Sliced verbatim out of product-detail-content.tsx, which was 857 lines of
 * markup and logic in one file.
 */
export function ProductBuyBox({ vm }: { vm: ProductDetailViewModel }) {
  const {
    averageRating,
    handleAddToCart,
    handleLike,
    isFashion,
    isInCart,
    isLiked,
    isLoading,
    isService,
    product,
    productLocation,
    quantity,
    resolvedPrice,
    reviews,
    scrollToTestimony,
    selectedColor,
    selectedSize,
    setQuantity,
    setSelectedColor,
    setSelectedImageUrl,
    setSelectedSize,
    t,
  } = vm

  return (
    <>
      {/* Product Details & Buy Box */}
      <div className="space-y-8">
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
                    className={cn("h-3.5 w-3.5", i < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-stone-200")}
                  />
                ))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {averageRating.toFixed(1)} ({reviews.length} reviews)
              </span>
            </button>

            {product.quality_grade && (
              <Badge
                variant="outline"
                className="rounded-full font-black text-[10px] uppercase tracking-wider px-3 py-1 border-primary/20 text-primary bg-primary/5"
              >
                Grade {product.quality_grade}
              </Badge>
            )}

            {isService && (
              <Badge className="bg-primary text-white font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-full">
                🛠️ Professional Service
              </Badge>
            )}

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span>{isService ? "Available Offering" : "Verified Stock"}</span>
            </div>

            {productLocation && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200/60 text-[10px] font-black uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>{productLocation}</span>
              </div>
            )}
          </div>

          <h1 className="font-sans font-black text-4xl md:text-5xl text-stone-900 leading-tight tracking-tight hover:text-stone-950 transition-colors">
            {product.name}
          </h1>

          <p className="text-stone-600 text-base leading-relaxed font-medium bg-stone-50/50 p-4 rounded-2xl border border-stone-100/50">
            {product.description}
          </p>

          {isService && (
            <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-3">
              <div className="h-8 w-8 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600 font-bold text-sm">
                ℹ️
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-950">Service Provider Details Unlocked Upon Purchase</p>
                <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                  Once you purchase this service, the provider's direct phone number, email, address, and direct messaging will be instantly
                  provided on your order confirmation page.
                </p>
              </div>
            </div>
          )}

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
                    <span className="text-xs font-bold text-stone-900">
                      {selectedColor?.name || "Select a color"}
                      {selectedColor?.price ? ` (TZS ${selectedColor.price.toLocaleString()})` : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.colors.map((color: ProductColor, idx: number) => (
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
                            : "border-transparent hover:border-stone-200",
                        )}
                        title={color.name}
                        aria-label={`Select color ${color.name}`}
                      >
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-stone-100 bg-stone-50">
                          {color.image ? (
                            <img src={color.image} alt={color.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="absolute inset-0 rounded-full" style={{ backgroundColor: color.name.toLowerCase() }} />
                          )}
                          <div
                            className={cn(
                              "absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity duration-300",
                              selectedColor?.name === color.name ? "opacity-100" : "opacity-0 group-hover:opacity-10",
                            )}
                          >
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
                        aria-label={`Select size ${size}`}
                        className={cn(
                          "min-w-[3.5rem] h-12 px-4 rounded-xl border-2 text-xs font-black uppercase transition-all duration-300 flex flex-col items-center justify-center gap-0.5",
                          selectedSize === size
                            ? "border-stone-950 bg-stone-950 text-white shadow-md scale-105"
                            : "border-stone-100 hover:border-stone-200 text-stone-900 bg-stone-50",
                        )}
                      >
                        <span>{size}</span>
                        {product.size_prices?.[size] && (
                          <span
                            className={cn(
                              "text-[8px] font-bold block normal-case",
                              selectedSize === size ? "text-stone-300" : "text-stone-500",
                            )}
                          >
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
                <button
                  type="button"
                  className="h-10 w-10 rounded-xl bg-white border border-stone-200 shadow-sm hover:bg-stone-50 hover:border-stone-300 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setQuantity(Math.max(product.moq || 1, quantity - 1))
                  }}
                  disabled={quantity <= (product.moq || 1)}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="text-base font-black w-10 text-center text-stone-900 select-none">{quantity}</span>
                <button
                  type="button"
                  className="h-10 w-10 rounded-xl bg-white border border-stone-200 shadow-sm hover:bg-stone-50 hover:border-stone-300 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Increase quantity"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setQuantity(Math.min(Number(product.stock_quantity) || 999, quantity + 1))
                  }}
                  disabled={quantity >= (Number(product.stock_quantity) || 999)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center px-1">
              <p className="text-[10px] font-bold text-stone-400 italic">
                Min Order: {product.moq || 1} {product.weight_unit || product.unit || "Units"}
              </p>
              <p className="text-[10px] font-bold text-stone-400 italic">
                {product.stock_quantity || "N/A"} {product.weight_unit || product.unit || "Units"} available
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex gap-3">
              <Button
                className={cn(
                  "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.98]",
                  isInCart
                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm shadow-emerald-500/5"
                    : "bg-[#0B5ED7] hover:bg-[#094cb0] text-white shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5",
                )}
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0}
              >
                {product.stock_quantity === 0 ? (
                  <>{t("products.sold_out")}</>
                ) : isInCart ? (
                  <>
                    <Check className="h-4.5 w-4.5 text-emerald-600 animate-in fade-in zoom-in-50" />
                    {t("products.in_cart")}
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4.5 w-4.5 text-primary" />
                    {t("products.add_to_cart_long")}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-14 w-14 rounded-2xl border-stone-200 hover:border-primary/40 hover:text-primary transition-all duration-300 shadow-sm hover:shadow-md shrink-0",
                  isLiked && "bg-rose-50 border-rose-100 text-rose-600 hover:text-rose-700 hover:border-rose-200",
                )}
                onClick={handleLike}
                disabled={isLoading}
              >
                <Heart
                  className={cn("h-5.5 w-5.5 transition-transform duration-300", isLiked && "fill-rose-500 text-rose-500 scale-105")}
                />
              </Button>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-100 space-y-4">
            <div className="flex items-start gap-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100/30">
              <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-xs font-black text-stone-900 uppercase tracking-wide">{t("products.protect")}</p>
                <p className="text-[10px] text-stone-500 font-medium">{t("products.protect_desc")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 rounded-3xl bg-stone-50 border border-stone-150 group hover:border-blue-100 hover:bg-blue-50/10 transition-all duration-300">
            <Truck className="h-5 w-5 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">{t("products.logistics")}</p>
            <p className="text-xs font-bold text-stone-800 mt-1">
              {product.delivery_available !== false ? t("products.delivery_door") : t("products.self_collect")}
            </p>
          </div>
          <div className="p-6 rounded-3xl bg-stone-50 border border-stone-150 group hover:border-blue-100 hover:bg-blue-50/10 transition-all duration-300">
            <RotateCcw className="h-5 w-5 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
            <p className="text-[10px] font-black uppercase tracking-wider text-stone-400">{t("products.return_policy")}</p>
            <p className="text-xs font-bold text-stone-800 mt-1">{t("products.return_7day")}</p>
          </div>
        </div>
      </div>
    </>
  )
}
