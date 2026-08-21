"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ShieldCheck } from "lucide-react"

/**
 * Full-screen spinner shown between "payment initiated" and the redirect.
 *
 * Split out of components/checkout/checkout-content.tsx so the page's own markup
 * starts at the page layout rather than 20 lines of modal.
 */
export function PaymentProcessingOverlay() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
      <Card className="max-w-md w-full mx-4 border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-primary p-8 text-white text-center space-y-4">
          <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Processing Payment</h2>
        </div>
        <CardContent className="p-8 text-center space-y-6">
          <p className="text-stone-600 font-medium leading-relaxed">Please wait while we process your payment...</p>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-left">
              Encrypted secure transaction protocol active
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
