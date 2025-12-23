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

    const { data: roles, error } = await supabase
      .from("admin_roles")
      .select("*")
      .order("access_level", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: roles })
  } catch (error: any) {
    console.error("[v0] Error fetching roles:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
