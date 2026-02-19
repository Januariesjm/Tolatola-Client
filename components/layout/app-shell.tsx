"use client"

import type React from "react"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import { SiteFooter } from "@/components/layout/site-footer"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"

const FloatingSupportWidget = dynamic(
  () => import("@/components/support/floating-support-widget").then((m) => ({ default: m.FloatingSupportWidget })),
  { ssr: false }
)

const CookieConsentBanner = dynamic(
  () => import("@/components/layout/cookie-consent-banner").then((m) => ({ default: m.CookieConsentBanner })),
  { ssr: false }
)

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

