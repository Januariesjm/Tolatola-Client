"use client"

import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ShopDeliveryMap } from "@/lib/checkout/build-order-payload"

/**
 * Per-shop delivery quote cards: distance, ETA and fee for each merchant in the
 * cart, plus the store-pickup notice.
 *
 * Split out of components/checkout/checkout-content.tsx, where this sat as ~75
 * lines of nested markup inside the shipping card. `deliveryAvailable` is
 * compared with `!== false` throughout because an older quote shape omits the
 * field and those legs are deliverable.
 */
export function DeliveryBreakdown({ shopDeliveries }: { shopDeliveries: ShopDeliveryMap }) {
  const entries = Object.entries(shopDeliveries)
  if (entries.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">
        <MapPin className="h-3 w-3" />
        <span>Delivery Logistics Breakdown</span>
      </div>
      {entries.map(([shopId, info]) => {
        const isDeliverable = info.deliveryAvailable !== false

        return (
          <div
            key={shopId}
            className="p-3.5 sm:p-5 md:p-6 bg-stone-50 rounded-2xl md:rounded-[2rem] border border-stone-100 space-y-3 md:space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#2563EB]">From Shop</p>
                <p className="text-xs sm:text-sm font-black text-stone-900 truncate">TOLA Verified Vendor</p>
              </div>
              <div className="px-2 py-1 rounded-lg bg-white border border-stone-100 shadow-sm text-[9px] sm:text-[10px] font-black text-stone-500 uppercase shrink-0">
                {info.transportMethod}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              <div className="p-2 sm:p-3 bg-white rounded-xl md:rounded-2xl border border-stone-50 space-y-0.5 min-w-0">
                <p className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wide text-stone-400 truncate">Distance</p>
                <p className="text-[10px] sm:text-xs font-black text-stone-800 truncate">{info.distanceKm} KM</p>
              </div>
              <div className="p-2 sm:p-3 bg-white rounded-xl md:rounded-2xl border border-stone-50 space-y-0.5 min-w-0">
                <p className="text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wide text-stone-400 truncate">Status</p>
                <p className={cn("text-[10px] sm:text-xs font-black truncate", isDeliverable ? "text-stone-800" : "text-amber-600")}>
                  {isDeliverable ? info.duration || "Fast" : "Pickup"}
                </p>
              </div>
              <div
                className={cn(
                  "p-2 sm:p-3 rounded-xl md:rounded-2xl border space-y-0.5 min-w-0",
                  isDeliverable ? "bg-[#2563EB]/5 border-[#2563EB]/10" : "bg-stone-100 border-stone-200",
                )}
              >
                <p
                  className={cn(
                    "text-[7.5px] sm:text-[8px] font-bold uppercase tracking-wide truncate",
                    isDeliverable ? "text-[#2563EB]" : "text-stone-400",
                  )}
                >
                  Fee
                </p>
                <p className={cn("text-[10px] sm:text-xs font-black truncate", isDeliverable ? "text-[#2563EB]" : "text-stone-500")}>
                  {isDeliverable ? `TZS ${info.deliveryFee.toLocaleString()}` : "FREE"}
                </p>
              </div>
            </div>
            {!isDeliverable && (
              <p className="text-[10px] font-bold text-amber-600 bg-amber-50 p-2.5 sm:p-3 rounded-xl border border-amber-100">
                Info: One or more items from this merchant are "Store Pickup Only". Please visit the shop location after payment.
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
