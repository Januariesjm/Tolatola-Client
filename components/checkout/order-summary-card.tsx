"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, CheckCircle2, Loader2, ShieldCheck, ShoppingBag } from "lucide-react"
import { cn } from "@/lib/utils"
import { isUnderMaintenance } from "@/lib/checkout/validate-checkout-form"
import type { CartItem } from "@/lib/types/checkout"

interface OrderSummaryCardProps {
  cartItems: CartItem[]
  subtotal: number
  deliveryFee: number
  insuranceFee: number
  total: number
  /** True once at least one shop has a delivery quote. */
  hasDeliveryQuotes: boolean
  isLoading: boolean
  isCalculatingDelivery: boolean
  paymentMethod: string
  /** Submission failure, rendered below the card. */
  error: string | null
}

/**
 * Checkout sidebar: line items, the fee breakdown, and the submit button.
 *
 * Split out of components/checkout/checkout-content.tsx. The button stays a
 * `type="submit"` with no click handler -- it is inside the page's form element,
 * so the form's onSubmit is what runs. It is disabled while a quote is being
 * calculated because the totals shown would not be the totals charged.
 */
export function OrderSummaryCard({
  cartItems,
  subtotal,
  deliveryFee,
  insuranceFee,
  total,
  hasDeliveryQuotes,
  isLoading,
  isCalculatingDelivery,
  paymentMethod,
  error,
}: OrderSummaryCardProps) {
  const methodUnavailable = isUnderMaintenance(paymentMethod)

  return (
    <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
      <Card className="border-none shadow-xl shadow-stone-200/50 rounded-2xl md:rounded-3xl overflow-hidden bg-white">
        <div className="bg-[#22C55E] p-4 sm:p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <h3 className="text-lg sm:text-xl font-black tracking-tight relative z-10">Order Summary</h3>
          <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mt-0.5 relative z-10">Your items</p>
        </div>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="space-y-4 sm:space-y-6 max-h-[300px] overflow-y-auto scrollbar-hide pr-1">
            {cartItems.map((item) => {
              // Colour and size are part of the identity: the same product in two
              // variants is two rows, so product_id alone is not a unique key.
              const itemId = `${item.product_id}-${item.selected_color?.name || ""}-${item.selected_size || ""}`
              return (
                <div key={itemId} className="flex gap-3 sm:gap-4">
                  <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-stone-50 overflow-hidden border border-stone-100 flex-shrink-0 animate-in fade-in zoom-in duration-500">
                    {item.selected_color?.image || item.product.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.selected_color?.image || item.product.images?.[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-stone-200" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-bold text-xs sm:text-sm text-stone-900 leading-tight truncate">{item.product.name}</p>

                    {(item.selected_color || item.selected_size) && (
                      <div className="flex flex-wrap gap-1">
                        {item.selected_color && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                            <span
                              className="w-1.5 h-1.5 rounded-full border border-stone-300"
                              style={{ backgroundColor: item.selected_color.name.toLowerCase() }}
                            />
                            {item.selected_color.name}
                          </span>
                        )}
                        {item.selected_size && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold bg-stone-100 text-stone-600 border border-stone-200">
                            {item.selected_size}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-400 font-bold text-[11px]">Qty: {item.quantity}</span>
                      <span className="text-stone-900 font-extrabold text-xs">
                        {(item.product.price * item.quantity).toLocaleString()} TZS
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="pt-4 sm:pt-6 border-t border-stone-100 space-y-2">
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-stone-500 font-bold">Subtotal</span>
              <span className="text-stone-900 font-bold tracking-tight">{subtotal.toLocaleString()} TZS</span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-stone-500 font-bold">Delivery</span>
              <span className={cn("font-bold tracking-tight", hasDeliveryQuotes ? "text-stone-900" : "text-primary italic animate-pulse")}>
                {hasDeliveryQuotes ? `${deliveryFee.toLocaleString()} TZS` : "Awaiting Address"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-stone-500 font-bold">Buyer Protection (1.5%)</span>
              <span className="text-stone-900 font-bold tracking-tight">{insuranceFee.toLocaleString()} TZS</span>
            </div>
            <div className="pt-3 border-t border-stone-100 flex justify-between items-end">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Total Amount</p>
                <p className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {total.toLocaleString()} <span className="text-[10px] uppercase">TZS</span>
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-primary hover:bg-stone-900 text-white font-bold text-lg shadow-xl shadow-primary/20 transition-all active:scale-[0.98] group"
            disabled={isLoading || isCalculatingDelivery || methodUnavailable}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                {methodUnavailable ? "Service Unavailable" : "Complete Order"}
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>

          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-green-600" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Protected</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-stone-300" />
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500">Secure</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-6 bg-destructive/10 border-2 border-destructive/20 rounded-[2.5rem] text-destructive text-center space-y-2 animate-in slide-in-from-top-4 duration-500">
          <p className="text-xs font-black uppercase tracking-widest">Protocol Error</p>
          <p className="font-bold">{error}</p>
        </div>
      )}
    </div>
  )
}
