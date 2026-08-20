import Image from "next/image"
import Link from "next/link"
import { ClipboardList } from "lucide-react"

/** Sticky header for the public market-validation survey page. */
export function SurveyPageHeader() {
  return (
    <header className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-primary/20 bg-white">
            <Image src="/logo-new.png" alt="TolaTola" fill className="object-contain p-1.5" priority />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">TOLA</span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <ClipboardList className="h-4 w-4" />
          <span className="hidden sm:inline">Market Validation Survey</span>
        </div>
      </div>
    </header>
  )
}
