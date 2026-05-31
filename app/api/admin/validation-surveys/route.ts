import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!apiBase) {
      return NextResponse.json({ error: "API URL not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const params = searchParams.toString()
    const url = `${apiBase}/admin/validation-surveys${params ? `?${params}` : ""}`

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
    })

    if (!res.ok) {
      const detail = await res.text()
      return NextResponse.json({ error: "Failed to fetch surveys", detail }, { status: res.status })
    }

    const json = await res.json()
    return NextResponse.json(json)
  } catch (error: any) {
    console.error("[VALIDATION SURVEYS API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
