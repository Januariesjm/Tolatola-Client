/**
 * Pure utility functions for the Admin Dashboard.
 * Extracted from admin-dashboard-content.tsx for testability and modularity.
 */

export function getInitialTab(permissions?: string[]): string {
  if (!permissions || permissions.length === 0) return "analytics"
  if (permissions.includes("view_analytics")) return "analytics"
  if (permissions.includes("manage_support")) return "support"
  if (permissions.includes("manage_hr")) return "hr"
  if (permissions.includes("manage_system")) return "system-health"
  return "analytics"
}

export function isSuperAdminRole(roleName?: string): boolean {
  if (!roleName) return false
  const r = roleName.toLowerCase()
  return r.includes("super") || r.includes("owner") || r.includes("master")
}

export function getDepartmentForRole(role: string): string {
  const r = role.toLowerCase()
  if (r.includes("it ") || r === "it admin" || r.includes("technical")) return "it"
  if (r.includes("finance")) return "finance"
  if (r.includes("hr") || r.includes("human resource")) return "hr"
  if (r.includes("vendor") || r.includes("manager")) return "vendor,logistics"
  if (r.includes("marketing") || r.includes("support")) return "general"
  return "general"
}

export interface TicketLike {
  id: string
  status: string
  department?: string
  [key: string]: unknown
}

export function filterTicketsByDepartment<T extends TicketLike>(
  tickets: T[],
  isSuperAdmin: boolean,
  userDepartment?: string
): T[] {
  return tickets.filter((t) => {
    if (t.status !== "open") return false
    if (isSuperAdmin) return true
    if (userDepartment) {
      const allowed = userDepartment.split(",").map((d) => d.trim())
      return allowed.includes(t.department || "general")
    }
    return true
  })
}
