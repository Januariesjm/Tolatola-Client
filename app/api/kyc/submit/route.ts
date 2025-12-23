import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const { data: existingKyc } = await supabase.from("customer_kyc").select("id").eq("user_id", user.id).maybeSingle()

    if (existingKyc) {
      // Update existing KYC
      const { error } = await supabase
        .from("customer_kyc")
        .update({
          ...body,
          kyc_status: "pending",
          kyc_notes: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)

      if (error) throw error
    } else {
      // Insert new KYC
      const { error } = await supabase.from("customer_kyc").insert({
        ...body,
        user_id: user.id,
        kyc_status: "pending",
      })

      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error submitting KYC:", error)
    return NextResponse.json({ error: "Failed to submit KYC" }, { status: 500 })
  }
}
