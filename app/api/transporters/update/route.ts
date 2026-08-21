import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { validateRequestBody } from "@/lib/api/validate-request"
import { transporterUpdateSchema } from "@/lib/schemas/api"

const log = logger.child("app.api.transporters.update")

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = await validateRequestBody(request, transporterUpdateSchema, "transporters.update")
    if (!parsed.ok) return parsed.response

    const { business_name, vehicle_type, license_plate } = parsed.data

    const { error } = await supabase
      .from("transporters")
      .update({
        business_name,
        vehicle_type,
        license_plate,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error("error updating transporter details", error)
    return NextResponse.json({ error: "Failed to update transporter details" }, { status: 500 })
  }
}
