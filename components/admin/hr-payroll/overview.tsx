"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Coins,
  FileSpreadsheet,
  Printer,
  Edit2,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Loader2,
  Eye,
} from "lucide-react"
import type { PayrollRecord } from "@/hooks/use-hr-payroll"
import type { HRPayrollViewModel } from "./view-model"

/**
 * Monthly totals broken down by component.
 *
 * Sliced verbatim out of hr-payroll-subtab.tsx, which was 804 lines of payroll
 * fetching and this markup in one file.
 */
export function PayrollOverviewTab({ vm }: { vm: HRPayrollViewModel }) {
  const { activeTab, formatCurrency, monthlyTotals, records, selectedMonth, setSelectedMonth } = vm

  return (
    <>
      {/* Main Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Label className="font-semibold text-slate-700">Select Month:</Label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="max-w-[180px] rounded-xl bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Net Payout</CardTitle>
                <Coins className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">TZS {formatCurrency(monthlyTotals.net)}</div>
                <p className="text-xs text-muted-foreground mt-1">For the month of {selectedMonth}</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Basic Salary</CardTitle>
                <DollarSign className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">TZS {formatCurrency(monthlyTotals.basic)}</div>
                <p className="text-xs text-muted-foreground mt-1">Before allowances/deductions</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Allowances</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">TZS {formatCurrency(monthlyTotals.allowances)}</div>
                <p className="text-xs text-muted-foreground mt-1">Bonuses, benefits, travel</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">PAYE & Deductions</CardTitle>
                <Badge className="bg-red-50 text-red-700 border-red-200">Tax Deducted</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">TZS {formatCurrency(monthlyTotals.deductions + monthlyTotals.paye)}</div>
                <p className="text-xs text-muted-foreground mt-1">PAYE: TZS {formatCurrency(monthlyTotals.paye)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-base font-bold">Monthly Summary Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 max-w-md text-sm">
                <span className="text-slate-500 font-medium">Total Staff Count on Payroll:</span>
                <span className="font-bold text-right">{records.length} Employees</span>

                <span className="text-slate-500 font-medium">Average Net Salary:</span>
                <span className="font-bold text-right">
                  TZS {records.length ? formatCurrency(monthlyTotals.net / records.length) : "0.00"}
                </span>

                <span className="text-slate-500 font-medium">Month Status:</span>
                <span className="text-right">
                  {records.length > 0 ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                      Generated & Paid
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold">
                      No Records
                    </Badge>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
