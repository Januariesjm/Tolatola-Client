import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { validateRequestBody } from "@/lib/api/validate-request"
import { profileUpdateSchema } from "@/lib/schemas/api"

const log = logger.child("app.api.profile.update")

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = await validateRequestBody(request, profileUpdateSchema, "profile.update")
    if (!parsed.ok) return parsed.response

    const { full_name, phone, address } = parsed.data

    const { error } = await supabase
      .from("users")
      .update({
        full_name,
        phone,
        address,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error("error updating profile", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
