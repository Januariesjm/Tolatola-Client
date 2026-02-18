"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { SiteFooter } from "@/components/layout/site-footer"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { FloatingSupportWidget } from "@/components/support/floating-support-widget"
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")
  const isAuth = pathname?.startsWith("/auth")

  return (
    <>
      <main className="flex-1 pb-32 lg:pb-0">{children}</main>
      {!isAdmin && !isAuth && <SiteFooter />}
      {!isAdmin && !isAuth && <MobileBottomNav />}
      <FloatingSupportWidget />
      {/* Cookie banner is global but respects prior consent */}
      <CookieConsentBanner />
    </>
  )
}

