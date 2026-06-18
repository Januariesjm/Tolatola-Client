"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Wallet,
  Coins,
  Clock,
  CheckCircle2,
  Award,
  ArrowUpRight,
  Shield,
  ArrowRight,
  TrendingUp,
  Landmark,
  X,
  Loader2,
  AlertCircle
} from "lucide-react"
import { DateRangeFilter, filterByDateRange, type DatePeriod } from "../admin/date-range-filter"

interface AgentCommissionTabProps {
  commissions: any[]
  summary: any
  leaderboard: any[]
  myRank: number | null
}

export function AgentCommissionTab({
  commissions: initialCommissions,
  summary: initialSummary,
  leaderboard,
  myRank,
}: AgentCommissionTabProps) {
  const { toast } = useToast()
  
  // Wallet State
  const [walletStats, setWalletStats] = useState<any>({
    lifetimeEarnings: initialSummary?.totalEarnings || 0,
    pendingBalance: initialSummary?.pendingCommission || 0,
    withdrawableBalance: 0,
    paidBalance: initialSummary?.paidCommission || 0,
    commissions: initialCommissions || [],
    withdrawals: [],
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitLoading, setIsSubmitLoading] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [activeHistoryTab, setActiveHistoryTab] = useState<"earnings" | "payouts">("earnings")
  
  // Form State
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("m-pesa")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [period, setPeriod] = useState<DatePeriod>("all")
  
  // Fetch real-time wallet details from backend
  const fetchWalletDetails = async () => {
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

      const response = await fetch(`${apiBase}/agents/wallet`, {
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.wallet) {
          setWalletStats(data.wallet)
        }
      }
    } catch (err) {
      console.error("Failed to load wallet stats:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchWalletDetails()
  }, [])

  const dateFilteredCommissions = useMemo(() => filterByDateRange(walletStats.commissions || [], period), [walletStats.commissions, period])
  const dateFilteredWithdrawals = useMemo(() => filterByDateRange(walletStats.withdrawals || [], period), [walletStats.withdrawals, period])

  const computedLifetimeEarnings = useMemo(() => {
    return dateFilteredCommissions
      .filter((c: any) => c.status === "paid" || c.status === "approved")
      .reduce((sum: number, c: any) => sum + Number(c.amount), 0)
  }, [dateFilteredCommissions])

  const computedPendingBalance = useMemo(() => {
    return dateFilteredCommissions
      .filter((c: any) => c.status === "pending")
      .reduce((sum: number, c: any) => sum + Number(c.amount), 0)
  }, [dateFilteredCommissions])

  const computedPaidBalance = useMemo(() => {
    return dateFilteredCommissions
      .filter((c: any) => c.status === "paid")
      .reduce((sum: number, c: any) => sum + Number(c.amount), 0)
  }, [dateFilteredCommissions])

  // Currency Formatter
  const formatTzs = (amount: number) => {
    return `TZS ${(amount || 0).toLocaleString()}`
  }

  // Handle Quick Percent Withdrawal
  const handleQuickPercent = (percent: number) => {
    const balance = walletStats.withdrawableBalance || 0
    if (balance <= 0) return
    const calculated = Math.floor(balance * percent)
    setWithdrawAmount(calculated.toString())
  }

  // Handle Payout Submission
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const amount = Number(withdrawAmount)
    const balance = walletStats.withdrawableBalance || 0

    if (!amount || isNaN(amount) || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Kosa la Uingizaji",
        description: "Tafadhali weka kiasi sahihi cha kutoa.",
      })
      return
    }

    if (amount > balance) {
      toast({
        variant: "destructive",
        title: "Salio Halitoshi",
        description: `Kiasi unachotaka kutoa kinazidi salio lako la sasa la kutoa la ${formatTzs(balance)}`,
      })
      return
    }

    if (!phoneNumber || phoneNumber.trim().length < 9) {
      toast({
        variant: "destructive",
        title: "Namba ya Simu Inahitajika",
        description: "Tafadhali weka namba sahihi ya simu ya kupokelea fedha.",
      })
      return
    }

    setIsSubmitLoading(true)

    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
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
        // Refresh wallet
        fetchWalletDetails()
      } else {
        toast({
          variant: "destructive",
          title: "Ombi Imeshindikana",
          description: data.error || "Imeshindikana kutuma ombi la kutoa salio. Jaribu tena.",
        })
      }
    } catch (err) {
      console.error("Error submitting withdrawal:", err)
      toast({
        variant: "destructive",
        title: "Hitilafu Imefanyika",
        description: "Hitilafu imetokea mtandaoni. Tafadhali jaribu tena baadae.",
      })
    } finally {
      setIsSubmitLoading(false)
    }
  }

  // Fees calculation
  const calculatedFee = withdrawAmount ? Math.round(Number(withdrawAmount) * 0.10) : 0
  const expectedPayout = withdrawAmount ? Math.max(0, Number(withdrawAmount) - calculatedFee) : 0

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
              <span className="text-xs font-medium text-emerald-100/80 uppercase tracking-widest block">
                SALIO LAKO LA WALLET
              </span>
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
            <span className="text-[10px] text-emerald-200/60 font-mono tracking-wider block">
              TOLA AGENT DEBIT ACCOUNT
            </span>
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    PATO LA LIFETIME
                  </span>
                  <span className="text-xl md:text-2xl font-black text-emerald-600 block">
                    {formatTzs(computedLifetimeEarnings)}
                  </span>
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    INAYOSUBIRI KUKUBALIWA
                  </span>
                  <span className="text-xl md:text-2xl font-black text-amber-600 block">
                    {formatTzs(computedPendingBalance)}
                  </span>
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    ZILIZOTOLEWA TAYARI
                  </span>
                  <span className="text-xl md:text-2xl font-black text-teal-600 block">
                    {formatTzs(computedPaidBalance)}
                  </span>
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

      {/* Transaction History & Records tab list */}
      <Card className="shadow-sm rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Historia ya Miamala ya Wallet
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Fuatilia mienendo ya mapato na utoaji wako wa fedha
            </CardDescription>
          </div>
          
          {/* Custom Tabs */}
          <div className="flex rounded-lg bg-slate-200/60 p-1 self-stretch sm:self-auto">
            <button
              onClick={() => setActiveHistoryTab("earnings")}
              className={`flex-1 sm:flex-initial text-xs font-bold px-4 py-1.5 rounded-md transition-all ${
                activeHistoryTab === "earnings"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Kamisheni Zilizopokelewa
            </button>
            <button
              onClick={() => setActiveHistoryTab("payouts")}
              className={`flex-1 sm:flex-initial text-xs font-bold px-4 py-1.5 rounded-md transition-all ${
                activeHistoryTab === "payouts"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Fedha Zilizotolewa (Payouts)
            </button>
          </div>
        </div>

        <CardContent className="p-0">
          {activeHistoryTab === "earnings" ? (
            /* Earnings History commissions list */
            dateFilteredCommissions.length === 0 ? (
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
                    {dateFilteredCommissions.map((comm: any) => (
                      <tr key={comm.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {comm.agent_registrations ? (
                            <div className="flex flex-col">
                              <span>Usajili: {comm.agent_registrations.full_name}</span>
                              <span className="text-[10px] text-slate-400 capitalize">Referred {comm.agent_registrations.registration_type}</span>
                            </div>
                          ) : (
                            comm.description || "Commission Reward"
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
                            {comm.status === "pending" ? "Inasubiri" : comm.status === "approved" ? "Imeidhinishwa" : comm.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            /* Withdrawals History payouts list */
            dateFilteredWithdrawals.length === 0 ? (
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
                    {dateFilteredWithdrawals.map((wdraw: any) => (
                      <tr key={wdraw.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 uppercase">{wdraw.payment_method}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{wdraw.payment_details?.phoneNumber || "M-Money"}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-800 font-black">
                          {formatTzs(wdraw.amount)}
                        </td>
                        <td className="py-4 px-4 text-rose-500 font-medium">
                          -{formatTzs(wdraw.service_fee)}
                        </td>
                        <td className="py-4 px-4 text-emerald-600 font-black">
                          {formatTzs(wdraw.payout_amount)}
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-medium">
                          {new Date(wdraw.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            wdraw.status === "paid" ? "bg-emerald-100 text-emerald-800" :
                            wdraw.status === "approved" ? "bg-teal-100 text-teal-800" :
                            wdraw.status === "processing" ? "bg-blue-100 text-blue-800" :
                            wdraw.status === "pending" ? "bg-amber-100 text-amber-800" :
                            "bg-rose-100 text-rose-800"
                          }`}>
                            {wdraw.status === "pending" ? "Inasubiri" : wdraw.status === "processing" ? "Inatumwa" : wdraw.status === "paid" ? "Imelipwa" : wdraw.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* WITHDRAW SLIDE DRAWER / MODAL DIALOG */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Kutoa Salio Kutoka Kwenye Wallet</h3>
                <p className="text-xs text-slate-400">Salio la Kutoa: {formatTzs(walletStats.withdrawableBalance)}</p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleWithdrawSubmit} className="p-6 space-y-5">
              {/* Payment Operator Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Mtoa Huduma wa Mtandao</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "m-pesa", label: "Vodacom M-Pesa", color: "border-red-500 text-red-600 bg-red-50/10" },
                    { id: "tigo-pesa", label: "Tigo Pesa", color: "border-blue-500 text-blue-600 bg-blue-50/10" },
                    { id: "airtel-money", label: "Airtel Money", color: "border-rose-600 text-rose-600 bg-rose-50/10" },
                    { id: "halopesa", label: "Halopesa", color: "border-orange-500 text-orange-600 bg-orange-50/10" },
                  ].map((operator) => (
                    <button
                      key={operator.id}
                      type="button"
                      onClick={() => setPaymentMethod(operator.id)}
                      className={`flex items-center justify-center p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                        paymentMethod === operator.id
                          ? `${operator.color} border-2 ring-2 ring-emerald-500/25`
                          : "border-slate-200 text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {operator.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Phone Number */}
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-bold text-slate-700">
                  Namba ya Simu ya Kupokelea (e.g. 07XXXXXXXX au 06XXXXXXXX)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Mfano: 0754123456"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm font-semibold h-11"
                />
              </div>

              {/* Amount Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="amount" className="text-xs font-bold text-slate-700">Kiasi cha Kutoa</Label>
                  <span className="text-[10px] font-bold text-slate-400">Tzs pekee</span>
                </div>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Mfano: 10000"
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="rounded-xl border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 font-black text-slate-800 text-base h-11 pl-12"
                  />
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-sm text-slate-400 font-bold">TZS</span>
                  </div>
                </div>

                {/* Quick Chips Selection */}
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(0.25)}
                    className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    25%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(0.5)}
                    className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(0.75)}
                    className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPercent(1.0)}
                    className="text-[10px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100"
                  >
                    Salio Lote (Max)
                  </button>
                </div>
              </div>

              {/* Live Fee Computation Panel */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs space-y-2.5">
                <div className="flex justify-between text-slate-500 font-medium">
                  <span>Kiasi cha Kutoa:</span>
                  <span>{formatTzs(Number(withdrawAmount || 0))}</span>
                </div>
                <div className="flex justify-between text-rose-500 font-semibold">
                  <span className="flex items-center gap-1">
                    Gharama ya Muamala (10%):
                  </span>
                  <span>-{formatTzs(calculatedFee)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-2.5 text-slate-800 font-black text-sm">
                  <span>Utapokea (Net):</span>
                  <span className="text-emerald-600">{formatTzs(expectedPayout)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 rounded-xl font-bold h-11 text-xs border-slate-200 hover:bg-slate-50"
                >
                  Ghairi
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitLoading || !withdrawAmount || Number(withdrawAmount) <= 0}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold h-11 text-xs rounded-xl shadow-lg shadow-emerald-500/25 border-none transition-transform active:scale-95 gap-1.5"
                >
                  {isSubmitLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Inatuma...
                    </>
                  ) : (
                    <>
                      Thibitisha Utoaji
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  )
}
