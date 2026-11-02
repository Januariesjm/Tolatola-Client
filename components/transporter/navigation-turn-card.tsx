"use client"

import { Loader2, RotateCw } from "lucide-react"
import type { ManeuverKind, NavigationTarget } from "@/lib/maps/navigation"
import { NavigationManeuverGlyph } from "./navigation-maneuver-glyph"

interface NavigationTurnCardProps {
  target: NavigationTarget
  /** True only until the first route resolves. */
  routeLoading: boolean
  hasRoute: boolean
  instructionDistance: string | null
  instruction: string | null
  routeError: string | null
  destinationMissing: boolean
  nextManeuver: ManeuverKind
  onRetry: () => void
}

/** Uber/Bolt-style next-manoeuvre card that floats over the map. */
export function NavigationTurnCard({
  target,
  routeLoading,
  hasRoute,
  instructionDistance,
  instruction,
  routeError,
  destinationMissing,
  nextManeuver,
  onRetry,
}: NavigationTurnCardProps) {
  const pending = routeLoading && !hasRoute
  return (
    <div className="absolute inset-x-4 top-20 z-20 flex items-start gap-3 rounded-2xl bg-white/98 p-3 shadow-lg lg:left-[416px] lg:right-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white ${
          target === "dropoff" ? "bg-violet-600" : "bg-sky-600"
        }`}
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <NavigationManeuverGlyph kind={nextManeuver} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-primary">{pending ? "Calculating route…" : instructionDistance || "Continue"}</p>
        <p className="mt-0.5 line-clamp-3 text-sm font-bold leading-snug text-slate-900">
          {routeError
            ? routeError
            : instruction ||
              (destinationMissing ? "Waiting for destination details" : `Head to the ${target === "pickup" ? "pickup point" : "customer"}`)}
        </p>
      </div>
      {routeError ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-primary hover:bg-blue-100"
          aria-label="Retry route"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}
