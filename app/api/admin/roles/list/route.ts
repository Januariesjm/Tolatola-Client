import { createClient } from "@/lib/supabase/server"
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

    const { data: roles, error } = await supabase
      .from("admin_roles")
      .select("id, role_name, access_level, description, permissions")
      .order("access_level", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching admin roles:", error.message)
      return NextResponse.json({
        roles: [],
        error: "Admin roles table not set up yet. Please run migration script 018.",
      })
    }

    return NextResponse.json({ roles: roles || [] })
  } catch (error: any) {
    console.error("[v0] Error fetching admin roles:", error)
    return NextResponse.json({ roles: [], error: error.message }, { status: 500 })
  }
}
