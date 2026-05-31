"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users, TrendingUp, ShieldCheck, Truck, Store, Search,
  Download, FileSpreadsheet, FileText, ChevronDown, ChevronUp,
  BarChart3, AlertTriangle, Wifi, CreditCard, Eye,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface ValidationSurvey {
  id: string; full_name: string; phone: string; email: string
  region: string; district: string; location_ward: string; respondent_type: string
  q1_challenges: string; q2_biggest_challenge: string; q3_impact_rating: number
  q4_time_searching: string; q5_lost_money: string; q6_channels: string[]
  q7_satisfaction_rating: number; q8_platform_value_rating: number
  q9_escrow_importance: number; q10_buyer_protection_importance: number
  q11_otp_reduces_disputes: string; q12_nearby_suppliers_frequency: string
  q13_willing_to_pay: string; q14_payment_amount: string
  q15_choice_and_reason: string; created_at: string
}

interface SurveyStats {
  totalResponses: number; totalConsumers: number; totalVendors: number
  totalTransporters: number; trustProblemPct: number; informationGapPct: number
  digitalAdoptionPct: number; willingnessToPayPct: number
  escrowAcceptancePct: number; buyerProtectionAcceptancePct: number
}

interface Props {
  initialSurveys?: ValidationSurvey[]
  initialStats?: SurveyStats
}

const defaultStats: SurveyStats = {
  totalResponses: 0, totalConsumers: 0, totalVendors: 0,
  totalTransporters: 0, trustProblemPct: 0, informationGapPct: 0,
  digitalAdoptionPct: 0, willingnessToPayPct: 0,
  escrowAcceptancePct: 0, buyerProtectionAcceptancePct: 0,
}

export function ValidationSurveysTab({ initialSurveys = [], initialStats }: Props) {
  const [surveys, setSurveys] = useState<ValidationSurvey[]>(initialSurveys)
  const [stats, setStats] = useState<SurveyStats>(initialStats || defaultStats)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initialSurveys.length)

  useEffect(() => {
    if (initialSurveys.length) return
    fetchSurveys()
  }, [])

  const fetchSurveys = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/validation-surveys`)
      if (res.ok) {
        const json = await res.json()
        setSurveys(json.data || [])
        setStats(json.stats || defaultStats)
      }
    } catch (e) { console.error("Failed to fetch surveys:", e) }
    finally { setLoading(false) }
  }

  const filtered = useMemo(() => {
    let result = surveys
    if (typeFilter !== "all") result = result.filter(s => s.respondent_type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.full_name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q)
      )
    }
    return result
  }, [surveys, search, typeFilter])

  const exportCSV = () => {
    const headers = [
      "#", "Timestamp", "Full Name", "Phone", "Email", "Region", "District", "Ward",
      "Type", "Q1-Challenges", "Q2-Biggest Challenge", "Q3-Impact", "Q4-Time Searching",
      "Q5-Lost Money", "Q6-Channels", "Q7-Satisfaction", "Q8-Platform Value",
      "Q9-Escrow", "Q10-Buyer Protection", "Q11-OTP", "Q12-Nearby Frequency",
      "Q13-Willing to Pay", "Q14-Amount", "Q15-Choice & Reason"
    ]
    const rows = filtered.map((s, i) => [
      i + 1, new Date(s.created_at).toLocaleString(), s.full_name, s.phone, s.email,
      s.region, s.district, s.location_ward, s.respondent_type,
      s.q1_challenges, s.q2_biggest_challenge, s.q3_impact_rating, s.q4_time_searching,
      s.q5_lost_money, (s.q6_channels || []).join("; "), s.q7_satisfaction_rating,
      s.q8_platform_value_rating, s.q9_escrow_importance, s.q10_buyer_protection_importance,
      s.q11_otp_reduces_disputes, s.q12_nearby_suppliers_frequency,
      s.q13_willing_to_pay, s.q14_payment_amount, `"${(s.q15_choice_and_reason || "").replace(/"/g, '""')}"`
    ])
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `tola-validation-surveys-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    // Use CSV with .xls extension for compatibility without extra dependencies
    const headers = [
      "#", "Timestamp", "Full Name", "Phone", "Email", "Region", "District", "Ward",
      "Type", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15"
    ]
    const rows = filtered.map((s, i) => [
      i + 1, new Date(s.created_at).toLocaleString(), s.full_name, s.phone, s.email,
      s.region, s.district, s.location_ward, s.respondent_type,
      s.q1_challenges, s.q2_biggest_challenge, s.q3_impact_rating, s.q4_time_searching,
      s.q5_lost_money, (s.q6_channels || []).join("; "), s.q7_satisfaction_rating,
      s.q8_platform_value_rating, s.q9_escrow_importance, s.q10_buyer_protection_importance,
      s.q11_otp_reduces_disputes, s.q12_nearby_suppliers_frequency,
      s.q13_willing_to_pay, s.q14_payment_amount, s.q15_choice_and_reason
    ])
    let table = "<table><tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>"
    rows.forEach(r => { table += "<tr>" + r.map(c => `<td>${c ?? ""}</td>`).join("") + "</tr>" })
    table += "</table>"
    const blob = new Blob([`<html><body>${table}</body></html>`], { type: "application/vnd.ms-excel" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `tola-validation-surveys-${new Date().toISOString().slice(0, 10)}.xls`
    a.click(); URL.revokeObjectURL(url)
  }

  const exportPDF = () => {
    const win = window.open("", "_blank")
    if (!win) return
    const rows = filtered.map((s, i) => `
      <tr>
        <td>${i + 1}</td><td>${new Date(s.created_at).toLocaleDateString()}</td>
        <td>${s.full_name}</td><td>${s.phone}</td><td>${s.email}</td>
        <td>${s.region}</td><td>${s.respondent_type}</td>
        <td>${s.q2_biggest_challenge}</td><td>${s.q3_impact_rating}/10</td>
        <td>${s.q9_escrow_importance}/10</td><td>${s.q13_willing_to_pay}</td>
      </tr>`).join("")
    win.document.write(`<!DOCTYPE html><html><head><title>TOLA Validation Surveys</title>
      <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f5f5f5;font-weight:600}
      h1{font-size:18px;margin-bottom:4px}p{color:#666;font-size:12px;margin-top:0}</style></head>
      <body><h1>TOLA Market Validation Survey Report</h1>
      <p>Generated: ${new Date().toLocaleString()} | Total: ${filtered.length} responses</p>
      <table><tr><th>#</th><th>Date</th><th>Name</th><th>Phone</th><th>Email</th><th>Region</th><th>Type</th><th>Challenge</th><th>Impact</th><th>Escrow</th><th>Pay?</th></tr>
      ${rows}</table></body></html>`)
    win.document.close()
    setTimeout(() => { win.print() }, 500)
  }

  const statCards = [
    { label: "Total Responses", value: stats.totalResponses, icon: BarChart3, color: "text-primary", bg: "bg-primary/10" },
    { label: "Consumers", value: stats.totalConsumers, icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Vendors", value: stats.totalVendors, icon: Store, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Transporters", value: stats.totalTransporters, icon: Truck, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Trust Problem", value: `${stats.trustProblemPct}%`, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    { label: "Info Gap", value: `${stats.informationGapPct}%`, icon: Search, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Digital Adoption", value: `${stats.digitalAdoptionPct}%`, icon: Wifi, color: "text-cyan-600", bg: "bg-cyan-100" },
    { label: "Willing to Pay", value: `${stats.willingnessToPayPct}%`, icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Escrow Acceptance", value: `${stats.escrowAcceptancePct}%`, icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" },
    { label: "Buyer Protection", value: `${stats.buyerProtectionAcceptancePct}%`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-100" },
  ]

  const TYPES = ["all", "Consumer", "Producer", "Manufacturer", "Supplier", "Wholesaler", "Retail Trader", "Transporter", "Other"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Market Validation Survey</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5"><Download className="h-3.5 w-3.5" />CSV</Button>
          <Button variant="outline" size="sm" onClick={exportExcel} className="gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5"><FileText className="h-3.5 w-3.5" />PDF</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map(sc => (
          <Card key={sc.label} className="shadow-sm border border-slate-100">
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">{sc.label}</span>
                <div className={`h-7 w-7 rounded-full ${sc.bg} flex items-center justify-center`}>
                  <sc.icon className={`h-3.5 w-3.5 ${sc.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{sc.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search by name, email, or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30">
          {TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>)}
        </select>
      </div>

      {/* Responses Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">Loading surveys...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400">No survey responses found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 w-12">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Contact</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Region</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Challenge</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Impact</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Date</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <>
                      <tr key={s.id} className="border-b hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                        <td className="px-4 py-3 text-slate-400 font-bold">#{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">{s.full_name}</td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700">{s.email}</div>
                          <div className="text-xs text-slate-400">{s.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.region}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">{s.respondent_type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{s.q2_biggest_challenge}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${s.q3_impact_rating >= 7 ? "text-red-600" : s.q3_impact_rating >= 4 ? "text-amber-600" : "text-emerald-600"}`}>
                            {s.q3_impact_rating}/10
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{new Date(s.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-center">
                          {expandedId === s.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </td>
                      </tr>
                      {expandedId === s.id && (
                        <tr key={`${s.id}-detail`} className="bg-slate-50/50">
                          <td colSpan={9} className="px-6 py-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-800 mb-3">Respondent Details</h4>
                                <p><span className="text-slate-500">District:</span> {s.district}</p>
                                <p><span className="text-slate-500">Ward:</span> {s.location_ward}</p>
                                <p><span className="text-slate-500">Channels:</span> {(s.q6_channels || []).join(", ")}</p>
                                <p><span className="text-slate-500">Time Searching:</span> {s.q4_time_searching}</p>
                                <p><span className="text-slate-500">Lost Money:</span> {s.q5_lost_money}</p>
                                <p><span className="text-slate-500">Challenges:</span> {s.q1_challenges}</p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-slate-800 mb-3">Ratings & Preferences</h4>
                                <p><span className="text-slate-500">Satisfaction:</span> {s.q7_satisfaction_rating}/10</p>
                                <p><span className="text-slate-500">Platform Value:</span> {s.q8_platform_value_rating}/10</p>
                                <p><span className="text-slate-500">Escrow Importance:</span> {s.q9_escrow_importance}/10</p>
                                <p><span className="text-slate-500">Buyer Protection:</span> {s.q10_buyer_protection_importance}/10</p>
                                <p><span className="text-slate-500">OTP Reduces Disputes:</span> {s.q11_otp_reduces_disputes}</p>
                                <p><span className="text-slate-500">Nearby Suppliers:</span> {s.q12_nearby_suppliers_frequency}</p>
                                <p><span className="text-slate-500">Willing to Pay:</span> {s.q13_willing_to_pay}</p>
                                <p><span className="text-slate-500">Payment Amount:</span> {s.q14_payment_amount}</p>
                              </div>
                              <div className="md:col-span-2 mt-2 p-3 bg-white rounded-xl border border-slate-200">
                                <p className="text-slate-500 text-xs font-semibold mb-1">Q15: Current Method vs TOLA</p>
                                <p className="text-slate-700">{s.q15_choice_and_reason}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
