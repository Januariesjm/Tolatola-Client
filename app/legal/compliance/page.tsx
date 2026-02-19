import SiteHeader from "@/components/layout/site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Legal & Compliance | TOLA Tanzania - Marketplace & Ecommerce",
  description:
    "Legal framework, insurance, and risk management for TOLA Tanzania. Platform liability, risk transfer, and mandatory insurance for our marketplace.",
  alternates: {
    canonical: "https://tolatola.co/legal/compliance",
  },
}

export default function LegalCompliancePage() {
  return (
    <div className="flex flex-col min-h-screen bg-stone-50">
      <SiteHeader />

      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4 text-center">
            <Badge
              variant="outline"
              className="px-4 py-1 border-primary/20 text-primary bg-primary/5 mb-4"
            >
              LEGAL &amp; COMPLIANCE
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight">
              Legal Framework, Insurance Structure &amp; Risk Management
            </h1>
            <p className="text-lg md:text-xl text-stone-600 font-medium">
              TOLA Digital trade &amp; Supply Chain Ecosystem
            </p>
          </div>

          <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-stone-100 bg-white/50 pb-8">
              <CardTitle className="text-xl text-primary font-bold">
                TOLA DIGITAL TRADE &amp; SUPPLY CHAIN ECOSYSTEM
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 md:p-10 space-y-8 text-stone-700 leading-relaxed">
              {/* 1. Platform Legal Status & Liability Limitation */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-stone-900 border-l-4 border-primary pl-4">
                  1. Platform Legal Status &amp; Liability Limitation
                </h2>
                <p>
                  TOLA DIGITAL TRADE &amp; SUPPLY CHAIN ECOSYSTEM operates as a digital trade and
                  supply chain coordination platform connecting Vendors, Buyers, and Licensed
                  Transporters through its technology infrastructure. TOLA acts strictly as a{" "}
                  <span className="font-semibold">digital intermediary and logistics coordination ecosystem</span>.
                </p>
                <p className="font-semibold">TOLA DIGITAL TRADE &amp; SUPPLY CHAIN ECOSYSTEM does NOT:</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Take ownership of goods</li>
                  <li>Take physical custody of cargo</li>
                  <li>Operate as a carrier or freight forwarder</li>
                  <li>Warehouse, store, or transport goods directly</li>
                </ul>
                <p>
                  All goods transported through the platform remain under the custody, control, and legal
                  responsibility of the contracted Transporter from the point of physical collection to final
                  delivery.
                </p>
                <p className="font-semibold">However, TOLA participates actively in ensuring:</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Shipment monitoring and tracking</li>
                  <li>Payment facilitation</li>
                  <li>Dispute coordination and resolution</li>
                  <li>Vendor payout processing</li>
                  <li>Transporter payout processing</li>
                </ul>
                <p>
                  Despite active coordination, TOLA DIGITAL TRADE &amp; SUPPLY CHAIN ECOSYSTEM shall not be
                  liable for:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Physical damage to goods</li>
                  <li>Theft or loss of cargo</li>
                  <li>Road accidents during transit</li>
                  <li>Delivery delays caused by transporter negligence</li>
                  <li>Force majeure events</li>
                </ul>
                <p>
                  Liability for such events rests solely with the contracted Transporter in accordance with
                  applicable transport and insurance laws under Tanzanian law.
                </p>
              </section>

              {/* 2. Risk Transfer Policy */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-stone-900 border-l-4 border-primary pl-4">
                  2. Risk Transfer Policy
                </h2>
                <p>Risk of loss or damage shall transfer as follows:</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>
                    Risk transfers from Vendor to Transporter at the point of physical collection and
                    digital dispatch confirmation recorded within the TOLA system.
                  </li>
                  <li>The Transporter assumes full responsibility and liability for the cargo during transit.</li>
                  <li>
                    Upon confirmed digital proof of delivery to the Buyer, risk transfers from Transporter to
                    Buyer.
                  </li>
                </ul>
                <p>All risk transfer stages are digitally timestamped within the platform system.</p>
              </section>

              {/* 3. Mandatory Insurance Requirements for Transporters */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-stone-900 border-l-4 border-primary pl-4">
                  3. Mandatory Insurance Requirements for Transporters
                </h2>
                <p>
                  All Transporters operating within TOLA DIGITAL TRADE &amp; SUPPLY CHAIN ECOSYSTEM must
                  maintain <span className="font-semibold">valid Goods-in-Transit Insurance</span>.
                </p>
                <p>The insurance must:</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Cover 100% of the declared cargo value</li>
                  <li>Be issued by a licensed insurance provider</li>
                  <li>Cover theft, accident damage, fire, and loss</li>
                  <li>Remain active throughout the transportation period</li>
                  <li>Be renewed annually</li>
                </ul>
                <p>
                  Transporters must submit valid insurance certification annually to TOLA DIGITAL TRADE &amp;
                  SUPPLY CHAIN ECOSYSTEM.
                </p>
                <p className="font-semibold">Failure to maintain valid insurance may result in:</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Immediate suspension from the ecosystem</li>
                  <li>Possible withholding of payouts pending claim resolution</li>
                  <li>Contract termination where applicable</li>
                </ul>
                <p>
                  In the event of cargo theft, accident, or loss, liability rests solely with the Transporter,
                  and compensation shall be processed through the Transporter’s Goods-in-Transit Insurance
                  provider.
                </p>
              </section>

              {/* 4. Insurance Structure */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-stone-900 border-l-4 border-primary pl-4">
                  4. Insurance Structure
                </h2>
                <p>To ensure cargo protection within the ecosystem:</p>
                <p className="font-semibold">Goods-in-Transit Insurance (Transporter Responsibility)</p>
                <p>This insurance covers:</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Cargo theft</li>
                  <li>Accident-related damage</li>
                  <li>Fire incidents</li>
                  <li>In-transit loss</li>
                </ul>
                <p>
                  The responsibility to obtain and maintain this insurance lies solely with the Transporter.
                  TOLA DIGITAL TRADE &amp; SUPPLY CHAIN ECOSYSTEM does not insure cargo directly and does not
                  assume cargo liability.
                </p>
              </section>

              {/* 5. Payment Security & Escrow Protection */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-stone-900 border-l-4 border-primary pl-4">
                  5. Payment Security &amp; Escrow Protection
                </h2>
                <p>To safeguard financial transactions:</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Payments are processed through licensed Payment Service Providers (PSPs).</li>
                  <li>Funds may be held in escrow until delivery confirmation.</li>
                  <li>Vendor payouts are processed after successful delivery confirmation.</li>
                  <li>Transporter payouts are processed after delivery validation.</li>
                  <li>In case of dispute, funds may be temporarily held pending resolution.</li>
                </ul>
                <p>
                  TOLA DIGITAL TRADE &amp; SUPPLY CHAIN ECOSYSTEM ensures secure transaction monitoring and
                  transparent payout procedures but does not assume cargo-related financial liability.
                </p>
              </section>

              {/* 6. Dispute Resolution Framework */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-stone-900 border-l-4 border-primary pl-4">
                  6. Dispute Resolution Framework
                </h2>
                <p>In the event of a dispute:</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>A formal dispute must be lodged via the platform.</li>
                  <li>Digital investigation procedures will be initiated.</li>
                  <li>
                    Evidence including dispatch confirmation, GPS tracking, and proof of delivery will be
                    reviewed.
                  </li>
                  <li>Liability determination will follow contractual and insurance obligations.</li>
                  <li>Where applicable, the Transporter shall initiate insurance claim procedures.</li>
                </ul>
                <p>
                  TOLA DIGITAL TRADE &amp; SUPPLY CHAIN ECOSYSTEM acts as a neutral digital dispute coordination
                  facilitator and does not assume direct financial liability for cargo-related claims.
                </p>
              </section>

              {/* 7. Risk Management Framework */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-stone-900 border-l-4 border-primary pl-4">
                  7. Risk Management Framework
                </h2>
                <p>TOLA implements structured risk management covering:</p>
                <p className="font-semibold">Operational Risk</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Vendor verification</li>
                  <li>Transporter vetting and compliance checks</li>
                  <li>GPS shipment tracking integration</li>
                  <li>Digital dispatch confirmation</li>
                </ul>
                <p className="font-semibold">Financial Risk</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Escrow-based payment structure</li>
                  <li>Licensed PSP integration</li>
                  <li>Transaction monitoring systems</li>
                </ul>
                <p className="font-semibold">Cargo Risk</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Mandatory Goods-in-Transit Insurance</li>
                  <li>Digital delivery confirmation</li>
                  <li>Transporter liability enforcement</li>
                </ul>
                <p className="font-semibold">Fraud Prevention</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>KYC onboarding</li>
                  <li>Identity verification</li>
                  <li>Transaction monitoring</li>
                </ul>
                <p className="font-semibold">Legal Risk</p>
                <ul className="list-disc list-inside space-y-1 text-sm md:text-base">
                  <li>Structured digital contracts</li>
                  <li>Indemnity clauses</li>
                  <li>Compliance with Tanzanian commercial and transport laws</li>
                </ul>
              </section>

              {/* 8. Governing Law */}
              <section className="space-y-3">
                <h2 className="text-2xl font-bold text-stone-900 border-l-4 border-primary pl-4">
                  8. Governing Law
                </h2>
                <p>
                  This Legal Framework shall be governed and interpreted in accordance with the laws of the
                  United Republic of Tanzania.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

