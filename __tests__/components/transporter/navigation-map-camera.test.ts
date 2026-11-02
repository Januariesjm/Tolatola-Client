/** Camera helpers shared by the Mapbox and Leaflet navigator maps. */

import { fitRoute, legColour } from "@/components/transporter/navigation-map-camera"

const route = [
  { latitude: -6.8, longitude: 39.2 },
  { latitude: -6.81, longitude: 39.21 },
]
const driver = { latitude: -6.795, longitude: 39.205, heading: 90 }

class FakeBounds {
  extend = jest.fn()
}

function fakeMap() {
  return {
    easeTo: jest.fn(),
    setView: jest.fn(),
    fitBounds: jest.fn(),
  }
}

beforeEach(() => {
  ;(window as any).mapboxgl = { LngLatBounds: FakeBounds }
  ;(window as any).L = { latLngBounds: jest.fn((points) => points) }
})

afterEach(() => {
  delete (window as any).mapboxgl
  delete (window as any).L
})

describe("legColour", () => {
  it("uses a different colour for each leg", () => {
    expect(legColour("pickup")).toBe("#0284c7")
    expect(legColour("dropoff")).toBe("#7c3aed")
  })
})

describe("fitRoute", () => {
  it("frames a Mapbox route including the driver", () => {
    const map = fakeMap()
    fitRoute(map, "mapbox", route, driver)

    expect(map.fitBounds).toHaveBeenCalledTimes(1)
    const [bounds, options] = map.fitBounds.mock.calls[0]
    expect(bounds).toBeInstanceOf(FakeBounds)
    expect(bounds.extend).toHaveBeenCalledTimes(3)
    expect(options).toMatchObject({ duration: 700, maxZoom: 16 })
    // jsdom reports 1024px, so the desktop rail padding is used.
    expect(options.padding).toMatchObject({ left: 460 })
  })

  it("frames a Leaflet route", () => {
    const map = fakeMap()
    fitRoute(map, "leaflet", route, driver)

    expect((window as any).L.latLngBounds).toHaveBeenCalledWith([
      [-6.8, 39.2],
      [-6.81, 39.21],
      [-6.795, 39.205],
    ])
    expect(map.fitBounds).toHaveBeenCalledWith(expect.anything(), { padding: [48, 48], maxZoom: 16 })
  })

  it("centres on the driver when there is no geometry yet", () => {
    const map = fakeMap()
    fitRoute(map, "mapbox", [], driver)
    expect(map.easeTo).toHaveBeenCalledWith(expect.objectContaining({ center: [39.205, -6.795], zoom: 15.5 }))

    const leaflet = fakeMap()
    fitRoute(leaflet, "leaflet", [], driver)
    expect(leaflet.setView).toHaveBeenCalledWith([-6.795, 39.205], 15, { animate: true })
  })

  it("does nothing without a route or driver", () => {
    const map = fakeMap()
    fitRoute(map, "mapbox", [], null)
    expect(map.easeTo).not.toHaveBeenCalled()
    expect(map.fitBounds).not.toHaveBeenCalled()
  })
})
