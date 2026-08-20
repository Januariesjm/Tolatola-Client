// Admin authentication middleware
import { getUserAdminRole, hasPermission } from "./roles"
import { createClient } from "../supabase/server"
import { logger } from "@/lib/logger"

const log = logger.child("lib.admin.middleware")

export async function checkAdminAccess(userId: string, requiredPermission: string) {
  try {
    const adminRole = await getUserAdminRole(userId)

    if (!adminRole) {
      return { allowed: false, reason: "User is not an admin" }
    }

    if (!hasPermission(adminRole.permissions, requiredPermission)) {
      return { allowed: false, reason: "User does not have required permission" }
    }

    return { allowed: true, adminRole }
  } catch (error) {
    log.error("error checking admin access", error)
    return { allowed: false, reason: "Error checking admin access" }
  }
}

export async function getAllAdminUsers() {
  const supabase = await createClient()

  try {
    const { data: admins, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        admin_role_id,
        admin_roles!users_admin_role_id_fkey (
          id,
          role_name,
          access_level
        ),
        created_at
      `,
      )
      .not("admin_role_id", "is", null)
      .order("created_at", { ascending: false })

    if (error) {
      log.error("error fetching admin users", error)
      throw error
    }

    return admins || []
  } catch (error) {
    log.error("error in getAllAdminUsers", error)
    throw error
  }
}
