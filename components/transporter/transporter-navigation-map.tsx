"use client"

import { useEffect, useRef, useState } from "react"
import { MAPBOX_STYLE_URL } from "@/lib/maps/navigation-route"
import type { NavigationPoint, NavigationTarget } from "@/lib/maps/navigation"
import { loadScript, loadStylesheet } from "@/lib/maps/dom-loader"
import { fitRoute, legColour } from "./navigation-map-camera"
import { driverMarkup, pinMarkup } from "./navigation-map-markers"

const MAPBOX_ACCESS_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ""
const MAPBOX_JS = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.js"
const MAPBOX_CSS = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css"
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"

export interface NavigationMapMarker extends NavigationPoint {
  name?: string | null
}

interface TransporterNavigationMapProps {
  route: NavigationPoint[]
  driver: (NavigationPoint & { heading?: number | null }) | null
  pickup: NavigationMapMarker | null
  dropoff: NavigationMapMarker | null
  activeTarget: NavigationTarget
  productWithDriver: boolean
  follow: boolean
  fitSignal: number
  recenterSignal: number
  onModeChange?: (mode: MapMode) => void
  onError?: (message: string) => void
  className?: string
}

export type MapMode = "mapbox" | "leaflet"

/* global mapboxgl, L */

declare global {
  interface Window {
    mapboxgl?: any
    L?: any
  }
}

/**
 * Mapbox GL JS (navigation-day roads, pitched camera, heading-up follow mode)
 * with a Leaflet/OpenStreetMap fallback when no public token is configured or
 * the Mapbox style cannot load, so the transport navigator always has a live
 * map instead of an external hand-off.
 */
export function TransporterNavigationMap({
  route,
  driver,
  pickup,
  dropoff,
  activeTarget,
  productWithDriver,
  follow,
  fitSignal,
  recenterSignal,
  onModeChange,
  onError,
  className,
}: TransporterNavigationMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const modeRef = useRef<MapMode | null>(null)
  const layersReadyRef = useRef(false)
  const pickupMarkerRef = useRef<any>(null)
  const dropoffMarkerRef = useRef<any>(null)
  const driverMarkerRef = useRef<any>(null)
  const pickupPointRef = useRef<NavigationMapMarker | null>(pickup)
  const dropoffPointRef = useRef<NavigationMapMarker | null>(dropoff)
  const driverPointRef = useRef<TransporterNavigationMapProps["driver"]>(driver)
  const initializedRef = useRef(false)
  const autoFittedRef = useRef(false)

  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<MapMode | null>(null)

  pickupPointRef.current = pickup
  dropoffPointRef.current = dropoff
  driverPointRef.current = driver

  const callbacksRef = useRef({ onModeChange, onError })
  callbacksRef.current = { onModeChange, onError }

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      let mapboxFailure: any = null

      if (MAPBOX_ACCESS_TOKEN) {
        try {
          await createMapboxMap({
            container: containerRef.current,
            driver: driverPointRef.current,
            pickup: pickupPointRef.current,
            onMap: (map) => {
              mapRef.current = map
              modeRef.current = "mapbox"
            },
            onLayersReady: () => {
              layersReadyRef.current = true
            },
            isCancelled: () => cancelled,
          })
        } catch (error: any) {
          mapboxFailure = error
          if (mapRef.current && modeRef.current === "mapbox") {
            try {
              mapRef.current.remove()
            } catch {
              /* already gone */
            }
          }
          mapRef.current = null
          modeRef.current = null
          layersReadyRef.current = false
        }
      }

      if (!mapRef.current) {
        try {
          await createLeafletMap({
            container: containerRef.current,
            driver: driverPointRef.current,
            pickup: pickupPointRef.current,
            onMap: (map) => {
              mapRef.current = map
              modeRef.current = "leaflet"
            },
            isCancelled: () => cancelled,
          })
        } catch (error: any) {
          if (!cancelled) {
            callbacksRef.current.onError?.(
              mapboxFailure
                ? `Map unavailable: ${mapboxFailure?.message || "Mapbox failed"}`
                : `Map unavailable: ${error?.message || "map libraries failed to load"}`,
            )
          }
          return
        }
      }

      if (cancelled) {
        mapRef.current?.remove?.()
        return
      }

      const activeMode = modeRef.current
      if (!activeMode) return
      setMode(activeMode)
      callbacksRef.current.onModeChange?.(activeMode)
      if (mapboxFailure) {
        callbacksRef.current.onError?.(`Mapbox could not start (${mapboxFailure?.message || "unknown error"}); showing OpenStreetMap.`)
      }
      initializedRef.current = true
      setReady(true)
    }

    init()

    return () => {
      cancelled = true
      initializedRef.current = false
      layersReadyRef.current = false
      pickupMarkerRef.current = null
      dropoffMarkerRef.current = null
      driverMarkerRef.current = null
      const map = mapRef.current
      mapRef.current = null
      modeRef.current = null
      if (map?.remove) {
        try {
          map.remove()
        } catch {
          /* already removed */
        }
      }
    }
  }, [])

  // Route geometry + active-leg colour.
  useEffect(() => {
    if (!ready) return
    const map = mapRef.current
    const currentMode = modeRef.current
    if (!map || !currentMode) return

    if (currentMode === "mapbox") {
      map.getSource?.("tola-route")?.setData({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: route.map((point) => [point.longitude, point.latitude]),
        },
      })
      if (layersReadyRef.current) {
        const color = legColour(activeTarget)
        map.setPaintProperty("tola-route-casing", "line-color", color)
        map.setPaintProperty("tola-route-line", "line-color", color)
      }
      return
    }

    if (map.__tolaRoute) map.removeLayer(map.__tolaRoute)
    if (map.__tolaCasing) map.removeLayer(map.__tolaCasing)
    if (route.length > 1) {
      const latLngs = route.map((point) => [point.latitude, point.longitude])
      map.__tolaCasing = window.L.polyline(latLngs, {
        color: "#0f172a",
        weight: 10,
        opacity: 0.28,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map)
      map.__tolaRoute = window.L.polyline(latLngs, {
        color: legColour(activeTarget),
        weight: 6,
        opacity: 0.95,
        lineJoin: "round",
        lineCap: "round",
      }).addTo(map)
    }
  }, [ready, route, activeTarget])

  // Frame the first route automatically so the transporter sees both stops
  // as soon as the directions resolve (later legs are framed by fitSignal).
  useEffect(() => {
    if (!ready || autoFittedRef.current) return
    const map = mapRef.current
    const currentMode = modeRef.current
    if (!map || !currentMode || route.length < 2) return
    autoFittedRef.current = true
    fitRoute(map, currentMode, route, driverPointRef.current)
  }, [ready, route])

  // Pickup / drop-off pins.
  useEffect(() => {
    if (!ready) return
    const map = mapRef.current
    const currentMode = modeRef.current
    if (!map || !currentMode) return

    const syncMarker = (kind: "pickup" | "dropoff", marker: NavigationMapMarker | null) => {
      const ref = kind === "pickup" ? pickupMarkerRef : dropoffMarkerRef
      const hasPoint = marker && Number.isFinite(Number(marker.latitude)) && Number.isFinite(Number(marker.longitude))

      if (!hasPoint) {
        if (ref.current) {
          if (currentMode === "mapbox") ref.current.remove()
          else map.removeLayer(ref.current)
          ref.current = null
        }
        return
      }

      const latitude = Number(marker!.latitude)
      const longitude = Number(marker!.longitude)
      const label = marker!.name || (kind === "pickup" ? "Pickup" : "Drop-off")

      if (currentMode === "mapbox") {
        if (!ref.current) {
          const element = document.createElement("div")
          element.innerHTML = pinMarkup(kind, label)
          ref.current = new window.mapboxgl.Marker({
            element: element.firstElementChild as HTMLElement,
            anchor: "bottom",
          })
            .setLngLat([longitude, latitude])
            .addTo(map)
        } else {
          ref.current.setLngLat([longitude, latitude])
          const element = ref.current.getElement?.()
          if (element) element.innerHTML = pinMarkup(kind, label)
        }
      } else {
        const icon = window.L.divIcon({
          className: "",
          html: pinMarkup(kind, label),
          iconSize: [130, 60],
          iconAnchor: [65, 56],
        })
        if (!ref.current) {
          ref.current = window.L.marker([latitude, longitude], {
            icon,
            keyboard: false,
            zIndexOffset: 500,
          }).addTo(map)
        } else {
          ref.current.setLatLng([latitude, longitude])
          ref.current.setIcon(icon)
        }
      }
    }

    syncMarker("pickup", pickup)
    syncMarker("dropoff", dropoff)
  }, [ready, pickup, dropoff])

  // Driver puck: position, heading and the "package on board" badge.
  useEffect(() => {
    if (!ready) return
    const map = mapRef.current
    const currentMode = modeRef.current
    if (!map || !currentMode) return

    if (!driver || !Number.isFinite(Number(driver.latitude))) {
      if (driverMarkerRef.current) {
        if (currentMode === "mapbox") driverMarkerRef.current.remove()
        else map.removeLayer(driverMarkerRef.current)
        driverMarkerRef.current = null
      }
      return
    }

    const latitude = Number(driver.latitude)
    const longitude = Number(driver.longitude)
    const heading = Number(driver.heading || 0)

    if (currentMode === "mapbox") {
      if (!driverMarkerRef.current) {
        const element = document.createElement("div")
        element.innerHTML = driverMarkup(productWithDriver)
        driverMarkerRef.current = new window.mapboxgl.Marker({
          element: element.firstElementChild as HTMLElement,
          anchor: "center",
          rotationAlignment: "viewport",
        })
          .setLngLat([longitude, latitude])
          .addTo(map)
      } else {
        driverMarkerRef.current.setLngLat([longitude, latitude])
      }

      const element = driverMarkerRef.current.getElement?.()
      const arrow = element?.querySelector("[data-driver-arrow]") as HTMLElement | null
      if (arrow) {
        const bearing = typeof map.getBearing === "function" ? map.getBearing() : 0
        arrow.style.transform = `rotate(${follow ? heading - bearing : heading}deg)`
      }
      if (element) {
        const disc = element.querySelector("[data-driver-disc]") as HTMLElement | null
        const hasBadge = Boolean(disc?.querySelector("[data-package-badge]"))
        if (productWithDriver && !hasBadge && disc) {
          const badge = document.createElement("div")
          badge.setAttribute("data-package-badge", "true")
          badge.style.cssText =
            "position:absolute;right:-4px;top:-4px;width:16px;height:16px;border-radius:8px;background:#16a34a;border:2px solid #fff;"
          disc.appendChild(badge)
        }
      }
    } else {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = window.L.marker([latitude, longitude], {
          icon: window.L.divIcon({
            className: "",
            html: driverMarkup(productWithDriver),
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
          zIndexOffset: 1000,
          keyboard: false,
        }).addTo(map)
      } else {
        driverMarkerRef.current.setLatLng([latitude, longitude])
      }
      const arrow = driverMarkerRef.current.getElement?.()?.querySelector("[data-driver-arrow]") as HTMLElement | null
      if (arrow) arrow.style.transform = `rotate(${heading}deg)`
    }

    if (follow) {
      if (currentMode === "mapbox") {
        map.easeTo({ center: [longitude, latitude], bearing: heading, pitch: 50, zoom: 16.5, duration: 900 })
      } else {
        map.panTo([latitude, longitude], { animate: true, duration: 0.9 })
      }
    }
  }, [ready, driver, follow, productWithDriver])

  // Explicit "recenter on me" requests from the UI.
  useEffect(() => {
    if (!ready || recenterSignal === 0) return
    const map = mapRef.current
    const currentMode = modeRef.current
    const point = driverPointRef.current
    if (!map || !currentMode) return

    if (!point) return

    if (currentMode === "mapbox") {
      map.easeTo({
        center: [point.longitude, point.latitude],
        bearing: Number(point.heading || 0),
        pitch: 50,
        zoom: 16.5,
        duration: 800,
      })
    } else {
      map.setView([point.latitude, point.longitude], 16, { animate: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recenterSignal, ready])

  // Explicit "show whole route" requests from the UI.
  useEffect(() => {
    if (!ready || fitSignal === 0) return
    const map = mapRef.current
    const currentMode = modeRef.current
    if (!map || !currentMode) return
    fitRoute(map, currentMode, route, driverPointRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal, ready])

  return (
    <div className={className}>
      <div ref={containerRef} className="h-full w-full" data-testid="navigation-map-canvas" />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-xs font-semibold text-muted-foreground">Starting navigation map…</p>
          </div>
        </div>
      )}
    </div>
  )
}

async function createMapboxMap({
  container,
  driver,
  pickup,
  onMap,
  onLayersReady,
  isCancelled,
}: {
  container: HTMLDivElement | null
  driver: TransporterNavigationMapProps["driver"]
  pickup: NavigationMapMarker | null
  onMap: (map: any) => void
  onLayersReady: () => void
  isCancelled: () => boolean
}): Promise<void> {
  await loadStylesheet(MAPBOX_CSS, "tola-mapbox-css")
  await loadScript(MAPBOX_JS, "tola-mapbox-js")
  if (isCancelled()) return
  if (!window.mapboxgl) throw new Error("Mapbox GL JS did not load")

  window.mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN
  const center: [number, number] = driver
    ? [driver.longitude, driver.latitude]
    : pickup
      ? [pickup.longitude, pickup.latitude]
      : [39.2083, -6.7924]

  const map = new window.mapboxgl.Map({
    container,
    style: MAPBOX_STYLE_URL,
    center,
    zoom: 15,
    pitch: 0,
    attributionControl: true,
    logoPosition: "bottom-left",
  })
  onMap(map)

  await new Promise<void>((resolve, reject) => {
    let loaded = false
    const timer = window.setTimeout(() => {
      reject(new Error("style did not load — check the Mapbox token"))
    }, 12_000)

    map.on("style.load", () => {
      window.clearTimeout(timer)
      loaded = true
      if (isCancelled()) return resolve()
      map.addSource("tola-route", {
        type: "geojson",
        data: { type: "Feature", geometry: { type: "LineString", coordinates: [] } },
      })
      map.addLayer({
        id: "tola-route-casing",
        type: "line",
        source: "tola-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#0284c7", "line-width": 11, "line-opacity": 0.32 },
      })
      map.addLayer({
        id: "tola-route-line",
        type: "line",
        source: "tola-route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#0284c7", "line-width": 6, "line-opacity": 0.96 },
      })
      onLayersReady()
      resolve()
    })

    map.on("error", (event: any) => {
      // Tile/font errors after the style loads are not fatal: the map is
      // already usable, so don't tear it down for a missing sprite.
      if (isCancelled() || loaded) return
      reject(event?.error || new Error("Mapbox failed to start"))
    })
  })
}

async function createLeafletMap({
  container,
  driver,
  pickup,
  onMap,
  isCancelled,
}: {
  container: HTMLDivElement | null
  driver: TransporterNavigationMapProps["driver"]
  pickup: NavigationMapMarker | null
  onMap: (map: any) => void
  isCancelled: () => boolean
}): Promise<void> {
  await loadStylesheet(LEAFLET_CSS, "tola-leaflet-css")
  await loadScript(LEAFLET_JS, "tola-leaflet-js")
  if (isCancelled()) return
  if (!window.L) throw new Error("Leaflet did not load")

  const center: [number, number] = driver
    ? [driver.latitude, driver.longitude]
    : pickup
      ? [pickup.latitude, pickup.longitude]
      : [-6.7924, 39.2083]

  const map = window.L.map(container, { zoomControl: false }).setView(center, 15)
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map)
  onMap(map)
}
