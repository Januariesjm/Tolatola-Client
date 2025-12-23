import type { Metadata } from "next"

import ClientPage from "./client-page"

export const metadata: Metadata = {
  title: "Vendor Registration",
  description:
    "Register as a vendor on TOLA marketplace. Complete KYC verification with your TIN, NIDA, and business license to start selling across Tanzania.",
  alternates: {
    canonical: "https://tolatola.vercel.app/vendor/register",
  },
  openGraph: {
    title: "Become a Vendor on TOLA",
    description: "Start selling your products on Tanzania's trusted marketplace",
    url: "https://tolatola.vercel.app/vendor/register",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function VendorRegisterPage() {
  return <ClientPage />
}
