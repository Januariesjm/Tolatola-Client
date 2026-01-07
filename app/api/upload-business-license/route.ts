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
    let usingServiceKey = false;

    // Check for Service Role Key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (serviceRoleKey && supabaseUrl) {
      // Basic validation of JWT format to catch obviously bad keys
      if (serviceRoleKey.split('.').length === 3) {
        try {
          // Attempt to create client with Service Key
          supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false
            }
          });
          usingServiceKey = true;
          console.log("Using Supabase Service Role Client for upload (RLS Bypassed)");
        } catch (e) {
          console.error("Failed to initialize Supabase with Service Key:", e);
        }
      } else {
        console.warn("SUPABASE_SERVICE_ROLE_KEY appears invalid (not a JWT format). Falling back to user session.");
      }
    } else {
      console.warn("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing in environment.");
    }

    if (!usingServiceKey) {
      console.log("Using standard RouteHandlerClient as fallback (Subject to RLS)");
      supabase = createRouteHandlerClient({ cookies });

      // Debug user session
      const { data: { session } } = await supabase.auth.getSession();
      console.log(`Current session user: ${session?.user?.id || 'None'}`);
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
      const errorMsg = usingServiceKey
        ? `Upload failed with Service Key: ${error.message}`
        : `Upload failed (User Session): ${error.message}. Likely RLS or Permission issue.`;

      return NextResponse.json({ error: errorMsg, details: error }, { status: 500 })
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
