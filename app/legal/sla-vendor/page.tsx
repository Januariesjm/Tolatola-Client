import SiteHeader from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function VendorSLAPage() {
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
                            For Vendors (Producers, Manufacturers, Suppliers, Wholesalers, Retail Traders)
                        </p>
                    </div>

                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-stone-100 bg-white/50 pb-8">
                            <CardTitle className="text-xl text-primary font-bold">TOLA DIGITAL TRADE & SUPPLY CHAIN ECOSYSTEM</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 md:p-10 space-y-8 text-stone-700 leading-relaxed">

                            <section className="space-y-4">
                                <h2 className="text-2xl font-bold text-stone-900 border-l-4 border-primary pl-4">Scope</h2>
                                <p>
                                    This SLA applies to <span className="font-semibold text-stone-900">Producers, Manufacturers, Suppliers, Wholesalers, Retail Traders, and Consumers</span> using the TOLA platform.
                                </p>
                            </section>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-100">
                                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">1</span>
                                        Producers & Manufacturers
                                    </h3>
                                    <p className="text-sm">
                                        Responsible for product quality, availability, and timely order confirmation. Failure results in order cancellation, payout withholding, or account suspension.
                                    </p>
                                </div>

                                <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-100">
                                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">2</span>
                                        Suppliers & Wholesalers
                                    </h3>
                                    <p className="text-sm">
                                        Must ensure accurate listings, timely fulfillment, and cooperation in delivery. Delays or misinformation result in penalties or suspension.
                                    </p>
                                </div>

                                <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-100">
                                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">3</span>
                                        Retail Traders
                                    </h3>
                                    <p className="text-sm">
                                        Must maintain correct pricing, confirm orders on time, and coordinate delivery. Non-compliance may lead to loss of payouts or access.
                                    </p>
                                </div>

                                <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-100">
                                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs">4</span>
                                        Consumers (Buyers)
                                    </h3>
                                    <p className="text-sm">
                                        Must complete payment, confirm delivery, and raise disputes within allowed time. Trade Assurance Fee is non-refundable.
                                    </p>
                                </div>
                            </div>

                            <section className="space-y-4 pt-4">
                                <h3 className="text-xl font-bold text-stone-900">5. Logistics & Delivery Confirmation</h3>
                                <p>
                                    Delivery confirmation is mandatory for settlement. False confirmations lead to suspension and legal action.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-bold text-stone-900">6. Payments & Commissions</h3>
                                <p>
                                    All payments are processed through licensed PSPs. Commissions are deducted automatically before payout.
                                </p>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-bold text-stone-900">7. Funds & Liability Disclaimer</h3>
                                <div className="p-4 bg-orange-50 border-l-4 border-orange-400 text-orange-800 rounded-r-lg">
                                    <p>TOLA is not a bank, wallet, or secure funds provider. Funds are held by licensed PSPs.</p>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h3 className="text-xl font-bold text-stone-900">8. Acceptance Clause</h3>
                                <p>
                                    By registering or using TOLA, users confirm acceptance of this SLA and responsibility for their obligations.
                                </p>
                            </section>

                        </CardContent>
                    </Card>
                </div>
            </main>

            <SiteFooter />
        </div>
    )
}
