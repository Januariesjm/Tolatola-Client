import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"
import { DOCUMENT_MIME_TYPES, validateUpload } from "@/lib/api/validate-upload"

const log = logger.child("app.api.upload-business-license")

export async function POST(request: Request) {
  try {
    // Same limits this route already enforced (5MB; PDF/JPEG/PNG), now from the
    // shared validator so every upload route agrees.
    const upload = await validateUpload(request, { allowedTypes: DOCUMENT_MIME_TYPES })
    if (!upload.ok) return upload.response
    const { file } = upload

    const bucketName = process.env.STORAGE_BUCKET || "uploads"
    let supabase: any
    let usingServiceKey = false

    // Check for Service Role Key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

    if (serviceRoleKey && supabaseUrl) {
      // Basic validation of JWT format to catch obviously bad keys
      if (serviceRoleKey.split(".").length === 3) {
        try {
          // Attempt to create client with Service Key
          supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          })
          usingServiceKey = true
          console.log("Using Supabase Service Role Client for upload (RLS Bypassed)")
        } catch (e) {
          log.error("failed to initialize Supabase with Service Key", e)
        }
      } else {
        log.warn("SUPABASE_SERVICE_ROLE_KEY appears invalid (not a JWT); falling back to the user session")
      }
    } else {
      log.warn("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing from the environment")
    }

    if (!usingServiceKey) {
      console.log("Using standard RouteHandlerClient as fallback (Subject to RLS)")
      supabase = createRouteHandlerClient({ cookies })

      // Debug user session
      const {
        data: { session },
      } = await supabase.auth.getSession()
      console.log(`Current session user: ${session?.user?.id || "None"}`)
    }

    // Upload to Supabase Storage
    const fileName = `business-licenses/${Date.now()}-${file.name}`
    console.log(`Attempting to upload to bucket: ${bucketName}, file: ${fileName}`)

    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    })

    if (error) {
      log.error("supabase storage upload error details", error)
      const errorMsg = usingServiceKey
        ? `Upload failed with Service Key: ${error.message}`
        : `Upload failed (User Session): ${error.message}. Likely RLS or Permission issue.`

      return NextResponse.json({ error: errorMsg, details: error }, { status: 500 })
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(fileName)

    return NextResponse.json({ url: publicUrl })
  } catch (error: any) {
    log.error("upload error catch", error)
    return NextResponse.json({ error: `Failed to process upload request: ${error.message || error}` }, { status: 500 })
  }
}
