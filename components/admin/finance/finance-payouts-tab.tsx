"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  Store,
  Truck,
  Banknote,
  Smartphone,
  Send,
  Loader2,
  RefreshCcw,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

interface FinancePayoutsTabProps {
  payouts: any[]
}

export function FinancePayoutsTab({ payouts }: FinancePayoutsTabProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [processing, setProcessing] = useState<string | null>(null)
  const [localPayouts, setLocalPayouts] = useState<any[]>(payouts)

  useEffect(() => {
    setLocalPayouts(payouts)
  }, [payouts])

  // Poll for processing payouts
  useEffect(() => {
    const processingPayouts = localPayouts.filter(p => p.status === "processing")
    
    if (processingPayouts.length === 0) return;

    let mounted = true;
    const pollStatuses = async () => {
      for (const p of processingPayouts) {
        try {
          const userType = p.user_type || "vendor"
          const res = await fetch(`/api/admin/payouts/${p.id}/status?userType=${userType}`)
          if (res.ok) {
            const data = await res.json()
            if (data.payout && data.payout.status !== "processing" && mounted) {
              setLocalPayouts(prev => prev.map(item => item.id === p.id ? data.payout : item))
              toast({
                title: "Payout Status Updated",
                description: `Payout is now ${data.payout.status}`,
              })
              router.refresh()
            }
          }
        } catch (e) {
          console.error("Failed to poll payout status", e)
        }
      }
    }

    const interval = setInterval(pollStatuses, 5000)
    
    return () => {
      mounted = false;
      clearInterval(interval)
    }
  }, [localPayouts, router, toast])

  const filtered = useMemo(() => {
    return localPayouts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      const q = searchQuery.toLowerCase()
      const businessName = (p.business_name || "").toLowerCase()
      const fullName = (p.full_name || "").toLowerCase()
      const phone = (p.phone || "").toLowerCase()
      const vendorId = (p.vendor_id || p.user_id || "").toLowerCase()
      const method = (p.payment_method || "").toLowerCase()
      return (
        businessName.includes(q) ||
        fullName.includes(q) ||
        phone.includes(q) ||
        vendorId.includes(q) ||
        method.includes(q)
      )
    })
  }, [localPayouts, searchQuery, statusFilter])

  const totalPending = localPayouts.filter((p) => p.status === "pending").reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalProcessing = localPayouts.filter((p) => p.status === "processing").reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalCompleted = localPayouts.filter((p) => p.status === "completed").reduce((s, p) => s + Number(p.amount || 0), 0)
  const totalFailed = localPayouts.filter((p) => p.status === "failed").reduce((s, p) => s + Number(p.amount || 0), 0)

  const handleApprove = async (payoutId: string, userType: string) => {
    setProcessing(payoutId)
    try {
      const response = await fetch("/api/admin/payouts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, userType }),
      })
      if (response.ok) {
        toast({ title: "Payout approved", description: "The payout has been initiated and is now processing." })
        setLocalPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: "processing" } : p))
        router.refresh()
      } else {
        throw new Error("Failed to approve payout")
      }
    } catch {
      toast({ title: "Error", description: "Failed to approve payout", variant: "destructive" })
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (payoutId: string, userType: string) => {
    setProcessing(payoutId)
    try {
      const response = await fetch("/api/admin/payouts/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId, userType }),
      })
      if (response.ok) {
        toast({ title: "Payout rejected", description: "The payout request has been rejected." })
        setLocalPayouts(prev => prev.map(p => p.id === payoutId ? { ...p, status: "failed" } : p))
        router.refresh()
      } else {
        throw new Error("Failed to reject payout")
      }
    } catch {
      toast({ title: "Error", description: "Failed to reject payout", variant: "destructive" })
    } finally {
      setProcessing(null)
    }
  }

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    processing: "bg-orange-100 text-orange-700 border-orange-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-rose-100 text-rose-700 border-rose-200",
  }

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    processing: "Processing",
    completed: "Sent",
    failed: "Failed",
  }

  const getPayoutIcon = (method: string) => {
    if (method?.toLowerCase().includes("bank")) return <Banknote className="h-4 w-4 text-blue-600" />
    return <Smartphone className="h-4 w-4 text-emerald-600" />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold text-slate-900">Payouts</h3>
            <Button variant="outline" size="icon" onClick={() => router.refresh()} className="h-8 w-8 rounded-full">
              <RefreshCcw className="h-4 w-4 text-slate-500" />
            </Button>
          </div>
          <p className="text-slate-500 text-sm mt-1">Final money transfers to vendors and drivers via Mobile Money or Bank.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search vendor, method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl border-slate-200 shadow-sm"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 rounded-xl border-slate-200 px-4 gap-2">
                <Filter className="h-4 w-4" />
                <span>{statusFilter === "all" ? "All" : statusLabel[statusFilter] || statusFilter}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
              <DropdownMenuLabel>Payout Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {["all", "pending", "processing", "completed", "failed"].map((s) => (
                <DropdownMenuCheckboxItem key={s} checked={statusFilter === s} onCheckedChange={() => setStatusFilter(s)}>
                  {s === "all" ? "All Status" : statusLabel[s] || s}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm rounded-xl border-amber-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Pending</CardTitle>
            <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">TZS {totalPending.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{localPayouts.filter((p) => p.status === "pending").length} payouts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-orange-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Processing</CardTitle>
            <div className="h-8 w-8 rounded-full bg-orange-50 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">TZS {totalProcessing.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{localPayouts.filter((p) => p.status === "processing").length} active</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-emerald-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Sent</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <Send className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">TZS {totalCompleted.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{localPayouts.filter((p) => p.status === "completed").length} payouts</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-rose-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Failed</CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">TZS {totalFailed.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{localPayouts.filter((p) => p.status === "failed").length} payouts</p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Records */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Wallet className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No payout records</h3>
            <p className="text-slate-500 mt-1 text-sm">No payouts match your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((payout, idx) => (
            <Card key={payout.id} className="shadow-sm hover:shadow-md transition-all border-slate-200">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                      payout.status === "pending" ? "bg-amber-100" : 
                      payout.status === "processing" ? "bg-orange-100" :
                      payout.status === "completed" ? "bg-emerald-100" : "bg-rose-100"
                    }`}>
                      {payout.status === "pending" ? <Clock className="h-5 w-5 text-amber-600" /> :
                       payout.status === "processing" ? <Loader2 className="h-5 w-5 text-orange-600 animate-spin" /> :
                       payout.status === "completed" ? <CheckCircle className="h-5 w-5 text-emerald-600" /> :
                       <XCircle className="h-5 w-5 text-rose-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-lg">TZS {Number(payout.amount || 0).toLocaleString()}</span>
                        <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 text-[11px] font-semibold border ${statusColors[payout.status] || ""}`}>
                          {statusLabel[payout.status] || payout.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          {payout.user_type === "transporter" ? <Truck className="h-3 w-3" /> : <Store className="h-3 w-3" />}
                          <span className="capitalize text-slate-700 font-medium">{payout.user_type || "Vendor"}</span>:{" "}
                          <span className="font-semibold text-slate-800">
                            {payout.business_name || payout.full_name || payout.user_id?.slice(0, 8) || "—"}
                          </span>
                          {payout.phone && <span className="text-xs text-slate-400 font-normal ml-1">({payout.phone})</span>}
                        </span>
                        <span className="flex items-center gap-1">
                          {getPayoutIcon(payout.payment_method)}
                          <span className="capitalize">{payout.payment_method?.replace("-", " ") || "Mobile Money"}</span>
                        </span>
                        <span>{format(new Date(payout.created_at), "MMM d, yyyy 'at' p")}</span>
                      </div>
                      {payout.payment_details?.details && (
                        <p className="text-xs text-slate-400 mt-1">Details: {payout.payment_details.details}</p>
                      )}
                    </div>
                  </div>

                  {payout.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                         size="sm"
                         className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                         onClick={() => handleApprove(payout.id, payout.user_type || "vendor")}
                         disabled={processing === payout.id}
                       >
                         <CheckCircle className="h-3.5 w-3.5" />
                         Approve
                       </Button>
                       <Button
                         size="sm"
                         variant="destructive"
                         className="rounded-xl gap-1.5"
                         onClick={() => handleReject(payout.id, payout.user_type || "vendor")}
                         disabled={processing === payout.id}
                       >
                         <XCircle className="h-3.5 w-3.5" />
                         Reject
                       </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
