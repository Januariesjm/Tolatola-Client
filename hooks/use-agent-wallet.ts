"use client"

import { useEffect, useMemo, useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { filterByDateRange, type DatePeriod } from "@/components/admin/date-range-filter"
import { logger } from "@/lib/logger"
import { emptyWalletStats, type AgentCommissionRecord, type AgentCommissionSummary, type AgentWalletStats } from "@/lib/types/agent"
import {
  expectedPayout,
  fetchAgentWallet,
  formatTzs,
  lifetimeEarnings,
  paidBalance,
  pendingBalance,
  quickPercentAmount,
  validateWithdrawal,
  withdrawalFee,
} from "@/lib/agent/wallet"

/**
 * Wallet data, date filtering, and the withdrawal form for the agent
 * commission tab.
 *
 * Extracted from components/agent/agent-commission-tab.tsx, which held all of
 * this state and both handlers alongside 630+ lines of markup. The arithmetic
 * itself already lived in lib/agent/wallet.ts (pure, tested); this is the React
 * state and the network calls wrapped around it.
 */

const log = logger.child("agent.agent-commission-tab")

export function useAgentWallet(initialSummary: AgentCommissionSummary | null, initialCommissions: AgentCommissionRecord[]) {
  const { toast } = useToast()

  const [walletStats, setWalletStats] = useState<AgentWalletStats>(() => emptyWalletStats(initialSummary, initialCommissions || []))
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [activeHistoryTab, setActiveHistoryTab] = useState<"earnings" | "payouts">("earnings")
  const [period, setPeriod] = useState<DatePeriod>("all")

  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("m-pesa")
  const [phoneNumber, setPhoneNumber] = useState("")

  // Fetch real-time wallet details from the backend. A failure leaves the
  // server-rendered balances in place rather than blanking them.
  const fetchWalletDetails = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const {
        data: { session },
      } = await createClient().auth.getSession()

      const wallet = await fetchAgentWallet(session?.access_token)
      if (wallet) setWalletStats(wallet)
    } catch (err) {
      log.error("failed to load wallet stats", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dateFilteredCommissions = useMemo(() => filterByDateRange(walletStats.commissions || [], period), [walletStats.commissions, period])
  const dateFilteredWithdrawals = useMemo(() => filterByDateRange(walletStats.withdrawals || [], period), [walletStats.withdrawals, period])

  const computedLifetimeEarnings = useMemo(() => lifetimeEarnings(dateFilteredCommissions), [dateFilteredCommissions])
  const computedPendingBalance = useMemo(() => pendingBalance(dateFilteredCommissions), [dateFilteredCommissions])
  const computedPaidBalance = useMemo(() => paidBalance(dateFilteredCommissions), [dateFilteredCommissions])

  const handleQuickPercent = (percent: number) => {
    const amount = quickPercentAmount(walletStats.withdrawableBalance || 0, percent)
    if (amount <= 0) return
    setWithdrawAmount(amount.toString())
  }

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const balance = walletStats.withdrawableBalance || 0
    const rejection = validateWithdrawal({ amount: withdrawAmount, balance, phoneNumber })

    if (rejection) {
      toast({ variant: "destructive", ...rejection })
      return
    }

    // Safe to coerce: validateWithdrawal has already rejected anything that is
    // not a positive number within the balance.
    const amount = Number(withdrawAmount)

    setIsSubmitLoading(true)

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

      const response = await fetch(`${apiBase}/agents/withdrawals/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          amount,
          paymentMethod,
          paymentDetails: phoneNumber,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Ombi Limepokelewa!",
          description: `Ombi lako la kutoa ${formatTzs(amount)} limefanikiwa na linafanyiwa kazi.`,
        })
        setShowWithdrawModal(false)
        setWithdrawAmount("")
        setPhoneNumber("")
        fetchWalletDetails()
      } else {
        toast({
          variant: "destructive",
          title: "Ombi Imeshindikana",
          description: data.error || "Imeshindikana kutuma ombi la kutoa salio. Jaribu tena.",
        })
      }
    } catch (err) {
      log.error("error submitting withdrawal", err)
      toast({
        variant: "destructive",
        title: "Hitilafu Imefanyika",
        description: "Hitilafu imetokea mtandaoni. Tafadhali jaribu tena baadae.",
      })
    } finally {
      setIsSubmitLoading(false)
    }
  }

  const calculatedFee = withdrawAmount ? withdrawalFee(withdrawAmount) : 0
  const payoutAfterFee = withdrawAmount ? expectedPayout(withdrawAmount) : 0

  return {
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
  }
}

export type UseAgentWallet = ReturnType<typeof useAgentWallet>
