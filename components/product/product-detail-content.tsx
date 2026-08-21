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
  Sparkles,
  MapPin,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ChatButton } from "@/components/messaging/chat-button"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { useFavorites } from "@/hooks/use-favorites"
import { useProductDetail } from "@/hooks/use-product-detail"
import { ProductGallery } from "./detail/gallery"
import { ProductBuyBox } from "./detail/buy-box"
import { ProductSpecs } from "./detail/specs"
import { ProductRecommendations } from "./detail/recommendations"
import type { ProductDetailViewModel } from "./detail/view-model"
import { useLanguage } from "@/lib/i18n/language-context"
import type { Product, ProductColor, RecommendedProduct, Review } from "@/lib/types/product"

interface ProductDetailContentProps {
  product: Product
  reviews: Review[]
  isLiked: boolean
}

export function ProductDetailContent({ product, reviews, isLiked: initialIsLiked }: ProductDetailContentProps) {
  const { t } = useLanguage()
  const state = useProductDetail({ product, reviews })

  const { isFavorite, toggleFavorite } = useFavorites()
  const isLiked = isFavorite(product.id)
  const [isLoading, setIsLoading] = useState(false)
  const testimonyRef = useRef<HTMLDivElement>(null)

  const handleLike = async () => {
    setIsLoading(true)
    await toggleFavorite(product.id)
    setIsLoading(false)
  }

  const scrollToTestimony = () => {
    testimonyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const vm: ProductDetailViewModel = {
    ...state,
    product,
    reviews,
    t,
    isLiked,
    isLoading,
    handleLike,
    scrollToTestimony,
    testimonyRef,
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
        <ProductGallery vm={vm} />
        <ProductBuyBox vm={vm} />
      </div>
      <ProductSpecs vm={vm} />
      <ProductRecommendations vm={vm} />
    </div>
  )
}
