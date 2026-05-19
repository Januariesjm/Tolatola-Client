import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { payoutId, userType } = await request.json()

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
        "Authorization": `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userType: userType || "vendor" })
    })

    if (!backendRes.ok) {
      const errBody = await backendRes.text()
      console.error("[v0] Backend payout approval error:", errBody)
      return NextResponse.json({ error: "Failed to approve payout" }, { status: backendRes.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Payout approval error:", error)
    return NextResponse.json({ error: "Failed to approve payout" }, { status: 500 })
  }
}
