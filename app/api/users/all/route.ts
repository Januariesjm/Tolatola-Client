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

    // Only admins can view all users
    const access = await checkAdminAccess(user.id, "manage_admins")
    if (!access.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, full_name, user_type, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: users })
  } catch (error: any) {
    console.error("[v0] Error fetching users:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
