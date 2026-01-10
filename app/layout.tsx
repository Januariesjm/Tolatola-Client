import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { SiteFooter } from "@/components/layout/site-footer"
import { LanguageProvider } from "@/lib/i18n/language-context"
import { JsonLd } from "@/components/seo/json-ld"
import { GlobalErrorLogger } from "@/components/utils/global-error-logger"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://tolatola.co"),
  title: {
    default: "TOLA - Tanzania's Leading Supply Chain & Trade Platform",
    template: "%s | TOLA",
  },
  description:
    "TOLA (TolaTola) is Tanzania's premier trade ecosystem. Connect with vendors, shop verified products, and experience secure supply chain solutions across Tanzania.",
  keywords: [
    "TOLA",
    "TolaTola",
    "Tola Tanzania",
    "Tanzania Digital trade and Supply Chain Ecosystem",
    "multivendor platform",
    "buy online Tanzania",
    "sell products Tanzania",
    "Tanzanian vendors",
    "mobile money payments",
    "M-Pesa",
    "Tigo Pesa",
    "online shopping Tanzania",
    "TOLA Digital trade and Supply Chain Ecosystem",
  ],
  authors: [{ name: "TOLA" }],
  creator: "TOLA",
  publisher: "TOLA",
  icons: {
    icon: "/tolalogo.jpg",
  },
  openGraph: {
    type: "website",
    url: "https://tolatola.co",
    title: "TOLA - Tanzania's Premier Trade Ecosystem",
    description: "Shop from verified vendors in Tanzania. TOLA: Secure, Fast, and Reliable Trade.",
    siteName: "TOLA",
    images: [
      {
        url: "/tolalogo.jpg",
        width: 1200,
        height: 630,
        alt: "TOLA - Tanzania Trade Ecosystem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TOLA - Leading Trade & Supply Chain Platform in Tanzania",
    description: "Your trusted gateway to Tanzanian trade. Secure payments, verified vendors.",
    images: ["/tolalogo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  generator: 'v0.app'
}

import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning className={`${inter.variable} ${playfair.variable} antialiased`}>
      <head>
        <link rel="canonical" href="https://tolatola.co" />
      </head>

      <body className="font-sans flex flex-col min-h-screen">
        <JsonLd />
        <LanguageProvider>
          <GlobalErrorLogger />
          <main className="flex-1 pb-16 lg:pb-0">{children}</main>
          <SiteFooter />
          <MobileBottomNav />
        </LanguageProvider>
      </body>
    </html>
  )
}

