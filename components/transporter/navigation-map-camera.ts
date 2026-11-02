import type { NavigationPoint, NavigationTarget } from "@/lib/maps/navigation"

/* global mapboxgl, L */

declare global {
  interface Window {
    mapboxgl?: any
    L?: any
  }
}

export type NavigationMapMode = "mapbox" | "leaflet"

export function legColour(target: NavigationTarget): string {
  return target === "dropoff" ? "#7c3aed" : "#0284c7"
}

/**
 * Frames the current leg. Padding leaves room for the floating turn card and,
 * on desktop, the left guidance rail instead of hiding the route behind them.
 */
export function fitRoute(
  map: any,
  mode: NavigationMapMode,
  route: NavigationPoint[],
  driver: (NavigationPoint & { heading?: number | null }) | null,
): void {
  if (route.length < 2) {
    if (!driver) return
    if (mode === "mapbox") {
      map.easeTo({ center: [driver.longitude, driver.latitude], zoom: 15.5, duration: 500 })
    } else {
      map.setView([driver.latitude, driver.longitude], 15, { animate: true })
    }
    return
  }

  if (mode === "mapbox") {
    const bounds = new window.mapboxgl.LngLatBounds()
    route.forEach((point) => bounds.extend([point.longitude, point.latitude]))
    if (driver) bounds.extend([driver.longitude, driver.latitude])
    const desktop = typeof window !== "undefined" && window.innerWidth >= 1024
    map.fitBounds(bounds, {
      padding: desktop ? { top: 96, right: 80, bottom: 96, left: 460 } : { top: 170, right: 48, bottom: 330, left: 48 },
      duration: 700,
      maxZoom: 16,
    })
    return
  }

  const latLngs = route.map((point) => [point.latitude, point.longitude])
  if (driver) latLngs.push([driver.latitude, driver.longitude])
  map.fitBounds(window.L.latLngBounds(latLngs), { padding: [48, 48], maxZoom: 16 })
}
