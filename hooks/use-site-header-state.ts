"use client"

import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { clientApiGet } from "@/lib/api-client"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/types"

const log = logger.child("layout.site-header")

/** Authenticated user as the header needs it. */
export interface HeaderUser {
  id: string
  email?: string | null
}

/** Profile fields the header renders. */
export interface HeaderProfile {
  full_name?: string | null
  email?: string | null
  profile_image_url?: string | null
  user_type?: string | null
  kyc_status?: string | null
}

/** One line item in the localStorage cart, as far as the badge cares. */
interface CartLine {
  quantity?: number
}

export interface UseSiteHeaderStateOptions {
  user?: HeaderUser | null
  profile?: HeaderProfile | null
  kycStatus?: string | null
}

/**
 * Session, cart-badge and scroll state for the site header.
 *
 * Extracted from components/layout/site-header.tsx: the component was over the
 * 500-line limit and mixed four independent effects with its markup.
 */
export function useSiteHeaderState({ user, profile, kycStatus }: UseSiteHeaderStateOptions) {
  const [authUser, setAuthUser] = useState<HeaderUser | null>(user ?? null)
  const [authProfile, setAuthProfile] = useState<HeaderProfile | null>(profile ?? null)
  const [authKyc, setAuthKyc] = useState<string | null>(kycStatus || null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient<Database>()
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    localStorage.removeItem("cart")
    window.dispatchEvent(new Event("cartUpdated"))
    router.refresh()
    router.push("/")
  }, [router, supabase])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Track cart count for mobile header badges.
  useEffect(() => {
    const updateCartCount = () => {
      const cart: CartLine[] = JSON.parse(localStorage.getItem("cart") || "[]")
      setCartCount(cart.reduce((acc, item) => acc + (item.quantity ?? 0), 0))
    }
    updateCartCount()
    window.addEventListener("cartUpdated", updateCartCount)
    window.addEventListener("storage", updateCartCount)
    return () => {
      window.removeEventListener("cartUpdated", updateCartCount)
      window.removeEventListener("storage", updateCartCount)
    }
  }, [])

  useEffect(() => {
    if (user) {
      setAuthUser(user)
      setAuthProfile(profile ?? null)
      setAuthKyc(kycStatus || null)
      return
    }

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) return

      setAuthUser(session.user as HeaderUser)
      try {
        const res = await clientApiGet<{ profile: HeaderProfile }>("profile")
        setAuthProfile(res.profile)
        setAuthKyc(res.profile?.kyc_status || null)
      } catch (err) {
        log.error("failed to load header profile", err)
      }
    }
    loadSession()
  }, [user, profile, kycStatus, supabase])

  return {
    authUser,
    authProfile,
    authKyc,
    mobileMenuOpen,
    setMobileMenuOpen,
    scrolled,
    cartCount,
    handleLogout,
    isVerified: (authKyc || kycStatus) === "approved",
    isHome: pathname === "/",
  }
}

/** Two-letter initials for the avatar fallback. */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}
