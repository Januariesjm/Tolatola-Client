"use client"

/**
 * The subscription upgrade dialog for the transporter subscription tab.
 *
 * Extracted verbatim from components/transporter/transporter-subscription-tab.tsx.
 * Presentational -- the payment-method fields and the upgrade request live in
 * the parent; this only renders the form and calls back into it.
 */

import { Building2, CreditCard, Smartphone } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { cn } from "@/lib/utils"
import type { SubscriptionPlan } from "@/lib/types/subscription"

export interface SubscriptionUpgradeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedPlan: SubscriptionPlan | null
  paymentMethod: string
  onPaymentMethodChange: (method: string) => void
  phoneNumber: string
  onPhoneNumberChange: (value: string) => void
  cardNumber: string
  onCardNumberChange: (value: string) => void
  expiryDate: string
  onExpiryDateChange: (value: string) => void
  cvv: string
  onCvvChange: (value: string) => void
  upgrading: boolean
  onUpgrade: () => void
}

export function SubscriptionUpgradeDialog({
  open,
  onOpenChange,
  selectedPlan,
  paymentMethod,
  onPaymentMethodChange,
  phoneNumber,
  onPhoneNumberChange,
  cardNumber,
  onCardNumberChange,
  expiryDate,
  onExpiryDateChange,
  cvv,
  onCvvChange,
  upgrading,
  onUpgrade,
}: SubscriptionUpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] sm:w-full rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl animate-in zoom-in duration-300">
        <div className="bg-primary p-6 py-8 text-white">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-2xl font-black text-white">Upgrade Account</DialogTitle>
            <DialogDescription className="text-white/80 font-medium">Elevate your earnings and priority status.</DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6 scrollbar-hide py-4 space-y-6">
          <div className="bg-stone-50 p-6 rounded-[1.5rem] border border-stone-100">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-stone-900">{selectedPlan?.name} Member</span>
              <span className="text-2xl font-black text-primary">{selectedPlan?.price?.toLocaleString()} TZS</span>
            </div>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Billed Monthly</p>
          </div>

          <div className="space-y-3">
            <Label className="font-black text-stone-900 ml-1">Select Payment Method</Label>
            <RadioGroup value={paymentMethod} onValueChange={onPaymentMethodChange}>
              <Accordion type="single" collapsible defaultValue="mobile-money" className="w-full space-y-2">
                <AccordionItem value="mobile-money" className="border-none">
                  <AccordionTrigger className="hover:no-underline p-4 bg-stone-50 rounded-2xl group data-[state=open]:bg-primary data-[state=open]:text-white transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5" />
                      <span className="text-lg font-bold tracking-tight">Mobile Money</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 mt-2 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-bold uppercase tracking-wide text-stone-500 ml-1">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => onPhoneNumberChange(e.target.value)}
                        className="h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
                        placeholder="e.g. 2557..."
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: "airtel-money", name: "Airtel Money", provider: "Airtel" },
                        { id: "mixx-by-yas", name: "Mixx by Yas", provider: "Tigo Pesa" },
                        { id: "halopesa", name: "HaloPesa", provider: "Halotel" },
                        { id: "ezypesa", name: "EzyPesa", provider: "Zantel" },
                        { id: "m-pesa", name: "M-Pesa", provider: "Vodacom", maintenance: true },
                      ].map((p) => (
                        <Label
                          key={p.id}
                          htmlFor={p.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300",
                            paymentMethod === p.id ? "bg-primary/5 border-primary shadow-sm" : "border-stone-100 hover:border-stone-300",
                            p.maintenance && "opacity-60 grayscale-[0.5]",
                          )}
                        >
                          <RadioGroupItem value={p.id} id={p.id} className="sr-only" />
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                              paymentMethod === p.id ? "bg-primary text-white" : "bg-stone-100 text-stone-500",
                            )}
                          >
                            <Smartphone className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-stone-900 text-sm">{p.name}</p>
                              {p.maintenance && (
                                <span className="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full font-black uppercase">
                                  Service Down
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-stone-500">{p.provider}</p>
                          </div>
                        </Label>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="cards" className="border-none">
                  <AccordionTrigger className="hover:no-underline p-4 bg-stone-50 rounded-2xl group data-[state=open]:bg-stone-900 data-[state=open]:text-white transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <span className="text-lg font-bold tracking-tight">Card Payment</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 mt-4 space-y-6">
                    <div className="grid grid-cols-3 gap-2">
                      {["visa", "mastercard", "unionpay"].map((c) => (
                        <Label
                          key={c}
                          htmlFor={c}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center",
                            paymentMethod === c ? "bg-primary/5 border-primary shadow-sm" : "border-stone-100 hover:border-stone-300",
                          )}
                        >
                          <RadioGroupItem value={c} id={c} className="sr-only" />
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center transition-colors",
                              paymentMethod === c ? "bg-primary text-white" : "bg-stone-100 text-stone-500",
                            )}
                          >
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <span className="font-bold uppercase tracking-wide text-[10px] text-stone-900">{c}</span>
                        </Label>
                      ))}
                    </div>
                    <div className="space-y-3 pt-3 border-t border-stone-100">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber" className="text-xs font-bold uppercase tracking-wide text-stone-500 ml-1">
                          Card Number
                        </Label>
                        <Input
                          id="cardNumber"
                          value={cardNumber}
                          onChange={(e) => onCardNumberChange(e.target.value)}
                          className="h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="expiry" className="text-xs font-bold uppercase tracking-wide text-stone-500 ml-1">
                            Expiry
                          </Label>
                          <Input
                            id="expiry"
                            value={expiryDate}
                            onChange={(e) => onExpiryDateChange(e.target.value)}
                            className="h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv" className="text-xs font-bold uppercase tracking-wide text-stone-500 ml-1">
                            CVV / CVC
                          </Label>
                          <Input
                            id="cvv"
                            value={cvv}
                            onChange={(e) => onCvvChange(e.target.value)}
                            className="h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bank" className="border-none">
                  <AccordionTrigger className="hover:no-underline p-4 bg-stone-50 rounded-2xl group data-[state=open]:bg-stone-900 data-[state=open]:text-white transition-all duration-300">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5" />
                      <span className="text-lg font-bold tracking-tight">Bank Transfer</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 space-y-3 mt-4">
                    {["crdb-simbanking", "crdb-internet-banking", "crdb-wakala", "crdb-branch-otc"].map((b) => (
                      <Label
                        key={b}
                        htmlFor={b}
                        className={cn(
                          "flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300",
                          paymentMethod === b ? "bg-primary/5 border-primary shadow-lg" : "border-stone-100 hover:border-stone-300",
                        )}
                      >
                        <RadioGroupItem value={b} id={b} className="sr-only" />
                        <div
                          className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                            paymentMethod === b ? "bg-primary text-white" : "bg-stone-50 text-stone-400",
                          )}
                        >
                          <Building2 className="h-5 w-5" />
                        </div>
                        <span className="font-black text-stone-900 capitalize">{b.replace(/-/g, " ")}</span>
                      </Label>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2 flex-col sm:flex-col gap-3">
          <Button
            onClick={onUpgrade}
            disabled={upgrading}
            className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            {upgrading ? "Processing..." : `Pay ${selectedPlan?.price?.toLocaleString()} TZS`}
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={upgrading}
            className="w-full h-12 rounded-2xl border-stone-200 text-stone-500 font-bold"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
