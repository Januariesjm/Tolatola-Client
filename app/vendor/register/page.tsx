import type { Metadata } from "next"

import ClientPage from "./client-page"

export const metadata: Metadata = {
  title: "Become a Vendor | Sell on TOLA Tanzania Marketplace",
  description:
    "Sell on Tanzania's online marketplace. Register as a vendor on TOLA - verified sellers, secure payouts, M-Pesa. KYC with TIN, NIDA, business license. Join vendors Tanzania.",
  alternates: {
    canonical: "https://tolatola.co/vendor/register",
  },
  openGraph: {
    title: "Become a Vendor | TOLA Tanzania - Marketplace for Sellers",
    description: "Sell online in Tanzania. Join TOLA marketplace - verified vendors, secure escrow, best prices.",
    url: "https://tolatola.co/vendor/register",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function VendorRegisterPage() {
  return <ClientPage />
}
