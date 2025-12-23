import type { Metadata } from "next"
import ClientPage from "./client-page"

export const metadata: Metadata = {
  title: "Transporter Registration",
  description:
    "Register as a transporter on TOLA marketplace. Complete KYC verification to start delivering products across Tanzania.",
  alternates: {
    canonical: "https://tolatola.vercel.app/transporter/register",
  },
  openGraph: {
    title: "Become a Transporter on TOLA",
    description: "Start delivering products on Tanzania's trusted marketplace",
    url: "https://tolatola.vercel.app/transporter/register",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TransporterRegisterPage() {
  return <ClientPage />
}
