import { NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"
import { createClient } from "@/lib/supabase/server"
import { DOCUMENT_MIME_TYPES, validateUpload } from "@/lib/api/validate-upload"

export async function POST(req: NextRequest) {
  // This route had no authentication check, so it proxied uploads to the
  // backend for anyone who could reach it.
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const upload = await validateUpload(req, { allowedTypes: DOCUMENT_MIME_TYPES })
  if (!upload.ok) return upload.response
  const { file } = upload

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
