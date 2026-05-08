import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!apiBase) {
    return NextResponse.json({ error: "NEXT_PUBLIC_API_BASE_URL is not set" }, { status: 500 })
  }

  const body = await req.json()

  const res = await fetch(`${apiBase}/registration-recovery/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text()
    return NextResponse.json({ error: "Failed to save registration progress", detail }, { status: res.status })
  }

  const json = await res.json()
  return NextResponse.json(json)
}
