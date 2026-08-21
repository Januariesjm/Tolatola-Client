import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { IMAGE_MIME_TYPES, safeFileExtension, validateUpload } from "@/lib/api/validate-upload"

const log = logger.child("app.api.upload")

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // This route had NO authentication check: anyone who could reach it could
    // write arbitrary files into the public "promotions" bucket.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const upload = await validateUpload(request, { allowedTypes: IMAGE_MIME_TYPES })
    if (!upload.ok) return upload.response
    const { file } = upload

    // Derived defensively: file.name is attacker-controlled and is concatenated
    // into the bucket key below.
    const fileExt = safeFileExtension(file.name, "png")
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    // Upload to 'promotions' bucket
    const { data, error } = await supabase.storage.from("promotions").upload(filePath, file)

    if (error) {
      log.error("supabase storage upload failed", error)
      return NextResponse.json(
        {
          error: "Upload to Supabase failed",
          details: error.message || "Unknown error",
          code: (error as any).statusCode || "500",
        },
        { status: 500 },
      )
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from("promotions").getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrlData.publicUrl,
      filename: fileName,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    log.error("upload handler caught exception", error)
    return NextResponse.json(
      {
        error: "Internal Server Error in Upload Handler",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
