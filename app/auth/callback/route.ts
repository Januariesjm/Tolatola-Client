import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies, headers } from "next/headers"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next") ?? "/"
  const error_param = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tolatola.co'

  // Log all parameters for debugging
  console.log('[AUTH CALLBACK] Request received:', {
    code: code ? `${code.substring(0, 10)}...` : null,
    token_hash: token_hash ? `${token_hash.substring(0, 10)}...` : null,
    type,
    next,
    error_param,
    error_description,
    allParams: Object.fromEntries(requestUrl.searchParams)
  })

  // Check if OAuth provider returned an error
  if (error_param) {
    console.error('[AUTH CALLBACK] OAuth provider error:', { error_param, error_description })
    return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=${encodeURIComponent(error_description || error_param)}`)
  }

  const supabase = await createClient()

  // Handle OAuth callback (Google, Facebook, etc.)
  if (code) {
    console.log('[AUTH CALLBACK] Processing OAuth code exchange...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[AUTH CALLBACK] OAuth code exchange error:', {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack
      })
      return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
    }

    if (data?.session) {
      const { user } = data.session
      console.log('[AUTH CALLBACK] OAuth successful, user:', user.email)

      // Get user profile from database to check user type
      // We check the database INSTEAD of just metadata because metadata might be out of sync
      const { data: profile, error: profileError } = await ((supabase
        .from("users") as any)
        .select("user_type")
        .eq("id", user.id) as any)
        .maybeSingle()

      if (profileError) {
        console.error('[AUTH CALLBACK] Error fetching user profile:', profileError)
      }

      const typedProfile = profile as { user_type: string } | null

      // If user doesn't have a record in users table or missing user_type, check by email (for account linking)
      if (!typedProfile || !typedProfile.user_type) {
        console.log('[AUTH CALLBACK] User type missing, checking for existing profile by email:', user.email)

        const { data: emailProfile, error: emailProfileError } = await ((supabase
          .from("users") as any)
          .select("user_type, id")
          .eq("email", user.email!) as any)
          .maybeSingle()

        if (emailProfile && emailProfile.user_type) {
          console.log('[AUTH CALLBACK] Found existing profile by email with type:', emailProfile.user_type)

          // Trigger backend rebinding
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
          if (apiBase) {
            console.log('[AUTH CALLBACK] Triggering backend ID rebinding...')
            try {
              await fetch(`${apiBase}/users/${user.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${data.session.access_token}`
                },
                body: JSON.stringify({
                  user_type: emailProfile.user_type,
                  full_name: user.user_metadata?.full_name
                })
              })
              console.log('[AUTH CALLBACK] Backend rebinding triggered successfully')
            } catch (fetchError) {
              console.error('[AUTH CALLBACK] Failed to trigger backend rebinding:', fetchError)
            }
          }

          let redirectTo = next && next !== "/" ? (next.startsWith('http') ? next : `${appUrl}${next}`) : null
          if (!redirectTo) {
            if (emailProfile.user_type === "admin") redirectTo = `${appUrl}/admin`
            else if (emailProfile.user_type === "vendor") redirectTo = `${appUrl}/vendor/dashboard`
            else if (emailProfile.user_type === "transporter") redirectTo = `${appUrl}/transporter/dashboard`
            else redirectTo = `${appUrl}/shop`
          }

          console.log('[AUTH CALLBACK] Redirecting existing email user to:', redirectTo)
          return NextResponse.redirect(redirectTo)
        }

        console.log('[AUTH CALLBACK] No existing profile found by ID or email. Redirecting to profile completion.')

        // Preserve the 'next' parameter if it exists
        const completeProfileUrl = new URL(`${appUrl}/auth/complete-profile`)
        completeProfileUrl.searchParams.set('from', 'oauth')
        if (next && next !== '/') {
          completeProfileUrl.searchParams.set('next', next)
        }

        return NextResponse.redirect(completeProfileUrl.toString())
      }

      // Existing user with complete profile - redirect to appropriate dashboard
      console.log('[AUTH CALLBACK] Existing user detected with type:', typedProfile.user_type)

      // Determine redirect based on user type
      let redirectTo = appUrl

      if (next && next !== "/") {
        // If there's a specific next parameter, use it
        redirectTo = next.startsWith('http') ? next : `${appUrl}${next}`
      } else if (typedProfile.user_type === "admin") {
        redirectTo = `${appUrl}/admin`
      } else if (typedProfile.user_type === "vendor") {
        redirectTo = `${appUrl}/vendor/dashboard`
      } else if (typedProfile.user_type === "transporter") {
        redirectTo = `${appUrl}/transporter/dashboard`
      } else {
        // Customer or default - go to shop
        redirectTo = `${appUrl}/shop`
      }

      console.log('[AUTH CALLBACK] Redirecting to:', redirectTo)
      return NextResponse.redirect(redirectTo)
    }

    console.error('[AUTH CALLBACK] No session returned from code exchange')
    return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=NoSessionReturned`)
  }

  // Handle email verification callback
  if (token_hash && type) {
    console.log('[AUTH CALLBACK] Processing email verification...')
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      console.log('[AUTH CALLBACK] Email verification successful')
      return NextResponse.redirect(`${appUrl}/auth/verified`)
    }

    console.error('[AUTH CALLBACK] Email verification error:', error)
    return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
  }

  // No valid parameters provided
  console.error('[AUTH CALLBACK] No valid parameters provided')
  return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=MissingParameters`)
}
