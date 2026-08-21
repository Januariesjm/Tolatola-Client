/**
 * Tests for the admin career applications list rules
 * (lib/admin/career-applications.ts).
 */

import {
  countApplicationsByStatus,
  distinctPositions,
  filterApplications,
  formatApplicationDate,
  matchesApplicationQuery,
  type CareerApplication,
} from "@/lib/admin/career-applications"

const application = (over: Partial<CareerApplication> = {}): CareerApplication => ({
  id: "a-1",
  full_name: "Asha Mwinyi",
  email: "asha@example.com",
  position: "Backend Engineer",
  cv_url: "/cv.pdf",
  status: "pending",
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
  ...over,
})

describe("distinctPositions", () => {
  it("returns unique positions, sorted", () => {
    const list = [application({ position: "Support" }), application({ position: "Backend" }), application({ position: "Support" })]

    expect(distinctPositions(list)).toEqual(["Backend", "Support"])
  })

  it("returns an empty list for no applications", () => {
    expect(distinctPositions([])).toEqual([])
  })
})

describe("matchesApplicationQuery", () => {
  it.each([
    ["full name", "asha"],
    ["email", "asha@example"],
    ["position", "backend"],
  ])("matches on %s", (_field, query) => {
    expect(matchesApplicationQuery(application(), query)).toBe(true)
  })

  it("is case-insensitive", () => {
    expect(matchesApplicationQuery(application(), "ASHA")).toBe(true)
  })

  it("does not match an unrelated query", () => {
    expect(matchesApplicationQuery(application(), "vendor")).toBe(false)
  })
})

describe("filterApplications", () => {
  const list = [
    application({ id: "a-1", full_name: "Asha Mwinyi", position: "Backend Engineer", status: "pending" }),
    application({ id: "a-2", full_name: "Baraka Juma", position: "Support Agent", status: "shortlisted" }),
  ]

  it("returns everything for an empty query and 'all' filters", () => {
    expect(filterApplications(list, { query: "", statusFilter: "all", positionFilter: "all" })).toHaveLength(2)
  })

  it("narrows by status", () => {
    const result = filterApplications(list, { query: "", statusFilter: "shortlisted", positionFilter: "all" })

    expect(result.map((a) => a.id)).toEqual(["a-2"])
  })

  it("narrows by position", () => {
    const result = filterApplications(list, { query: "", statusFilter: "all", positionFilter: "Support Agent" })

    expect(result.map((a) => a.id)).toEqual(["a-2"])
  })

  it("narrows by search query", () => {
    const result = filterApplications(list, { query: "baraka", statusFilter: "all", positionFilter: "all" })

    expect(result.map((a) => a.id)).toEqual(["a-2"])
  })

  it("combines all three filters", () => {
    const result = filterApplications(list, { query: "asha", statusFilter: "pending", positionFilter: "Backend Engineer" })

    expect(result.map((a) => a.id)).toEqual(["a-1"])
  })

  it("returns an empty list when nothing matches", () => {
    expect(filterApplications(list, { query: "zzz", statusFilter: "all", positionFilter: "all" })).toEqual([])
  })
})

describe("countApplicationsByStatus", () => {
  it("counts each status and the overall total", () => {
    const list = [
      application({ status: "pending" }),
      application({ status: "pending" }),
      application({ status: "reviewed" }),
      application({ status: "shortlisted" }),
      application({ status: "rejected" }),
    ]

    expect(countApplicationsByStatus(list)).toEqual({ all: 5, pending: 2, reviewed: 1, shortlisted: 1, rejected: 1 })
  })

  it("returns all zeros for an empty list", () => {
    expect(countApplicationsByStatus([])).toEqual({ all: 0, pending: 0, reviewed: 0, shortlisted: 0, rejected: 0 })
  })
})

describe("formatApplicationDate", () => {
  it("formats as 'Mon D, YYYY'", () => {
    expect(formatApplicationDate("2026-02-01T00:00:00Z")).toBe("Feb 1, 2026")
  })
})
