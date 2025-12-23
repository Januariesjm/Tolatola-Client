import { createClient } from "@/lib/supabase/server"
import { checkAdminAccess } from "@/lib/admin/middleware"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const access = await checkAdminAccess(user.id, "manage_admins")
    if (!access.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: admins, error } = await supabase
      .from("users")
      .select(
        `
        id,
        email,
        full_name,
        admin_roles!users_admin_role_id_fkey (
          role_name,
          access_level
        ),
        created_at
      `,
      )
      .not("admin_role_id", "is", null)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: admins })
  } catch (error: any) {
    console.error("[v0] Error fetching admins:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
