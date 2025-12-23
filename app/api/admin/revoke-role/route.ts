import { createClient } from "@/lib/supabase/server"
import { getUserAdminRole } from "@/lib/admin/roles"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = await getUserAdminRole(user.id)
    if (!userRole || !userRole.roleName.includes("Super Admin")) {
      return NextResponse.json({ error: "Forbidden - Super Admin only" }, { status: 403 })
    }

    const { userId, reason } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }

    const { data: userData } = await supabase
      .from("users")
      .select("email, full_name, admin_role_id")
      .eq("id", userId)
      .single()

    const { data: previousRole } = await supabase
      .from("admin_roles")
      .select("role_name")
      .eq("id", userData?.admin_role_id)
      .single()

    const { error } = await supabase
      .from("users")
      .update({
        user_type: "customer",
        admin_role_id: null,
      })
      .eq("id", userId)

    if (error) {
      console.error("[v0] Error revoking role:", error)
      throw error
    }

    if (userData?.email) {
      await supabase.from("admin_notifications").insert({
        user_id: userId,
        notification_type: "role_revoked",
        title: "Admin Role Revoked",
        message: `Your admin role (${previousRole?.role_name || "Admin"}) has been revoked${reason ? `: ${reason}` : ""}. You no longer have access to the admin dashboard.`,
      })

      console.log(`[v0] Email notification queued for ${userData.email}: Admin role revoked`)
    }
    // </CHANGE>

    return NextResponse.json({ success: true, message: "Admin role revoked successfully" })
  } catch (error: any) {
    console.error("[v0] Error revoking role:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
