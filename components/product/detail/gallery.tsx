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
 * Hero image with hover zoom, plus the thumbnail strip.
 *
 * Sliced verbatim out of product-detail-content.tsx, which was 857 lines of
 * markup and logic in one file.
 */
export function ProductGallery({ vm }: { vm: ProductDetailViewModel }) {
  const {
    displayedImage,
    isZoomed,
    product,
    selectedImageIndex,
    selectedImageUrl,
    setIsZoomed,
    setSelectedImageIndex,
    setSelectedImageUrl,
  } = vm

  return (
    <>
      {/* Product Gallery — Professional Ecommerce Size */}
      <div className="space-y-4">
        <div
          className="relative aspect-[4/5] max-h-[520px] w-full rounded-2xl overflow-hidden bg-stone-50 border border-stone-100 shadow-lg group cursor-zoom-in"
          onMouseEnter={() => setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
        >
          {displayedImage ? (
            <Image
              src={displayedImage}
              alt={product.name}
              fill
              className={cn("object-cover transition-transform duration-700 ease-out", isZoomed ? "scale-110" : "scale-100")}
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-200">
              <ShoppingBag className="h-24 w-24" />
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {product.images && product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((image: string, index: number) => (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setSelectedImageIndex(index)
                  setSelectedImageUrl(null)
                }}
                className={cn(
                  "relative h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-300",
                  selectedImageIndex === index && !selectedImageUrl
                    ? "border-primary ring-2 ring-primary/20 scale-105"
                    : "border-transparent hover:border-stone-200 shadow-sm",
                )}
              >
                <Image src={image} alt={`view-${index}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
