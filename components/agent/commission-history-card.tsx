"use client"

/**
 * Wallet transaction history for the agent commission tab: a tab switch
 * between received commissions and completed payouts, each its own table.
 *
 * Extracted verbatim from components/agent/agent-commission-tab.tsx.
 * Presentational -- the two lists it renders are already date-filtered by the
 * caller (hooks/use-agent-wallet.ts).
 */

import { CheckCircle2, Coins, Landmark } from "lucide-react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { formatTzs } from "@/lib/agent/wallet"
import type { AgentCommissionRecord, AgentWithdrawal } from "@/lib/types/agent"

export interface CommissionHistoryCardProps {
  activeHistoryTab: "earnings" | "payouts"
  onHistoryTabChange: (tab: "earnings" | "payouts") => void
  commissions: AgentCommissionRecord[]
  withdrawals: AgentWithdrawal[]
}

export function CommissionHistoryCard({ activeHistoryTab, onHistoryTabChange, commissions, withdrawals }: CommissionHistoryCardProps) {
  return (
    <Card className="shadow-sm rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <div>
          <CardTitle className="text-sm font-bold text-slate-800">Historia ya Miamala ya Wallet</CardTitle>
          <CardDescription className="text-xs text-slate-400">Fuatilia mienendo ya mapato na utoaji wako wa fedha</CardDescription>
        </div>

        {/* Custom Tabs */}
        <div className="flex rounded-lg bg-slate-200/60 p-1 self-stretch sm:self-auto">
          <button
            onClick={() => onHistoryTabChange("earnings")}
            className={`flex-1 sm:flex-initial text-xs font-bold px-4 py-1.5 rounded-md transition-all ${
              activeHistoryTab === "earnings" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Kamisheni Zilizopokelewa
          </button>
          <button
            onClick={() => onHistoryTabChange("payouts")}
            className={`flex-1 sm:flex-initial text-xs font-bold px-4 py-1.5 rounded-md transition-all ${
              activeHistoryTab === "payouts" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Fedha Zilizotolewa (Payouts)
          </button>
        </div>
      </div>

      <CardContent className="p-0">
        {activeHistoryTab === "earnings" ? (
          /* Earnings History commissions list */
          commissions.length === 0 ? (
            <div className="text-center py-20 bg-white">
              <Coins className="h-10 w-10 text-slate-200 mx-auto mb-3" />
              <p className="text-xs text-slate-400 font-semibold">Hujapata kamisheni yoyote bado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Chanzo cha Mapato</th>
                    <th className="py-4 px-4">Kiasi</th>
                    <th className="py-4 px-4">Aina ya Kamisheni</th>
                    <th className="py-4 px-4">Tarehe</th>
                    <th className="py-4 px-6 text-right">Hali ya Kichwa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.map((comm: AgentCommissionRecord) => (
                    <tr key={comm.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900">
                        {comm.agent_registrations ? (
                          <div className="flex flex-col">
                            <span>Usajili: {comm.agent_registrations.full_name}</span>
                            <span className="text-[10px] text-slate-400 capitalize">
                              Referred {comm.agent_registrations.registration_type}
                            </span>
                          </div>
                        ) : (
                          comm.description || "Commission Reward"
                        )}
                      </td>
                      <td className="py-4 px-4 text-emerald-600 font-black">+{formatTzs(comm.amount)}</td>
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
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            comm.status === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : comm.status === "approved"
                                ? "bg-teal-100 text-teal-800"
                                : comm.status === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {comm.status === "pending" ? "Inasubiri" : comm.status === "approved" ? "Imeidhinishwa" : comm.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : /* Withdrawals History payouts list */
        withdrawals.length === 0 ? (
          <div className="text-center py-20 bg-white">
            <Landmark className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-xs text-slate-400 font-semibold">Hujafanya muamala wowote wa kutoa salio bado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/20 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-4 px-6">Njia ya Malipo</th>
                  <th className="py-4 px-4">Kiasi Kilichotolewa</th>
                  <th className="py-4 px-4">Makato (Fee)</th>
                  <th className="py-4 px-4">Kiasi cha Kupokea</th>
                  <th className="py-4 px-4">Tarehe</th>
                  <th className="py-4 px-6 text-right">Hali ya Malipo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withdrawals.map((wdraw: AgentWithdrawal) => (
                  <tr key={wdraw.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 uppercase">{wdraw.payment_method}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{wdraw.payment_details?.phoneNumber || "M-Money"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-800 font-black">{formatTzs(wdraw.amount)}</td>
                    <td className="py-4 px-4 text-rose-500 font-medium">-{formatTzs(wdraw.service_fee)}</td>
                    <td className="py-4 px-4 text-emerald-600 font-black">{formatTzs(wdraw.payout_amount)}</td>
                    <td className="py-4 px-4 text-slate-500 font-medium">
                      {new Date(wdraw.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          wdraw.status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : wdraw.status === "approved"
                              ? "bg-teal-100 text-teal-800"
                              : wdraw.status === "processing"
                                ? "bg-blue-100 text-blue-800"
                                : wdraw.status === "pending"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {wdraw.status === "pending"
                          ? "Inasubiri"
                          : wdraw.status === "processing"
                            ? "Inatumwa"
                            : wdraw.status === "paid"
                              ? "Imelipwa"
                              : wdraw.status}
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
  )
}
