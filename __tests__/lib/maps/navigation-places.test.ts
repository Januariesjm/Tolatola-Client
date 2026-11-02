/** Place/coordinate coercion used to turn API rows into navigator stops. */

import { buildPlace, toPoint } from "@/lib/maps/navigation-places"

describe("toPoint", () => {
  it("accepts numbers and numeric strings", () => {
    expect(toPoint(39.2)).toBe(39.2)
    expect(toPoint("-6.8")).toBe(-6.8)
    expect(toPoint(0)).toBe(0)
  })

  it("rejects empty and non-numeric values", () => {
    expect(toPoint(null)).toBeNull()
    expect(toPoint(undefined)).toBeNull()
    expect(toPoint("")).toBeNull()
    expect(toPoint("not-a-number")).toBeNull()
  })
})

describe("buildPlace", () => {
  it("builds a place with a joined address", () => {
    const place = buildPlace(-6.8, 39.2, "Shop", ["Street 1", null, "Kariakoo"], "+255700000000")
    expect(place).toEqual({
      latitude: -6.8,
      longitude: 39.2,
      name: "Shop",
      address: "Street 1, Kariakoo",
      phone: "+255700000000",
    })
  })

  it("treats 0,0 and missing coordinates as no destination", () => {
    expect(buildPlace(0, 0, "Nowhere", [], null)).toBeNull()
    expect(buildPlace(null, 39.2, "Shop", [], null)).toBeNull()
    expect(buildPlace(-6.8, null, "Shop", [], null)).toBeNull()
  })

  it("keeps a place with no address or phone", () => {
    const place = buildPlace(-6.8, 39.2, "Shop", [null, undefined, ""], null)
    expect(place?.address).toBeNull()
    expect(place?.phone).toBeNull()
  })
})
