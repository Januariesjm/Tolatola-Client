import Link from "next/link"
import { CheckCircle2 } from "lucide-react"

/** Final step of the market-validation survey, shown after a successful submit. */
export function SurveyThankYou() {
  return (
    <div className="text-center py-12 space-y-6">
      <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Thank You!</h2>
      <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
        Thank you for participating in the TOLA Market Validation Survey. Your feedback helps us build a trusted Digital Trade &amp; Supply
        Chain Ecosystem for Africa.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20"
      >
        Back to TOLA
      </Link>
    </div>
  )
}
