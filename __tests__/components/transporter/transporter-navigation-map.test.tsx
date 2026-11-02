/**
 * Map adapter for the transporter navigator.
 *
 * Both providers are stubbed: Mapbox GL JS and Leaflet are third-party browser
 * libraries with no npm dependency in this repo, so the component's contract is
 * what matters -- start the right map, fall back when it fails, and keep route,
 * pins and driver puck in sync with props.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"

jest.mock("@/lib/maps/dom-loader", () => ({
  loadScript: jest.fn().mockResolvedValue(undefined),
  loadStylesheet: jest.fn().mockResolvedValue(undefined),
}))

// The component reads the token once at module scope. Set it before requiring
// the component so this suite exercises the Mapbox branch; the Leaflet branch
// is covered via the failure fallback below. (Resetting modules instead would
// load a second copy of React and break hooks.)
process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = "pk.test-token"
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TransporterNavigationMap } =
  require("@/components/transporter/transporter-navigation-map") as typeof import("@/components/transporter/transporter-navigation-map")

interface FakeMapOptions {
  mode?: "ok" | "error"
}

function createFakeMapbox({ mode = "ok" }: FakeMapOptions = {}) {
  const source = { setData: jest.fn() }
  const map: any = {
    addSource: jest.fn(),
    addLayer: jest.fn(),
    getSource: jest.fn(() => source),
    setPaintProperty: jest.fn(),
    remove: jest.fn(),
    easeTo: jest.fn(),
    fitBounds: jest.fn(),
    getBearing: jest.fn(() => 0),
    on: jest.fn((event: string, callback: () => void) => {
      if (event === "style.load" && mode === "ok") callback()
      if (event === "error" && mode === "error") callback()
    }),
  }

  class FakeBounds {
    extend = jest.fn()
  }

  const markers: any[] = []
  class FakeMarker {
    element: HTMLElement
    constructor(options: any) {
      this.element = options.element
      markers.push(this)
    }
    setLngLat = jest.fn(() => this)
    addTo = jest.fn(() => this)
    getElement = () => this.element
    remove = jest.fn()
  }

  ;(window as any).mapboxgl = {
    accessToken: "",
    Map: jest.fn(() => map),
    Marker: jest.fn((options: any) => new FakeMarker(options)),
    LngLatBounds: FakeBounds,
  }

  return { map, source, markers }
}

function createFakeLeaflet() {
  const routeLayer: any = { addTo: jest.fn(() => routeLayer) }
  const tileLayer: any = { addTo: jest.fn(() => tileLayer) }
  const markerInstance: any = {
    setLatLng: jest.fn(() => markerInstance),
    setIcon: jest.fn(() => markerInstance),
    getElement: jest.fn(() => document.createElement("div")),
    addTo: jest.fn(() => markerInstance),
  }
  const map: any = {
    setView: jest.fn(() => map),
    fitBounds: jest.fn(),
    panTo: jest.fn(),
    removeLayer: jest.fn(),
    remove: jest.fn(),
  }

  ;(window as any).L = {
    map: jest.fn(() => map),
    tileLayer: jest.fn(() => tileLayer),
    polyline: jest.fn(() => routeLayer),
    marker: jest.fn(() => markerInstance),
    divIcon: jest.fn(() => ({ html: "" })),
    latLngBounds: jest.fn((points) => points),
  }

  return { map, markerInstance, routeLayer }
}

const pickup = { latitude: -6.8, longitude: 39.2, name: "Kariakoo Shop" }
const dropoff = { latitude: -6.81, longitude: 39.21, name: "Amina" }
const driver = { latitude: -6.805, longitude: 39.205, heading: 90 }
const route = [
  { latitude: -6.8, longitude: 39.2 },
  { latitude: -6.805, longitude: 39.205 },
  { latitude: -6.81, longitude: 39.21 },
]

function props(overrides: Record<string, unknown> = {}) {
  return {
    route,
    driver,
    pickup,
    dropoff,
    activeTarget: "pickup" as const,
    productWithDriver: false,
    follow: false,
    fitSignal: 1,
    recenterSignal: 1,
    onModeChange: jest.fn(),
    onError: jest.fn(),
    className: "h-full",
    ...overrides,
  }
}

afterEach(() => {
  delete (window as any).mapboxgl
  delete (window as any).L
})

describe("TransporterNavigationMap", () => {
  it("starts Mapbox and tracks the route, pins and driver", async () => {
    const { map, source, markers } = createFakeMapbox()
    const onModeChange = jest.fn()

    render(<TransporterNavigationMap {...props({ onModeChange })} />)

    await waitFor(() => expect(onModeChange).toHaveBeenCalledWith("mapbox"))
    expect(screen.queryByText(/Starting navigation map/)).not.toBeInTheDocument()
    expect((window as any).mapboxgl.accessToken).toBe("pk.test-token")
    expect((window as any).mapboxgl.Map).toHaveBeenCalledWith(
      expect.objectContaining({ style: "mapbox://styles/mapbox/navigation-day-v1" }),
    )
    expect(map.addSource).toHaveBeenCalledWith("tola-route", expect.anything())
    expect(map.addLayer).toHaveBeenCalledTimes(2)
    expect(source.setData).toHaveBeenCalledWith(
      expect.objectContaining({
        geometry: { type: "LineString", coordinates: route.map((p) => [p.longitude, p.latitude]) },
      }),
    )
    // pickup + drop-off + driver
    expect(markers).toHaveLength(3)
    expect(map.fitBounds).toHaveBeenCalled()
    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ pitch: 50, zoom: 16.5 }))
  })

  it("recolours the active leg and badges the driver once loaded", async () => {
    const { map, markers } = createFakeMapbox()

    render(<TransporterNavigationMap {...props({ activeTarget: "dropoff", productWithDriver: true })} />)

    await waitFor(() => expect(map.setPaintProperty).toHaveBeenCalledWith("tola-route-line", "line-color", "#7c3aed"))
    expect(markers.some((marker) => marker.element.querySelector("[data-package-badge]"))).toBe(true)
  })

  it("falls back to Leaflet when the Mapbox style cannot load", async () => {
    createFakeMapbox({ mode: "error" })
    const leaflet = createFakeLeaflet()
    const onModeChange = jest.fn()
    const onError = jest.fn()

    render(<TransporterNavigationMap {...props({ onModeChange, onError, follow: true })} />)

    await waitFor(() => expect(onModeChange).toHaveBeenCalledWith("leaflet"))
    expect(onError).toHaveBeenCalledWith(expect.stringContaining("Mapbox could not start"))
    expect(leaflet.map.setView).toHaveBeenCalled()
    expect((window as any).L.tileLayer).toHaveBeenCalledWith("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", expect.anything())
    expect((window as any).L.polyline).toHaveBeenCalled()
    expect(leaflet.map.fitBounds).toHaveBeenCalled()
    expect(leaflet.map.panTo).toHaveBeenCalledWith([driver.latitude, driver.longitude], {
      animate: true,
      duration: 0.9,
    })
    expect(screen.queryByText(/Starting navigation map/)).not.toBeInTheDocument()
  })

  it("reports an error when every map provider fails", async () => {
    createFakeMapbox({ mode: "error" })
    ;(window as any).L = {
      map: jest.fn(() => {
        throw new Error("leaflet unavailable")
      }),
    }
    const onError = jest.fn()

    render(<TransporterNavigationMap {...props({ onError })} />)

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringContaining("Map unavailable")))
  })
})
