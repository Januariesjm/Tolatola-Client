/**
 * Tests for the admin HR staff list rules (lib/admin/hr-staff.ts).
 */

import { countStaffByStatus, distinctRoles, filterStaff, matchesStaffQuery, matchesStatusTab, type HRStaff } from "@/lib/admin/hr-staff"

const staff = (over: Partial<HRStaff> = {}): HRStaff => ({
  id: "s-1",
  full_name: "Asha Mwinyi",
  employee_id: "EMP-001",
  role: "Manager",
  department: "Engineering",
  email: "asha@example.com",
  phone: "255700000001",
  join_date: "2026-01-01",
  status: "active",
  ...over,
})

describe("matchesStatusTab", () => {
  it.each([["active"], ["suspended"], ["terminated"]] as const)("matches an exact %s status", (status) => {
    expect(matchesStatusTab(staff({ status }), status)).toBe(true)
  })

  it.each([["inactive"], ["exited"]])("the 'inactive' tab matches both 'inactive' and the legacy 'exited' status", (status) => {
    expect(matchesStatusTab(staff({ status }), "inactive")).toBe(true)
  })

  it("does not match a different status", () => {
    expect(matchesStatusTab(staff({ status: "active" }), "suspended")).toBe(false)
  })
})

describe("matchesStaffQuery", () => {
  it.each([
    ["full name", "asha"],
    ["email", "asha@example"],
    ["employee id", "emp-001"],
  ])("matches on %s", (_field, query) => {
    expect(matchesStaffQuery(staff(), query)).toBe(true)
  })

  it("does not match an unrelated query", () => {
    expect(matchesStaffQuery(staff(), "vendor")).toBe(false)
  })
})

describe("filterStaff", () => {
  const list = [
    staff({ id: "s-1", full_name: "Asha Mwinyi", role: "Manager", status: "active", created_at: "2026-01-05T00:00:00Z" }),
    staff({ id: "s-2", full_name: "Baraka Juma", role: "Support", status: "suspended", created_at: "2026-01-15T00:00:00Z" }),
  ]

  it("narrows by status tab first", () => {
    const result = filterStaff(list, { statusTab: "suspended", query: "", role: "all", dateFrom: "", dateTo: "" })

    expect(result.map((s) => s.id)).toEqual(["s-2"])
  })

  it("narrows by search query within the status tab", () => {
    const result = filterStaff(list, { statusTab: "active", query: "asha", role: "all", dateFrom: "", dateTo: "" })

    expect(result.map((s) => s.id)).toEqual(["s-1"])
  })

  it("narrows by role", () => {
    const result = filterStaff(list, { statusTab: "active", query: "", role: "Manager", dateFrom: "", dateTo: "" })

    expect(result.map((s) => s.id)).toEqual(["s-1"])
  })

  it("excludes a record created before dateFrom", () => {
    const result = filterStaff([...list], {
      statusTab: "active",
      query: "",
      role: "all",
      dateFrom: "2026-01-10",
      dateTo: "",
    })

    expect(result).toEqual([])
  })

  it("includes a record created within the date range, at either boundary", () => {
    const result = filterStaff(list, { statusTab: "active", query: "", role: "all", dateFrom: "2026-01-01", dateTo: "2026-01-05" })

    expect(result.map((s) => s.id)).toEqual(["s-1"])
  })

  it("falls back to join_date when created_at is absent", () => {
    const noCreatedAt = staff({ id: "s-3", join_date: "2026-01-20", created_at: undefined, status: "active" })

    const result = filterStaff([noCreatedAt], { statusTab: "active", query: "", role: "all", dateFrom: "2026-01-15", dateTo: "" })

    expect(result.map((s) => s.id)).toEqual(["s-3"])
  })
})

describe("distinctRoles", () => {
  it("returns unique, non-empty roles", () => {
    const list = [staff({ role: "Manager" }), staff({ role: "Support" }), staff({ role: "Manager" }), staff({ role: "" })]

    expect(distinctRoles(list)).toEqual(["Manager", "Support"])
  })
})

describe("countStaffByStatus", () => {
  it("counts each status, folding 'exited' into 'inactive'", () => {
    const list = [
      staff({ status: "active" }),
      staff({ status: "active" }),
      staff({ status: "suspended" }),
      staff({ status: "inactive" }),
      staff({ status: "exited" }),
      staff({ status: "terminated" }),
    ]

    expect(countStaffByStatus(list)).toEqual({ active: 2, suspended: 1, exited: 2, terminated: 1 })
  })

  it("returns all zeros for an empty list", () => {
    expect(countStaffByStatus([])).toEqual({ active: 0, suspended: 0, exited: 0, terminated: 0 })
  })
})
