import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { serverApiPost } from "@/lib/api-server"
import { logger, normalizeError } from "@/lib/logger"

const log = logger.child("app.api.profile.delete")

/**
 * Deletes the caller's own account.
 *
 * Takes no request body — the user is resolved from the session, never from
 * input — so there is nothing here for a schema to validate.
 */
export async function POST() {
  try {
    // 1. Verify the user is authenticated using the server client
    const supabaseServer = await createServerClient()
    const {
      data: { user },
    } = await supabaseServer.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Delegate the user deletion and database cleanup to the backend API
    const response = await serverApiPost<{ success: boolean; message?: string }>("profile/delete")

    return NextResponse.json(response)
  } catch (error) {
    log.error("error deleting account", error)
    return NextResponse.json({ error: normalizeError(error).message || "Failed to delete account" }, { status: 500 })
  }
}
