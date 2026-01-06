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
      console.log('[AUTH CALLBACK] OAuth successful, user:', data.session.user.email)

      // Check if this is a new user without profile completion
      const userMetadata = data.session.user.user_metadata
      const userType = userMetadata?.user_type

      // If user doesn't have a user_type, redirect to profile completion
      if (!userType) {
        console.log('[AUTH CALLBACK] New OAuth user needs profile completion')
        return NextResponse.redirect(`${appUrl}/auth/complete-profile?from=oauth`)
      }

      // OAuth successful with complete profile - redirect to next page or home
      const redirectTo = next !== "/" ? next : `${appUrl}/`
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
