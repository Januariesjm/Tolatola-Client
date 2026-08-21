import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { DOCUMENT_MIME_TYPES, safeFileExtension, safePathSegment, validateUpload } from "@/lib/api/validate-upload"

const log = logger.child("app.api.kyc.upload-document")

const BUCKET_NAME = "kyc-documents"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const upload = await validateUpload(request, { allowedTypes: DOCUMENT_MIME_TYPES })
    if (!upload.ok) return upload.response
    const { file, formData } = upload

    const documentType = formData.get("documentType")

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage with organized folder structure
    // Path format: {user_id}/{documentType}-{timestamp}-{filename}
    // This matches the RLS policy requirement: (storage.foldername(name))[1] = auth.uid()::text
    // Both documentType and file.name arrive from the client and are
    // concatenated into the bucket key, so each is reduced to a safe segment --
    // otherwise a name containing "../" escapes the user's own folder, which is
    // exactly what the RLS policy on this bucket relies on.
    const typeSegment = safePathSegment(typeof documentType === "string" ? documentType : undefined, "document")
    const extension = safeFileExtension(file.name)
    const filename = `${user.id}/${typeSegment}-${Date.now()}.${extension}`

    const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filename, buffer, {
      contentType: file.type,
      upsert: true,
    })

    if (uploadError) {
      log.error("upload error", uploadError)
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename)

    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    log.error("upload error", error)
    return NextResponse.json({ error: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}` }, { status: 500 })
  }
}
