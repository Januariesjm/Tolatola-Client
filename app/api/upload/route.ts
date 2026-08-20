import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { logger } from "@/lib/logger"

const log = logger.child("app.api.upload")

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Generate a unique file name
    const fileExt = file.name.split(".").pop()
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
