/**
 * Tests for WebMapPicker (components/checkout/web-map-picker.tsx).
 *
 * The component drives the real `google.maps.Map`/`google.maps.Marker`
 * classes directly off `window.google` -- there is no wrapper library import
 * to mock (unlike tanzania-address-form's `@react-google-maps`-style usage,
 * this one just polls `window.google.maps.Map` and calls `new` on it). That
 * means the whole Maps SDK surface it touches can be faked with minimal
 * stand-in classes that record what they were constructed/called with, which
 * is what's done below: MockMap and MockMarker capture their constructor
 * options and expose the same `addListener`/`setPosition`/`setMap`/`panTo`/
 * `setZoom` methods the component calls, so the click/dragend wiring and the
 * marker lifecycle can be exercised for real.
 *
 * What's NOT exercised here (documented rather than faked away): the actual
 * behaviour of Google's JS SDK itself (tile rendering, real marker drag
 * physics, real geocoding) -- that only exists in a real browser against
 * Google's servers and is out of reach for any jsdom-based test, mocked or
 * not.
 */

import React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

import { WebMapPicker } from "@/components/checkout/web-map-picker"

/** Minimal stand-in for google.maps.Map. */
class MockMap {
  static instances: MockMap[] = []
  options: any
  listeners: Record<string, (...args: unknown[]) => void> = {}
  lastPanTo: unknown = null
  zoom: unknown

  constructor(_el: HTMLElement, opts: any) {
    this.options = opts
    this.zoom = opts.zoom
    MockMap.instances.push(this)
  }

  addListener(event: string, cb: (...args: unknown[]) => void) {
    this.listeners[event] = cb
  }

  panTo(pos: unknown) {
    this.lastPanTo = pos
  }

  setZoom(z: unknown) {
    this.zoom = z
  }
}

/** Minimal stand-in for google.maps.Marker. */
class MockMarker {
  static instances: MockMarker[] = []
  options: any
  position: any
  map: any
  listeners: Record<string, (...args: unknown[]) => void> = {}

  constructor(opts: any) {
    this.options = opts
    this.position = opts.position
    this.map = opts.map
    MockMarker.instances.push(this)
  }

  addListener(event: string, cb: (...args: unknown[]) => void) {
    this.listeners[event] = cb
  }

  setPosition(pos: unknown) {
    this.position = pos
  }

  setMap(map: unknown) {
    this.map = map
  }

  getPosition() {
    const pos = this.position as { lat: number; lng: number }
    return { lat: () => pos.lat, lng: () => pos.lng }
  }
}

function installMockGoogleMaps() {
  MockMap.instances = []
  MockMarker.instances = []
  ;(window as unknown as { google: unknown }).google = {
    maps: { Map: MockMap, Marker: MockMarker, Animation: { DROP: "DROP" } },
  }
}

function removeMockGoogleMaps() {
  delete (window as unknown as { google?: unknown }).google
}

beforeEach(() => {
  jest.clearAllMocks()
  removeMockGoogleMaps()
})

afterEach(() => {
  jest.useRealTimers()
})

describe("WebMapPicker", () => {
  it("shows the initializing overlay and disables GPS button before google maps has loaded", () => {
    render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} />)

    expect(screen.getByText("Initializing Maps...")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Use Current GPS/i })).toBeDisabled()
  })

  it("renders the given title, defaulting to 'Pin Location on Map'", () => {
    const { rerender } = render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} />)
    expect(screen.getByText("Pin Location on Map")).toBeInTheDocument()

    rerender(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} title="Custom title" />)
    expect(screen.getByText("Custom title")).toBeInTheDocument()
  })

  it("shows 'Not pinned' for latitude/longitude when no coordinates are given", () => {
    render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} />)
    expect(screen.getAllByText("Not pinned")).toHaveLength(2)
  })

  it("formats latitude/longitude to 6 decimal places once pinned", () => {
    render(<WebMapPicker latitude={-6.792412} longitude={39.208345} onLocationSelect={jest.fn()} />)
    expect(screen.getByText("-6.792412")).toBeInTheDocument()
    expect(screen.getByText("39.208345")).toBeInTheDocument()
  })

  describe("once google maps is available", () => {
    beforeEach(() => {
      installMockGoogleMaps()
    })

    it("creates the map centered on Dar es Salaam with a wide zoom when there are no coordinates", async () => {
      render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} />)

      await waitFor(() => expect(MockMap.instances).toHaveLength(1))
      expect(MockMap.instances[0].options.center).toEqual({ lat: -6.7924, lng: 39.2083 })
      expect(MockMap.instances[0].options.zoom).toBe(12)
      expect(MockMarker.instances).toHaveLength(0)
      await waitFor(() => expect(screen.queryByText("Initializing Maps...")).not.toBeInTheDocument())
    })

    it("centers on the given coordinates with a close zoom and drops a draggable marker", async () => {
      render(<WebMapPicker latitude={-6.1731} longitude={35.7419} onLocationSelect={jest.fn()} />)

      await waitFor(() => expect(MockMap.instances).toHaveLength(1))
      expect(MockMap.instances[0].options.center).toEqual({ lat: -6.1731, lng: 35.7419 })
      expect(MockMap.instances[0].options.zoom).toBe(15)

      await waitFor(() => expect(MockMarker.instances).toHaveLength(1))
      expect(MockMarker.instances[0].options.position).toEqual({ lat: -6.1731, lng: 35.7419 })
      expect(MockMarker.instances[0].options.draggable).toBe(true)
      expect(MockMarker.instances[0].options.animation).toBe("DROP")
    })

    it("disables mapTypeControl, fullscreenControl, and streetViewControl", async () => {
      render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} />)
      await waitFor(() => expect(MockMap.instances).toHaveLength(1))

      expect(MockMap.instances[0].options).toMatchObject({
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false,
      })
    })

    it("calls onLocationSelect with the clicked coordinates when the map is clicked", async () => {
      const onLocationSelect = jest.fn()
      render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={onLocationSelect} />)
      await waitFor(() => expect(MockMap.instances).toHaveLength(1))

      act(() => {
        MockMap.instances[0].listeners.click({ latLng: { lat: () => -1.234, lng: () => 2.345 } })
      })

      expect(onLocationSelect).toHaveBeenCalledWith({ lat: -1.234, lng: 2.345 })
    })

    it("calls onLocationSelect with the dropped position when the marker is dragged", async () => {
      const onLocationSelect = jest.fn()
      render(<WebMapPicker latitude={-6.1731} longitude={35.7419} onLocationSelect={onLocationSelect} />)
      await waitFor(() => expect(MockMarker.instances).toHaveLength(1))

      act(() => {
        MockMarker.instances[0].position = { lat: -6.5, lng: 36.1 }
        MockMarker.instances[0].listeners.dragend()
      })

      expect(onLocationSelect).toHaveBeenCalledWith({ lat: -6.5, lng: 36.1 })
    })

    it("pans to new coordinates and repositions the existing marker without creating a new map or marker", async () => {
      const onLocationSelect = jest.fn()
      const { rerender } = render(<WebMapPicker latitude={-6.1731} longitude={35.7419} onLocationSelect={onLocationSelect} />)
      await waitFor(() => expect(MockMarker.instances).toHaveLength(1))

      rerender(<WebMapPicker latitude={-7.0} longitude={36.0} onLocationSelect={onLocationSelect} />)

      expect(MockMap.instances).toHaveLength(1)
      expect(MockMarker.instances).toHaveLength(1)
      expect(MockMarker.instances[0].position).toEqual({ lat: -7.0, lng: 36.0 })
      expect(MockMap.instances[0].lastPanTo).toEqual({ lat: -7.0, lng: 36.0 })
    })

    it("removes the marker from the map when coordinates become null", async () => {
      const onLocationSelect = jest.fn()
      const { rerender } = render(<WebMapPicker latitude={-6.1731} longitude={35.7419} onLocationSelect={onLocationSelect} />)
      await waitFor(() => expect(MockMarker.instances).toHaveLength(1))

      rerender(<WebMapPicker latitude={null} longitude={null} onLocationSelect={onLocationSelect} />)

      expect(MockMarker.instances[0].map).toBeNull()
    })

    it("enables the GPS button once google maps has loaded", async () => {
      render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} />)
      await waitFor(() => expect(screen.getByRole("button", { name: /Use Current GPS/i })).not.toBeDisabled())
    })

    describe("Use Current GPS", () => {
      const originalGeolocation = navigator.geolocation

      afterEach(() => {
        Object.defineProperty(navigator, "geolocation", { value: originalGeolocation, configurable: true })
      })

      it("shows a 'Not Supported' toast when the browser has no geolocation API", async () => {
        Object.defineProperty(navigator, "geolocation", { value: undefined, configurable: true })
        const user = userEvent.setup()
        render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} />)

        const gpsButton = await screen.findByRole("button", { name: /Use Current GPS/i })
        await waitFor(() => expect(gpsButton).not.toBeDisabled())
        await user.click(gpsButton)

        expect(mockToast).toHaveBeenCalledWith({
          title: "Not Supported",
          description: "Geolocation is not supported by your browser.",
          variant: "destructive",
        })
      })

      it("calls onLocationSelect, shows a success toast, and zooms in on a successful GPS fix", async () => {
        const getCurrentPosition = jest.fn((success: (pos: unknown) => void) => {
          success({ coords: { latitude: -6.5, longitude: 36.2 } })
        })
        Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition }, configurable: true })

        const onLocationSelect = jest.fn()
        const user = userEvent.setup()
        render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={onLocationSelect} />)

        const gpsButton = await screen.findByRole("button", { name: /Use Current GPS/i })
        await waitFor(() => expect(gpsButton).not.toBeDisabled())
        await waitFor(() => expect(MockMap.instances).toHaveLength(1))

        await user.click(gpsButton)

        expect(onLocationSelect).toHaveBeenCalledWith({ lat: -6.5, lng: 36.2 })
        expect(mockToast).toHaveBeenCalledWith({
          title: "Location Fetched",
          description: "Acquired coordinates: -6.50000, 36.20000",
        })
        expect(MockMap.instances[0].zoom).toBe(16)
      })

      it("disables the button and shows a spinner while a GPS lookup is in flight", async () => {
        let resolveLookup: (() => void) | undefined
        const getCurrentPosition = jest.fn((success: (pos: unknown) => void) => {
          resolveLookup = () => success({ coords: { latitude: -6.5, longitude: 36.2 } })
        })
        Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition }, configurable: true })

        const user = userEvent.setup()
        render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} />)

        const gpsButton = await screen.findByRole("button", { name: /Use Current GPS/i })
        await waitFor(() => expect(gpsButton).not.toBeDisabled())

        await user.click(gpsButton)
        expect(gpsButton).toBeDisabled()

        act(() => {
          resolveLookup?.()
        })

        await waitFor(() => expect(gpsButton).not.toBeDisabled())
      })

      it("shows a destructive toast and re-enables the button when the GPS lookup fails", async () => {
        const getCurrentPosition = jest.fn((_success: unknown, error: (err: unknown) => void) => {
          error(new Error("PERMISSION_DENIED"))
        })
        Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition }, configurable: true })

        const user = userEvent.setup()
        render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} />)

        const gpsButton = await screen.findByRole("button", { name: /Use Current GPS/i })
        await waitFor(() => expect(gpsButton).not.toBeDisabled())
        await user.click(gpsButton)

        expect(mockToast).toHaveBeenCalledWith({
          title: "Location Error",
          description: "Could not fetch GPS location. Please choose manually.",
          variant: "destructive",
        })
        await waitFor(() => expect(gpsButton).not.toBeDisabled())
      })

      it("requests high accuracy with a 10s timeout", async () => {
        const getCurrentPosition = jest.fn((success: (pos: unknown) => void) => {
          success({ coords: { latitude: -6.5, longitude: 36.2 } })
        })
        Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition }, configurable: true })

        const user = userEvent.setup()
        render(<WebMapPicker latitude={null} longitude={null} onLocationSelect={jest.fn()} />)

        const gpsButton = await screen.findByRole("button", { name: /Use Current GPS/i })
        await waitFor(() => expect(gpsButton).not.toBeDisabled())
        await user.click(gpsButton)

        expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      })
    })
  })
})
