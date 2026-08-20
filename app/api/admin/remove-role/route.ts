import { createClient } from "@/lib/supabase/server"
import { getUserAdminRole } from "@/lib/admin/roles"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { validateRequestBody } from "@/lib/api/validate-request"
import { revokeRoleSchema } from "@/lib/schemas/api"

const log = logger.child("app.api.admin.remove-role")

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

    const parsed = await validateRequestBody(request, revokeRoleSchema, "admin.remove-role")

    if (!parsed.ok) return parsed.response

    const { userId, reason } = parsed.data

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({ error: "Reason must be at least 10 characters" }, { status: 400 })
    }

    // Prevent self-removal
    if (userId === user.id) {
      return NextResponse.json({ error: "Cannot remove your own admin access" }, { status: 400 })
    }

    const { data: targetUser, error: fetchError } = await supabase
      .from("users")
      .select("email, full_name, user_type")
      .eq("id", userId)
      .single()

    if (fetchError) throw fetchError

    try {
      const { error: historyError } = await supabase.from("admin_revoke_history").insert({
        user_id: userId,
        revoked_by: user.id,
        revoke_reason: reason.trim(),
        user_email: targetUser.email,
        user_name: targetUser.full_name,
        previous_role_name: "Admin",
        previous_access_level: 100,
      })

      if (historyError) {
        log.warn("failed to save revoke history (table may not exist)", historyError.message)
      }
    } catch (historyError) {
      log.warn("revoke history table doesn't exist yet. Run script 020 to enable tracking.")
    }

    // Revoke admin access by changing user_type back to customer
    const { error } = await supabase
      .from("users")
      .update({
        user_type: "customer",
      })
      .eq("id", userId)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Admin access revoked" })
  } catch (error: any) {
    log.error("error removing role", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
