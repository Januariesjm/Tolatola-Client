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
 * Cross-sell strip, and the fallback shown when it fails to load.
 *
 * Sliced verbatim out of product-detail-content.tsx, which was 857 lines of
 * markup and logic in one file.
 */
export function ProductRecommendations({ vm }: { vm: ProductDetailViewModel }) {
  const { product, recommendations, recommendationsFailed, t } = vm

  return (
    <>
      {/* Cross-Selling Recommendations */}
      {recommendationsFailed && (
        <div className="mt-24">
          <div className="flex items-center gap-4 mb-8">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-black tracking-tighter text-stone-950">You May Also Like</h3>
            <div className="h-px flex-1 bg-stone-100" />
          </div>
          <div role="status" className="rounded-[1.5rem] border border-stone-100 bg-stone-50/60 p-8 text-center">
            <p className="text-sm font-medium text-stone-600">We couldn&apos;t load recommendations right now.</p>
            <p className="mt-1 text-xs text-stone-500">
              Everything else on this page is up to date — try refreshing to see related products.
            </p>
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="mt-24">
          <div className="flex items-center gap-4 mb-8">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h3 className="text-2xl font-black tracking-tighter text-stone-950">You May Also Like</h3>
            <div className="h-px flex-1 bg-stone-100" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendations.map((rec: RecommendedProduct) => (
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
                    {rec.price?.toLocaleString()}{" "}
                    <span className="text-[10px] font-medium uppercase">TZS{rec.weight_unit ? ` / ${rec.weight_unit}` : ""}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
