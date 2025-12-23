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

    // Check if user is Super Admin
    const userRole = await getUserAdminRole(user.id)
    if (!userRole || !userRole.roleName.includes("Super Admin")) {
      return NextResponse.json({ error: "Forbidden - Super Admin only" }, { status: 403 })
    }

    const { userId, roleId } = await request.json()

    if (!userId || !roleId) {
      return NextResponse.json({ error: "userId and roleId are required" }, { status: 400 })
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(roleId)) {
      return NextResponse.json(
        { error: "Invalid role ID format. Please ensure admin roles are properly set up." },
        { status: 400 },
      )
    }

    const { data: roleExists, error: roleCheckError } = await supabase
      .from("admin_roles")
      .select("id, role_name")
      .eq("id", roleId)
      .maybeSingle()

    if (roleCheckError || !roleExists) {
      return NextResponse.json(
        { error: "Selected role does not exist. Please refresh and try again." },
        { status: 400 },
      )
    }

    const { data: userData } = await supabase.from("users").select("email, full_name").eq("id", userId).single()

    const { error } = await supabase
      .from("users")
      .update({
        user_type: "admin",
        admin_role_id: roleId,
      })
      .eq("id", userId)

    if (error) {
      console.error("[v0] Error assigning role:", error)
      throw error
    }

    if (userData?.email) {
      await supabase.from("admin_notifications").insert({
        user_id: userId,
        admin_role_id: roleId,
        notification_type: "role_assigned",
        title: "Admin Role Assigned",
        message: `You have been assigned the role of ${roleExists.role_name}. You can now access the admin dashboard at /admin.`,
      })

      // TODO: Implement actual email sending via Resend or similar
      console.log(`[v0] Email notification queued for ${userData.email}: Admin role ${roleExists.role_name} assigned`)
    }
    // </CHANGE>

    return NextResponse.json({ success: true, message: "Admin role assigned successfully" })
  } catch (error: any) {
    console.error("[v0] Error assigning role:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
