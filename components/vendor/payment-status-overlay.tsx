"use client"

/**
 * Full-screen overlay shown while a vendor subscription payment is being
 * confirmed.
 *
 * Extracted verbatim from components/vendor/vendor-subscription-tab.tsx.
 * Presentational -- the polling that eventually closes it lives in
 * hooks/use-subscription-payment-poll.ts.
 *
 * Structurally similar to
 * components/transporter/payment-status-overlay.tsx but not identical: this
 * one additionally shows CRDB SimBanking dial instructions once a control
 * number arrives, which the transporter tab's checkout flow never surfaced.
 * Kept separate rather than adding an optional instructions prop to one
 * shared component for a difference that is specific to this tab's copy.
 */

import { Building2, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export interface VendorPaymentStatusOverlayProps {
  controlNumber: string
  statusMessage: string
  onDone: () => void
}

export function VendorPaymentStatusOverlay({ controlNumber, statusMessage, onDone }: VendorPaymentStatusOverlayProps) {
  const { toast } = useToast()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-500">
      <Card className="max-w-md w-full mx-4 border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-primary p-8 text-white text-center space-y-4">
          <div className="h-16 w-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto">
            {controlNumber ? <Building2 className="h-8 w-8 animate-bounce" /> : <Loader2 className="h-8 w-8 animate-spin" />}
          </div>
          <h2 className="text-2xl font-black tracking-tight">{controlNumber ? "Bank Settlement" : "Confirming Payment"}</h2>
        </div>
        <CardContent className="p-8 text-center space-y-6">
          <div className="space-y-2">
            <p className="text-stone-600 font-medium leading-relaxed">{statusMessage}</p>
            {controlNumber && (
              <div className="mt-4 p-6 bg-stone-50 rounded-2xl border-2 border-dashed border-primary/20 space-y-4">
                {controlNumber.startsWith("http") ? (
                  <div className="space-y-4 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Payment Link</p>
                    <Button
                      size="lg"
                      className="w-full rounded-xl bg-primary text-white font-bold h-12 text-base shadow-lg shadow-primary/20 hover:bg-primary/90"
                      onClick={() => window.open(controlNumber, "_blank")}
                    >
                      Complete Payment Now
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Control Number</p>
                      <p className="text-3xl font-black text-primary tracking-tight tabular-nums select-all">{controlNumber}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-stone-200"
                      onClick={() => {
                        navigator.clipboard.writeText(controlNumber)
                        toast({ title: "Copied!", description: "Control number copied to clipboard." })
                      }}
                    >
                      Copy Number
                    </Button>
                    <div className="text-left space-y-2 bg-white p-4 rounded-xl border border-stone-100">
                      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Instructions</p>
                      <ul className="text-xs text-stone-600 space-y-1 list-disc pl-4">
                        <li>Dial *150*03# (CRDB SimBanking)</li>
                        <li>Select 'Bill Payment'</li>
                        <li>Enter this Control Number</li>
                        <li>Follow prompts to complete</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {controlNumber ? (
              <Button className="w-full h-12 rounded-xl bg-stone-900 text-white font-bold" onClick={onDone}>
                I have completed payment
              </Button>
            ) : (
              <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 text-left">
                  Encrypted secure transaction protocol active
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Do not refresh this page</p>
        </CardContent>
      </Card>
    </div>
  )
}
