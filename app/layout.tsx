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
    default: "TOLA Tanzania | Online Shopping, Marketplace & Ecommerce for Vendors",
    template: "%s | TOLA Tanzania",
  },
  description:
    "TOLA is Tanzania's online marketplace ✔ Shop from verified vendors, sell online, and manage logistics ✔ Ecommerce in Tanzania with M-Pesa & Tigo Pesa ✔ Secure escrow, best prices, wholesale to last-mile delivery.",
  keywords: [
    "online shops in Tanzania",
    "marketplace Tanzania",
    "vendors Tanzania",
    "ecommerce Tanzania",
    "online shopping Tanzania",
    "TOLA",
    "TolaTola",
    "buy online Tanzania",
    "sell online Tanzania",
    "Tanzanian marketplace",
    "multivendor platform Tanzania",
    "M-Pesa Tanzania",
    "Tigo Pesa",
    "verified vendors Tanzania",
    "digital trade Tanzania",
    "supply chain Tanzania",
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
    title: "TOLA Tanzania | Online Shopping, Marketplace & Ecommerce",
    description: "Tanzania's online marketplace ✔ Shop from verified vendors, secure payments, M-Pesa & Tigo Pesa. Best prices, escrow protection.",
    siteName: "TOLA Tanzania",
    locale: "en_TZ",
    images: [
      {
        url: "/logo-new.png",
        width: 1200,
        height: 630,
        alt: "TOLA Tanzania - Online Marketplace & Ecommerce",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TOLA Tanzania | Online Shopping, Marketplace & Ecommerce",
    description: "Shop from verified vendors in Tanzania. Secure payments, M-Pesa, best prices. Tanzania's marketplace for buyers and sellers.",
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

