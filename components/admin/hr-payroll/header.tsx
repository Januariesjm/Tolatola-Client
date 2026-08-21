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
 * Month picker, totals strip and the generate-payroll action.
 *
 * Sliced verbatim out of hr-payroll-subtab.tsx, which was 804 lines of payroll
 * fetching and this markup in one file.
 */
export function PayrollHeader({ vm }: { vm: HRPayrollViewModel }) {
  const { activeTab, profiles, records, selectedMonth, setActiveTab, setGenMonth, setIsGenerateOpen } = vm

  return (
    <>
      {/* Top Header Card */}
      <Card className="shadow-sm border border-slate-200/80 rounded-xl overflow-hidden bg-white">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/40 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">Payroll Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Review history, update salaries, and generate payslips.</p>
          </div>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm self-start sm:self-center"
            onClick={() => {
              setGenMonth(selectedMonth)
              setIsGenerateOpen(true)
            }}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Generate Payroll
          </Button>
        </div>

        <div className="px-6 border-b">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "overview" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("profiles")}
              className={`py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "profiles" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Employee Profiles
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "records" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Payroll Records
            </button>
          </div>
        </div>
      </Card>
    </>
  )
}
