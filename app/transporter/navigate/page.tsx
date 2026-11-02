import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { serverApiGet } from "@/lib/api-server"
import { TransporterNavigationScreen } from "@/components/transporter/transporter-navigation-screen"
import { logger } from "@/lib/logger"
import type { TransporterAssignment } from "@/lib/types/transporter"

const log = logger.child("app.transporter.navigate")

export const dynamic = "force-dynamic"

interface NavigatePageProps {
  searchParams: {
    assignmentId?: string
    target?: string
  }
}

/**
 * Full-screen in-app navigator for one transporter assignment.
 *
 * Server-renders the assignment so the map has pickup/drop-off coordinates on
 * first paint; the client component then streams GPS, refreshes the route and
 * advances the trip status without ever leaving TOLA.
 */
export default async function TransporterNavigatePage({ searchParams }: NavigatePageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  const assignmentId = searchParams.assignmentId
  if (!assignmentId) redirect("/transporter/dashboard?tab=assignments")

  let assignment: TransporterAssignment | null = null
  try {
    const res = await serverApiGet<{ assignments: TransporterAssignment[] }>("assignments")
    assignment = (res.assignments || []).find((item) => item.id === assignmentId || item.order_id === assignmentId) || null
  } catch (error) {
    log.error("could not load assignment for navigation", error)
  }

  if (!assignment) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Trip not available</h1>
          <p className="mt-2 text-sm text-slate-500">This trip could not be found. It may have been reassigned or completed.</p>
          <Link
            href="/transporter/dashboard?tab=assignments"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
          >
            Back to Trips
          </Link>
        </div>
      </div>
    )
  }

  const target =
    searchParams.target === "pickup" || searchParams.target === "dropoff" || searchParams.target === "auto" ? searchParams.target : "auto"

  return <TransporterNavigationScreen assignment={assignment} initialTarget={target} />
}
