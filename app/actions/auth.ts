"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function signInWithGoogle(returnUrl?: string) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = (process.env.NEXT_PUBLIC_APP_URL || 'https://tolatola.co').replace(/\/$/, '')

  const redirectTo = returnUrl
    ? `${origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`
    : `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  if (error) {
    console.error("Error signing in with Google:", error)
    return redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    return redirect(data.url)
  }

  return redirect("/auth/login?error=OAuthConfigurationError")
}

export async function signInWithFacebook(returnUrl?: string) {
  const supabase = await createClient()
  const origin = (process.env.NEXT_PUBLIC_APP_URL || 'https://tolatola.co').replace(/\/$/, '')

  const redirectTo = returnUrl
    ? `${origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`
    : `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo,
      scopes: "email,public_profile",
    },
  })

  if (error) {
    console.error("Error signing in with Facebook:", error)
    return redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  if (data.url) {
    return redirect(data.url)
  }

  return redirect("/auth/login?error=OAuthConfigurationError")
}
