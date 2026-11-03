"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, Info, Package, ShoppingBag } from "lucide-react"
import { clientApiGet, clientApiPatch } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { logger } from "@/lib/logger"
import {
  bearingDegrees,
  defaultTargetForStatus,
  formatDistanceText,
  formatDurationText,
  getNextNavigationStep,
  getProductPosition,
  getRouteProgress,
  haversineMeters,
  maneuverKind,
  productPositionDescription,
  productPositionLabel,
  type NavigationPoint,
  type NavigationRoute,
  type NavigationTarget,
} from "@/lib/maps/navigation"
import { buildPlace, toPoint, type NavigationPlace } from "@/lib/maps/navigation-places"
import { fetchNavigationRoute } from "@/lib/maps/navigation-route"
import type { TransporterAssignment } from "@/lib/types/transporter"
import { TransporterNavigationMap, type MapMode } from "./transporter-navigation-map"
import { NavigationHeader } from "./navigation-header"
import { NavigationLegPanel } from "./navigation-leg-panel"
import { NavigationMapControls } from "./navigation-map-controls"
import { NavigationTurnCard } from "./navigation-turn-card"
import { NavigationPinDialog } from "./navigation-pin-dialog"
import { NavigationActionPanel } from "./navigation-action-panel"

const log = logger.child("transporter.transporter-navigation-screen")

const ROUTE_REFRESH_DISTANCE_METERS = 60
const ROUTE_REFRESH_INTERVAL_MS = 30_000
const ASSIGNMENT_POLL_MS = 20_000

interface TransporterNavigationScreenProps {
  assignment: TransporterAssignment
  initialTarget?: NavigationTarget | "auto"
}

/**
 * In-app Uber/Bolt-style navigator for the website transporter dashboard.
 *
 * Everything happens inside TOLA: Mapbox (or OSM fallback) map, live GPS,
 * turn-by-turn guidance, both stops, and the trip status actions -- no
 * `google.com/maps` hand-off.
 */
export function TransporterNavigationScreen({ assignment, initialTarget = "auto" }: TransporterNavigationScreenProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [current, setCurrent] = useState<TransporterAssignment>(assignment)
  const [statusOverride, setStatusOverride] = useState<string | null>(null)
  const [targetMode, setTargetMode] = useState<NavigationTarget | "auto">(initialTarget)
  const [driver, setDriver] = useState<(NavigationPoint & { heading?: number | null }) | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)
  const [route, setRoute] = useState<NavigationRoute | null>(null)
  const [routeLoading, setRouteLoading] = useState(true)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [retryToken, setRetryToken] = useState(0)
  const [follow, setFollow] = useState(true)
  const [fitSignal, setFitSignal] = useState(0)
  const [recenterSignal, setRecenterSignal] = useState(0)
  const [advancing, setAdvancing] = useState(false)
  const [mapMode, setMapMode] = useState<MapMode | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [arrivedManually, setArrivedManually] = useState(false)
  const [pinDialogOpen, setPinDialogOpen] = useState(false)

  const lastPositionRef = useRef<NavigationPoint | null>(null)
  const lastFetchRef = useRef<{ key: string; origin: NavigationPoint; at: number } | null>(null)
  const requestIdRef = useRef(0)
  const fetchingRef = useRef(false)

  const status = statusOverride ?? current.status
  const target: NavigationTarget = targetMode === "auto" ? defaultTargetForStatus(status) : targetMode

  const pickup = useMemo<NavigationPlace | null>(
    () =>
      buildPlace(
        toPoint(current.shops?.latitude),
        toPoint(current.shops?.longitude),
        current.shops?.name || "Pickup merchant",
        [current.shops?.address, current.shops?.district, current.shops?.region],
        current.shops?.phone,
      ),
    [current.shops],
  )

  const dropoff = useMemo<NavigationPlace | null>(
    () =>
      buildPlace(
        toPoint(current.orders?.shipping_address?.latitude),
        toPoint(current.orders?.shipping_address?.longitude),
        current.orders?.users?.full_name || current.orders?.shipping_address?.full_name || "Customer",
        [
          current.orders?.shipping_address?.street || current.orders?.shipping_address?.address,
          current.orders?.shipping_address?.ward || current.orders?.shipping_address?.village,
          current.orders?.shipping_address?.district,
          current.orders?.shipping_address?.region,
        ],
        current.orders?.users?.phone,
      ),
    [current.orders],
  )

  const destination = target === "pickup" ? pickup : dropoff
  const origin = driver ?? pickup
  const productPosition = getProductPosition(status)

  // Live browser GPS; routing still works from the pickup point if it is
  // blocked so the transporter can at least preview both legs.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationDenied(true)
      return
    }

    let watchId: number | null = null
    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const previous = lastPositionRef.current
          const next: NavigationPoint & { heading?: number | null } = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            heading:
              position.coords.heading ??
              (previous
                ? bearingDegrees(previous, {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  })
                : null),
          }
          lastPositionRef.current = next
          setDriver(next)
          setLocationDenied(false)
        },
        (error) => {
          log.warn("geolocation watch failed", error)
          setLocationDenied(true)
        },
        { enableHighAccuracy: true, maximumAge: 4_000, timeout: 15_000 },
      )
    } catch (error) {
      log.error("geolocation unavailable", error)
      setLocationDenied(true)
    }

    return () => {
      if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // Keep the assignment fresh (status/coordinates can change from the customer
  // app or the shop while the transporter is driving).
  useEffect(() => {
    let cancelled = false
    const refresh = async () => {
      try {
        const res = await clientApiGet<{ assignments: TransporterAssignment[] }>("assignments")
        const next = (res.assignments || []).find((item) => item.id === assignment.id || item.order_id === assignment.id)
        if (!cancelled && next) {
          setCurrent(next)
          setStatusOverride(null)
        }
      } catch (error) {
        log.warn("could not refresh assignment", error)
      }
    }

    const interval = window.setInterval(refresh, ASSIGNMENT_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [assignment.id])

  // Recompute the route only when the leg/status changes or the driver has
  // moved enough to matter, not on every GPS tick.
  useEffect(() => {
    if (!origin || !destination) {
      setRoute(null)
      setRouteLoading(false)
      return
    }

    const now = Date.now()
    const key = `${target}|${destination.latitude.toFixed(5)}|${destination.longitude.toFixed(5)}|${status}`
    const last = lastFetchRef.current
    const moved = last ? haversineMeters(last.origin, origin) : Number.POSITIVE_INFINITY
    const sameDestination = last?.key === key
    const elapsed = now - (last?.at ?? 0)

    const shouldFetch = !route
      ? !last || elapsed >= 5_000
      : !sameDestination || moved >= ROUTE_REFRESH_DISTANCE_METERS || (elapsed >= ROUTE_REFRESH_INTERVAL_MS && moved >= 15)
    if (!shouldFetch || fetchingRef.current) return

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId
    fetchingRef.current = true
    lastFetchRef.current = { key, origin, at: now }
    if (!route) setRouteLoading(true)

    fetchNavigationRoute({ origin, destination, profile: "driving-traffic" })
      .then((nextRoute) => {
        if (requestId !== requestIdRef.current) return
        setRoute(nextRoute)
        setRouteError(null)
      })
      .catch((error: any) => {
        if (requestId !== requestIdRef.current) return
        log.error("could not calculate route", error)
        setRouteError(error?.message || "Could not calculate a route.")
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          fetchingRef.current = false
          setRouteLoading(false)
        }
      })
  }, [origin, destination, target, status, route, retryToken])

  // Frame the new leg whenever the transporter switches pickup <-> drop-off or
  // the trip advances.
  useEffect(() => {
    setFollow(false)
    setFitSignal((value) => value + 1)
  }, [target, status])

  const progress = useMemo(() => getRouteProgress(route, driver), [route, driver])
  const nextStep = useMemo(() => getNextNavigationStep(route, driver), [route, driver])

  const distanceToDestination = useMemo(() => {
    if (!driver || !destination) return null
    return haversineMeters(driver, destination)
  }, [driver, destination])

  const isArrivedAtDropoff = useMemo(() => {
    if (arrivedManually) return true
    if (target === "dropoff" && status === "in_transit") {
      if (distanceToDestination !== null && distanceToDestination <= 80) return true
      if (nextStep?.step.maneuver === "arrive" && nextStep.distanceToStepMeters <= 50) return true
    }
    return false
  }, [arrivedManually, target, status, distanceToDestination, nextStep])

  const advanceStatus = useCallback(
    async (nextStatus: "picked_up" | "in_transit") => {
      if (advancing) return
      setAdvancing(true)
      try {
        const payload: { status: string; picked_up_at?: string; delivered_at?: string } = {
          status: nextStatus,
        }
        if (nextStatus === "picked_up") payload.picked_up_at = new Date().toISOString()

        await clientApiPatch(`assignments/${current.id}`, payload)
        setStatusOverride(nextStatus)
        setTargetMode("auto")
        setCurrent((previous) => ({ ...previous, status: nextStatus }))
        toast({
          title: nextStatus === "picked_up" ? "Package picked up" : "Delivery started",
          description:
            nextStatus === "picked_up"
              ? "Navigation is now set to the customer's address."
              : "Follow the route; finish with the customer PIN to release your payout.",
        })
      } catch (error) {
        log.error("could not update assignment status", error)
        toast({
          variant: "destructive",
          title: "Could not update trip",
          description: "Check your connection and try again.",
        })
      } finally {
        setAdvancing(false)
      }
    },
    [advancing, current.id, toast],
  )

  const callDestination = () => {
    if (!destination?.phone) return
    window.location.href = `tel:${destination.phone}`
  }

  const retryRoute = () => {
    setRouteError(null)
    lastFetchRef.current = null
    setRetryToken((value) => value + 1)
  }

  const instructionDistance = nextStep ? formatDistanceText(nextStep.distanceToStepMeters) : route ? "Arriving" : null
  const delivered = status === "delivered" || status === "completed"
  const headline =
    status === "picked_up"
      ? "Package picked up"
      : status === "in_transit"
        ? "Delivering to customer"
        : delivered
          ? "Delivery complete"
          : "Heading to pickup"

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-slate-100">
      <TransporterNavigationMap
        className="absolute inset-0 lg:left-[400px]"
        route={route?.coordinates ?? []}
        driver={driver}
        pickup={pickup}
        dropoff={dropoff}
        activeTarget={target}
        productWithDriver={productPosition === "with_driver"}
        follow={follow}
        fitSignal={fitSignal}
        recenterSignal={recenterSignal}
        onModeChange={setMapMode}
        onError={setMapError}
      />

      <NavigationHeader
        headline={headline}
        orderNumber={current.orders?.order_number || current.order_id || "—"}
        gpsState={driver ? "live" : locationDenied ? "off" : "locating"}
        delivered={delivered}
        productLabel={productPositionLabel(productPosition)}
        onBack={() => router.push("/transporter/dashboard?tab=assignments")}
      />

      <NavigationTurnCard
        target={target}
        routeLoading={routeLoading}
        hasRoute={Boolean(route)}
        instructionDistance={instructionDistance}
        instruction={nextStep?.step.instruction ?? null}
        routeError={routeError}
        destinationMissing={!destination}
        nextManeuver={maneuverKind(nextStep?.step ?? null)}
        onRetry={retryRoute}
      />

      <NavigationMapControls
        onRecenter={() => {
          setFollow(true)
          setRecenterSignal((value) => value + 1)
        }}
        onFitRoute={() => {
          setFollow(false)
          setFitSignal((value) => value + 1)
        }}
      />

      {/* Guidance sheet (bottom sheet on mobile, left rail on desktop) */}
      <aside className="absolute inset-x-0 bottom-0 z-30 max-h-[64vh] overflow-y-auto rounded-t-3xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl lg:inset-y-0 lg:left-0 lg:right-auto lg:max-h-none lg:w-[400px] lg:overflow-y-auto lg:rounded-none lg:border-r lg:border-slate-200 lg:px-5 lg:pb-6 lg:pt-5">
        <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-slate-300 lg:hidden" />

        {mapError ? (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-[11px] font-medium text-amber-800">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-3">{mapError}</span>
          </div>
        ) : null}

        <div className="flex items-end gap-4">
          <div>
            <p className="text-2xl font-black text-slate-900">{route ? formatDurationText(progress.remainingSeconds) : "—"}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ETA</p>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <p className="text-2xl font-black text-slate-900">{route ? formatDistanceText(progress.remainingMeters) : "—"}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Remaining</p>
          </div>
          <div className="ml-auto">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${
                productPosition === "delivered"
                  ? "bg-green-50 text-green-700"
                  : productPosition === "with_driver"
                    ? "bg-violet-50 text-violet-700"
                    : "bg-sky-50 text-sky-700"
              }`}
            >
              {productPosition === "delivered" ? (
                <CheckCircle className="h-3 w-3" />
              ) : productPosition === "with_driver" ? (
                <Package className="h-3 w-3" />
              ) : (
                <ShoppingBag className="h-3 w-3" />
              )}
              {productPositionLabel(productPosition)}
            </span>
          </div>
        </div>
        <p className="mt-1 truncate text-[11px] text-slate-500">{productPositionDescription(productPosition)}</p>

        <NavigationLegPanel target={target} destination={destination} onSelectTarget={setTargetMode} onCall={callDestination} />

        <NavigationActionPanel
          status={status}
          destination={destination}
          follow={follow}
          advancing={advancing}
          isArrivedAtDropoff={isArrivedAtDropoff}
          delivered={delivered}
          locationDenied={locationDenied}
          onToggleFollow={() => {
            if (follow) {
              setFollow(false)
              setFitSignal((value) => value + 1)
            } else {
              setFollow(true)
              setRecenterSignal((value) => value + 1)
            }
          }}
          onRecenter={() => {
            setFollow(true)
            setRecenterSignal((value) => value + 1)
          }}
          onAdvanceStatus={advanceStatus}
          onManualArrive={() => setArrivedManually(true)}
          onCompleteDelivery={() => setPinDialogOpen(true)}
          onOpenTrips={() =>
            router.push(`/transporter/dashboard?tab=assignments&orderId=${encodeURIComponent(current.order_id || current.id)}`)
          }
        />
      </aside>

      <NavigationPinDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        assignmentId={current.id}
        onSuccess={() => {
          setStatusOverride("delivered")
          setCurrent((prev) => ({ ...prev, status: "delivered" }))
        }}
      />
    </div>
  )
}
