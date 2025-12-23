// Admin system initialization and verification utilities
import { createClient } from "@/lib/supabase/server"

export async function verifyAdminSetup() {
  const supabase = await createClient()

  console.log("[v0] Verifying admin system setup...")

  try {
    // Check if admin_roles table exists and has data
    const { data: roles, error: rolesError } = await supabase
      .from("admin_roles")
      .select("id, role_name")
      .limit(1)

    if (rolesError) {
      console.error("[v0] Admin roles table not found:", rolesError.message)
      return {
        status: "error",
        message: "Admin roles table not found. Run script 015 first.",
      }
    }

    // Check if admin_permissions table exists
    const { data: permissions, error: permissionsError } = await supabase
      .from("admin_permissions")
      .select("id, permission_key")
      .limit(1)

    if (permissionsError) {
      console.error("[v0] Admin permissions table not found:", permissionsError.message)
      return {
        status: "error",
        message: "Admin permissions table not found. Run script 015 first.",
      }
    }

    // Check if users table has admin_role_id column
    const { data: userCheck, error: userError } = await supabase
      .from("users")
      .select("admin_role_id")
      .limit(1)

    if (userError) {
      if (userError.message.includes("admin_role_id")) {
        console.error("[v0] admin_role_id column not found in users table")
        return {
          status: "error",
          message: "admin_role_id column missing. Run script 017 first.",
        }
      }
    }

    console.log("[v0] Admin system setup verified successfully!")
    return {
      status: "success",
      message: "Admin system is properly set up",
    }
  } catch (error) {
    console.error("[v0] Error verifying admin setup:", error)
    return {
      status: "error",
      message: "Error verifying admin setup",
    }
  }
}

export async function getAdminStatistics() {
  const supabase = await createClient()

  try {
    // Get role counts
    const { data: roles } = await supabase
      .from("admin_roles")
      .select("id, role_name, access_level")
      .order("access_level", { ascending: false })

    // Get current admins
    const { data: admins } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        admin_roles!users_admin_role_id_fkey (
          role_name,
          access_level
        )
      `,
      )
      .not("admin_role_id", "is", null)

    // Count admins by role
    const adminsByRole: Record<string, number> = {}
    admins?.forEach((admin: any) => {
      const roleName = admin.admin_roles?.role_name || "Unknown"
      adminsByRole[roleName] = (adminsByRole[roleName] || 0) + 1
    })

    return {
      totalRoles: roles?.length || 0,
      totalAdmins: admins?.length || 0,
      roles: roles || [],
      adminsByRole,
      admins: admins || [],
    }
  } catch (error) {
    console.error("[v0] Error getting admin statistics:", error)
    return {
      totalRoles: 0,
      totalAdmins: 0,
      roles: [],
      adminsByRole: {},
      admins: [],
    }
  }
}
