import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!apiBase) {
    return NextResponse.json({ error: "NEXT_PUBLIC_API_BASE_URL is not set" }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is required" }, { status: 400 })
  }

  const res = await fetch(`${apiBase}/registration-recovery/resume?session_id=${encodeURIComponent(sessionId)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  if (!res.ok) {
    const detail = await res.text()
    return NextResponse.json({ error: "Failed to resume registration", detail }, { status: res.status })
  }

  const json = await res.json()
  return NextResponse.json(json)
}
