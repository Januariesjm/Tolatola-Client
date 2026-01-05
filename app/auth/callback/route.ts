import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { cookies, headers } from "next/headers"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get("token_hash")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next") ?? "/"

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error) {
      // Redirect to success page or home
      // FORCE PRODUCTION URL: prevent 0.0.0.0 or localhost redirects in containerized env
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tolatola.co'
      const redirectTo = `${appUrl}/auth/verified`
      return NextResponse.redirect(redirectTo)
    }
  }

  // Return the user to an error page with instructions
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tolatola.co'
  return NextResponse.redirect(`${appUrl}/auth/auth-code-error`)
}
