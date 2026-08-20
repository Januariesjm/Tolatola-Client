import { getInitialTab, isSuperAdminRole, getDepartmentForRole, filterTicketsByDepartment } from "@/lib/admin/dashboard-utils"

describe("dashboard-utils (lib/admin/dashboard-utils.ts)", () => {
  describe("getInitialTab", () => {
    it("returns 'analytics' if permissions is undefined or empty", () => {
      expect(getInitialTab()).toBe("analytics")
      expect(getInitialTab([])).toBe("analytics")
    })

    it("returns 'analytics' if permissions includes view_analytics", () => {
      expect(getInitialTab(["view_analytics", "manage_support"])).toBe("analytics")
    })

    it("returns 'support' if view_analytics is absent but manage_support is present", () => {
      expect(getInitialTab(["manage_support"])).toBe("support")
    })

    it("returns 'hr' if manage_hr is present and higher-priority ones absent", () => {
      expect(getInitialTab(["manage_hr"])).toBe("hr")
    })

    it("returns 'system-health' if manage_system is present", () => {
      expect(getInitialTab(["manage_system"])).toBe("system-health")
    })

    it("defaults to 'analytics' if no matching tab rule matches", () => {
      expect(getInitialTab(["unknown_permission"])).toBe("analytics")
    })
  })

  describe("isSuperAdminRole", () => {
    it("returns false for falsy input", () => {
      expect(isSuperAdminRole()).toBe(false)
      expect(isSuperAdminRole("")).toBe(false)
    })

    it("returns true for roles containing super, owner, or master", () => {
      expect(isSuperAdminRole("Super Administrator")).toBe(true)
      expect(isSuperAdminRole("Platform Owner")).toBe(true)
      expect(isSuperAdminRole("Master Admin")).toBe(true)
    })

    it("returns false for regular roles", () => {
      expect(isSuperAdminRole("Support Agent")).toBe(false)
      expect(isSuperAdminRole("Finance Manager")).toBe(false)
      expect(isSuperAdminRole("IT Support")).toBe(false)
    })
  })

  describe("getDepartmentForRole", () => {
    it("maps IT roles correctly", () => {
      expect(getDepartmentForRole("IT Admin")).toBe("it")
      expect(getDepartmentForRole("Technical Manager")).toBe("it")
    })

    it("maps Finance roles correctly", () => {
      expect(getDepartmentForRole("Finance Lead")).toBe("finance")
    })

    it("maps HR roles correctly", () => {
      expect(getDepartmentForRole("Human Resource Specialist")).toBe("hr")
      expect(getDepartmentForRole("HR Manager")).toBe("hr")
    })

    it("maps Vendor/Manager roles correctly", () => {
      expect(getDepartmentForRole("Vendor Operations")).toBe("vendor,logistics")
      expect(getDepartmentForRole("Store Manager")).toBe("vendor,logistics")
    })

    it("defaults to general for unrecognized roles", () => {
      expect(getDepartmentForRole("Custom Officer")).toBe("general")
    })
  })

  describe("filterTicketsByDepartment", () => {
    const mockTickets = [
      { id: "1", status: "open", department: "it" },
      { id: "2", status: "closed", department: "it" },
      { id: "3", status: "open", department: "finance" },
      { id: "4", status: "open", department: "general" },
    ]

    it("returns all open tickets for super admin", () => {
      const result = filterTicketsByDepartment(mockTickets, true)
      expect(result.map((t) => t.id)).toEqual(["1", "3", "4"])
    })

    it("filters open tickets matching user department", () => {
      const result = filterTicketsByDepartment(mockTickets, false, "it")
      expect(result.map((t) => t.id)).toEqual(["1"])
    })

    it("handles multi-department user role strings", () => {
      const result = filterTicketsByDepartment(mockTickets, false, "vendor,logistics,finance")
      expect(result.map((t) => t.id)).toEqual(["3"])
    })

    it("ignores closed tickets regardless of role", () => {
      const result = filterTicketsByDepartment(mockTickets, true)
      expect(result.find((t) => t.id === "2")).toBeUndefined()
    })
  })
})
