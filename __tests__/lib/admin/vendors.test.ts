/**
 * Tests for the admin vendor list rules (lib/admin/vendors.ts).
 *
 * The search predicate used to be an inline seven-way `||` chain inside a
 * `useEffect`, so which fields an admin can search by was invisible without
 * reading the component. These pin it.
 */

import { VENDOR_TYPE_LABELS, filterVendors, isVendorActive, matchesVendorQuery, vendorTypeLabel, type Vendor } from "@/lib/admin/vendors"

const vendor = (over: Partial<Vendor> = {}): Vendor =>
  ({
    id: "v-1",
    business_name: "Dodoma Crafts",
    tin_number: "TIN-111",
    nida_number: "NIDA-111",
    address: "12 Samora Ave",
    district: "Dodoma Urban",
    region: "Dodoma",
    ward: "Kikuyu",
    kyc_status: "approved",
    created_at: "2026-01-05T10:00:00Z",
    updated_at: "2026-01-06T10:00:00Z",
    users: { email: "asha@example.com", full_name: "Asha Mwinyi", phone: "255700000001" },
    ...over,
  }) as Vendor

describe("matchesVendorQuery", () => {
  it.each([
    ["business name", "dodoma craft"],
    ["email", "asha@example"],
    ["full name", "mwinyi"],
    ["TIN", "tin-111"],
    ["NIDA", "nida-111"],
    ["the user's phone", "255700000001"],
  ])("matches on %s", (_field, query) => {
    expect(matchesVendorQuery(vendor(), query)).toBe(true)
  })

  it("matches on the phone stored on the vendor row rather than the user", () => {
    // Older records carry the number here; newer ones on the joined user.
    const bare = vendor({ users: undefined, phone: "255700000009" })

    expect(matchesVendorQuery(bare, "255700000009")).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(matchesVendorQuery(vendor(), "DODOMA")).toBe(true)
  })

  it("does not match an unrelated query", () => {
    expect(matchesVendorQuery(vendor(), "mbeya")).toBe(false)
  })

  it("does not search the address, district or region", () => {
    // Deliberate: those are shown on the card but were never searchable, and
    // making them searchable would change which rows an admin sees.
    expect(matchesVendorQuery(vendor(), "samora")).toBe(false)
    expect(matchesVendorQuery(vendor(), "kikuyu")).toBe(false)
  })

  it("does not throw for a vendor missing every optional field", () => {
    const sparse = { id: "v-9" } as Vendor

    expect(matchesVendorQuery(sparse, "anything")).toBe(false)
  })
})

describe("filterVendors", () => {
  const list = [vendor(), vendor({ id: "v-2", business_name: "Mbeya Grains", tin_number: "TIN-222", users: undefined })]

  it.each([[""], ["   "]])("returns everything for the blank query %p", (query) => {
    expect(filterVendors(list, query)).toHaveLength(2)
  })

  it("returns the same array instance for a blank query, so no needless re-render", () => {
    expect(filterVendors(list, "")).toBe(list)
  })

  it("narrows to the matching vendors", () => {
    expect(filterVendors(list, "mbeya").map((v) => v.id)).toEqual(["v-2"])
  })

  it("returns an empty list when nothing matches", () => {
    expect(filterVendors(list, "zzz")).toEqual([])
  })

  it("trims only for the blank check, so a padded query still filters", () => {
    expect(filterVendors(list, " mbeya")).toEqual([])
  })
})

describe("vendorTypeLabel", () => {
  it("maps a known type to its display name", () => {
    expect(vendorTypeLabel("retail_trader")).toBe("Retail Trader")
  })

  it.each(Object.keys(VENDOR_TYPE_LABELS))("has a non-empty label for %s", (type) => {
    expect(vendorTypeLabel(type).trim()).not.toBe("")
  })

  it("falls back to the raw value for a type added by the backend first", () => {
    expect(vendorTypeLabel("cooperative")).toBe("cooperative")
  })
})

describe("isVendorActive", () => {
  it("treats an explicit true as active", () => {
    expect(isVendorActive({ is_active: true })).toBe(true)
  })

  it("treats an explicit false as inactive", () => {
    expect(isVendorActive({ is_active: false })).toBe(false)
  })

  it.each([[null], [undefined]])("treats %p as active, since the column post-dates these rows", (value) => {
    expect(isVendorActive({ is_active: value })).toBe(true)
  })
})
