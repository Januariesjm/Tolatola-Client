import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { validateRequestBody } from "@/lib/api/validate-request"
import { customerKycSubmitSchema } from "@/lib/schemas/api"

const log = logger.child("app.api.kyc.submit")

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // The schema omits `user_id` and Zod strips unknown keys, so the column can
    // only come from the session below. Previously the whole body was spread into
    // the update, letting a caller reassign their KYC record to another user.
    const parsed = await validateRequestBody(request, customerKycSubmitSchema, "kyc.submit")
    if (!parsed.ok) return parsed.response

    const body = parsed.data

    const { data: existingKyc } = await supabase.from("customer_kyc").select("id").eq("user_id", user.id).maybeSingle()

    if (existingKyc) {
      // Update existing KYC
      const { error } = await supabase
        .from("customer_kyc")
        .update({
          ...body,
          user_id: user.id,
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
    log.error("error submitting KYC", error)
    return NextResponse.json({ error: "Failed to submit KYC" }, { status: 500 })
  }
}
