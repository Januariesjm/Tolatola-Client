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
 * Merchant spotlight, specification table and the review list.
 *
 * Sliced verbatim out of product-detail-content.tsx, which was 857 lines of
 * markup and logic in one file.
 */
export function ProductSpecs({ vm }: { vm: ProductDetailViewModel }) {
  const { product, productLocation, reviews, t, testimonyRef } = vm

  return (
    <>
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
                Seller details are hidden to prevent off-platform deals and ensure secure trade. Identity will be revealed after order
                placement.
              </p>
            </div>
          </div>

          <div className="space-y-5 bg-gradient-to-br from-white to-stone-50/50 p-7 rounded-[2rem] border border-stone-200/60 shadow-sm shadow-stone-100/50">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <p className="text-[11px] font-black uppercase tracking-widest text-stone-900">Product details</p>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                <span className="text-xs font-medium text-stone-500">Identifier (SKU)</span>
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wide bg-stone-100 px-2.5 py-1 rounded-md">
                  {product.sku || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                <span className="text-xs font-medium text-stone-500">Category</span>
                <span className="text-xs font-bold text-stone-900 uppercase tracking-wide bg-stone-100 px-2.5 py-1 rounded-md">
                  {product.categories?.name || "Inventory"}
                </span>
              </div>
              {productLocation && (
                <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                  <span className="text-xs font-medium text-stone-500">Location</span>
                  <span className="text-xs font-bold text-stone-900 uppercase tracking-wide bg-stone-100 px-2.5 py-1 rounded-md flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-primary" />
                    {productLocation}
                  </span>
                </div>
              )}

              {/* Vehicle Specifications */}
              {product.vehicle_section === "vehicle" && (
                <>
                  {product.brand && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Brand / Make</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.brand}</span>
                    </div>
                  )}
                  {product.model && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Model</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.model}</span>
                    </div>
                  )}
                  {product.year && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Year</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.year}</span>
                    </div>
                  )}
                  {product.mileage != null && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Mileage</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.mileage.toLocaleString()} km</span>
                    </div>
                  )}
                  {product.transmission && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Transmission</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.transmission}</span>
                    </div>
                  )}
                  {product.fuel_type && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Fuel Type</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.fuel_type}</span>
                    </div>
                  )}
                  {product.engine_size && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Engine Size</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.engine_size}</span>
                    </div>
                  )}
                  {product.condition && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Condition</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.condition}</span>
                    </div>
                  )}
                </>
              )}

              {/* Spare Parts Specifications */}
              {product.vehicle_section === "spare_part" && (
                <>
                  {product.model && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Part Name</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.model}</span>
                    </div>
                  )}
                  {product.brand && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Brand</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.brand}</span>
                    </div>
                  )}
                  {product.part_number && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Part Number</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.part_number}</span>
                    </div>
                  )}
                  {product.compatibility && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Compatible Vehicles</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.compatibility}</span>
                    </div>
                  )}
                  {product.condition && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Condition</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.condition}</span>
                    </div>
                  )}
                </>
              )}

              {/* Ready to Eat Specifications */}
              {(product.dietary_info || product.prep_time) && (
                <>
                  {product.dietary_info && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Dietary Info</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.dietary_info}</span>
                    </div>
                  )}
                  {product.prep_time && (
                    <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                      <span className="text-xs font-medium text-stone-500">Prep Time</span>
                      <span className="text-xs font-bold text-stone-900 uppercase">{product.prep_time}</span>
                    </div>
                  )}
                </>
              )}

              {/* Drinks Specifications */}
              {product.drink_section && (
                <div className="flex justify-between items-center py-3 px-1 hover:bg-stone-50/50 rounded-xl transition-colors duration-200">
                  <span className="text-xs font-medium text-stone-500">Drink Type</span>
                  <span className="text-xs font-bold text-stone-900 uppercase">
                    {product.drink_section === "alcoholic" ? "Alcoholic" : "Non-Alcoholic"}
                  </span>
                </div>
              )}
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
                <div
                  key={review.id}
                  className="p-8 rounded-[2rem] bg-white border border-stone-100 shadow-sm space-y-4 group hover:shadow-xl transition-all"
                >
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
    </>
  )
}
