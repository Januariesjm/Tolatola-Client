import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyPermanentVerifyToken } from "@/lib/tokenSigner"
import { logger } from "@/lib/logger"

const log = logger.child("app.auth.callback")

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const token_hash = requestUrl.searchParams.get("token_hash")
  const v_token = requestUrl.searchParams.get("v_token")
  const uid = requestUrl.searchParams.get("uid")
  const type = requestUrl.searchParams.get("type")
  const next = requestUrl.searchParams.get("next") ?? "/"
  const error_param = requestUrl.searchParams.get("error")
  const error_description = requestUrl.searchParams.get("error_description")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tolatola.co"

  // Log all parameters for debugging
  console.log("[AUTH CALLBACK] Request received:", {
    code: code ? `${code.substring(0, 10)}...` : null,
    token_hash: token_hash ? `${token_hash.substring(0, 10)}...` : null,
    type,
    next,
    error_param,
    error_description,
    allParams: Object.fromEntries(requestUrl.searchParams),
  })

  // Check if OAuth provider returned an error
  if (error_param) {
    log.error("OAuth provider returned an error", undefined, { error_param, error_description })
    return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=${encodeURIComponent(error_description || error_param)}`)
  }

  const supabase = createRouteHandlerClient({ cookies })

  // Handle OAuth callback (Google, Facebook, etc.)
  if (code) {
    console.log("[AUTH CALLBACK] Processing OAuth code exchange...")
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      log.error("OAuth code exchange failed", undefined, {
        message: error.message,
        status: error.status,
        name: error.name,
        stack: error.stack,
      })
      return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
    }

    if (data?.session) {
      const { user } = data.session
      console.log("[AUTH CALLBACK] OAuth successful, user:", user.email)

      // Get user profile from database to check user type
      // We check the database INSTEAD of just metadata because metadata might be out of sync
      const { data: profile, error: profileError } = await (
        (supabase.from("users") as any).select("user_type").eq("id", user.id) as any
      ).maybeSingle()

      if (profileError) {
        log.error("error fetching user profile", profileError)
      }

      const typedProfile = profile as { user_type: string } | null

      // If user doesn't have a record in users table or missing user_type, check by email (for account linking)
      if (!typedProfile || !typedProfile.user_type) {
        console.log("[AUTH CALLBACK] User type missing, checking for existing profile by email:", user.email)

        const { data: emailProfile, error: emailProfileError } = await (
          (supabase.from("users") as any).select("user_type, id").eq("email", user.email!) as any
        ).maybeSingle()

        if (emailProfile && emailProfile.user_type) {
          console.log("[AUTH CALLBACK] Found existing profile by email with type:", emailProfile.user_type)

          // Trigger backend rebinding
          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
          if (apiBase) {
            console.log("[AUTH CALLBACK] Triggering backend ID rebinding...")
            try {
              await fetch(`${apiBase}/users/${user.id}`, {
                method: "PATCH",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${data.session.access_token}`,
                },
                body: JSON.stringify({
                  user_type: emailProfile.user_type,
                  full_name: user.user_metadata?.full_name,
                }),
              })
              console.log("[AUTH CALLBACK] Backend rebinding triggered successfully")
            } catch (fetchError) {
              log.error("failed to trigger backend rebinding", fetchError)
            }
          }

          let redirectTo = next && next !== "/" ? (next.startsWith("http") ? next : `${appUrl}${next}`) : null
          if (!redirectTo) {
            if (emailProfile.user_type === "admin") redirectTo = `${appUrl}/admin`
            else if (emailProfile.user_type === "vendor") redirectTo = `${appUrl}/vendor/dashboard`
            else if (emailProfile.user_type === "transporter") redirectTo = `${appUrl}/transporter/dashboard`
            else redirectTo = `${appUrl}/shop`
          }

          console.log("[AUTH CALLBACK] Redirecting existing email user to:", redirectTo)
          return NextResponse.redirect(redirectTo)
        }

        const ref = requestUrl.searchParams.get("ref")

        // Preserve the 'next' and 'ref' parameters if they exist
        const completeProfileUrl = new URL(`${appUrl}/auth/complete-profile`)
        completeProfileUrl.searchParams.set("from", "oauth")
        if (next && next !== "/") {
          completeProfileUrl.searchParams.set("next", next)
        }
        if (ref) {
          completeProfileUrl.searchParams.set("ref", ref)
        }

        return NextResponse.redirect(completeProfileUrl.toString())
      }

      // Existing user with complete profile - redirect to appropriate dashboard
      console.log("[AUTH CALLBACK] Existing user detected with type:", typedProfile.user_type)

      // Determine redirect based on user type
      let redirectTo = appUrl

      if (next && next !== "/") {
        // If there's a specific next parameter, use it
        redirectTo = next.startsWith("http") ? next : `${appUrl}${next}`
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

      console.log("[AUTH CALLBACK] Redirecting to:", redirectTo)
      return NextResponse.redirect(redirectTo)
    }

    log.error("no session returned from code exchange")
    return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=NoSessionReturned`)
  }

  // Handle permanent non-expiring multi-clickable verification link (v_token)
  if (v_token) {
    console.log("[AUTH CALLBACK] Processing permanent non-expiring verification token...")
    const payload = verifyPermanentVerifyToken(v_token)
    const targetUserId = payload?.u || uid
    const targetEmail = payload?.e || requestUrl.searchParams.get("email")

    if (payload && targetUserId) {
      console.log("[AUTH CALLBACK] Permanent token signature valid for user:", targetUserId, targetEmail)

      // 1. Call backend API to confirm email & update tables
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
      if (apiBase) {
        try {
          await fetch(`${apiBase}/auth/confirm-verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: targetUserId, email: targetEmail }),
          })
        } catch (e) {
          log.error("error calling backend confirm-verify", e)
        }
      }

      // 2. Directly update is_verified in public.users
      try {
        await (supabase.from("users") as any).update({ is_verified: true }).eq("id", targetUserId)
      } catch (e) {
        // ignore
      }

      // 3. Fetch profile user_type for dashboard routing
      let userType = null
      try {
        const { data: userProfile } = await (
          (supabase.from("users") as any).select("user_type").eq("id", targetUserId) as any
        ).maybeSingle()
        userType = userProfile?.user_type
      } catch (e) {
        // ignore
      }

      const targetNext = requestUrl.searchParams.get("next")
      if (targetNext && targetNext !== "/") {
        return NextResponse.redirect(`${appUrl}${targetNext}`)
      }

      if (userType === "vendor") {
        return NextResponse.redirect(`${appUrl}/vendor/dashboard`)
      } else if (userType === "transporter") {
        return NextResponse.redirect(`${appUrl}/transporter/dashboard`)
      }

      return NextResponse.redirect(`${appUrl}/auth/verified`)
    }
  }

  // Handle email verification callback
  if (token_hash && type) {
    console.log("[AUTH CALLBACK] Processing email verification...", { token_hash: token_hash.substring(0, 10), type })

    // If setting up agent password, redirect directly to the page without calling verifyOtp
    // to avoid consuming the single-use token on GET. The setup page will perform the OTP
    // verification and password update inside the form submit action.
    if (next && next.startsWith("/agent/setup")) {
      console.log("[AUTH CALLBACK] Redirecting directly to agent setup to preserve token_hash")
      const emailParam = requestUrl.searchParams.get("email")
      const emailQuery = emailParam ? `&email=${encodeURIComponent(emailParam)}` : ""
      return NextResponse.redirect(`${appUrl}${next}${next.includes("?") ? "&" : "?"}token_hash=${token_hash}&type=${type}${emailQuery}`)
    }

    const { data: verifyData, error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })

    if (!error && verifyData?.user) {
      console.log("[AUTH CALLBACK] Email verification successful for user:", verifyData.user.email)

      const user = verifyData.user
      const userType = user.user_metadata?.user_type

      // 1. Update public.users is_verified status
      try {
        await (supabase.from("users") as any).update({ is_verified: true }).eq("id", user.id)
      } catch (dbErr) {
        log.error("failed to update is_verified in public.users", dbErr)
      }

      // 2. Mark incomplete registration recovery record as completed
      if (user.email) {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
        if (apiBase) {
          try {
            await fetch(`${apiBase}/registration-recovery/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email }),
            })
          } catch (recErr) {
            log.error("failed to mark incomplete registration completed", recErr)
          }
        }
      }

      // Determine appropriate redirect destination
      const targetNext = requestUrl.searchParams.get("next")
      if (targetNext && targetNext !== "/") {
        return NextResponse.redirect(`${appUrl}${targetNext}`)
      }

      if (userType === "vendor") {
        return NextResponse.redirect(`${appUrl}/vendor/dashboard`)
      } else if (userType === "transporter") {
        return NextResponse.redirect(`${appUrl}/transporter/dashboard`)
      }

      return NextResponse.redirect(`${appUrl}/auth/verified`)
    }

    if (error) {
      log.error("email verification error", error)

      // Fallback: Check if session user is already confirmed (e.g. link pre-fetched by email scanner)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        console.log("[AUTH CALLBACK] User is already confirmed, proceeding to dashboard...")
        const userType = session.user.user_metadata?.user_type
        if (userType === "vendor") return NextResponse.redirect(`${appUrl}/vendor/dashboard`)
        if (userType === "transporter") return NextResponse.redirect(`${appUrl}/transporter/dashboard`)
        return NextResponse.redirect(`${appUrl}/auth/verified`)
      }

      const emailForResend = requestUrl.searchParams.get("email") || ""
      const emailQuery = emailForResend ? `&email=${encodeURIComponent(emailForResend)}` : ""
      return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=${encodeURIComponent(error.message)}${emailQuery}`)
    }
  }

  // No valid parameters provided
  log.error("no valid parameters provided")
  const fallbackEmail = requestUrl.searchParams.get("email") || ""
  const fallbackEmailQuery = fallbackEmail ? `&email=${encodeURIComponent(fallbackEmail)}` : ""
  return NextResponse.redirect(`${appUrl}/auth/auth-code-error?error=MissingParameters${fallbackEmailQuery}`)
}
