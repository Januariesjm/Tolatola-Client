"use client"

import { clientApiGet } from "@/lib/api-client"
import { logger } from "@/lib/logger"
import { formatDistanceText, formatDurationText } from "./navigation"
import type { NavigationPoint, NavigationRoute, NavigationStep } from "./navigation"

const log = logger.child("lib.maps.navigation-route")

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
export const MAPBOX_STYLE_URL = process.env.NEXT_PUBLIC_MAPBOX_STYLE_URL || "mapbox://styles/mapbox/navigation-day-v1"

export type RouteProfile = "driving" | "driving-traffic"

interface FetchRouteArgs {
  origin: NavigationPoint
  destination: NavigationPoint
  profile?: RouteProfile
}

/**
 * Resolves one normalized route for the navigator.
 *
 * 1. The Tola API (`GET /maps/route`) when the backend has a routing key.
 * 2. Direct Mapbox Directions with the public NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN.
 * 3. Whatever the API returned (its straight-line fallback) rather than
 *    breaking the map when there is no GPS or network.
 */
export async function fetchNavigationRoute({ origin, destination, profile = "driving-traffic" }: FetchRouteArgs): Promise<NavigationRoute> {
  const path =
    `maps/route?originLat=${origin.latitude}&originLng=${origin.longitude}` +
    `&destLat=${destination.latitude}&destLng=${destination.longitude}` +
    `&profile=${profile}`

  let apiRoute: NavigationRoute | null = null
  try {
    apiRoute = await clientApiGet<NavigationRoute>(path)
    if (apiRoute.provider !== "fallback" || !MAPBOX_TOKEN) return apiRoute
  } catch (error) {
    log.warn("route API failed, trying Mapbox directly", error)
  }

  if (!MAPBOX_TOKEN) {
    if (apiRoute) return apiRoute
    throw new Error("Unable to calculate a route right now.")
  }

  try {
    return await fetchMapboxRoute(origin, destination, profile)
  } catch (error) {
    log.error("direct Mapbox directions failed", error)
    if (apiRoute) return apiRoute
    throw new Error("Unable to calculate a route right now.")
  }
}

export async function fetchMapboxRoute(
  origin: NavigationPoint,
  destination: NavigationPoint,
  profile: RouteProfile = "driving-traffic",
): Promise<NavigationRoute> {
  if (!MAPBOX_TOKEN) throw new Error("Mapbox token is not configured.")

  const coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`
  const url = new URL(`https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinates}`)
  url.searchParams.set("alternatives", "false")
  url.searchParams.set("geometries", "geojson")
  url.searchParams.set("overview", "full")
  url.searchParams.set("steps", "true")
  url.searchParams.set("language", "en")
  url.searchParams.set("access_token", MAPBOX_TOKEN)

  const response = await fetch(url.toString())
  if (!response.ok) throw new Error(`Mapbox directions returned ${response.status}.`)

  const data = await response.json()
  if (data?.code !== "Ok" || !data.routes?.[0]) {
    throw new Error(`Mapbox directions failed: ${data?.message || data?.code || "unknown"}`)
  }

  return normalizeMapboxRoute(data.routes[0])
}

/**
 * Converts a Mapbox Directions route into the app's normalized shape.
 * Exported so it can be unit-tested without a network call.
 */
export function normalizeMapboxRoute(route: any): NavigationRoute {
  const coordinates: NavigationPoint[] = Array.isArray(route?.geometry?.coordinates)
    ? route.geometry.coordinates
        .filter((point: unknown) => Array.isArray(point) && point.length >= 2)
        .map((point: [number, number]) => ({
          latitude: Number(point[1]),
          longitude: Number(point[0]),
        }))
        .filter((point: NavigationPoint) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude))
    : []

  const steps: NavigationStep[] = (route?.legs ?? []).flatMap((leg: any) =>
    (leg?.steps ?? []).map((step: any) => {
      const location = step?.maneuver?.location
      return {
        instruction: step?.maneuver?.instruction || fallbackInstruction(step?.maneuver?.type, step?.maneuver?.modifier, step?.name),
        maneuver: step?.maneuver?.type ?? null,
        modifier: step?.maneuver?.modifier ?? null,
        distanceMeters: Number(step?.distance ?? 0),
        durationSeconds: Number(step?.duration ?? 0),
        location:
          Array.isArray(location) && location.length >= 2 ? { latitude: Number(location[1]), longitude: Number(location[0]) } : null,
      }
    }),
  )

  const distanceMeters = Number(route?.distance ?? 0)
  const durationSeconds = Number(route?.duration ?? 0)

  return {
    provider: "mapbox",
    coordinates,
    distanceMeters,
    durationSeconds,
    distanceText: formatDistanceText(distanceMeters),
    durationText: formatDurationText(durationSeconds),
    steps,
  }
}

function fallbackInstruction(type?: string, modifier?: string, roadName?: string): string {
  const road = roadName ? ` on ${roadName}` : ""
  if (type === "arrive") return "You have arrived"
  if (type === "depart") return `Head out${road}`
  if (type === "turn") return `Turn ${modifier || "ahead"}${road}`
  if (type === "roundabout" || type === "rotary") return `Take the roundabout${road}`
  return `Continue${road}`
}
