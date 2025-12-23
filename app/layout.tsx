import type React from "react"
import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { SiteFooter } from "@/components/layout/site-footer"
import { LanguageProvider } from "@/lib/i18n/language-context"

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
    default: "TOLA - Tanzania's Premier Trade & Supply Chain Ecosystem",
    template: "%s | TOLA",
  },
  description:
    "TOLA is Tanzania's trusted Trade & Supply Chain Ecosystem connecting local producers, vendors, and customers. Shop from verified vendors, secure payments with mobile money, and enjoy fast delivery across Tanzania.",
  keywords: [
    "Tanzania marketplace",
    "multivendor platform",
    "buy online Tanzania",
    "sell products Tanzania",
    "Tanzanian vendors",
    "mobile money payments",
    "M-Pesa",
    "Tigo Pesa",
    "online shopping Tanzania",
    "TOLA marketplace",
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
    title: "TOLA - Tanzania's Premier Trade & Supply Chain Ecosystem",
    description: "Shop from verified Tanzanian vendors. Secure payments, fast delivery, mobile money support.",
    siteName: "TOLA",
    images: [
      {
        url: "/tolalogo.jpg",
        width: 1200,
        height: 630,
        alt: "TOLA Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TOLA - Tanzania's Premier Trade & Supply Chain Ecosystem",
    description: "Shop from verified vendors. Secure payments, fast delivery.",
    images: ["/tolalogo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
    generator: 'v0.app'
}

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
        <LanguageProvider>
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  )
}

