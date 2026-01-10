import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getUserAdminRole } from "@/lib/admin/roles"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is Super Admin
    const userRole = await getUserAdminRole(user.id)
    if (!userRole || !userRole.roleName.includes("Super Admin")) {
      return NextResponse.json({ error: "Forbidden - Super Admin only" }, { status: 403 })
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, full_name, user_type, created_at, admin_role_id")
      .eq("user_type", "admin")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const rolesMap = new Map()
    if (users && users.length > 0) {
      const roleIds = users.filter((u) => u.admin_role_id).map((u) => u.admin_role_id)

      if (roleIds.length > 0) {
        const { data: roles } = await supabase
          .from("admin_roles")
          .select("id, role_name, access_level, description")
          .in("id", roleIds)

        if (roles) {
          roles.forEach((role) => rolesMap.set(role.id, role))
        }
      }
    }

    const usersWithRoles = users?.map((u) => ({
      ...u,
      admin_roles:
        u.admin_role_id && rolesMap.has(u.admin_role_id)
          ? rolesMap.get(u.admin_role_id)
          : {
            role_name: "Super Admin",
            access_level: 100,
            description: "Full system access (default)",
          },
    }))

    return NextResponse.json({ users: usersWithRoles || [] })
  } catch (error: any) {
    console.error("[v0] Error in list users endpoint:", error)
    return NextResponse.json({ users: [], error: error.message }, { status: 500 })
  }
}
