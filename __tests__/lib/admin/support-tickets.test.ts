/**
 * Tests for the admin support ticket list rules (lib/admin/support-tickets.ts).
 *
 * Two quirks are pinned deliberately, matching the existing component test's
 * own framing: a ticket with no department counts as "general", and the
 * Super Admin "vendor" filter also matches "logistics".
 */

import {
  countTicketsByStatus,
  departmentBadgeStyle,
  filterTicketsByStatusAndQuery,
  isTicketResolved,
  matchesTicketQuery,
  scopeTicketsByDepartment,
  type SupportTicketLike,
} from "@/lib/admin/support-tickets"

const ticket = (over: Partial<SupportTicketLike> = {}): SupportTicketLike => ({
  department: "general",
  status: "open",
  subject: "Cannot log in",
  description: "I get an error on the login page",
  users: { full_name: "Asha Mwinyi", email: "asha@example.com" },
  ...over,
})

describe("departmentBadgeStyle", () => {
  it("returns the mapped style for a known department", () => {
    expect(departmentBadgeStyle("finance").label).toBe("Finance & Payouts")
  })

  it.each([[null], [undefined], [""]])("falls back to General Support for %p", (department) => {
    expect(departmentBadgeStyle(department).label).toBe("General Support")
  })

  it("falls back to General Support for an unrecognised department", () => {
    expect(departmentBadgeStyle("marketing").label).toBe("General Support")
  })
})

describe("isTicketResolved", () => {
  it.each([["resolved"], ["completed"], ["closed"]])("treats %s as resolved", (status) => {
    expect(isTicketResolved(status)).toBe(true)
  })

  it.each([["open"], ["in_progress"], [null], [undefined]])("treats %p as not resolved", (status) => {
    expect(isTicketResolved(status)).toBe(false)
  })
})

describe("scopeTicketsByDepartment", () => {
  const list = [
    ticket({ department: "vendor" }),
    ticket({ department: "logistics" }),
    ticket({ department: "hr" }),
    ticket({ department: undefined }),
  ]

  it("shows a Super Admin everything when the filter is 'all'", () => {
    expect(scopeTicketsByDepartment(list, { isSuperAdmin: true, departmentFilter: "all" })).toHaveLength(4)
  })

  it("the Super Admin 'vendor' filter also matches 'logistics'", () => {
    const result = scopeTicketsByDepartment(list, { isSuperAdmin: true, departmentFilter: "vendor" })

    expect(result.map((t) => t.department)).toEqual(["vendor", "logistics"])
  })

  it("a department-scoped admin sees only their listed departments", () => {
    const result = scopeTicketsByDepartment(list, { isSuperAdmin: false, departmentFilter: "all", department: "hr, vendor" })

    expect(result.map((t) => t.department)).toEqual(["vendor", "hr"])
  })

  it("a ticket with no department counts as 'general'", () => {
    const result = scopeTicketsByDepartment(list, { isSuperAdmin: false, departmentFilter: "all", department: "general" })

    expect(result).toHaveLength(1)
    expect(result[0].department).toBeUndefined()
  })

  it("sees everything when neither scoping applies", () => {
    expect(scopeTicketsByDepartment(list, { isSuperAdmin: false, departmentFilter: "all" })).toHaveLength(4)
  })
})

describe("matchesTicketQuery", () => {
  it.each([
    ["subject", "cannot log in"],
    ["description", "error on the login"],
    ["the requester's name", "asha"],
  ])("matches on %s", (_field, query) => {
    expect(matchesTicketQuery(ticket(), query)).toBe(true)
  })

  it("matches on the requester's email only when there is no full_name to prefer", () => {
    // `name` is full_name || email || guest_name -- once full_name is present,
    // email is not searched at all. This mirrors the original component's own
    // `||` chain rather than a bug introduced by the extraction.
    expect(matchesTicketQuery(ticket(), "asha@example")).toBe(false)
    expect(matchesTicketQuery(ticket({ users: { email: "asha@example.com" } }), "asha@example")).toBe(true)
  })

  it("falls back to guest_name when there is no linked user", () => {
    expect(matchesTicketQuery(ticket({ users: undefined, guest_name: "Guest Baraka" }), "baraka")).toBe(true)
  })

  it("does not match an unrelated query", () => {
    expect(matchesTicketQuery(ticket(), "unrelated")).toBe(false)
  })
})

describe("filterTicketsByStatusAndQuery", () => {
  const list = [ticket({ status: "open", subject: "Cannot log in" }), ticket({ status: "resolved", subject: "Payout missing" })]

  it("narrows by status", () => {
    expect(filterTicketsByStatusAndQuery(list, { statusFilter: "resolved", query: "" })).toHaveLength(1)
  })

  it("narrows by query within the status filter", () => {
    const result = filterTicketsByStatusAndQuery(list, { statusFilter: "all", query: "payout" })

    expect(result.map((t) => t.subject)).toEqual(["Payout missing"])
  })
})

describe("countTicketsByStatus", () => {
  it("counts open, in_progress, and folds every resolved-like status into one bucket", () => {
    const list = [
      ticket({ status: "open" }),
      ticket({ status: "open" }),
      ticket({ status: "in_progress" }),
      ticket({ status: "resolved" }),
      ticket({ status: "completed" }),
      ticket({ status: "closed" }),
    ]

    expect(countTicketsByStatus(list)).toEqual({ open: 2, inProgress: 1, resolved: 3 })
  })

  it("returns zeros for an empty list", () => {
    expect(countTicketsByStatus([])).toEqual({ open: 0, inProgress: 0, resolved: 0 })
  })
})
