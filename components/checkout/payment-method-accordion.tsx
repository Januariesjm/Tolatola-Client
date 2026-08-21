"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Building2, CreditCard, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { BANK_METHODS, CARD_NETWORKS, MOBILE_MONEY_PROVIDERS, formatBankMethodLabel } from "@/lib/checkout/payment-methods"
import type { CheckoutCardDetails } from "@/lib/checkout/validate-checkout-form"

interface PaymentMethodAccordionProps {
  paymentMethod: string
  onPaymentMethodChange: (value: string) => void
  paymentPhoneNumber: string
  onPaymentPhoneNumberChange: (value: string) => void
  cardDetails: CheckoutCardDetails
  onCardDetailsChange: (value: CheckoutCardDetails) => void
}

const FIELD_CLASSES =
  "h-12 rounded-xl border-stone-200 bg-white focus:ring-primary/20 transition-all font-medium text-base px-4 text-stone-900"
const LABEL_CLASSES = "text-xs font-bold uppercase tracking-wide text-stone-500 ml-1"
const SELECTED_TILE = "bg-primary/5 border-primary shadow-sm"
const UNSELECTED_TILE = "border-stone-100 hover:border-stone-300"

/**
 * Step 3 of checkout: the mobile money / card / bank transfer picker.
 *
 * Split out of components/checkout/checkout-content.tsx, where this was ~190
 * lines of accordion markup with the provider, card-network and bank-channel
 * lists written inline as literals. Those lists now come from
 * lib/checkout/payment-methods, which derives them from the same constants the
 * form validator uses.
 *
 * The whole picker is one RadioGroup spanning three accordion sections, so
 * selecting a card clears a previously selected wallet -- collapsing a section
 * does not deselect what is inside it.
 */
export function PaymentMethodAccordion({
  paymentMethod,
  onPaymentMethodChange,
  paymentPhoneNumber,
  onPaymentPhoneNumberChange,
  cardDetails,
  onCardDetailsChange,
}: PaymentMethodAccordionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">3</div>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-stone-900">Choose Payment</h2>
      </div>

      <Card className="border-none shadow-xl shadow-stone-200/40 rounded-2xl md:rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-4 sm:p-6 md:p-8">
          <RadioGroup value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <Accordion type="single" collapsible defaultValue="mobile-money" className="w-full space-y-2">
              <AccordionItem value="mobile-money" className="border-none">
                <AccordionTrigger className="hover:no-underline p-3.5 sm:p-4 bg-stone-50 rounded-2xl group data-[state=open]:bg-[#22C55E] data-[state=open]:text-white transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5" />
                    <span className="text-base sm:text-lg font-bold tracking-tight">TOLA Pay</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-2 sm:p-4 mt-2 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentPhone" className={LABEL_CLASSES}>
                      Phone Number
                    </Label>
                    <Input
                      id="paymentPhone"
                      type="tel"
                      value={paymentPhoneNumber}
                      onChange={(e) => onPaymentPhoneNumberChange(e.target.value)}
                      className={FIELD_CLASSES}
                      placeholder="e.g. 2557..."
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                    {MOBILE_MONEY_PROVIDERS.map((p) => (
                      <Label
                        key={p.id}
                        htmlFor={p.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-300",
                          paymentMethod === p.id ? SELECTED_TILE : UNSELECTED_TILE,
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
                <AccordionTrigger className="hover:no-underline p-3.5 sm:p-4 bg-stone-50 rounded-2xl group data-[state=open]:bg-stone-900 data-[state=open]:text-white transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-base sm:text-lg font-bold tracking-tight">Card Payment</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-3.5 sm:p-6 mt-2 sm:mt-4 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {CARD_NETWORKS.map((c) => (
                      <Label
                        key={c}
                        htmlFor={c}
                        className={cn(
                          "flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 text-center",
                          paymentMethod === c ? SELECTED_TILE : UNSELECTED_TILE,
                        )}
                      >
                        <RadioGroupItem value={c} id={c} className="sr-only" />
                        <div
                          className={cn(
                            "h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center transition-colors",
                            paymentMethod === c ? "bg-primary text-white" : "bg-stone-100 text-stone-500",
                          )}
                        >
                          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                        </div>
                        <span className="font-bold uppercase tracking-wide text-[9px] sm:text-[10px] text-stone-900">{c}</span>
                      </Label>
                    ))}
                  </div>
                  <div className="space-y-3 pt-3 border-t border-stone-100">
                    <div className="space-y-2">
                      <Label htmlFor="cardNumber" className={LABEL_CLASSES}>
                        Card Number
                      </Label>
                      <Input
                        id="cardNumber"
                        value={cardDetails.number}
                        onChange={(e) => onCardDetailsChange({ ...cardDetails, number: e.target.value })}
                        className={FIELD_CLASSES}
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="expiry" className={LABEL_CLASSES}>
                          Expiry
                        </Label>
                        <Input
                          id="expiry"
                          value={cardDetails.expiry}
                          onChange={(e) => onCardDetailsChange({ ...cardDetails, expiry: e.target.value })}
                          className={FIELD_CLASSES}
                          placeholder="MM/YY"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv" className={LABEL_CLASSES}>
                          CVV / CVC
                        </Label>
                        <Input
                          id="cvv"
                          value={cardDetails.cvv}
                          onChange={(e) => onCardDetailsChange({ ...cardDetails, cvv: e.target.value })}
                          className={FIELD_CLASSES}
                          placeholder="123"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bank" className="border-none">
                <AccordionTrigger className="hover:no-underline p-3.5 sm:p-4 bg-stone-50 rounded-2xl group data-[state=open]:bg-stone-900 data-[state=open]:text-white transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5" />
                    <span className="text-base sm:text-lg font-bold tracking-tight">Bank Transfer</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="p-3.5 sm:p-6 space-y-3 mt-2 sm:mt-4">
                  {BANK_METHODS.map((b) => (
                    <Label
                      key={b}
                      htmlFor={b}
                      className={cn(
                        "flex items-center gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 cursor-pointer transition-all duration-300",
                        paymentMethod === b ? "bg-primary/5 border-primary shadow-lg" : UNSELECTED_TILE,
                      )}
                    >
                      <RadioGroupItem value={b} id={b} className="sr-only" />
                      <div
                        className={cn(
                          "h-9 w-9 sm:h-10 sm:w-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
                          paymentMethod === b ? "bg-primary text-white" : "bg-stone-50 text-stone-400",
                        )}
                      >
                        <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <span className="font-bold text-xs sm:text-sm text-stone-900 capitalize">{formatBankMethodLabel(b)}</span>
                    </Label>
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </RadioGroup>
        </CardContent>
      </Card>
    </section>
  )
}
