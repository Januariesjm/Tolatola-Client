/**
 * In-app transporter navigator.
 *
 * The map itself is replaced with a stub: what matters here is that the screen
 * keeps the transporter inside TOLA, shows both stops and the package state,
 * and advances the trip without sending them to an external maps app.
 */

import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import type { NavigationRoute } from "@/lib/maps/navigation"
import type { TransporterAssignment } from "@/lib/types/transporter"

const mockPush = jest.fn()
const mockFetchRoute = jest.fn()
const mockClientApiGet = jest.fn()
const mockClientApiPatch = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
}))

jest.mock("@/components/transporter/transporter-navigation-map", () => ({
  TransporterNavigationMap: ({ activeTarget }: { activeTarget: string }) => <div data-testid="navigation-map" data-target={activeTarget} />,
}))

jest.mock("@/lib/maps/navigation-route", () => ({
  fetchNavigationRoute: (...args: unknown[]) => mockFetchRoute(...args),
  MAPBOX_STYLE_URL: "mapbox://styles/mapbox/navigation-day-v1",
}))

jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockClientApiGet(...args),
  clientApiPatch: (...args: unknown[]) => mockClientApiPatch(...args),
}))

import { TransporterNavigationScreen } from "@/components/transporter/transporter-navigation-screen"

const origin = { latitude: -6.8, longitude: 39.2 }
const destination = { latitude: -6.81, longitude: 39.21 }

function assignment(overrides: Partial<TransporterAssignment> = {}): TransporterAssignment {
  return {
    id: "a-1",
    order_id: "o-1",
    status: "accepted",
    shops: {
      name: "Kariakoo Shop",
      address: "Kariakoo",
      latitude: origin.latitude,
      longitude: origin.longitude,
      phone: "+255700000001",
    },
    orders: {
      order_number: "TOLA-1001",
      shipping_address: {
        full_name: "Amina Juma",
        address: "Mikocheni",
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
      users: { full_name: "Amina Juma", phone: "+255700000002" },
    },
    ...overrides,
  }
}

function route(): NavigationRoute {
  const midpoint = { latitude: -6.805, longitude: 39.205 }
  return {
    provider: "mapbox",
    coordinates: [origin, midpoint, destination],
    distanceMeters: 1000,
    durationSeconds: 300,
    distanceText: "1.0 km",
    durationText: "5 min",
    steps: [
      {
        instruction: "Head east",
        maneuver: "depart",
        modifier: null,
        distanceMeters: 200,
        durationSeconds: 40,
        location: origin,
      },
      {
        instruction: "Turn left onto Nyerere Road",
        maneuver: "turn",
        modifier: "left",
        distanceMeters: 300,
        durationSeconds: 60,
        location: midpoint,
      },
      {
        instruction: "You have arrived",
        maneuver: "arrive",
        modifier: null,
        distanceMeters: 0,
        durationSeconds: 0,
        location: destination,
      },
    ],
  }
}

function mockGeolocation(position = origin) {
  const watchPosition = jest.fn((success: PositionCallback) => {
    success({
      coords: {
        latitude: position.latitude,
        longitude: position.longitude,
        heading: 90,
        accuracy: 5,
        altitude: null,
        altitudeAccuracy: null,
        speed: null,
      },
      timestamp: Date.now(),
    } as GeolocationPosition)
    return 7
  })

  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { watchPosition, clearWatch: jest.fn() },
  })

  return watchPosition
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGeolocation()
  mockFetchRoute.mockResolvedValue(route())
  mockClientApiGet.mockResolvedValue({ assignments: [] })
  mockClientApiPatch.mockResolvedValue({})
})

describe("TransporterNavigationScreen", () => {
  it("opens on the pickup leg with the order and both stops available", async () => {
    render(<TransporterNavigationScreen assignment={assignment()} />)

    expect(screen.getByText("Heading to pickup")).toBeInTheDocument()
    expect(screen.getByText(/Order #TOLA-1001/)).toBeInTheDocument()
    expect(screen.getByTestId("navigation-map")).toHaveAttribute("data-target", "pickup")
    expect(screen.getByText("Kariakoo Shop")).toBeInTheDocument()
    expect(await screen.findByText("Turn left onto Nyerere Road")).toBeInTheDocument()
  })

  it("switches to the customer without leaving TOLA", async () => {
    render(<TransporterNavigationScreen assignment={assignment()} />)

    fireEvent.click(await screen.findByRole("button", { name: /^drop-off$/i }))

    expect(await screen.findByText("Amina Juma")).toBeInTheDocument()
    expect(screen.getByText("Mikocheni")).toBeInTheDocument()
    expect(screen.getByTestId("navigation-map")).toHaveAttribute("data-target", "dropoff")
  })

  it("marks the package picked up and moves guidance to the customer", async () => {
    render(<TransporterNavigationScreen assignment={assignment()} />)

    fireEvent.click(await screen.findByRole("button", { name: /mark as picked up/i }))

    await waitFor(() =>
      expect(mockClientApiPatch).toHaveBeenCalledWith(
        "assignments/a-1",
        expect.objectContaining({ status: "picked_up", picked_up_at: expect.any(String) }),
      ),
    )
    expect(await screen.findByText("Package picked up")).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: /start delivery/i })).toBeInTheDocument()
  })

  it("keeps the final PIN step in Trips and links back to it", async () => {
    render(<TransporterNavigationScreen assignment={assignment({ status: "in_transit" })} />)

    expect(screen.getByText("Delivering to customer")).toBeInTheDocument()
    const openTrips = await screen.findByRole("button", { name: /open trips/i })
    fireEvent.click(openTrips)

    expect(mockPush).toHaveBeenCalledWith("/transporter/dashboard?tab=assignments&orderId=o-1")
  })

  it("shows the Mapbox/OSM fallback notice only when the map degrades", async () => {
    render(<TransporterNavigationScreen assignment={assignment()} />)

    // The real map reports its mode; without it the screen stays quiet.
    expect(screen.queryByText(/OpenStreetMap fallback/i)).not.toBeInTheDocument()
  })

  it("returns to Trips and drives the map camera from the controls", async () => {
    render(<TransporterNavigationScreen assignment={assignment()} />)

    fireEvent.click(screen.getByRole("button", { name: /back to trips/i }))
    expect(mockPush).toHaveBeenCalledWith("/transporter/dashboard?tab=assignments")

    fireEvent.click(screen.getByRole("button", { name: /recenter on me/i }))
    fireEvent.click(screen.getByRole("button", { name: /show the whole route/i }))
    fireEvent.click(screen.getByRole("button", { name: /^recenter$/i }))

    // Following starts on; the main action flips to a route overview.
    expect(screen.getByRole("button", { name: /route overview/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /route overview/i }))
    expect(await screen.findByRole("button", { name: /start navigation/i })).toBeInTheDocument()
  })

  it("offers a call action when the stop has a phone number", async () => {
    render(<TransporterNavigationScreen assignment={assignment()} />)

    expect(await screen.findByRole("button", { name: /call kariakoo shop/i })).toBeInTheDocument()
  })

  it("explains a failed route and retries it", async () => {
    mockFetchRoute.mockRejectedValueOnce(new Error("Directions are down"))
    render(<TransporterNavigationScreen assignment={assignment()} />)

    expect(await screen.findByText("Directions are down")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /retry route/i }))

    expect(await screen.findByText("Turn left onto Nyerere Road")).toBeInTheDocument()
    expect(mockFetchRoute).toHaveBeenCalledTimes(2)
  })

  it("keeps routing from the pickup when GPS is blocked", async () => {
    Object.defineProperty(navigator, "geolocation", {
      configurable: true,
      value: {
        watchPosition: jest.fn((_success: PositionCallback, error: PositionErrorCallback) => {
          error({ code: 1, message: "denied" } as GeolocationPositionError)
          return 3
        }),
        clearWatch: jest.fn(),
      },
    })

    render(<TransporterNavigationScreen assignment={assignment()} />)

    expect(await screen.findByText(/Order #TOLA-1001 • GPS off/)).toBeInTheDocument()
    expect(screen.getByText(/Location is off — routing from the pickup point/i)).toBeInTheDocument()
    expect(mockFetchRoute).toHaveBeenCalledWith(expect.objectContaining({ origin: expect.objectContaining({ latitude: origin.latitude }) }))
  })
})
