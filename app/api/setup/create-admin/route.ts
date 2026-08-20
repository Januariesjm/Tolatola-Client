import { createHash, timingSafeEqual } from "crypto"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

const log = logger.child("app.api.setup.create-admin")

/**
 * Constant-time comparison of two secrets of arbitrary length.
 *
 * Both sides are hashed first so the buffers handed to timingSafeEqual are
 * always the same size, which keeps it from throwing on a length mismatch and
 * stops the comparison from leaking the expected key's length.
 */
function secretsMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest()
  const b = createHash("sha256").update(expected).digest()
  return timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  try {
    // No fallback: an unset ADMIN_SETUP_KEY disables this route entirely rather
    // than leaving admin creation behind a key that is public in the source.
    const setupKeySecret = process.env.ADMIN_SETUP_KEY

    if (!setupKeySecret) {
      log.error("aDMIN_SETUP_KEY is not set; refusing request")
      return NextResponse.json({ error: "Admin setup is not configured on this deployment." }, { status: 503 })
    }

    const { email, password, fullName, setupKey } = await request.json()

    // Verify setup key
    if (typeof setupKey !== "string" || !secretsMatch(setupKey, setupKeySecret)) {
      return NextResponse.json({ error: "Invalid setup key" }, { status: 403 })
    }

    // Validate input
    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = (await createClient()) as any

    // Check if any admin user already exists
    const { data: existingAdmins, error: checkError } = await supabase.from("users").select("id").eq("user_type", "admin").limit(1)

    if (checkError) {
      log.error("error checking existing admins", checkError)
      return NextResponse.json({ error: "Failed to check existing admins" }, { status: 500 })
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({ error: "Admin user already exists. This setup can only be used once." }, { status: 400 })
    }

    // Create the admin user using Supabase Auth Admin API
    // Note: This requires service role key
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        user_type: "admin",
        full_name: fullName,
      },
    })

    if (authError) {
      log.error("error creating admin user", authError)
      return NextResponse.json({ error: authError.message || "Failed to create admin user" }, { status: 500 })
    }

    // Update the user profile to ensure admin role
    const { error: updateError } = await supabase
      .from("users")
      .update({
        user_type: "admin",
        full_name: fullName,
        phone: "+255000000000",
      })
      .eq("id", authData.user.id)

    if (updateError) {
      log.error("error updating user profile", updateError)
      // Don't fail the request, the trigger should have set it
    }

    return NextResponse.json({
      success: true,
      message: "Admin user created successfully",
      userId: authData.user.id,
    })
  } catch (error: any) {
    log.error("error in create-admin route", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
