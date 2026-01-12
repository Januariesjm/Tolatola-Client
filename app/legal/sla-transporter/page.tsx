import SiteHeader from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function TransporterSLAPage() {
    return (
        <div className="flex flex-col min-h-screen bg-stone-50">
            <SiteHeader />

            <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="space-y-4 text-center">
                        <Badge variant="outline" className="px-4 py-1 border-primary/20 text-primary bg-primary/5 mb-4">LEGAL DOCUMENT</Badge>
                        <h1 className="text-3xl md:text-5xl font-black text-stone-900 tracking-tight">
                            Service Level Agreement
                        </h1>
                        <p className="text-lg md:text-xl text-stone-600 font-medium">
                            For Transporters / Logistics Partners
                        </p>
                    </div>

                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-stone-100 bg-white/50 pb-8">
                            <CardTitle className="text-xl text-primary font-bold">TOLA PLATFORM</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10 space-y-8 text-stone-700 leading-relaxed">

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900">1. INTRODUCTION</h2>
                                <div className="p-4 bg-stone-50 rounded-lg border border-stone-100 text-sm">
                                    <p className="mb-2">This Service Level Agreement (SLA) is entered into between:</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                        <li><strong>TOLA Digital Trade & Supply Chain Ecosystem</strong> – a Digital Trade & Supply Chain Ecosystem ("TOLA")</li>
                                        <li><strong>Transporter / Logistics Partner</strong> (the "Transporter")</li>
                                    </ul>
                                    <p className="mt-2">This SLA defines the service standards, roles, responsibilities, rights, and obligations governing the participation of Transporters on the TOLA Digital Trade & Supply Chain Ecosystem.</p>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900">2. DEFINITIONS</h2>
                                <ul className="space-y-3">
                                    <li><strong className="text-stone-900">TOLA Digital Trade & Supply Chain Ecosystem:</strong> A digital platform that orchestrates trade, logistics, and transaction data without holding or controlling funds.</li>
                                    <li><strong className="text-stone-900">Transporter:</strong> A logistics or transportation service provider onboarded on the TOLA Digital Trade & Supply Chain Ecosystem.</li>
                                    <li><strong className="text-stone-900">Buyer:</strong> The purchaser of goods.</li>
                                    <li><strong className="text-stone-900">Seller:</strong> The supplier of goods.</li>
                                    <li><strong className="text-stone-900">Delivery Confirmation:</strong> Digital confirmation that delivery has been successfully completed.</li>
                                    <li><strong className="text-stone-900">Payment Service Provider (PSP):</strong> A licensed third-party entity responsible for receiving, holding, and disbursing funds.</li>
                                </ul>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900">3. SCOPE OF SERVICES</h2>
                                <p>The Transporter agrees to provide the following services via the TOLA Digital Trade & Supply Chain Ecosystem:</p>
                                <div className="grid md:grid-cols-2 gap-4 text-sm bg-stone-50 p-6 rounded-xl">
                                    <ul className="space-y-2 list-disc pl-4">
                                        <li>Receive transport orders digitally</li>
                                        <li>View full order details (Pickup, Destination, Cargo Data)</li>
                                        <li>Accept or reject orders within response window</li>
                                        <li>Collect cargo from Seller</li>
                                    </ul>
                                    <ul className="space-y-2 list-disc pl-4">
                                        <li>Transport cargo safely within timeframe</li>
                                        <li>Deliver cargo to Buyer</li>
                                        <li>Submit digital Proof of Delivery (POD)</li>
                                        <li>Participate in tracking and reporting</li>
                                    </ul>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900">4. SERVICE LEVELS</h2>

                                <div className="grid gap-6">
                                    <div className="border-l-4 border-primary pl-4 py-2">
                                        <h3 className="font-bold text-stone-900">4.1 Pickup Time</h3>
                                        <p className="text-sm mt-1">Cargo must be collected within <strong>10 minutes to 8 hours</strong> after order receipt and confirmation.</p>
                                    </div>
                                    <div className="border-l-4 border-primary pl-4 py-2">
                                        <h3 className="font-bold text-stone-900">4.2 Transit Time</h3>
                                        <p className="text-sm mt-1">Shall follow agreed route and timeline. Variance not to exceed <strong>±10%</strong>.</p>
                                    </div>
                                    <div className="border-l-4 border-primary pl-4 py-2">
                                        <h3 className="font-bold text-stone-900">4.3 Delivery Success Rate</h3>
                                        <p className="text-sm mt-1">Minimum successful delivery rate: <strong>95%</strong>.</p>
                                    </div>
                                    <div className="border-l-4 border-primary pl-4 py-2">
                                        <h3 className="font-bold text-stone-900">4.4 Communication & Responsiveness</h3>
                                        <p className="text-sm mt-1">Emergency issues: <strong>30 minutes</strong>. Non-urgent issues: <strong>2 hours</strong>.</p>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900">5. PROOF OF DELIVERY (POD)</h2>
                                <p>The Transporter must upload valid digital POD (Signature, Photos, GPS) via TOLA. Failure results in delayed payout.</p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900">6. CARGO SAFETY & INCIDENT REPORTING</h2>
                                <p>Transporter is responsible for cargo from pickup to delivery. Must report incidents within <strong>1 hour</strong> via TOLA.</p>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900">7. PAYOUTS & FEES</h2>
                                <p>Payouts executed via licensed PSP upon delivery confirmation.</p>
                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                                    <h3 className="font-bold text-primary mb-2">7.1 Platform Coordination Fee</h3>
                                    <p className="text-sm">A <strong>3% fee</strong> is deducted from the transaction value for coordination, matching, and tracking services. This is processed automatically via the PSP.</p>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900">8. PENALTIES & DEDUCTIONS</h2>
                                <div className="overflow-hidden rounded-lg border border-stone-200">
                                    <table className="min-w-full divide-y divide-stone-200 text-sm">
                                        <thead className="bg-stone-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-bold text-stone-900">Event</th>
                                                <th className="px-4 py-3 text-left font-bold text-stone-900">Consequence</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-200 bg-white">
                                            <tr>
                                                <td className="px-4 py-3">Unjustified delivery delay</td>
                                                <td className="px-4 py-3 text-red-600">Deduction up to 10%</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3">Invalid or missing POD</td>
                                                <td className="px-4 py-3 text-red-600">Payout suspension</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3">Cargo damage or loss</td>
                                                <td className="px-4 py-3 text-red-600">Compensation based on value</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3">Repeated non-responsiveness</td>
                                                <td className="px-4 py-3 text-red-600">Warning, suspension, or removal</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900">9. DISPUTE RESOLUTION</h2>
                                <p>Complaints reviewed within 5 business days. Final determinations rely on TOLA system records.</p>
                            </section>

                            <div className="grid md:grid-cols-2 gap-8 pt-4">
                                <section className="space-y-2">
                                    <h2 className="text-lg font-bold text-stone-900">10. LEGAL COMPLIANCE</h2>
                                    <p className="text-sm">Transporter must comply with all Tanzanian transportation laws and maintain valid licenses/insurance.</p>
                                </section>
                                <section className="space-y-2">
                                    <h2 className="text-lg font-bold text-stone-900">11. DATA PROTECTION</h2>
                                    <p className="text-sm">All data is confidential and may not be disclosed without authorization.</p>
                                </section>
                            </div>

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900">12. SUSPENSION OR TERMINATION</h2>
                                <p>TOLA may suspend access for violations or terminate with 7 days' notice (immediate for material breach).</p>
                            </section>

                            <section className="space-y-4 pt-4 border-t border-stone-100">
                                <h2 className="text-2xl font-bold text-stone-900">13. DIGITAL ACCEPTANCE</h2>
                                <div className="p-6 bg-green-50 rounded-xl border border-green-100 text-green-900">
                                    <p className="font-bold mb-2">This SLA is entirely digital and binding.</p>
                                    <p className="text-sm">By creating an account and accepting transport orders, the Transporter legally agrees to all terms. No physical signatures are required. System records constitute conclusive evidence.</p>
                                </div>
                            </section>

                        </CardContent>
                    </Card>
                </div>
            </main>

            <SiteFooter />
        </div>
    )
}
