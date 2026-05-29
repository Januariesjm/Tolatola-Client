import { redirect } from "next/navigation"
import { serverApiGet } from "@/lib/api-server"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import type { Database } from "@/lib/types"
import { AgentDashboardContent } from "@/components/agent/agent-dashboard-content"

export const dynamic = "force-dynamic"

export default async function AgentDashboardPage() {
  const supabase = createServerComponentClient<Database>({ cookies, headers } as any)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?returnUrl=/agent")
  }

  // 1. Fetch agent authorization/role info
  let myRoleData: any = null
  try {
    myRoleData = await serverApiGet<any>("agents/my-role")
  } catch (err) {
    console.error("[AGENT DASHBOARD] Error checking agent role:", err)
  }

  if (!myRoleData || !myRoleData.allowed || !myRoleData.agent) {
    // Render standard access denied layout rather than blank page
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">
            Your account is not registered as a Sales Agent, or is currently inactive. Please contact the administrator.
          </p>
          <a
            href="/"
            className="inline-flex justify-center items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary hover:bg-primary/95 transition-all shadow-sm shadow-primary/20"
          >
            Back to Home
          </a>
        </div>
      </div>
    )
  }

  // 2. Fetch agent dashboard analytics & listings
  let dashboardData: any = null
  let registrationsList: any[] = []
  let commissionsList: any[] = []
  let commissionsSummary: any = {}
  let leaderboardData: any = null

  try {
    const [dashRes, regsRes, commsRes, leaderRes] = await Promise.all([
      serverApiGet<any>("agents/dashboard").catch(e => { console.error("Error dash:", e); return null }),
      serverApiGet<{ data: any[] }>("agents/registrations").catch(e => { console.error("Error regs:", e); return { data: [] } }),
      serverApiGet<any>("agents/commissions").catch(e => { console.error("Error comms:", e); return { data: [], summary: {} } }),
      serverApiGet<any>("agents/leaderboard").catch(e => { console.error("Error leaderboard:", e); return { leaderboard: [], myRank: null } }),
    ])

    dashboardData = dashRes
    registrationsList = regsRes.data || []
    commissionsList = commsRes.data || []
    commissionsSummary = commsRes.summary || {}
    leaderboardData = leaderRes
  } catch (err) {
    console.error("[AGENT DASHBOARD] Error loading dashboard sub-data:", err)
  }

  return (
    <AgentDashboardContent
      agent={myRoleData.agent}
      role={myRoleData.role}
      permissions={myRoleData.permissions}
      dashboardStats={dashboardData?.overview || {}}
      trend={dashboardData?.registrationTrend || []}
      registrations={registrationsList}
      commissions={commissionsList}
      commissionSummary={commissionsSummary}
      leaderboard={leaderboardData?.leaderboard || []}
      myRank={leaderboardData?.myRank || null}
    />
  )
}
