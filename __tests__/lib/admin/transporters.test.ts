/**
 * Tests for the admin transporter list rules (lib/admin/transporters.ts).
 */

import { filterTransporters, isTransporterActive, matchesTransporterQuery, type Transporter } from "@/lib/admin/transporters"

const transporter = (over: Partial<Transporter> = {}): Transporter =>
  ({
    id: "t-1",
    user_id: "u-1",
    vehicle_type: "bodaboda",
    vehicle_registration: "T123ABC",
    license_number: "LIC-001",
    kyc_status: "approved",
    availability_status: "available",
    created_at: "2026-01-05T10:00:00Z",
    updated_at: "2026-01-06T10:00:00Z",
    total_deliveries: 12,
    users: { email: "asha@example.com", full_name: "Asha Mwinyi", phone: "255700000001" },
    ...over,
  }) as Transporter

describe("matchesTransporterQuery", () => {
  it.each([
    ["the driver's name", "asha"],
    ["the driver's email", "asha@example"],
    ["vehicle registration", "t123abc"],
    ["license number", "lic-001"],
    ["the joined user's phone", "255700000001"],
  ])("matches on %s", (_field, query) => {
    expect(matchesTransporterQuery(transporter(), query)).toBe(true)
  })

  it("matches on the phone stored on the transporter row itself", () => {
    const bare = transporter({ users: undefined, phone: "255700000009" })

    expect(matchesTransporterQuery(bare, "255700000009")).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(matchesTransporterQuery(transporter(), "ASHA")).toBe(true)
  })

  it("does not match an unrelated query", () => {
    expect(matchesTransporterQuery(transporter(), "unrelated")).toBe(false)
  })

  it("does not throw for a transporter missing every optional field", () => {
    const sparse = { id: "t-9" } as Transporter

    expect(matchesTransporterQuery(sparse, "anything")).toBe(false)
  })
})

describe("filterTransporters", () => {
  const list = [transporter(), transporter({ id: "t-2", vehicle_registration: "T456DEF", users: undefined })]

  it.each([[""], ["   "]])("returns everything for the blank query %p", (query) => {
    expect(filterTransporters(list, query)).toHaveLength(2)
  })

  it("returns the same array instance for a blank query", () => {
    expect(filterTransporters(list, "")).toBe(list)
  })

  it("narrows to the matching transporters", () => {
    expect(filterTransporters(list, "t456def").map((t) => t.id)).toEqual(["t-2"])
  })

  it("returns an empty list when nothing matches", () => {
    expect(filterTransporters(list, "zzz")).toEqual([])
  })
})

describe("isTransporterActive", () => {
  it.each([[true], [false]])("returns the explicit value %p", (value) => {
    expect(isTransporterActive({ is_active: value })).toBe(value)
  })

  it.each([[null], [undefined]])("treats %p as active, since the column post-dates these rows", (value) => {
    expect(isTransporterActive({ is_active: value })).toBe(true)
  })
})
