import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PDF, JPG, and PNG are allowed" }, { status: 400 })
    }

    const bucketName = process.env.STORAGE_BUCKET || "uploads"
    let supabase;

    // Use Service Role Key if available to bypass RLS for registration uploads
    if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log("Using Supabase Service Role Client for upload");
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            persistSession: false
          }
        }
      );
    } else {
      console.log("Using standard RouteHandlerClient as fallback");
      supabase = createRouteHandlerClient({ cookies });
    }

    // Upload to Supabase Storage
    const fileName = `business-licenses/${Date.now()}-${file.name}`
    console.log(`Attempting to upload to bucket: ${bucketName}, file: ${fileName}`)

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error("Supabase storage upload error details:", error)
      return NextResponse.json({ error: `Failed to upload file to storage: ${error.message}`, details: error }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    console.error("Upload error catch:", error)
    return NextResponse.json({ error: `Failed to process upload request: ${error.message || error}` }, { status: 500 })
  }
}
