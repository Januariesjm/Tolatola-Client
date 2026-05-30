"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

interface FinanceSettlementsTabProps {
  transactions: any[]
}

export function FinanceSettlementsTab({ transactions }: FinanceSettlementsTabProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const groupedTransactions = useMemo(() => {
    const map = new Map<string, any>()
    transactions.forEach(t => {
      const key = t.order_id || t.id
      if (!map.has(key)) {
        map.set(key, { ...t, amount: t.amount || 0, shops: [t.shops?.name].filter(Boolean) })
      } else {
        const existing = map.get(key)
        existing.amount += (t.amount || 0)
        if (t.shops?.name && !existing.shops.includes(t.shops.name)) {
          existing.shops.push(t.shops.name)
        }
        // If any part of the settlement is held, the whole order settlement is considered held
        if (t.status === "held") existing.status = "held"
      }
    })
    return Array.from(map.values()).map(t => ({
      ...t,
      shopNames: t.shops.join(", ") || "N/A"
    }))
  }, [transactions])

  const filtered = useMemo(() => {
    return groupedTransactions.filter((t) => {
      if (statusFilter !== "all" && t.status !== statusFilter) return false
      const q = searchQuery.toLowerCase()
      const orderNum = (t.orders?.order_number || "").toLowerCase()
      const shopName = t.shopNames.toLowerCase()
      return orderNum.includes(q) || shopName.includes(q)
    })
  }, [groupedTransactions, searchQuery, statusFilter])

  const totalHeld = groupedTransactions.filter((t) => t.status === "held").reduce((sum, t) => sum + (t.amount || 0), 0)
  const totalReleased = groupedTransactions.filter((t) => t.status === "released").reduce((sum, t) => sum + (t.amount || 0), 0)
  const totalRefunded = groupedTransactions.filter((t) => t.status === "refunded").reduce((sum, t) => sum + (t.amount || 0), 0)

  const statusColors: Record<string, string> = {
    held: "bg-yellow-100 text-yellow-700 border-yellow-200",
    released: "bg-emerald-100 text-emerald-700 border-emerald-200",
    refunded: "bg-rose-100 text-rose-700 border-rose-200",
  }

  const statusLabel: Record<string, string> = {
    held: "Pending",
    released: "Settled",
    refunded: "Refunded",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-900">Settlements</h3>
          <p className="text-slate-500 text-sm mt-1">Funds held securely in the TOLA system, awaiting delivery confirmation before distribution.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search order # or vendor..."
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
              <DropdownMenuLabel>Settlement Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem checked={statusFilter === "all"} onCheckedChange={() => setStatusFilter("all")}>All</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === "held"} onCheckedChange={() => setStatusFilter("held")}>Pending</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === "released"} onCheckedChange={() => setStatusFilter("released")}>Settled</DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={statusFilter === "refunded"} onCheckedChange={() => setStatusFilter("refunded")}>Refunded</DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm rounded-xl border-yellow-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Pending Settlement</CardTitle>
            <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center">
              <Lock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">TZS {totalHeld.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{groupedTransactions.filter((t) => t.status === "held").length} orders</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-emerald-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Settled</CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
              <Unlock className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">TZS {totalReleased.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{groupedTransactions.filter((t) => t.status === "released").length} orders</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm rounded-xl border-rose-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Refunded</CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700">TZS {totalRefunded.toLocaleString()}</div>
            <p className="text-xs text-slate-500 mt-1">{groupedTransactions.filter((t) => t.status === "refunded").length} orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Settlement Records */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50">
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <ShieldCheck className="h-7 w-7 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No settlement records</h3>
            <p className="text-slate-500 mt-1 text-sm">No settlement data matches your current filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, idx) => (
            <Card key={t.id} className="shadow-sm hover:shadow-md transition-all border-slate-200">
              <CardContent className="p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                      t.status === "held" ? "bg-yellow-100" : t.status === "released" ? "bg-emerald-100" : "bg-rose-100"
                    }`}>
                      {t.status === "held" ? <Lock className="h-5 w-5 text-yellow-600" /> :
                       t.status === "released" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> :
                       <AlertTriangle className="h-5 w-5 text-rose-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-900">Order #{t.orders?.order_number || "—"}</span>
                        <Badge variant="outline" className={`rounded-lg px-2.5 py-0.5 text-[11px] font-semibold border ${statusColors[t.status] || ""}`}>
                          {statusLabel[t.status] || t.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">Merchant: {t.shopNames}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Amount</p>
                      <p className="text-lg font-bold text-slate-900">TZS {(t.amount || 0).toLocaleString()}</p>
                    </div>
                    <div className="text-right min-w-[100px]">
                      <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Created</p>
                      <p className="text-sm font-medium text-slate-700">{format(new Date(t.created_at), "MMM d, yyyy")}</p>
                    </div>
                    {t.released_at && (
                      <div className="text-right min-w-[100px]">
                        <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">Settled On</p>
                        <p className="text-sm font-medium text-emerald-700">{format(new Date(t.released_at), "MMM d, yyyy")}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
