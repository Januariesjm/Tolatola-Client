import { NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "file is required" }, { status: 400 })
  }

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
  if (!apiBase) {
    return NextResponse.json({ error: "NEXT_PUBLIC_API_BASE_URL is not set" }, { status: 500 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const contentType = file.type || "application/octet-stream"
  const filename = file.name || "upload.bin"

  const uploadRes = await fetch(`${apiBase}/uploads/transporter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename,
      data: `data:${contentType};base64,${base64}`,
      contentType,
    }),
  })

  if (!uploadRes.ok) {
    const detail = await uploadRes.text()
    return NextResponse.json({ error: "Failed to upload document", detail }, { status: uploadRes.status })
  }

  const json = await uploadRes.json()
  return NextResponse.json(json)
}
