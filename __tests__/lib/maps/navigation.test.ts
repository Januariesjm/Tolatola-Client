/**
 * Pure maths/formatting behind the transporter navigator.
 *
 * These are the pieces that decide the ETA, the remaining distance, the next
 * manoeuvre and whether the package is with the driver -- worth pinning
 * because they are hard to eyeball on a live map.
 */

import {
  bearingDegrees,
  defaultTargetForStatus,
  formatDistanceText,
  formatDurationText,
  getNextNavigationStep,
  getProductPosition,
  getRouteProgress,
  haversineMeters,
  maneuverKind,
  productPositionDescription,
  productPositionLabel,
  type NavigationRoute,
} from "@/lib/maps/navigation"

function route(overrides: Partial<NavigationRoute> = {}): NavigationRoute {
  return {
    provider: "mapbox",
    coordinates: [
      { latitude: 0, longitude: 0 },
      { latitude: 0, longitude: 0.01 },
      { latitude: 0, longitude: 0.02 },
    ],
    distanceMeters: 2224,
    durationSeconds: 240,
    distanceText: "2.2 km",
    durationText: "4 min",
    steps: [
      {
        instruction: "Head east",
        maneuver: "depart",
        modifier: null,
        distanceMeters: 1112,
        durationSeconds: 120,
        location: { latitude: 0, longitude: 0 },
      },
      {
        instruction: "Turn right",
        maneuver: "turn",
        modifier: "right",
        distanceMeters: 1112,
        durationSeconds: 120,
        location: { latitude: 0, longitude: 0.01 },
      },
      {
        instruction: "You have arrived",
        maneuver: "arrive",
        modifier: null,
        distanceMeters: 0,
        durationSeconds: 0,
        location: { latitude: 0, longitude: 0.02 },
      },
    ],
    ...overrides,
  }
}

describe("haversineMeters", () => {
  it("measures a degree of longitude at the equator", () => {
    const metres = haversineMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })
    expect(metres).toBeGreaterThan(111_000)
    expect(metres).toBeLessThan(111_300)
  })

  it("returns 0 for the same point", () => {
    expect(haversineMeters({ latitude: -6.8, longitude: 39.2 }, { latitude: -6.8, longitude: 39.2 })).toBe(0)
  })
})

describe("bearingDegrees", () => {
  it("points north/south/east/west", () => {
    expect(bearingDegrees({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 0 })).toBeCloseTo(0)
    expect(bearingDegrees({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 1 })).toBeCloseTo(90)
    expect(bearingDegrees({ latitude: 0, longitude: 0 }, { latitude: -1, longitude: 0 })).toBeCloseTo(180)
    expect(bearingDegrees({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: -1 })).toBeCloseTo(270)
  })

  it("always returns a value in [0, 360)", () => {
    const value = bearingDegrees({ latitude: -6.8, longitude: 39.2 }, { latitude: -6.7, longitude: 39.1 })
    expect(value).toBeGreaterThanOrEqual(0)
    expect(value).toBeLessThan(360)
  })
})

describe("getRouteProgress", () => {
  it("has no progress without a driver or route", () => {
    const empty = getRouteProgress(null, null)
    expect(empty).toMatchObject({ nearestIndex: 0, remainingMeters: 0, fractionComplete: 0 })
  })

  it("is at the start when the driver is at the first coordinate", () => {
    const progress = getRouteProgress(route(), { latitude: 0, longitude: 0 })
    expect(progress.nearestIndex).toBe(0)
    expect(progress.distanceFromRouteMeters).toBeCloseTo(0, 0)
    expect(progress.fractionComplete).toBeCloseTo(0, 3)
    expect(progress.remainingMeters).toBeCloseTo(2224, -1)
  })

  it("is roughly half way at the middle coordinate", () => {
    const progress = getRouteProgress(route(), { latitude: 0, longitude: 0.01 })
    expect(progress.nearestIndex).toBe(1)
    expect(progress.fractionComplete).toBeGreaterThan(0.49)
    expect(progress.fractionComplete).toBeLessThan(0.51)
    expect(progress.remainingMeters).toBeGreaterThan(1000)
    expect(progress.remainingMeters).toBeLessThan(1200)
  })
})

describe("getNextNavigationStep", () => {
  it("skips the depart step and returns the next real manoeuvre", () => {
    const next = getNextNavigationStep(route(), { latitude: 0, longitude: 0 })
    expect(next?.step.instruction).toBe("Turn right")
    expect(next?.distanceToStepMeters).toBeGreaterThan(1000)
  })

  it("moves on to the arrive step after the turn", () => {
    const next = getNextNavigationStep(route(), { latitude: 0, longitude: 0.015 })
    expect(next?.step.instruction).toBe("You have arrived")
    expect(next?.distanceToStepMeters).toBeGreaterThan(400)
    expect(next?.distanceToStepMeters).toBeLessThan(800)
  })

  it("returns null when there is nothing to navigate", () => {
    expect(getNextNavigationStep(null, null)).toBeNull()
    expect(getNextNavigationStep(route({ steps: [] }), { latitude: 0, longitude: 0 })).toBeNull()
  })
})

describe("maneuverKind", () => {
  it.each([
    ["turn", "left", "left"],
    ["turn", "right", "right"],
    ["turn", "slight left", "slight-left"],
    ["turn", "slight right", "slight-right"],
    ["merge", "straight", "merge"],
    ["roundabout", null, "roundabout"],
    ["rotary", null, "roundabout"],
    ["uturn", null, "uturn"],
    ["arrive", null, "arrive"],
    ["depart", null, "depart"],
  ])("maps %s/%s to %s", (type, modifier, expected) => {
    expect(
      maneuverKind({
        instruction: "x",
        maneuver: type,
        modifier,
        distanceMeters: 0,
        durationSeconds: 0,
        location: null,
      }),
    ).toBe(expected)
  })

  it("falls back to straight for an unknown manoeuvre", () => {
    expect(maneuverKind(null)).toBe("straight")
    expect(
      maneuverKind({
        instruction: "x",
        maneuver: "notification",
        modifier: null,
        distanceMeters: 0,
        durationSeconds: 0,
        location: null,
      }),
    ).toBe("straight")
  })
})

describe("product position", () => {
  it("reports where the package is for every trip status", () => {
    expect(getProductPosition("assigned")).toBe("at_pickup")
    expect(getProductPosition("accepted")).toBe("at_pickup")
    expect(getProductPosition("ready_for_pickup")).toBe("at_pickup")
    expect(getProductPosition("picked_up")).toBe("with_driver")
    expect(getProductPosition("in_transit")).toBe("with_driver")
    expect(getProductPosition("delivered")).toBe("delivered")
    expect(getProductPosition("completed")).toBe("delivered")
    expect(getProductPosition("weird")).toBe("unknown")
    expect(getProductPosition(null)).toBe("unknown")
  })

  it("has customer-facing wording for each position", () => {
    expect(productPositionLabel("at_pickup")).toMatch(/pickup/i)
    expect(productPositionLabel("with_driver")).toMatch(/you/i)
    expect(productPositionLabel("delivered")).toMatch(/delivered/i)
    expect(productPositionDescription("at_pickup")).toMatch(/merchant/i)
    expect(productPositionDescription("with_driver")).toMatch(/customer/i)
  })

  it("defaults to the drop-off once the package is collected", () => {
    expect(defaultTargetForStatus("assigned")).toBe("pickup")
    expect(defaultTargetForStatus("accepted")).toBe("pickup")
    expect(defaultTargetForStatus("picked_up")).toBe("dropoff")
    expect(defaultTargetForStatus("in_transit")).toBe("dropoff")
    expect(defaultTargetForStatus(null)).toBe("pickup")
  })
})

describe("formatting", () => {
  it("formats distance", () => {
    expect(formatDistanceText(0)).toBe("0 m")
    expect(formatDistanceText(Number.NaN)).toBe("0 m")
    expect(formatDistanceText(450)).toBe("450 m")
    expect(formatDistanceText(1500)).toBe("1.5 km")
  })

  it("formats duration", () => {
    expect(formatDurationText(0)).toBe("0 min")
    expect(formatDurationText(20)).toBe("<1 min")
    expect(formatDurationText(600)).toBe("10 min")
    expect(formatDurationText(3900)).toBe("1 hr 5 min")
    expect(formatDurationText(7200)).toBe("2 hr")
  })
})
