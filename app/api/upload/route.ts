import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // Generate a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    // Upload to 'promotions' bucket
    const { data, error } = await supabase.storage
      .from('promotions')
      .upload(filePath, file)

    if (error) {
      console.error("Supabase storage upload error:", error)
      // If bucket doesn't exist, try 'public' or 'images' as fallback? 
      // Or just fail and rely on user creating the bucket.
      return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('promotions')
      .getPublicUrl(filePath)

    return NextResponse.json({
      url: publicUrl,
      filename: fileName,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Upload handler error:", error)
    return NextResponse.json({ error: "Upload failed internal" }, { status: 500 })
  }
}
