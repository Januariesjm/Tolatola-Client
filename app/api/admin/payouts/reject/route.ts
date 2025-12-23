import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { payoutId } = await request.json()

    // Verify user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminUser } = await supabase.from("users").select("user_type").eq("id", user.id).single()

    if (adminUser?.user_type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update payout status
    const { error } = await supabase
      .from("payouts")
      .update({
        status: "failed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", payoutId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Payout rejection error:", error)
    return NextResponse.json({ error: "Failed to reject payout" }, { status: 500 })
  }
}
