import type { Metadata } from "next"
import ClientPage from "./client-page"

export const metadata: Metadata = {
  title: "Become a Transporter | TOLA Tanzania - Logistics & Delivery",
  description:
    "Join TOLA Tanzania logistics. Deliver for Tanzania's online marketplace. Earn with last-mile delivery, secure payments. Register as a transporter.",
  alternates: {
    canonical: "https://tolatola.co/transporter/register",
  },
  openGraph: {
    title: "Become a Transporter | TOLA Tanzania Marketplace",
    description: "Deliver for TOLA - Tanzania's ecommerce platform. Join our logistics network and earn.",
    url: "https://tolatola.co/transporter/register",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function TransporterRegisterPage() {
  return <ClientPage />
}
