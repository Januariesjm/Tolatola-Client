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
 * Generated payroll records for the selected month.
 *
 * Sliced verbatim out of hr-payroll-subtab.tsx, which was 804 lines of payroll
 * fetching and this markup in one file.
 */
export function PayrollRecordsTab({ vm }: { vm: HRPayrollViewModel }) {
  const {
    activeTab,
    formatCurrency,
    monthlyTotals,
    records,
    selectedMonth,
    setGenMonth,
    setIsGenerateOpen,
    setIsPayslipOpen,
    setSelectedMonth,
    setSelectedRecordForDetail,
  } = vm

  return (
    <>
      {activeTab === "records" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-xl bg-white">
            <div className="flex items-center gap-3">
              <Label className="font-semibold text-slate-700">Month:</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="max-w-[180px] rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
            <Badge className="bg-slate-900 text-white rounded-md self-start sm:self-center font-bold px-3 py-1 font-mono text-xs">
              Records: {records.length}
            </Badge>
          </div>

          <Card className="rounded-xl border shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              {records.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  No payroll records found for {selectedMonth}. Click{" "}
                  <strong
                    className="text-primary cursor-pointer hover:underline"
                    onClick={() => {
                      setGenMonth(selectedMonth)
                      setIsGenerateOpen(true)
                    }}
                  >
                    Generate Payroll
                  </strong>{" "}
                  to create them.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Basic Salary</TableHead>
                      <TableHead className="text-right">Allowances</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">PAYE</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((rec) => (
                      <TableRow key={rec.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-slate-800">{rec.hr_staff_records?.full_name || "Employee"}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(rec.basic_salary)}</TableCell>
                        <TableCell className="text-right font-medium text-slate-700">{formatCurrency(rec.allowances)}</TableCell>
                        <TableCell className="text-right font-medium text-slate-700">{formatCurrency(rec.deductions)}</TableCell>
                        <TableCell className="text-right text-pink-600 font-medium">{formatCurrency(rec.paye)}</TableCell>
                        <TableCell className="text-right font-bold text-slate-900">{formatCurrency(rec.net_salary)}</TableCell>
                        <TableCell className="text-sm text-slate-600">{rec.created_by}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg text-slate-700 border-slate-200"
                              onClick={() => {
                                setSelectedRecordForDetail(rec)
                                setIsPayslipOpen(true)
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg text-slate-700 border-slate-200"
                              onClick={() => {
                                setSelectedRecordForDetail(rec)
                                setIsPayslipOpen(true)
                                // Let the modal render, then print
                                setTimeout(() => window.print(), 300)
                              }}
                            >
                              Payslip
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Month Total Sum Row */}
                    <TableRow className="bg-slate-50 font-bold hover:bg-slate-50 border-t-2 border-slate-200">
                      <TableCell className="text-slate-800 font-black">Month Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(monthlyTotals.basic)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(monthlyTotals.allowances)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(monthlyTotals.deductions)}</TableCell>
                      <TableCell className="text-right text-pink-600">{formatCurrency(monthlyTotals.paye)}</TableCell>
                      <TableCell className="text-right text-slate-900 font-black">{formatCurrency(monthlyTotals.net)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
