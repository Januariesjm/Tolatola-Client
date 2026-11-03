"use client"

import { CheckCircle, Crosshair, Info, Loader2, Maximize2, Navigation, Package, Truck } from "lucide-react"
import type { NavigationPlace } from "@/lib/maps/navigation-places"

interface NavigationActionPanelProps {
  status: string
  destination: NavigationPlace | null
  follow: boolean
  advancing: boolean
  isArrivedAtDropoff: boolean
  delivered: boolean
  locationDenied: boolean
  onToggleFollow: () => void
  onRecenter: () => void
  onAdvanceStatus: (nextStatus: "picked_up" | "in_transit") => void
  onManualArrive: () => void
  onCompleteDelivery: () => void
  onOpenTrips: () => void
}

export function NavigationActionPanel({
  status,
  destination,
  follow,
  advancing,
  isArrivedAtDropoff,
  delivered,
  locationDenied,
  onToggleFollow,
  onRecenter,
  onAdvanceStatus,
  onManualArrive,
  onCompleteDelivery,
  onOpenTrips,
}: NavigationActionPanelProps) {
  return (
    <>
      <div className="mt-3 flex gap-2.5">
        <button
          type="button"
          disabled={!destination}
          onClick={onToggleFollow}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {follow ? <Maximize2 className="h-4 w-4" /> : <Navigation className="h-4 w-4" />}
          {follow ? "Route overview" : "Start navigation"}
        </button>
        <button
          type="button"
          onClick={onRecenter}
          className="flex w-12 items-center justify-center rounded-xl bg-blue-50 text-primary hover:bg-blue-100"
          aria-label="Recenter"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      {(status === "accepted" || status === "assigned") && (
        <button
          type="button"
          disabled={advancing}
          onClick={() => onAdvanceStatus("picked_up")}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 py-3 text-sm font-extrabold text-white transition-colors hover:bg-sky-700 disabled:opacity-60"
        >
          {advancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
          Mark as picked up
        </button>
      )}

      {status === "picked_up" && (
        <button
          type="button"
          disabled={advancing}
          onClick={() => onAdvanceStatus("in_transit")}
          className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-extrabold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
        >
          {advancing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Truck className="h-4 w-4" />}
          Start delivery
        </button>
      )}

      {status === "in_transit" && (
        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-blue-50 p-2.5">
          {isArrivedAtDropoff ? (
            <button
              type="button"
              onClick={onCompleteDelivery}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-sm transition-colors hover:bg-emerald-700"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Delivery
            </button>
          ) : (
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                Heading to customer...
              </span>
              <button type="button" onClick={onManualArrive} className="font-bold text-primary hover:underline text-[11px]">
                Arrived?
              </button>
            </div>
          )}
          <button type="button" onClick={onOpenTrips} className="text-center text-[11px] font-bold text-primary hover:underline">
            Open Trips
          </button>
        </div>
      )}

      {delivered ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 p-2.5 text-xs font-bold text-green-700">
          <CheckCircle className="h-4 w-4" />
          Delivery complete
        </div>
      ) : null}

      {locationDenied ? (
        <p className="mt-2.5 text-[10px] leading-relaxed text-slate-400">
          Location is off — routing from the pickup point. Allow location access for live turn-by-turn.
        </p>
      ) : null}
    </>
  )
}
