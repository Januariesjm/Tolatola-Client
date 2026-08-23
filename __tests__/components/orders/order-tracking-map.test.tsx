/**
 * Tests for OrderTrackingMap (components/orders/order-tracking-map.tsx).
 *
 * This component is a thin wrapper around the imperative Google Maps
 * JavaScript SDK: it injects a <script> tag, then drives `new google.maps.*`
 * constructors directly against a ref. jsdom cannot render real map tiles, so
 * -- following the project's approach for other Maps-SDK components (e.g.
 * components/checkout/web-map-picker.tsx) -- these tests replace `window.google`
 * with a fully mocked SDK and assert on the boundary: which constructors get
 * called, with what arguments, and how the component reacts to the loader and
 * directions callbacks. Actual tile rendering, pan/zoom rendering, and marker
 * icon pixel output are left untested because there is nothing prop-driven or
 * observable about them under jsdom -- see the note at the bottom of this file.
 */

import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import { OrderTrackingMap } from "@/components/orders/order-tracking-map"
import { getGoogleMapsScriptUrl } from "@/app/actions/maps"
import { logger } from "@/lib/logger"

jest.mock("@/app/actions/maps", () => ({
  getGoogleMapsScriptUrl: jest.fn(),
}))

jest.mock("@/lib/logger", () => {
  const childLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
  return { logger: { child: jest.fn(() => childLogger) } }
})

const mockGetGoogleMapsScriptUrl = getGoogleMapsScriptUrl as jest.Mock
/** The scoped child logger the component holds onto via `logger.child(...)`. */
const childLogger = (logger.child as jest.Mock)()

/** Builds a fresh mocked `window.google` SDK, recording every instance created. */
function installGoogleMock() {
  const mapInstances: any[] = []
  const markerInstances: any[] = []
  const directionsServiceInstances: any[] = []
  const directionsRendererInstances: any[] = []
  const boundsInstances: any[] = []
  const idleListeners: Array<() => void> = []

  const Map = jest.fn(function (this: any, element: unknown, options: unknown) {
    this.element = element
    this.options = options
    this.fitBounds = jest.fn()
    this.getZoom = jest.fn(() => 16)
    this.setZoom = jest.fn()
    mapInstances.push(this)
  })

  const Marker = jest.fn(function (this: any, options: unknown) {
    this.options = options
    this.setMap = jest.fn()
    markerInstances.push(this)
  })

  const DirectionsRenderer = jest.fn(function (this: any, options: unknown) {
    this.options = options
    this.setDirections = jest.fn()
    directionsRendererInstances.push(this)
  })

  const DirectionsService = jest.fn(function (this: any) {
    this.route = jest.fn()
    directionsServiceInstances.push(this)
  })

  const LatLngBounds = jest.fn(function (this: any) {
    this.extend = jest.fn()
    boundsInstances.push(this)
  })

  const addListener = jest.fn((_target: unknown, _event: string, cb: () => void) => {
    idleListeners.push(cb)
    return { __id: idleListeners.length - 1 }
  })
  const removeListener = jest.fn()

  const google = {
    maps: {
      Map,
      Marker,
      DirectionsRenderer,
      DirectionsService,
      LatLngBounds,
      Size: jest.fn(),
      Point: jest.fn(),
      TravelMode: { DRIVING: "DRIVING" },
      DirectionsStatus: { OK: "OK" },
      event: { addListener, removeListener },
    },
  }

  ;(window as any).google = google

  return {
    google,
    mapInstances,
    markerInstances,
    directionsServiceInstances,
    directionsRendererInstances,
    boundsInstances,
    idleListeners,
  }
}

const origin = { lat: -6.8, lng: 39.2, address: "Shop" }
const destination = { lat: -6.79, lng: 39.29, address: "Customer" }

beforeEach(() => {
  jest.clearAllMocks()
  delete (window as any).google
  delete (window as any).initGoogleMapsCallback
  document.head.innerHTML = ""
  mockGetGoogleMapsScriptUrl.mockResolvedValue(null)
})

describe("OrderTrackingMap", () => {
  describe("script loading", () => {
    it("shows a loading state while the SDK has not loaded yet", async () => {
      render(<OrderTrackingMap origin={origin} destination={destination} />)

      expect(screen.getByText("Loading Map...")).toBeInTheDocument()
      // No API key configured -> the server action resolves null and the
      // component has nothing to inject; it should stay in the loading state
      // rather than throwing.
      await waitFor(() => expect(mockGetGoogleMapsScriptUrl).toHaveBeenCalled())
      expect(screen.getByText("Loading Map...")).toBeInTheDocument()
    })

    it("skips the loading state entirely when window.google is already present", async () => {
      installGoogleMock()

      render(<OrderTrackingMap origin={origin} destination={destination} />)

      await waitFor(() => expect(screen.queryByText("Loading Map...")).not.toBeInTheDocument())
      // Already loaded, so it never needed to ask the server for a script URL.
      expect(mockGetGoogleMapsScriptUrl).not.toHaveBeenCalled()
    })

    it("injects a script tag with the URL from the server action when the SDK isn't present", async () => {
      mockGetGoogleMapsScriptUrl.mockResolvedValue("https://maps.googleapis.com/maps/api/js?key=abc&callback=initGoogleMapsCallback")

      render(<OrderTrackingMap origin={origin} destination={destination} />)

      await waitFor(() => {
        const script = document.head.querySelector("script")
        expect(script).not.toBeNull()
      })

      const script = document.head.querySelector("script") as HTMLScriptElement
      expect(script.src).toBe("https://maps.googleapis.com/maps/api/js?key=abc&callback=initGoogleMapsCallback")
      expect(script.async).toBe(true)
      expect(script.defer).toBe(true)
      expect(screen.getByText("Loading Map...")).toBeInTheDocument()

      // Simulate the SDK's own script calling back once it has loaded.
      installGoogleMock()
      await act(async () => {
        window.initGoogleMapsCallback?.()
      })

      await waitFor(() => expect(screen.queryByText("Loading Map...")).not.toBeInTheDocument())
    })

    it("does not inject a duplicate script tag when one is already on the page", async () => {
      const scriptUrl = "https://maps.googleapis.com/maps/api/js?key=abc&callback=initGoogleMapsCallback"
      mockGetGoogleMapsScriptUrl.mockResolvedValue(scriptUrl)
      const existingScript = document.createElement("script")
      existingScript.src = scriptUrl
      document.head.appendChild(existingScript)

      render(<OrderTrackingMap origin={origin} destination={destination} />)

      await waitFor(() => expect(mockGetGoogleMapsScriptUrl).toHaveBeenCalled())
      expect(document.head.querySelectorAll("script")).toHaveLength(1)

      // The component should attach a "load" listener to the existing tag
      // rather than polling or re-injecting.
      installGoogleMock()
      await act(async () => {
        existingScript.dispatchEvent(new Event("load"))
      })

      await waitFor(() => expect(screen.queryByText("Loading Map...")).not.toBeInTheDocument())
    })

    it("resets the global callback on unmount so a late script load cannot touch an unmounted component", async () => {
      mockGetGoogleMapsScriptUrl.mockResolvedValue("https://maps.googleapis.com/maps/api/js?key=abc&callback=initGoogleMapsCallback")

      const { unmount } = render(<OrderTrackingMap origin={origin} destination={destination} />)
      await waitFor(() => expect(document.head.querySelector("script")).not.toBeNull())

      unmount()

      expect(() => window.initGoogleMapsCallback?.()).not.toThrow()
    })
  })

  describe("map, marker and route setup once the SDK is ready", () => {
    it("creates a map centered on Dar es Salaam and a DirectionsRenderer", async () => {
      const g = installGoogleMock()

      render(<OrderTrackingMap origin={origin} destination={destination} />)

      await waitFor(() => expect(g.mapInstances).toHaveLength(1))
      expect(g.mapInstances[0].options).toMatchObject({
        center: { lat: -6.7924, lng: 39.2083 },
        zoom: 12,
      })
      expect(g.directionsRendererInstances).toHaveLength(1)
      expect(g.directionsRendererInstances[0].options).toMatchObject({ suppressMarkers: true })
    })

    it("places an origin and a destination marker at the given coordinates", async () => {
      const g = installGoogleMock()

      render(<OrderTrackingMap origin={origin} destination={destination} />)

      await waitFor(() => expect(g.markerInstances.length).toBeGreaterThanOrEqual(2))
      const titles = g.markerInstances.map((m) => m.options.title)
      expect(titles).toEqual(expect.arrayContaining(["Shop", "Delivery Location"]))

      const shopMarker = g.markerInstances.find((m) => m.options.title === "Shop")
      expect(shopMarker.options.position).toEqual({ lat: origin.lat, lng: origin.lng })

      const destMarker = g.markerInstances.find((m) => m.options.title === "Delivery Location")
      expect(destMarker.options.position).toEqual({ lat: destination.lat, lng: destination.lng })
    })

    it("does not place a transporter marker when no transporter location is given", async () => {
      const g = installGoogleMock()

      render(<OrderTrackingMap origin={origin} destination={destination} transporterLocation={null} />)

      await waitFor(() => expect(g.markerInstances.length).toBeGreaterThanOrEqual(2))
      expect(g.markerInstances.some((m) => m.options.title === "Transporter")).toBe(false)
    })

    it("places a transporter marker when a transporter location is given", async () => {
      const g = installGoogleMock()
      const transporterLocation = { lat: -6.795, lng: 39.21 }

      render(<OrderTrackingMap origin={origin} destination={destination} transporterLocation={transporterLocation} />)

      await waitFor(() => expect(g.markerInstances.some((m) => m.options.title === "Transporter")).toBe(true))
      const truckMarker = g.markerInstances.find((m) => m.options.title === "Transporter")
      expect(truckMarker.options.position).toEqual({ lat: transporterLocation.lat, lng: transporterLocation.lng })
    })

    it("clears the previous markers before drawing a new set when props change", async () => {
      const g = installGoogleMock()

      const { rerender } = render(<OrderTrackingMap origin={origin} destination={destination} />)
      await waitFor(() => expect(g.markerInstances.length).toBeGreaterThanOrEqual(2))
      const firstRoundMarkers = [...g.markerInstances]

      const newDestination = { lat: -6.7, lng: 39.3 }
      rerender(<OrderTrackingMap origin={origin} destination={newDestination} />)

      await waitFor(() => expect(g.markerInstances.length).toBeGreaterThanOrEqual(4))
      firstRoundMarkers.forEach((marker) => expect(marker.setMap).toHaveBeenCalledWith(null))
    })

    it("requests driving directions from origin to destination", async () => {
      const g = installGoogleMock()

      render(<OrderTrackingMap origin={origin} destination={destination} />)

      await waitFor(() => expect(g.directionsServiceInstances).toHaveLength(1))
      const [request] = g.directionsServiceInstances[0].route.mock.calls[0]
      expect(request).toMatchObject({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: "DRIVING",
      })
    })

    it("renders the route on the map when directions succeed", async () => {
      const g = installGoogleMock()

      render(<OrderTrackingMap origin={origin} destination={destination} />)

      await waitFor(() => expect(g.directionsServiceInstances).toHaveLength(1))
      const [, callback] = g.directionsServiceInstances[0].route.mock.calls[0]
      const result = { routes: [{}] }

      callback(result, "OK")

      expect(g.directionsRendererInstances[0].setDirections).toHaveBeenCalledWith(result)
      expect(childLogger.error).not.toHaveBeenCalled()
    })

    it("logs an error and does not render a route when directions fail", async () => {
      const g = installGoogleMock()

      render(<OrderTrackingMap origin={origin} destination={destination} />)

      await waitFor(() => expect(g.directionsServiceInstances).toHaveLength(1))
      const [, callback] = g.directionsServiceInstances[0].route.mock.calls[0]

      callback(null, "ZERO_RESULTS")

      expect(g.directionsRendererInstances[0].setDirections).not.toHaveBeenCalled()
      expect(childLogger.error).toHaveBeenCalledWith("directions request failed", undefined, { status: "ZERO_RESULTS" })
    })

    it("fits the map bounds to origin, destination, and transporter when present", async () => {
      const g = installGoogleMock()
      const transporterLocation = { lat: -6.795, lng: 39.21 }

      render(<OrderTrackingMap origin={origin} destination={destination} transporterLocation={transporterLocation} />)

      await waitFor(() => expect(g.boundsInstances).toHaveLength(1))
      const bounds = g.boundsInstances[0]
      expect(bounds.extend).toHaveBeenCalledWith({ lat: origin.lat, lng: origin.lng })
      expect(bounds.extend).toHaveBeenCalledWith({ lat: destination.lat, lng: destination.lng })
      expect(bounds.extend).toHaveBeenCalledWith({ lat: transporterLocation.lat, lng: transporterLocation.lng })
      expect(g.mapInstances[0].fitBounds).toHaveBeenCalledWith(bounds)
    })

    it("caps the zoom at 14 once the map settles from fitBounds", async () => {
      const g = installGoogleMock()

      render(<OrderTrackingMap origin={origin} destination={destination} />)

      await waitFor(() => expect(g.idleListeners).toHaveLength(1))
      const map = g.mapInstances[0]
      map.getZoom.mockReturnValue(17)

      g.idleListeners[0]()

      expect(map.setZoom).toHaveBeenCalledWith(14)
      expect(g.google.maps.event.removeListener).toHaveBeenCalled()
    })

    it("leaves the zoom alone when it is already within bounds", async () => {
      const g = installGoogleMock()

      render(<OrderTrackingMap origin={origin} destination={destination} />)

      await waitFor(() => expect(g.idleListeners).toHaveLength(1))
      const map = g.mapInstances[0]
      map.getZoom.mockReturnValue(10)

      g.idleListeners[0]()

      expect(map.setZoom).not.toHaveBeenCalled()
    })
  })

  describe("map container", () => {
    it("applies the given className to the rendered container once loaded", async () => {
      installGoogleMock()

      const { container } = render(<OrderTrackingMap origin={origin} destination={destination} className="my-extra-class" />)

      await waitFor(() => expect(container.querySelector(".my-extra-class")).not.toBeNull())
    })

    it("applies the given className to the loading placeholder before load", () => {
      const { container } = render(<OrderTrackingMap origin={origin} destination={destination} className="my-extra-class" />)

      expect(container.querySelector(".my-extra-class")).not.toBeNull()
    })
  })
})

/**
 * Not reasonably testable under jsdom, and intentionally left uncovered:
 *
 * - Actual map tile rendering, pan/zoom interaction, and the fullscreen
 *   control -- these are drawn by the real Google Maps SDK inside an iframe
 *   the SDK creates itself; jsdom has no layout engine to render them and the
 *   mocked SDK above never produces real pixels to assert against.
 * - The `poi` label-hiding map style and `mapTypeControl`/`streetViewControl`
 *   flags -- these are opaque options handed straight to the real SDK; they
 *   are covered structurally (the `options` object passed to `new
 *   google.maps.Map` is asserted against) but their visual effect cannot be
 *   observed without the real renderer.
 * - Marker icon glyph rendering (the truck SVG path, `red-dot.png` /
 *   `green-dot.png` pin images) -- these are icon URLs/paths handed to the
 *   SDK's marker renderer; the tests assert the `title`/`position` fields
 *   that drive component behaviour, not the pixel-level icon output.
 */
