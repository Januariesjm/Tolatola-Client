/**
 * Pure navigation helpers for the transporter in-app navigator.
 *
 * Kept free of React/Mapbox so the route maths, product-location wording and
 * formatting can be unit-tested and reused by the assignments tab.
 */

export interface NavigationPoint {
  latitude: number
  longitude: number
}

export interface NavigationStep {
  instruction: string
  maneuver: string | null
  modifier: string | null
  distanceMeters: number
  durationSeconds: number
  location: NavigationPoint | null
}

export interface NavigationRoute {
  provider: "mapbox" | "google" | "fallback"
  coordinates: NavigationPoint[]
  distanceMeters: number
  durationSeconds: number
  distanceText: string
  durationText: string
  steps: NavigationStep[]
}

export type NavigationTarget = "pickup" | "dropoff"

const EARTH_RADIUS_METERS = 6_371_000

export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/** Great-circle distance in metres. */
export function haversineMeters(a: NavigationPoint, b: NavigationPoint): number {
  const dLat = toRadians(b.latitude - a.latitude)
  const dLng = toRadians(b.longitude - a.longitude)
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)
  const h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Compass bearing from a to b, 0–360. */
export function bearingDegrees(a: NavigationPoint, b: NavigationPoint): number {
  const lat1 = toRadians(a.latitude)
  const lat2 = toRadians(b.latitude)
  const dLng = toRadians(b.longitude - a.longitude)
  const y = Math.sin(dLng) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export interface RouteProgress {
  nearestIndex: number
  distanceFromRouteMeters: number
  remainingMeters: number
  remainingSeconds: number
  /** 0 = at the start, 1 = at the destination. */
  fractionComplete: number
}

export function getRouteProgress(route: NavigationRoute | null, driver: NavigationPoint | null): RouteProgress {
  if (!route || route.coordinates.length < 2 || !driver) {
    return {
      nearestIndex: 0,
      distanceFromRouteMeters: 0,
      remainingMeters: route?.distanceMeters ?? 0,
      remainingSeconds: route?.durationSeconds ?? 0,
      fractionComplete: 0,
    }
  }

  const cumulative = cumulativeDistances(route.coordinates)
  const totalAlong = cumulative[cumulative.length - 1] || 0
  const nearestIndex = findNearestIndex(route.coordinates, driver)
  const distanceFromRouteMeters = haversineMeters(route.coordinates[nearestIndex], driver)
  const driverAlong = cumulative[nearestIndex] + distanceFromRouteMeters
  const remainingAlong = Math.max(0, totalAlong - driverAlong)
  const fractionRemaining = totalAlong > 0 ? remainingAlong / totalAlong : 0
  const fractionComplete = Math.min(1, Math.max(0, 1 - fractionRemaining))

  return {
    nearestIndex,
    distanceFromRouteMeters,
    remainingMeters: route.distanceMeters * fractionRemaining,
    remainingSeconds: route.durationSeconds * fractionRemaining,
    fractionComplete,
  }
}

export interface NextStep {
  step: NavigationStep
  distanceToStepMeters: number
  routeIndex: number
}

export function getNextNavigationStep(route: NavigationRoute | null, driver: NavigationPoint | null): NextStep | null {
  if (!route || route.steps.length === 0 || !driver || route.coordinates.length < 2) {
    return null
  }

  const cumulative = cumulativeDistances(route.coordinates)
  const progress = getRouteProgress(route, driver)
  const driverAlong = cumulative[progress.nearestIndex] + progress.distanceFromRouteMeters

  const indexed = route.steps.map((step, index) => {
    const routeIndex = step.location
      ? nearestCoordinateIndex(route.coordinates, step.location)
      : Math.min(route.coordinates.length - 1, Math.round(((index + 1) / route.steps.length) * (route.coordinates.length - 1)))
    return { step, routeIndex, along: cumulative[routeIndex] }
  })

  // A step at the very start (depart) is not a manoeuvre we still have to make.
  const ahead = indexed.filter((entry) => entry.along > driverAlong + 5)
  const chosen = ahead[0] ?? indexed[indexed.length - 1]

  return {
    step: chosen.step,
    distanceToStepMeters: Math.max(0, chosen.along - driverAlong),
    routeIndex: chosen.routeIndex,
  }
}

export type ManeuverKind =
  "left" | "right" | "slight-left" | "slight-right" | "straight" | "uturn" | "roundabout" | "merge" | "arrive" | "depart"

/** Collapses provider manoeuvre vocabulary into the icons the UI can draw. */
export function maneuverKind(step: NavigationStep | null): ManeuverKind {
  if (!step) return "straight"
  const type = (step.maneuver || "").toLowerCase()
  const modifier = (step.modifier || "").toLowerCase()

  if (type === "arrive") return "arrive"
  if (type === "depart") return "depart"
  if (type === "roundabout" || type === "rotary") return "roundabout"
  if (type === "merge") return "merge"
  if (type === "uturn" || modifier === "uturn") return "uturn"
  if (modifier.includes("slight")) return modifier.includes("left") ? "slight-left" : "slight-right"
  if (modifier.includes("left")) return "left"
  if (modifier.includes("right")) return "right"
  return "straight"
}

export type ProductPosition = "at_pickup" | "with_driver" | "delivered" | "unknown"

export function getProductPosition(status: string | null | undefined): ProductPosition {
  if (!status) return "unknown"
  if (status === "delivered" || status === "completed") return "delivered"
  if (status === "picked_up" || status === "in_transit") return "with_driver"
  if (status === "accepted" || status === "assigned" || status === "ready_for_pickup") return "at_pickup"
  return "unknown"
}

export function productPositionLabel(position: ProductPosition): string {
  switch (position) {
    case "at_pickup":
      return "Waiting at pickup"
    case "with_driver":
      return "With you"
    case "delivered":
      return "Delivered"
    default:
      return "Status unavailable"
  }
}

export function productPositionDescription(position: ProductPosition): string {
  switch (position) {
    case "at_pickup":
      return "The package is still at the merchant. Head to the pickup point."
    case "with_driver":
      return "The package is with you. Keep heading to the customer."
    case "delivered":
      return "This delivery is complete."
    default:
      return "Accept the trip to see the package location."
  }
}

export function defaultTargetForStatus(status: string | null | undefined): NavigationTarget {
  return status === "picked_up" || status === "in_transit" || status === "delivered" ? "dropoff" : "pickup"
}

export function formatDistanceText(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return "0 m"
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

export function formatDurationText(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0 min"
  const minutes = Math.round(seconds / 60)
  if (minutes < 1) return "<1 min"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours} hr ${rest} min` : `${hours} hr`
}

function cumulativeDistances(points: NavigationPoint[]): number[] {
  const cumulative: number[] = [0]
  for (let i = 1; i < points.length; i += 1) {
    cumulative.push(cumulative[i - 1] + haversineMeters(points[i - 1], points[i]))
  }
  return cumulative
}

function nearestCoordinateIndex(points: NavigationPoint[], target: NavigationPoint): number {
  return findNearestIndex(points, target)
}

function findNearestIndex(points: NavigationPoint[], target: NavigationPoint): number {
  let index = 0
  let best = Number.POSITIVE_INFINITY
  for (let i = 0; i < points.length; i += 1) {
    const distance = haversineMeters(points[i], target)
    if (distance < best) {
      best = distance
      index = i
    }
  }
  return index
}
