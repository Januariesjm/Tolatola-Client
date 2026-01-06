import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies, headers } from "next/headers"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next") ?? "/"
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tolatola.co'

  const supabase = await createClient()

  // Handle OAuth callback (Google, Facebook, etc.)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // OAuth successful - redirect to next page or home
      const redirectTo = next !== "/" ? next : `${appUrl}/`
      return NextResponse.redirect(redirectTo)
    }

    console.error("OAuth code exchange error:", error)
    return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
  }

  // Handle email verification callback
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      // Email verification successful
      return NextResponse.redirect(`${appUrl}/auth/verified`)
    }

    console.error("Email verification error:", error)
    return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
  }

  // No valid parameters provided
  return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=MissingParameters`)
}
