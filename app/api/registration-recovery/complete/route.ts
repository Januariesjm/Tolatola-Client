import { NextRequest, NextResponse } from "next/server"
import { validateRequestBody } from "@/lib/api/validate-request"
import { registrationRecoveryCompleteSchema } from "@/lib/schemas/api"

export async function POST(req: NextRequest) {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!apiBase) {
    return NextResponse.json({ error: "NEXT_PUBLIC_API_BASE_URL is not set" }, { status: 500 })
  }

  const parsed = await validateRequestBody(req, registrationRecoveryCompleteSchema, "registration-recovery.complete")
  if (!parsed.ok) return parsed.response

  const body = parsed.data

  const res = await fetch(`${apiBase}/registration-recovery/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const detail = await res.text()
    return NextResponse.json({ error: "Failed to complete registration", detail }, { status: res.status })
  }

  const json = await res.json()
  return NextResponse.json(json)
}
