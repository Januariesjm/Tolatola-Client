import { createClient } from "@/lib/supabase/server"
import { getUserAdminRole } from "@/lib/admin/roles"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const userRole = await getUserAdminRole(user.id)
    if (!userRole) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 })
    }

    // Fetch revoke history
    const { data: history, error } = await supabase
      .from("admin_revoke_history")
      .select("*")
      .order("revoked_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching revoke history:", error.message)
      if (error.code === "42P01" || error.code === "PGRST204" || error.code === "PGRST205") {
        return NextResponse.json({ history: [], tableExists: false })
      }
      throw error
    }

    return NextResponse.json({ history: history || [], tableExists: true })
  } catch (error: any) {
    console.error("[v0] Error fetching revoke history:", error)
    return NextResponse.json({ error: error.message, history: [], tableExists: false }, { status: 200 })
  }
}
