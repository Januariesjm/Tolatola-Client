import { serverApiGet } from "@/lib/api-server"

export const ALL_PERMISSIONS = [
  "view_dashboard",
  "manage_vendors",
  "manage_products",
  "manage_orders",
  "manage_payouts",
  "manage_escrow",
  "manage_support",
  "manage_promotions",
  "manage_admins",
  "view_analytics",
  "manage_system",
  "manage_transactions",
]

export const ROLE_DEFINITIONS = {
  "Super Admin": {
    accessLevel: 100,
    permissions: ALL_PERMISSIONS,
    description: "Owner with full system control",
  },
  "IT Admin": {
    accessLevel: 85,
    permissions: [
      "view_dashboard",
      "manage_vendors",
      "manage_products",
      "manage_orders",
      "manage_escrow",
      "manage_support",
      "manage_promotions",
      "view_analytics",
      "manage_system",
    ],
    description: "Technical administrator managing system infrastructure",
  },
  "Finance Admin": {
    accessLevel: 70,
    permissions: ["view_dashboard", "manage_payouts", "manage_transactions", "view_analytics"],
    description: "Financial administrator managing payments and accounting",
  },
  "Vendor Manager": {
    accessLevel: 65,
    permissions: ["view_dashboard", "manage_vendors", "manage_products", "manage_orders", "view_analytics"],
    description: "Operations manager overseeing vendors and products",
  },
  "Marketing & Support": {
    accessLevel: 50,
    permissions: ["view_dashboard", "manage_promotions", "manage_support", "view_analytics"],
    description: "Marketing and customer support team",
  },
}

export async function getUserAdminRole(_userId?: string) {
  // The backend enforces auth via Bearer token; just ask it for my role
  try {
    const res = await serverApiGet<{
      adminRole?: {
        id: string
        role_name: string
        access_level: number
        description?: string
        permissions: string[]
      }
      user?: {
        id: string
        email: string
        full_name?: string
      }
    }>("admin/roles")

    const role = (res as any).adminRole
    const user = (res as any).user

    if (role && user) {
      return {
        roleId: role.id,
        roleName: role.role_name,
        accessLevel: role.access_level,
        permissions: Array.isArray(role.permissions) ? role.permissions : [],
        userId: user.id,
        userEmail: user.email,
        userName: user.full_name,
      }
    }
  } catch (error) {
    console.error("[v0] Error fetching admin role via API:", error)
  }
  return null
}

export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission)
}
