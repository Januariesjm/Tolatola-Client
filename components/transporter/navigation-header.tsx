"use client"

import { ArrowLeft } from "lucide-react"

const GPS_TEXT = {
  live: " • Live GPS",
  off: " • GPS off",
  locating: " • Locating…",
} as const

interface NavigationHeaderProps {
  headline: string
  orderNumber: string
  gpsState: keyof typeof GPS_TEXT
  delivered: boolean
  productLabel: string
  onBack: () => void
}

/** Top bar: back to Trips, trip headline, order number, GPS + package state. */
export function NavigationHeader({ headline, orderNumber, gpsState, delivered, productLabel, onBack }: NavigationHeaderProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:left-[400px]">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
        aria-label="Back to trips"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">{headline}</p>
        <p className="truncate text-[11px] text-slate-500">
          Order #{orderNumber}
          {GPS_TEXT[gpsState]}
        </p>
      </div>
      <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 sm:flex">
        <span className={`h-1.5 w-1.5 rounded-full ${delivered ? "bg-green-500" : "bg-blue-600"}`} />
        {delivered ? "Delivered" : productLabel}
      </span>
    </header>
  )
}
