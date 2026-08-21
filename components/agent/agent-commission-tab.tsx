"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowUpRight, CheckCircle2, Clock, Coins, Wallet } from "lucide-react"
import { DateRangeFilter } from "@/components/admin/date-range-filter"
import { CommissionHistoryCard } from "@/components/agent/commission-history-card"
import { WithdrawModal } from "@/components/agent/withdraw-modal"
import { useAgentWallet } from "@/hooks/use-agent-wallet"
import { formatTzs } from "@/lib/agent/wallet"
import type { AgentCommissionRecord, AgentCommissionSummary, AgentLeaderboardEntry } from "@/lib/types/agent"

interface AgentCommissionTabProps {
  commissions: AgentCommissionRecord[]
  summary: AgentCommissionSummary | null
  /** Accepted for the dashboard's prop shape; this tab does not render them. */
  leaderboard: AgentLeaderboardEntry[]
  myRank: number | null
}

export function AgentCommissionTab({ commissions: initialCommissions, summary: initialSummary }: AgentCommissionTabProps) {
  const {
    walletStats,
    isLoading,
    isSubmitLoading,
    showWithdrawModal,
    setShowWithdrawModal,
    activeHistoryTab,
    setActiveHistoryTab,
    period,
    setPeriod,
    dateFilteredCommissions,
    dateFilteredWithdrawals,
    computedLifetimeEarnings,
    computedPendingBalance,
    computedPaidBalance,
    withdrawAmount,
    setWithdrawAmount,
    paymentMethod,
    setPaymentMethod,
    phoneNumber,
    setPhoneNumber,
    handleQuickPercent,
    handleWithdrawSubmit,
    calculatedFee,
    payoutAfterFee,
  } = useAgentWallet(initialSummary, initialCommissions)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">Miamala na Mapato</h2>
        <DateRangeFilter value={period} onChange={setPeriod} />
      </div>

      {/* Premium Wallet & KPI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Glassmorphic Balance Debit Card */}
        <div className="relative h-[220px] rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-900 p-6 text-white shadow-xl overflow-hidden flex flex-col justify-between border border-emerald-500/20 lg:col-span-1">
          {/* Background shapes for aesthetics */}
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/5 blur-3xl -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl -ml-20 -mb-20" />

          <div className="flex justify-between items-start z-10">
            <div>
              <span className="text-xs font-medium text-emerald-100/80 uppercase tracking-widest block">SALIO LAKO LA WALLET</span>
              <h2 className="text-3xl md:text-4xl font-black mt-1 tracking-tight">
                {isLoading ? (
                  <span className="inline-block h-8 w-32 bg-white/10 animate-pulse rounded" />
                ) : (
                  formatTzs(walletStats.withdrawableBalance)
                )}
              </h2>
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
              <Wallet className="h-5.5 w-5.5 text-emerald-300" />
            </div>
          </div>

          <div className="z-10">
            <span className="text-[10px] text-emerald-200/60 font-mono tracking-wider block">TOLA AGENT DEBIT ACCOUNT</span>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-white/90 font-semibold tracking-widest block font-mono">
                **** **** **** {walletStats.commissions?.[0]?.agent_id?.substring(0, 4)?.toUpperCase() || "AGENT"}
              </span>
              <Button
                onClick={() => setShowWithdrawModal(true)}
                disabled={walletStats.withdrawableBalance <= 0}
                size="sm"
                className="bg-white hover:bg-emerald-50 text-emerald-950 font-bold border-none shadow-lg shadow-emerald-950/20 px-4 rounded-xl gap-1 text-xs shrink-0 transition-transform active:scale-95"
              >
                Kutoa Salio
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Secondary Info Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:col-span-2 gap-4">
          {/* Lifetime Earnings */}
          <Card className="shadow-sm rounded-xl border border-emerald-100/80 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">PATO LA LIFETIME</span>
                  <span className="text-xl md:text-2xl font-black text-emerald-600 block">{formatTzs(computedLifetimeEarnings)}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                  <Coins className="h-5 w-5" />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block border-t border-slate-100 pt-3">
                Jumla ya kamisheni zote tangu kujiunga
              </span>
            </CardContent>
          </Card>

          {/* Pending Approval */}
          <Card className="shadow-sm rounded-xl border border-amber-100 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">INAYOSUBIRI KUKUBALIWA</span>
                  <span className="text-xl md:text-2xl font-black text-amber-600 block">{formatTzs(computedPendingBalance)}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block border-t border-slate-100 pt-3">
                Kamisheni inayohitaji hakiki ya uongozi
              </span>
            </CardContent>
          </Card>

          {/* Fully Paid Out */}
          <Card className="shadow-sm rounded-xl border border-teal-100 bg-white hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">ZILIZOTOLEWA TAYARI</span>
                  <span className="text-xl md:text-2xl font-black text-teal-600 block">{formatTzs(computedPaidBalance)}</span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
              </div>
              <span className="text-[10px] text-slate-400 font-medium block border-t border-slate-100 pt-3">
                Kiasi kilicholipwa kikamilifu kwenye namba yako
              </span>
            </CardContent>
          </Card>
        </div>
      </div>

      <CommissionHistoryCard
        activeHistoryTab={activeHistoryTab}
        onHistoryTabChange={setActiveHistoryTab}
        commissions={dateFilteredCommissions}
        withdrawals={dateFilteredWithdrawals}
      />

      {/* WITHDRAW SLIDE DRAWER / MODAL DIALOG */}
      {showWithdrawModal && (
        <WithdrawModal
          onClose={() => setShowWithdrawModal(false)}
          onSubmit={handleWithdrawSubmit}
          withdrawableBalance={walletStats.withdrawableBalance}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          phoneNumber={phoneNumber}
          onPhoneNumberChange={setPhoneNumber}
          withdrawAmount={withdrawAmount}
          onWithdrawAmountChange={setWithdrawAmount}
          onQuickPercent={handleQuickPercent}
          calculatedFee={calculatedFee}
          payoutAfterFee={payoutAfterFee}
          isSubmitLoading={isSubmitLoading}
        />
      )}
    </div>
  )
}
