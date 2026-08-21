"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Truck } from "lucide-react"
import type { TransportMethod } from "@/app/actions/maps"

interface TransportMethodSelectProps {
  transportMethods: TransportMethod[]
  selectedTransportId: string
  onSelectedTransportIdChange: (value: string) => void
}

/**
 * Step 2 of checkout: the delivery-method dropdown.
 *
 * Split out of components/checkout/checkout-content.tsx. The
 * `[[data-slot=select-value]_&]:hidden` selectors are load-bearing: Radix
 * re-renders the chosen SelectItem's children inside the trigger, and without
 * them the price badge and description would appear in the collapsed trigger as
 * well as in the open list.
 */
export function TransportMethodSelect({ transportMethods, selectedTransportId, onSelectedTransportIdChange }: TransportMethodSelectProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-stone-900 text-white flex items-center justify-center font-bold text-lg shadow-lg">2</div>
        <h2 className="text-lg md:text-xl font-bold tracking-tight text-stone-900">Delivery Method</h2>
      </div>

      <div className="w-full">
        <Select value={selectedTransportId} onValueChange={onSelectedTransportIdChange}>
          <SelectTrigger className="w-full !h-auto py-4 md:!py-8 rounded-2xl md:rounded-[2.5rem] border-2 border-stone-200 bg-white px-4 md:px-8 focus:ring-primary/20 transition-all hover:bg-stone-50 hover:border-primary/40 shadow-sm hover:shadow-md group">
            <div className="flex items-center gap-3 md:gap-6 min-w-0 flex-1">
              <div className="h-10 w-10 md:h-14 md:w-14 shrink-0 rounded-xl md:rounded-[1.25rem] bg-primary/10 text-primary flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-inner">
                <Truck className="h-5 w-5 md:h-7 md:w-7" />
              </div>
              <div className="flex flex-col items-start text-left gap-0.5 md:gap-1.5 overflow-hidden min-w-0 flex-1">
                <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] text-stone-400">Delivery Method</span>
                <div className="font-black text-stone-900 text-base md:text-xl tracking-tight truncate w-full">
                  <SelectValue placeholder="Please select delivery method" />
                </div>
              </div>
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-stone-200 shadow-2xl p-2 bg-white max-w-[92vw] sm:min-w-[300px] z-[150]">
            {transportMethods.map((method) => (
              <SelectItem
                key={method.id}
                value={method.id}
                className="rounded-xl md:rounded-[1.5rem] md:py-6 py-3 md:px-8 px-4 focus:bg-primary/5 cursor-pointer mb-2 md:mb-3 last:mb-0 transition-all border border-transparent hover:border-primary/10"
              >
                <div className="flex flex-col gap-1.5 md:gap-2.5 text-left w-full">
                  <div className="flex items-center justify-between gap-3 md:gap-10 w-full">
                    <span className="font-black text-stone-900 md:text-lg text-sm tracking-tight truncate">{method.name}</span>
                    <div className="[[data-slot=select-value]_&]:hidden px-2.5 md:px-4 py-1 md:py-1.5 rounded-full bg-primary/5 border border-primary/20 flex-shrink-0">
                      <span className="text-primary font-black md:text-[11px] text-[9px] tracking-wider uppercase">
                        {method.rate_per_km
                          ? `TZS ${method.rate_per_km.toLocaleString()}/KM`
                          : `TZS ${method.rate_per_kg?.toLocaleString()}/KG`}
                      </span>
                    </div>
                  </div>
                  <span className="md:text-sm text-xs text-stone-500 font-bold leading-relaxed pr-2 md:pr-12 line-clamp-2 [[data-slot=select-value]_&]:hidden">
                    {method.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}
