"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Coins,
  Clock,
  CheckCircle2,
  Award,
  TrendingUp,
  User,
  Medal,
  ChevronRight
} from "lucide-react"

interface AgentCommissionTabProps {
  commissions: any[]
  summary: any
  leaderboard: any[]
  myRank: number | null
}

export function AgentCommissionTab({
  commissions,
  summary,
  leaderboard,
  myRank,
}: AgentCommissionTabProps) {
  // Format currency
  const formatTzs = (amount: number) => {
    return `TZS ${(amount || 0).toLocaleString()}`
  }

  // Summary widgets data
  const totalEarnings = summary?.totalEarnings || 0
  const pendingCommission = summary?.pendingCommission || 0
  const paidCommission = summary?.paidCommission || 0
  const bonusRewards = summary?.bonusRewards || 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Commission summaries grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Earnings */}
        <Card className="shadow-sm rounded-xl border border-emerald-100 bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Total Earnings
              </span>
              <span className="text-xl md:text-2xl font-black text-emerald-600 block">
                {formatTzs(totalEarnings)}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Total commissions earned
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
              <Coins className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Paid Commissions */}
        <Card className="shadow-sm rounded-xl border border-teal-100 bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Paid Out
              </span>
              <span className="text-xl md:text-2xl font-black text-teal-600 block">
                {formatTzs(paidCommission)}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Fully paid out
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Pending Commissions */}
        <Card className="shadow-sm rounded-xl border border-indigo-100 bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Pending Approval
              </span>
              <span className="text-xl md:text-2xl font-black text-indigo-600 block">
                {formatTzs(pendingCommission)}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Awaiting verification
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        {/* Bonuses & Rewards */}
        <Card className="shadow-sm rounded-xl border border-amber-100 bg-white">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Bonuses & Rewards
              </span>
              <span className="text-xl md:text-2xl font-black text-amber-600 block">
                {formatTzs(bonusRewards)}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block">
                Performance bonus rewards
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
              <Award className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main split: individual commissions list and leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Earnings History table list */}
        <Card className="lg:col-span-2 shadow-sm rounded-xl border border-slate-200 bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-800">
              Earnings History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {commissions.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xs text-slate-400">You haven't earned any commissions yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-4 px-6">Source / Ref</th>
                      <th className="py-4 px-4">Amount</th>
                      <th className="py-4 px-4">Type</th>
                      <th className="py-4 px-4">Date</th>
                      <th className="py-4 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commissions.map((comm) => (
                      <tr key={comm.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {comm.agent_registrations ? (
                            <div className="flex flex-col">
                              <span>Registration: {comm.agent_registrations.full_name}</span>
                              <span className="text-[10px] text-slate-400 capitalize">{comm.agent_registrations.registration_type}</span>
                            </div>
                          ) : (
                            comm.description || "Commission / Reward"
                          )}
                        </td>
                        <td className="py-4 px-4 text-emerald-600 font-black">
                          +{formatTzs(comm.amount)}
                        </td>
                        <td className="py-4 px-4 capitalize">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {comm.commission_type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-medium">
                          {new Date(comm.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            comm.status === "paid" ? "bg-emerald-100 text-emerald-800" :
                            comm.status === "approved" ? "bg-teal-100 text-teal-800" :
                            comm.status === "pending" ? "bg-amber-100 text-amber-800" :
                            "bg-rose-100 text-rose-800"
                          }`}>
                            {comm.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sleek Agent Leaderboard Panel */}
        <Card className="shadow-sm rounded-xl border border-slate-200 bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Medal className="h-4.5 w-4.5 text-amber-500" />
              Leaderboard
            </CardTitle>
            {myRank && (
              <Badge className="bg-emerald-500 text-white rounded-full font-bold text-[10px]">
                Rank: #{myRank}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {leaderboard.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xs text-slate-400">Leaderboard is currently unavailable.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {leaderboard.map((user, idx) => {
                  const isGold = user.rank === 1
                  const isSilver = user.rank === 2
                  const isBronze = user.rank === 3

                  return (
                    <div
                      key={user.agent_code}
                      className={`flex items-center justify-between p-4 transition-colors ${
                        user.isCurrentAgent ? "bg-emerald-50/60 border-l-4 border-emerald-500" : "hover:bg-slate-50/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank Badge */}
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isGold ? "bg-amber-100 text-amber-700 shadow-sm shadow-amber-200" :
                          isSilver ? "bg-slate-200 text-slate-800" :
                          isBronze ? "bg-amber-50 text-amber-600" :
                          "text-slate-400"
                        }`}>
                          {user.rank}
                        </div>

                        {/* Name and Region */}
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-bold text-slate-900 truncate max-w-[120px] ${
                            user.isCurrentAgent ? "text-emerald-700" : ""
                          }`}>
                            {user.name}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wide">
                            {user.region || "Tanzania"}
                          </span>
                        </div>
                      </div>

                      {/* Total registrations */}
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block">
                          {user.registrations} Regs
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 block">
                          {formatTzs(user.commission)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
