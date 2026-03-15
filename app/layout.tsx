import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/lib/i18n/language-context"
import { JsonLd } from "@/components/seo/json-ld"
import { GlobalErrorLogger } from "@/components/utils/global-error-logger"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://tolatola.co"),
  title: {
    default: "TOLA Tanzania | Digital Trade and Supply Chain Ecosystem",
    template: "%s | TOLA Tanzania",
  },
  description:
    "TOLA Tanzania – Tanzania's Digital Trade and Supply Chain Ecosystem ✔ Registered with TRA, BRELA & TCRA ✔ Buy from verified vendors, sell online, ship & pay with M-Pesa & Tigo Pesa ✔ Secure escrow & nationwide logistics.",
  keywords: [
    "TOLA Tanzania",
    "TolaTola",
    "digital trade Tanzania",
    "supply chain Tanzania",
    "digital trade ecosystem",
    "TCRA registered Tanzania",
    "TRA BRELA Tanzania",
    "buy online Tanzania",
    "sell online Tanzania",
    "verified vendors Tanzania",
    "M-Pesa Tanzania",
    "Tigo Pesa",
    "online shopping Tanzania",
    "logistics Tanzania",
    "escrow Tanzania",
  ],
  authors: [{ name: "TOLA", url: "https://tolatola.co" }],
  creator: "TOLA",
  publisher: "TOLA",
  icons: {
    icon: "/logo-new.png",
    apple: "/logo-new.png",
  },
  openGraph: {
    type: "website",
    url: "https://tolatola.co",
    title: "TOLA Tanzania | Digital Trade and Supply Chain Ecosystem",
    description:
      "TOLA Tanzania – Digital Trade and Supply Chain Ecosystem ✔ Registered with TRA, BRELA & TCRA ✔ Verified vendors, secure payments, M-Pesa & Tigo Pesa, nationwide logistics.",
    siteName: "TOLA Tanzania",
    locale: "en_TZ",
    images: [
      {
        url: "https://tolatola.co/logo-new.png",
        width: 1200,
        height: 630,
        alt: "TOLA Tanzania - Digital Trade and Supply Chain Ecosystem",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TOLA Tanzania | Digital Trade and Supply Chain Ecosystem",
    description:
      "TOLA Tanzania – Digital Trade and Supply Chain Ecosystem ✔ TRA, BRELA & TCRA registered ✔ Verified vendors, M-Pesa & Tigo Pesa, secure escrow & logistics.",
    images: ["/logo-new.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://tolatola.co",
  },
}

import { AppShell } from "@/components/layout/app-shell"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning className={`${inter.variable} ${playfair.variable} antialiased`} lang="en">
      <head>
        <meta name="theme-color" content="#0f766e" />
        <link rel="preconnect" href="https://tolatola.co" />
        <link rel="dns-prefetch" href="https://tolatola.co" />
      </head>

      <body className="font-sans flex flex-col min-h-screen">
        <JsonLd />
        <LanguageProvider>
          <GlobalErrorLogger />
          <AppShell>{children}</AppShell>
        </LanguageProvider>
      </body>
    </html>
  )
}

