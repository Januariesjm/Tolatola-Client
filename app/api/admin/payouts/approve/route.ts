import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { validateRequestBody } from "@/lib/api/validate-request"
import { payoutDecisionSchema } from "@/lib/schemas/api"

const log = logger.child("app.api.admin.payouts.approve")

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const parsed = await validateRequestBody(request, payoutDecisionSchema, "admin.payouts.approve")
    if (!parsed.ok) return parsed.response
    const { payoutId, userType } = parsed.data

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session?.access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"
    const backendRes = await fetch(`${backendUrl}/admin/payouts/${payoutId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userType: userType || "vendor" }),
    })

    if (!backendRes.ok) {
      const errBody = await backendRes.text()
      log.error("backend payout approval error", errBody)
      let errorMessage = "Failed to approve payout"
      try {
        const parsed = JSON.parse(errBody)
        if (parsed && parsed.error) {
          errorMessage = parsed.error
        }
      } catch (e) {
        // ignore
      }
      return NextResponse.json({ error: errorMessage }, { status: backendRes.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    log.error("payout approval error", error)
    return NextResponse.json({ error: "Failed to approve payout" }, { status: 500 })
  }
}
