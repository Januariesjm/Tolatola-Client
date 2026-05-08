"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, LineChart, Banknote, ShieldCheck, PieChart, Wallet, Clock } from "lucide-react"

import { FinanceOrdersTab } from "./finance-orders-tab"
import { FinanceCollectionsTab } from "./finance-collections-tab"
import { FinanceSettlementsTab } from "./finance-settlements-tab"
import { FinanceDisbursementsTab } from "./finance-disbursements-tab"
import { FinancePayoutsTab } from "./finance-payouts-tab"
import { FinanceAuditTab } from "./finance-audit-tab"

interface FinanceHubTabProps {
  orders: any[]
  transactions: any[]
  payouts: any[]
  stats: any
}

export function FinanceHubTab({ orders, transactions, payouts, stats }: FinanceHubTabProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const pendingPayouts = payouts.filter((p) => p.status === "pending").length
  const heldFunds = transactions.filter((t) => t.status === "held").reduce((acc, t) => acc + (t.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Finance Operations</h2>
          <p className="text-slate-500 mt-1">Manage collections, settlements, revenue splits, and payouts.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex whitespace-nowrap bg-white border border-slate-200 rounded-xl p-1 h-auto shadow-sm">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              <LineChart className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              <Banknote className="h-4 w-4 mr-2" />
              Order Economics
            </TabsTrigger>
            <TabsTrigger value="collections" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              <DollarSign className="h-4 w-4 mr-2" />
              Collections
            </TabsTrigger>
            <TabsTrigger value="settlements" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Settlements
            </TabsTrigger>
            <TabsTrigger value="disbursements" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              <PieChart className="h-4 w-4 mr-2" />
              Disbursements
            </TabsTrigger>
            <TabsTrigger value="payouts" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              <Wallet className="h-4 w-4 mr-2" />
              Payouts
              {pendingPayouts > 0 && (
                <span className="ml-2 inline-flex items-center justify-center bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingPayouts}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="rounded-lg px-4 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-white">
              <Clock className="h-4 w-4 mr-2" />
              Audit Timeline
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <Card className="shadow-sm rounded-xl border border-primary/20 bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Total GMV
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  TZS {stats.totalGMV?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-xl border border-yellow-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Secure Hold
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-yellow-50 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  TZS {heldFunds.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-xl border border-indigo-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Total Payouts
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-indigo-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {payouts.length}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-xl border border-blue-200 bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  Processed Orders
                </CardTitle>
                <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                  <Banknote className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {orders.length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card className="border-slate-200 shadow-sm">
             <CardHeader>
               <CardTitle>Financial Flow Structure</CardTitle>
               <CardDescription>Visualizing the independent stages of money flow in TOLA</CardDescription>
             </CardHeader>
             <CardContent>
               <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-8 px-4">
                  <div className="flex-1 text-center p-6 border-2 border-dashed border-emerald-200 rounded-xl bg-emerald-50 w-full">
                    <h3 className="font-bold text-emerald-700 mb-2">1. Collection</h3>
                    <p className="text-xs text-emerald-600">Customer Payment (Mobile Money)</p>
                  </div>
                  <div className="hidden md:block text-slate-300">→</div>
                  <div className="flex-1 text-center p-6 border-2 border-dashed border-yellow-200 rounded-xl bg-yellow-50 w-full">
                    <h3 className="font-bold text-yellow-700 mb-2">2. Settlement</h3>
                    <p className="text-xs text-yellow-600">Funds Held securely pending delivery</p>
                  </div>
                  <div className="hidden md:block text-slate-300">→</div>
                  <div className="flex-1 text-center p-6 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50 w-full">
                    <h3 className="font-bold text-indigo-700 mb-2">3. Disbursement</h3>
                    <p className="text-xs text-indigo-600">Revenue split (Vendor/Driver/TOLA)</p>
                  </div>
                  <div className="hidden md:block text-slate-300">→</div>
                  <div className="flex-1 text-center p-6 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50 w-full">
                    <h3 className="font-bold text-blue-700 mb-2">4. Payout</h3>
                    <p className="text-xs text-blue-600">Final money transfer to recipients</p>
                  </div>
               </div>
             </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="outline-none">
          <FinanceOrdersTab orders={orders} transactions={transactions} payouts={payouts} />
        </TabsContent>

        <TabsContent value="collections" className="outline-none">
          <FinanceCollectionsTab orders={orders} />
        </TabsContent>

        <TabsContent value="settlements" className="outline-none">
          <FinanceSettlementsTab transactions={transactions} />
        </TabsContent>

        <TabsContent value="disbursements" className="outline-none">
          <FinanceDisbursementsTab orders={orders} />
        </TabsContent>

        <TabsContent value="payouts" className="outline-none">
          <FinancePayoutsTab payouts={payouts} />
        </TabsContent>
        
        <TabsContent value="audit" className="outline-none">
          <FinanceAuditTab orders={orders} transactions={transactions} payouts={payouts} />
        </TabsContent>

      </Tabs>
    </div>
  )
}
