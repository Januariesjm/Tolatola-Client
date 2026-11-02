/**
 * Route resolution for the website navigator.
 *
 * The navigator prefers the Tola API, can fall back to Mapbox Directions with
 * the public browser token, and must never leave the transporter without a map
 * just because one provider is unavailable.
 */

jest.mock("@/lib/api-client", () => ({ clientApiGet: jest.fn() }))

import { clientApiGet } from "@/lib/api-client"
import type { NavigationRoute } from "@/lib/maps/navigation"
import { fetchMapboxRoute, fetchNavigationRoute, normalizeMapboxRoute } from "@/lib/maps/navigation-route"

const mockGet = clientApiGet as jest.MockedFunction<typeof clientApiGet>

const origin = { latitude: -6.8, longitude: 39.2 }
const destination = { latitude: -6.81, longitude: 39.21 }

function apiRoute(overrides: Partial<NavigationRoute> = {}): NavigationRoute {
  return {
    provider: "mapbox",
    coordinates: [origin, destination],
    distanceMeters: 1200,
    durationSeconds: 300,
    distanceText: "1.2 km",
    durationText: "5 min",
    steps: [],
    ...overrides,
  }
}

function mapboxResponse() {
  return {
    code: "Ok",
    routes: [
      {
        distance: 1500,
        duration: 420,
        geometry: {
          coordinates: [
            [39.2, -6.8],
            [39.205, -6.805],
            [39.21, -6.81],
          ],
        },
        legs: [
          {
            steps: [
              {
                distance: 200,
                duration: 60,
                name: "Nyerere Road",
                maneuver: {
                  type: "turn",
                  modifier: "left",
                  instruction: "Turn left onto Nyerere Road",
                  location: [39.2, -6.8],
                },
              },
              {
                distance: 0,
                duration: 0,
                name: "",
                maneuver: { type: "arrive", modifier: undefined, location: [39.21, -6.81] },
              },
            ],
          },
        ],
      },
    ],
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
})

describe("fetchNavigationRoute", () => {
  it("returns the API route when the backend has routing configured", async () => {
    const expected = apiRoute()
    mockGet.mockResolvedValueOnce(expected)

    const result = await fetchNavigationRoute({ origin, destination })

    expect(result).toBe(expected)
    expect(mockGet).toHaveBeenCalledWith("maps/route?originLat=-6.8&originLng=39.2&destLat=-6.81&destLng=39.21&profile=driving-traffic")
  })

  it("keeps the API straight-line fallback when no Mapbox token exists", async () => {
    const fallback = apiRoute({ provider: "fallback", coordinates: [origin, destination] })
    mockGet.mockResolvedValueOnce(fallback)

    await expect(fetchNavigationRoute({ origin, destination })).resolves.toBe(fallback)
  })

  it("rejects when both the API and Mapbox are unavailable", async () => {
    mockGet.mockRejectedValueOnce(new Error("API down"))

    await expect(fetchNavigationRoute({ origin, destination })).rejects.toThrow("Unable to calculate a route right now.")
  })
})

describe("fetchMapboxRoute", () => {
  it("refuses to call Mapbox without a public token", async () => {
    await expect(fetchMapboxRoute(origin, destination)).rejects.toThrow("Mapbox token is not configured.")
  })
})

describe("Mapbox fallback with a public token", () => {
  const originalToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  const originalFetch = global.fetch

  afterEach(() => {
    if (originalToken === undefined) delete process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    else process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = originalToken
    global.fetch = originalFetch
    jest.resetModules()
  })

  function loadWithToken() {
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN = "pk.test-token"
    jest.resetModules()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const apiClient = require("@/lib/api-client") as { clientApiGet: jest.Mock }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const routeModule = require("@/lib/maps/navigation-route") as typeof import("@/lib/maps/navigation-route")
    return { apiClient, routeModule }
  }

  it("calls Mapbox Directions when the API only produced a straight line", async () => {
    const { apiClient, routeModule } = loadWithToken()
    apiClient.clientApiGet.mockResolvedValueOnce(apiRoute({ provider: "fallback" }))
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mapboxResponse() }) as unknown as typeof fetch

    const result = await routeModule.fetchNavigationRoute({ origin, destination })

    expect(result.provider).toBe("mapbox")
    expect(result.coordinates).toHaveLength(3)
    expect(result.distanceText).toBe("1.5 km")
    expect(result.steps[0].instruction).toBe("Turn left onto Nyerere Road")
    const url = String((global.fetch as jest.Mock).mock.calls[0][0])
    expect(url).toContain("/directions/v5/mapbox/driving-traffic/")
    expect(url).toContain("geometries=geojson")
    expect(url).toContain("access_token=pk.test-token")
  })

  it("falls back to the API route when Mapbox Directions fails", async () => {
    const { apiClient, routeModule } = loadWithToken()
    const fallback = apiRoute({ provider: "fallback" })
    apiClient.clientApiGet.mockResolvedValueOnce(fallback)
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 401 }) as unknown as typeof fetch

    await expect(routeModule.fetchNavigationRoute({ origin, destination })).resolves.toBe(fallback)
  })
})

describe("normalizeMapboxRoute", () => {
  it("converts GeoJSON lon/lat into the app's lat/lng shape", () => {
    const route = normalizeMapboxRoute(mapboxResponse().routes[0])

    expect(route.provider).toBe("mapbox")
    expect(route.coordinates).toEqual([
      { latitude: -6.8, longitude: 39.2 },
      { latitude: -6.805, longitude: 39.205 },
      { latitude: -6.81, longitude: 39.21 },
    ])
    expect(route.distanceText).toBe("1.5 km")
    expect(route.durationText).toBe("7 min")
  })

  it("gives steps without an instruction a readable fallback", () => {
    const route = normalizeMapboxRoute(mapboxResponse().routes[0])

    expect(route.steps[0]).toMatchObject({ maneuver: "turn", modifier: "left" })
    expect(route.steps[1].instruction).toBe("You have arrived")
  })

  it("survives malformed geometry and empty legs", () => {
    const route = normalizeMapboxRoute({
      distance: 0,
      duration: 0,
      geometry: { coordinates: [[1, 2], [3], ["x", "y"]] },
      legs: [],
    })

    expect(route.coordinates).toEqual([{ latitude: 2, longitude: 1 }])
    expect(route.steps).toEqual([])
  })
})
