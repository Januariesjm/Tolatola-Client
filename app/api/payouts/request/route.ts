import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { vendorId, amount, paymentMethod, paymentDetails } = await request.json()

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify vendor ownership
    const { data: vendor } = await supabase
      .from("vendors")
      .select("id")
      .eq("id", vendorId)
      .eq("user_id", user.id)
      .single()

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Create payout request
    const { data: payout, error } = await supabase
      .from("payouts")
      .insert({
        vendor_id: vendorId,
        amount,
        payment_method: paymentMethod,
        payment_details: { details: paymentDetails },
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, payout })
  } catch (error) {
    console.error("[v0] Payout request error:", error)
    return NextResponse.json({ error: "Failed to request payout" }, { status: 500 })
  }
}
