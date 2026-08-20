/**
 * Tests for the shared admin dashboard nav config
 * (components/admin/dashboard/nav-items.ts).
 *
 * This config replaced two hand-maintained lists (desktop sidebar + mobile tab
 * strip) that each repeated their own permission checks. These tests pin the
 * permission gating, the badge counts and the sidebar/mobile relationship so a
 * future edit cannot silently expose a section to the wrong role.
 */

import {
  ADMIN_NAV_ITEMS,
  getMobileLabel,
  getMobileNavItems,
  getVisibleNavItems,
  type AdminNavContext,
} from "@/components/admin/dashboard/nav-items"

const NO_COUNTS: AdminNavContext["counts"] = {
  pendingVendors: 0,
  pendingTransporters: 0,
  pendingCustomerKyc: 0,
  pendingProducts: 0,
  pendingPayouts: 0,
  pendingTickets: 0,
  pendingRecovery: 0,
  pendingHr: 0,
}

function ctx(overrides: Partial<AdminNavContext> = {}): AdminNavContext {
  return {
    permissions: [],
    isSuperAdmin: false,
    hasAnyRole: false,
    showAdminManagement: false,
    canManageAgents: false,
    counts: NO_COUNTS,
    ...overrides,
  }
}

const keysFor = (c: AdminNavContext) => getVisibleNavItems(c).map((i) => i.key)

describe("ADMIN_NAV_ITEMS", () => {
  it("has a unique key per item", () => {
    const keys = ADMIN_NAV_ITEMS.map((i) => i.key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("gives every item a label, mobile label and icon", () => {
    for (const item of ADMIN_NAV_ITEMS) {
      expect(item.label).toBeTruthy()
      expect(item.mobileLabel).toBeTruthy()
      expect(item.icon).toBeTruthy()
    }
  })
})

describe("getVisibleNavItems", () => {
  it("shows nothing to an admin with no permissions and no role", () => {
    expect(keysFor(ctx())).toEqual([])
  })

  it.each([
    ["view_analytics", ["analytics", "validation"]],
    ["manage_kyc", ["kyc"]],
    ["manage_products", ["products", "all-products"]],
    ["manage_orders", ["orders"]],
    ["manage_payouts", ["finance", "payouts"]],
    ["manage_transactions", ["finance"]],
    ["manage_promotions", ["promotions"]],
    ["manage_blog", ["blog"]],
    ["manage_subscriptions", ["subscriptions"]],
    ["manage_hr", ["hr"]],
    ["view_logs", ["logs"]],
  ])("permission %s reveals exactly %p", (permission, expected) => {
    expect(keysFor(ctx({ permissions: [permission] }))).toEqual(expected)
  })

  it("reveals both the KYC and management tabs for manage_transporters", () => {
    expect(keysFor(ctx({ permissions: ["manage_transporters"] }))).toEqual(["transporter-kyc", "transporters", "messaging"])
  })

  it("reveals all four system tabs for manage_system", () => {
    expect(keysFor(ctx({ permissions: ["manage_system"] }))).toEqual([
      "infrastructure",
      "api-integrations",
      "security-access",
      "system-health",
    ])
  })

  it("shows support to any admin holding a role, even without manage_support", () => {
    expect(keysFor(ctx({ hasAnyRole: true }))).toEqual(["support"])
  })

  it("shows support to a super admin with no explicit permissions", () => {
    expect(keysFor(ctx({ isSuperAdmin: true }))).toEqual(["support"])
  })

  it("gates recovery behind manage_support, unlike support itself", () => {
    expect(keysFor(ctx({ hasAnyRole: true }))).not.toContain("recovery")
    expect(keysFor(ctx({ permissions: ["manage_support"] }))).toContain("recovery")
  })

  it("gates agents and admins on their own flags, not a permission string", () => {
    expect(keysFor(ctx({ canManageAgents: true }))).toEqual(["agents"])
    expect(keysFor(ctx({ showAdminManagement: true }))).toEqual(["admins"])
  })

  it("shows messaging for any one of the three audience permissions", () => {
    for (const permission of ["manage_vendors", "manage_customers", "manage_transporters"]) {
      expect(keysFor(ctx({ permissions: [permission] }))).toContain("messaging")
    }
  })

  it("preserves declaration order regardless of permission order", () => {
    const forward = keysFor(ctx({ permissions: ["manage_hr", "view_analytics"] }))
    const reverse = keysFor(ctx({ permissions: ["view_analytics", "manage_hr"] }))

    expect(forward).toEqual(reverse)
    expect(forward).toEqual(["analytics", "hr", "validation"])
  })
})

describe("getMobileNavItems", () => {
  it("mirrors the sidebar except for Activity Logs", () => {
    const all = ctx({
      permissions: [
        "view_analytics",
        "manage_kyc",
        "manage_transporters",
        "manage_customers",
        "manage_products",
        "manage_orders",
        "manage_transactions",
        "manage_payouts",
        "manage_support",
        "manage_promotions",
        "manage_blog",
        "manage_vendors",
        "manage_subscriptions",
        "manage_hr",
        "manage_system",
        "view_logs",
      ],
      isSuperAdmin: true,
      hasAnyRole: true,
      showAdminManagement: true,
      canManageAgents: true,
    })

    const sidebar = getVisibleNavItems(all).map((i) => i.key)
    const mobile = getMobileNavItems(all).map((i) => i.key)

    expect(sidebar).toContain("logs")
    expect(mobile).not.toContain("logs")
    expect(mobile).toEqual(sidebar.filter((k) => k !== "logs"))
  })

  it("never shows a mobile item the sidebar hides", () => {
    const c = ctx({ permissions: ["manage_kyc"] })
    const sidebar = new Set(getVisibleNavItems(c).map((i) => i.key))

    for (const item of getMobileNavItems(c)) {
      expect(sidebar.has(item.key)).toBe(true)
    }
  })
})

describe("getMobileLabel", () => {
  const counts = {
    ...NO_COUNTS,
    pendingVendors: 3,
    pendingProducts: 0,
    pendingHr: 12,
  }

  it("appends the count for items that track one, even at zero", () => {
    const c = ctx({ permissions: ["manage_kyc", "manage_products"], counts })
    const items = getVisibleNavItems(c)

    const kyc = items.find((i) => i.key === "kyc")!
    const products = items.find((i) => i.key === "products")!

    expect(getMobileLabel(kyc, c)).toBe("Vendor KYC (3)")
    expect(getMobileLabel(products, c)).toBe("Approvals (0)")
  })

  it("leaves countless items unchanged", () => {
    const c = ctx({ permissions: ["manage_orders"], counts })
    const orders = getVisibleNavItems(c).find((i) => i.key === "orders")!

    expect(getMobileLabel(orders, c)).toBe("Orders")
  })

  it("uses the short mobile label, not the sidebar label", () => {
    const c = ctx({ permissions: ["manage_hr", "manage_blog", "view_analytics"], counts })
    const items = getVisibleNavItems(c)

    const hr = items.find((i) => i.key === "hr")!
    const blog = items.find((i) => i.key === "blog")!
    const validation = items.find((i) => i.key === "validation")!

    expect(hr.label).toBe("Human Resource")
    expect(getMobileLabel(hr, c)).toBe("HR (12)")
    expect(blog.label).toBe("TOLA Journal")
    expect(getMobileLabel(blog, c)).toBe("Journal")
    expect(validation.label).toBe("Market Validation")
    expect(getMobileLabel(validation, c)).toBe("Validation")
  })
})
