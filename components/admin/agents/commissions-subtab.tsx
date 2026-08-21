"use client"

/**
 * The "Commissions" sub-tab of the admin agent management page: the
 * commission approval queue.
 *
 * Extracted verbatim from components/admin/agent-management-tab.tsx.
 */

import { CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatTzs } from "@/lib/agent/wallet"
import type { AgentCommission } from "@/lib/admin/agent-types"

export interface CommissionsSubTabProps {
  commissions: AgentCommission[]
  isLoading: boolean
  isActionLoading: string | null
  onApproveCommission: (commissionId: string, decision: "approved" | "rejected" | "paid") => void
}

export function CommissionsSubTab({ commissions, isLoading, isActionLoading, onApproveCommission }: CommissionsSubTabProps) {
  return (
    <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-sm font-bold text-slate-800">Commission Approval Queue</CardTitle>
        <CardDescription className="text-xs">Review and approve commission payouts for sales agents.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
            <span className="text-xs text-slate-400">Loading commission queue...</span>
          </div>
        ) : commissions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xs text-slate-400">No commissions awaiting approval at this time.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6 w-[50px]">#</th>
                  <th className="py-3 px-6">Agent Details</th>
                  <th className="py-3 px-4">Registration Detail</th>
                  <th className="py-3 px-4">Payout Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Request Date</th>
                  <th className="py-3 px-6 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((comm, index) => (
                  <tr key={comm.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-6 font-medium text-slate-400">{index + 1}</td>
                    <td className="py-3 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{comm.agents?.users?.full_name || "Sales Agent"}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Code: {comm.agents?.agent_code}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{comm.agent_registrations?.full_name || "New Registered User"}</span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          Category: {comm.agent_registrations?.registration_type}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-black text-emerald-600">{formatTzs(comm.amount)}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold capitalize ${
                          comm.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : comm.status === "approved"
                              ? "bg-teal-100 text-teal-800"
                              : comm.status === "pending"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {comm.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{new Date(comm.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-6 text-right">
                      {comm.status === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isActionLoading !== null}
                            onClick={() => onApproveCommission(comm.id, "approved")}
                            className="rounded-xl h-8 text-xs border-teal-200 text-teal-700 hover:bg-teal-50"
                          >
                            {isActionLoading === `comm-${comm.id}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={isActionLoading !== null}
                            onClick={() => onApproveCommission(comm.id, "rejected")}
                            className="rounded-xl h-8 text-xs text-rose-600 hover:bg-rose-50"
                          >
                            Reject
                          </Button>
                        </div>
                      ) : comm.status === "approved" ? (
                        <Button
                          size="sm"
                          disabled={isActionLoading !== null}
                          onClick={() => onApproveCommission(comm.id, "paid")}
                          className="rounded-xl h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Disburse (Mark Paid)
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No Action Needed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
