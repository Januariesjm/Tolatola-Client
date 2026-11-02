"use client"

import { Home, Info, Phone, ShoppingBag } from "lucide-react"
import type { NavigationTarget } from "@/lib/maps/navigation"
import type { NavigationPlace } from "@/lib/maps/navigation-places"

interface NavigationLegPanelProps {
  target: NavigationTarget
  destination: NavigationPlace | null
  onSelectTarget: (target: NavigationTarget) => void
  onCall: () => void
}

/**
 * The active stop, its contact action, the pickup/drop-off toggle, and the
 * warning shown when the API has no coordinates for that stop.
 */
export function NavigationLegPanel({ target, destination, onSelectTarget, onCall }: NavigationLegPanelProps) {
  return (
    <>
      <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-slate-50 p-2.5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
            target === "pickup" ? "bg-sky-600" : "bg-violet-600"
          }`}
        >
          {target === "pickup" ? <ShoppingBag className="h-4 w-4" /> : <Home className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            {target === "pickup" ? "Pick up from" : "Deliver to"}
          </p>
          <p className="truncate text-sm font-bold text-slate-900">{destination?.name || "Destination coordinates missing"}</p>
          {destination?.address ? <p className="truncate text-[11px] text-slate-500">{destination.address}</p> : null}
        </div>
        {destination?.phone ? (
          <button
            type="button"
            onClick={onCall}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-primary hover:bg-blue-100"
            aria-label={`Call ${destination.name}`}
          >
            <Phone className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* Segment: both destinations stay one tap apart */}
      <div className="mt-3 flex gap-1.5 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => onSelectTarget("pickup")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors ${
            target === "pickup" ? "bg-sky-600 text-white" : "text-slate-600 hover:bg-white"
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          Pickup
        </button>
        <button
          type="button"
          onClick={() => onSelectTarget("dropoff")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-colors ${
            target === "dropoff" ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-white"
          }`}
        >
          <Home className="h-3.5 w-3.5" />
          Drop-off
        </button>
      </div>

      {!destination ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] font-semibold text-amber-800">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          This {target === "pickup" ? "pickup" : "delivery"} address has no map coordinates yet.
        </div>
      ) : null}
    </>
  )
}
