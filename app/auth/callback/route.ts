import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/shop"
  const error = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription)
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError)
      return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(exchangeError.message)}`)
    }

    // Check if user profile exists, if not create one
    if (data.user) {
      const { data: existingUser } = await supabase.from("users").select("id").eq("id", data.user.id).maybeSingle()

      if (!existingUser) {
        // Create user profile for OAuth users
        const { error: insertError } = await supabase.from("users").insert({
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || "",
          user_type: "customer",
          profile_image_url: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || "",
        })

        if (insertError) {
          console.error("Error creating user profile:", insertError)
        }
      }

      // Redirect based on user type
      const { data: userData } = await supabase.from("users").select("user_type").eq("id", data.user.id).maybeSingle()

      if (userData?.user_type === "admin") {
        return NextResponse.redirect(`${origin}/admin`)
      } else if (userData?.user_type === "vendor") {
        return NextResponse.redirect(`${origin}/vendor/dashboard`)
      }
    }

    // Use x-forwarded-host for production deployments
    const forwardedHost = request.headers.get("x-forwarded-host")
    const isLocalEnv = process.env.NODE_ENV === "development"

    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`)
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`)
    } else {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // No code provided
  return NextResponse.redirect(`${origin}/auth/login?error=NoCodeProvided`)
}
