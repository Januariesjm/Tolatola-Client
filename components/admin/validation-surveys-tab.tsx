"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users, TrendingUp, ShieldCheck, Truck, Store, Search,
  Download, FileSpreadsheet, FileText, ChevronDown, ChevronUp,
  BarChart3, AlertTriangle, Wifi, CreditCard, Upload, Calendar, MapPin,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from "recharts"

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
  // Enhanced fields
  survey_date: string
  upload_date: string
  assisted_by_agent?: boolean
  agent_id?: string
  agent_name?: string
  collection_method?: string
  source?: string
  created_by?: string
  updated_by?: string
  updated_at?: string
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

const TYPES = ["all", "Consumer", "Producer", "Manufacturer", "Supplier", "Wholesaler", "Retail Trader", "Transporter", "Other"]

const REGIONS = [
  "Arusha","Dar es Salaam","Dodoma","Geita","Iringa","Kagera","Katavi","Kigoma",
  "Kilimanjaro","Lindi","Manyara","Mara","Mbeya","Morogoro","Mtwara","Mwanza",
  "Njombe","Pemba Kaskazini","Pemba Kusini","Pwani","Rukwa","Ruvuma","Shinyanga",
  "Simiyu","Singida","Songwe","Tabora","Tanga","Unguja Kaskazini","Unguja Kusini","Unguja Mjini Magharibi"
]

export function ValidationSurveysTab({ initialSurveys = [], initialStats }: Props) {
  const [surveys, setSurveys] = useState<ValidationSurvey[]>(initialSurveys)
  const [stats, setStats] = useState<SurveyStats>(initialStats || defaultStats)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initialSurveys.length)

  // Standard and Enhanced Filter State
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [agentFilter, setAgentFilter] = useState("")
  const [surveyFrom, setSurveyFrom] = useState("")
  const [surveyTo, setSurveyTo] = useState("")
  const [uploadFrom, setUploadFrom] = useState("")
  const [uploadTo, setUploadTo] = useState("")

  // Bulk Import Wizard State
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importStep, setImportStep] = useState(1)
  const [importError, setImportError] = useState<string | null>(null)
  const [parsedRows, setParsedRows] = useState<any[]>([])
  
  // Default values configurables
  const [defaultAgentId, setDefaultAgentId] = useState("")
  const [defaultAgentName, setDefaultAgentName] = useState("")
  const [defaultSource, setDefaultSource] = useState("Manual Bulk Entry")
  const [defaultCollectionMethod, setDefaultCollectionMethod] = useState("Physical Interview")

  const fetchSurveys = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.append("search", search)
      if (typeFilter && typeFilter !== "all") params.append("type", typeFilter)
      if (surveyFrom) params.append("survey_from", surveyFrom)
      if (surveyTo) params.append("survey_to", surveyTo)
      if (uploadFrom) params.append("upload_from", uploadFrom)
      if (uploadTo) params.append("upload_to", uploadTo)
      if (regionFilter && regionFilter !== "all") params.append("region", regionFilter)
      if (agentFilter.trim()) params.append("agent", agentFilter)

      const res = await fetch(`/api/admin/validation-surveys?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        setSurveys(json.data || [])
        setStats(json.stats || defaultStats)
      }
    } catch (e) {
      console.error("Failed to fetch surveys:", e)
    } finally {
      setLoading(false)
    }
  }

  // Trigger search on filter changes
  useEffect(() => {
    fetchSurveys()
  }, [typeFilter, surveyFrom, surveyTo, uploadFrom, uploadTo, regionFilter])

  // Debounced trigger on search/agent queries
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSurveys()
    }, 450)
    return () => clearTimeout(timer)
  }, [search, agentFilter])

  const resetFilters = () => {
    setSearch("")
    setTypeFilter("all")
    setRegionFilter("all")
    setAgentFilter("")
    setSurveyFrom("")
    setSurveyTo("")
    setUploadFrom("")
    setUploadTo("")
  }

  // Trend analysis data for Recharts (grouped by survey_date)
  const trendData = useMemo(() => {
    const datesMap: Record<string, number> = {}
    surveys.forEach(s => {
      const dateStr = s.survey_date ? s.survey_date.split("T")[0] : new Date(s.created_at).toISOString().split("T")[0]
      datesMap[dateStr] = (datesMap[dateStr] || 0) + 1
    })

    return Object.entries(datesMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-15) // last 15 days for a clean grid layout
  }, [surveys])

  const filtered = surveys // API already applies all criteria server-side!

  // --- CSV parsing & Importing wizard handlers ---
  const closeImportWizard = () => {
    setIsImportOpen(false)
    setImportStep(1)
    setImportError(null)
    setParsedRows([])
  }

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportError(null)
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        if (!text) {
          setImportError("File is empty.")
          return
        }

        const lines = text.split(/\r?\n/)
        if (lines.length < 2) {
          setImportError("CSV must have a header row and at least one data row.")
          return
        }

        // Quote-aware CSV line parsing
        const parseCsvLine = (line: string) => {
          const result = []
          let cur = ""
          let inQuotes = false
          for (let i = 0; i < line.length; i++) {
            const char = line[i]
            if (char === '"') {
              inQuotes = !inQuotes
            } else if (char === ',' && !inQuotes) {
              result.push(cur.trim())
              cur = ""
            } else {
              cur += char
            }
          }
          result.push(cur.trim())
          return result
        }

        const rawHeaders = parseCsvLine(lines[0])
        const headers = rawHeaders.map(h => h.toLowerCase().trim().replace(/[\s_]+/g, "_"))

        const parsed: any[] = []
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const values = parseCsvLine(line)
          const record: Record<string, any> = {}
          
          headers.forEach((header, index) => {
            let val: any = values[index]
            if (val === undefined) val = ""
            
            if (typeof val === "string" && val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1)
            }
            
            let key = header
            if (header === "ward") key = "location_ward"
            if (header === "fullname" || header === "name") key = "full_name"
            if (header === "date") key = "survey_date"
            
            record[key] = val
          })
          
          // Defaults overrides
          if (!record.collection_method) record.collection_method = defaultCollectionMethod
          if (!record.source) record.source = defaultSource
          if (!record.agent_id && defaultAgentId) record.agent_id = defaultAgentId
          if (!record.agent_name && defaultAgentName) record.agent_name = defaultAgentName
          record.agent_name = record.agent_name || "Self-Submitted"
          record.assisted_by_agent = !!(record.agent_name && record.agent_name !== "Self-Submitted")

          parsed.push(record)
        }

        if (parsed.length === 0) {
          setImportError("No records found in CSV.")
          return
        }

        setParsedRows(parsed)
        setImportStep(3)
      } catch (err: any) {
        setImportError(`Failed to parse CSV: ${err.message}`)
      }
    }
    reader.readAsText(file)
  }

  const executeBulkImport = async () => {
    setLoading(true)
    setImportError(null)
    try {
      const res = await fetch("/api/admin/validation-surveys/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          surveys: parsedRows,
          defaultAgentId: defaultAgentId || null,
          defaultAgentName: defaultAgentName || null,
          defaultSource: defaultSource || null,
          defaultCollectionMethod: defaultCollectionMethod || null,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || json.details?.join("\n") || "Failed to import records.")
      }

      setImportStep(4)
      fetchSurveys() // Refresh dashboard items immediately!
    } catch (err: any) {
      setImportError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- Exporting helpers ---
  const exportCSV = () => {
    const headers = [
      "#", "Survey Date", "Upload Date", "Full Name", "Phone", "Email", "Region", "District", "Ward",
      "Type", "Assisted by Agent", "Agent ID", "Agent Name", "Collection Method", "Source", "Created By", "Created At", "Updated By", "Updated At",
      "Q1-Challenges", "Q2-Biggest Challenge", "Q3-Impact", "Q4-Time Searching",
      "Q5-Lost Money", "Q6-Channels", "Q7-Satisfaction", "Q8-Platform Value",
      "Q9-Escrow", "Q10-Buyer Protection", "Q11-OTP", "Q12-Nearby Frequency",
      "Q13-Willing to Pay", "Q14-Amount", "Q15-Choice & Reason"
    ]
    const rows = filtered.map((s, i) => [
      i + 1,
      s.survey_date || "",
      s.upload_date || "",
      s.full_name,
      s.phone,
      s.email || "",
      s.region,
      s.district,
      s.location_ward,
      s.respondent_type,
      s.assisted_by_agent ? "Yes" : "No",
      s.agent_id || "",
      s.agent_name || "Self-Submitted",
      s.collection_method || "Website",
      s.source || "",
      s.created_by || "",
      s.created_at || "",
      s.updated_by || "",
      s.updated_at || "",
      s.q1_challenges,
      s.q2_biggest_challenge,
      s.q3_impact_rating,
      s.q4_time_searching,
      s.q5_lost_money,
      (s.q6_channels || []).join("; "),
      s.q7_satisfaction_rating,
      s.q8_platform_value_rating,
      s.q9_escrow_importance,
      s.q10_buyer_protection_importance,
      s.q11_otp_reduces_disputes,
      s.q12_nearby_suppliers_frequency,
      s.q13_willing_to_pay,
      s.q14_payment_amount,
      `"${(s.q15_choice_and_reason || "").replace(/"/g, '""')}"`
    ])
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = `tola-validation-surveys-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    const headers = [
      "#", "Survey Date", "Upload Date", "Full Name", "Phone", "Email", "Region", "District", "Ward",
      "Type", "Assisted by Agent", "Agent ID", "Agent Name", "Collection Method", "Source", "Created By", "Created At", "Updated By", "Updated At",
      "Q1", "Q2", "Q3", "Q4", "Q5", "Q6", "Q7", "Q8", "Q9", "Q10", "Q11", "Q12", "Q13", "Q14", "Q15"
    ]
    const rows = filtered.map((s, i) => [
      i + 1,
      s.survey_date || "",
      s.upload_date || "",
      s.full_name,
      s.phone,
      s.email || "",
      s.region,
      s.district,
      s.location_ward,
      s.respondent_type,
      s.assisted_by_agent ? "Yes" : "No",
      s.agent_id || "",
      s.agent_name || "Self-Submitted",
      s.collection_method || "Website",
      s.source || "",
      s.created_by || "",
      s.created_at || "",
      s.updated_by || "",
      s.updated_at || "",
      s.q1_challenges,
      s.q2_biggest_challenge,
      s.q3_impact_rating,
      s.q4_time_searching,
      s.q5_lost_money,
      (s.q6_channels || []).join("; "),
      s.q7_satisfaction_rating,
      s.q8_platform_value_rating,
      s.q9_escrow_importance,
      s.q10_buyer_protection_importance,
      s.q11_otp_reduces_disputes,
      s.q12_nearby_suppliers_frequency,
      s.q13_willing_to_pay,
      s.q14_payment_amount,
      s.q15_choice_and_reason
    ])
    let table = "<table><tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>"
    rows.forEach(r => { table += "<tr>" + r.map(c => `<td>${c ?? ""}</td>`).join("") + "</tr>" })
    table += "</table>"
    const blob = new Blob([`<html><head><meta charset="utf-8"></head><body>${table}</body></html>`], { type: "application/vnd.ms-excel" })
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
        <td>${i + 1}</td>
        <td>${s.survey_date || new Date(s.created_at).toLocaleDateString()}</td>
        <td>${s.upload_date ? new Date(s.upload_date).toLocaleDateString() : new Date(s.created_at).toLocaleDateString()}</td>
        <td>${s.full_name}</td>
        <td>${s.region}</td>
        <td>${s.respondent_type}</td>
        <td>${s.collection_method || "Website"}</td>
        <td>${s.agent_name || "Self-Submitted"}</td>
        <td>${s.q2_biggest_challenge}</td>
        <td>${s.q3_impact_rating}/10</td>
      </tr>`).join("")
    win.document.write(`<!DOCTYPE html><html><head><title>TOLA Validation Surveys Report</title>
      <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border:1px solid #ddd;padding:6px;text-align:left}th{background:#f5f5f5;font-weight:600}
      h1{font-size:18px;margin-bottom:4px}p{color:#666;font-size:12px;margin-top:0}</style></head>
      <body><h1>TOLA Market Validation Survey Report</h1>
      <p>Generated: ${new Date().toLocaleString()} | Total: ${filtered.length} responses</p>
      <table><tr><th>#</th><th>Survey Date</th><th>Upload Date</th><th>Name</th><th>Region</th><th>Type</th><th>Method</th><th>Agent</th><th>Challenge</th><th>Impact</th></tr>
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Market Validation Survey</h2>
          <p className="text-xs text-slate-500 mt-0.5">Explore user survey feedback and digital trade statistics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={() => setIsImportOpen(true)} className="gap-1.5 rounded-xl bg-primary text-white hover:bg-primary/95 transition"><Upload className="h-3.5 w-3.5" />Bulk Import</Button>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 rounded-xl"><Download className="h-3.5 w-3.5" />CSV</Button>
          <Button variant="outline" size="sm" onClick={exportExcel} className="gap-1.5 rounded-xl"><FileSpreadsheet className="h-3.5 w-3.5" />Excel</Button>
          <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5 rounded-xl"><FileText className="h-3.5 w-3.5" />PDF</Button>
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

      {/* Trend Chart (by Survey Date) */}
      {trendData.length > 0 && (
        <Card className="shadow-sm border border-slate-100 bg-white/50 backdrop-blur">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Response Submissions Trend (by Survey Conducted Date)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-44 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  labelStyle={{ fontWeight: "bold", fontSize: "10px", color: "#1e293b" }}
                  itemStyle={{ fontSize: "11px", color: "#4f46e5" }}
                />
                <Area type="monotone" dataKey="count" name="Surveys Conducted" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Premium Search and Filters Grid */}
      <Card className="shadow-sm border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Text search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Search respondent name, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl bg-white border-slate-200" />
          </div>

          {/* Respondent Type */}
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer">
            {TYPES.map(t => <option key={t} value={t}>{t === "all" ? "All Respondent Types" : t}</option>)}
          </select>

          {/* Region */}
          <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer">
            <option value="all">All Regions (31 Tanzania)</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Agent ID or Name */}
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Agent ID or Agent Name" value={agentFilter} onChange={e => setAgentFilter(e.target.value)} className="pl-9 rounded-xl bg-white border-slate-200" />
            </div>
            <Button variant="outline" size="sm" onClick={resetFilters} className="text-slate-500 hover:text-slate-900 rounded-xl text-xs px-3 border border-slate-200 bg-white">
              Reset
            </Button>
          </div>
        </div>

        {/* Date Ranges Panel */}
        <div className="mt-3 pt-3 border-t border-slate-200/50 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Conducted Date Range (Survey Date)</span>
            <div className="flex items-center gap-2">
              <Input type="date" value={surveyFrom} onChange={e => setSurveyFrom(e.target.value)} className="bg-white border-slate-200 h-8 text-xs rounded-lg cursor-pointer" />
              <span className="text-slate-400">to</span>
              <Input type="date" value={surveyTo} onChange={e => setSurveyTo(e.target.value)} className="bg-white border-slate-200 h-8 text-xs rounded-lg cursor-pointer" />
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block mb-1">System Upload Date Range (Upload Date)</span>
            <div className="flex items-center gap-2">
              <Input type="date" value={uploadFrom} onChange={e => setUploadFrom(e.target.value)} className="bg-white border-slate-200 h-8 text-xs rounded-lg cursor-pointer" />
              <span className="text-slate-400">to</span>
              <Input type="date" value={uploadTo} onChange={e => setUploadTo(e.target.value)} className="bg-white border-slate-200 h-8 text-xs rounded-lg cursor-pointer" />
            </div>
          </div>
        </div>
      </Card>

      {/* Responses Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              <span className="animate-pulse">Loading validation surveys...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No survey responses found matching active filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/80">
                    <th className="px-4 py-3 text-left font-semibold text-slate-600 w-12">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Respondent</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Contact</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Location</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Survey Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Upload Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Collection Method</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">Challenge</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-600 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <>
                      <tr key={s.id} className="border-b hover:bg-slate-50/50 transition cursor-pointer" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                        <td className="px-4 py-3 text-slate-400 font-bold">#{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{s.full_name}</div>
                          <Badge variant="secondary" className="text-[10px] scale-90 -ml-1 mt-0.5">{s.respondent_type}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700 text-xs">{s.email || "—"}</div>
                          <div className="text-[10px] text-slate-400">{s.phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-600 text-xs font-medium">{s.region}</div>
                          <div className="text-[10px] text-slate-400">{s.district} • {s.location_ward}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs font-semibold">
                          {s.survey_date ? new Date(s.survey_date).toLocaleDateString() : new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {s.upload_date ? new Date(s.upload_date).toLocaleDateString() : new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider ${
                            s.collection_method === "Mobile App" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                            s.collection_method === "Website" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            s.collection_method === "Physical Interview" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            s.collection_method === "Phone Interview" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-purple-50 text-purple-700 border-purple-200"
                          }`}>
                            {s.collection_method || "Website"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700 text-xs">{s.q2_biggest_challenge}</div>
                          <span className={`text-[10px] font-bold ${s.q3_impact_rating >= 7 ? "text-rose-600" : s.q3_impact_rating >= 4 ? "text-amber-600" : "text-emerald-600"}`}>
                            Impact: {s.q3_impact_rating}/10
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {expandedId === s.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </td>
                      </tr>
                      {expandedId === s.id && (
                        <tr key={`${s.id}-detail`} className="bg-slate-50/40">
                          <td colSpan={9} className="px-6 py-5 border-b">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                              <div className="space-y-2">
                                <h4 className="font-bold text-indigo-900 border-b pb-1 flex items-center gap-1.5">
                                  <MapPin className="h-4 w-4 text-indigo-600" /> Respondent Profiling
                                </h4>
                                <p><span className="text-slate-500 font-medium">District & Ward:</span> {s.district} • {s.location_ward}</p>
                                <p><span className="text-slate-500 font-medium">Channels:</span> {(s.q6_channels || []).join(", ")}</p>
                                <p><span className="text-slate-500 font-medium">Time Searching:</span> {s.q4_time_searching}</p>
                                <p><span className="text-slate-500 font-medium">Lost Money:</span> {s.q5_lost_money}</p>
                                <p><span className="text-slate-500 font-medium">Challenges:</span> {s.q1_challenges}</p>
                                <p><span className="text-slate-500 font-medium">Assisted by Agent:</span> {s.assisted_by_agent ? "Yes" : "No"}</p>
                                 <p><span className="text-slate-500 font-medium">Collection Agent:</span> {s.agent_name || "Self-Submitted"} {s.agent_id ? `(ID: ${s.agent_id})` : ""}</p>
                                <p><span className="text-slate-500 font-medium">Data Source:</span> {s.source || "Public Submission"}</p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-indigo-900 border-b pb-1 flex items-center gap-1.5">
                                  <TrendingUp className="h-4 w-4 text-indigo-600" /> Ratings & Digital Preferences
                                </h4>
                                <p><span className="text-slate-500 font-medium">Satisfaction:</span> {s.q7_satisfaction_rating}/10</p>
                                <p><span className="text-slate-500 font-medium">Platform Value:</span> {s.q8_platform_value_rating}/10</p>
                                <p><span className="text-slate-500 font-medium">Escrow Importance:</span> {s.q9_escrow_importance}/10</p>
                                <p><span className="text-slate-500 font-medium">Buyer Protection:</span> {s.q10_buyer_protection_importance}/10</p>
                                <p><span className="text-slate-500 font-medium">OTP Reduces Disputes:</span> {s.q11_otp_reduces_disputes}</p>
                                <p><span className="text-slate-500 font-medium">Nearby Suppliers:</span> {s.q12_nearby_suppliers_frequency}</p>
                                <p><span className="text-slate-500 font-medium">Willing to Pay:</span> {s.q13_willing_to_pay}</p>
                                <p><span className="text-slate-500 font-medium">Payment Amount:</span> {s.q14_payment_amount}</p>
                              </div>
                              <div className="md:col-span-2 p-3 bg-white rounded-xl border border-slate-200">
                                <p className="text-slate-500 text-xs font-semibold mb-1">Q15: Current Method vs TOLA</p>
                                <p className="text-slate-700 leading-relaxed text-xs">{s.q15_choice_and_reason}</p>
                              </div>

                              {/* Audit Trail Row */}
                              <div className="md:col-span-2 pt-4 border-t border-slate-100 flex flex-wrap gap-x-8 gap-y-2 text-[10px] text-slate-400">
                                <div>
                                  <span className="font-semibold text-slate-500">Created By:</span> {s.created_by || "System/Anonymous"}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-500">Created At:</span> {s.created_at ? new Date(s.created_at).toLocaleString() : "N/A"}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-500">Updated By:</span> {s.updated_by || "System/Anonymous"}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-500">Updated At:</span> {s.updated_at ? new Date(s.updated_at).toLocaleString() : "N/A"}
                                </div>
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

      {/* --- Interactive Bulk Import Wizard Modal --- */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-[fade-in_0.2s_ease-out] p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-[scale-up_0.2s_ease-out]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary animate-bounce" />
                  Bulk Import Survey Wizard
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Parse, map override parameters, and securely batch insert validation surveys.</p>
              </div>
              <button onClick={closeImportWizard} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition">
                <span className="text-xl font-semibold">&times;</span>
              </button>
            </div>

            {/* Wizard Steps */}
            <div className="px-6 py-3 bg-indigo-50/40 border-b border-slate-100 grid grid-cols-4 gap-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span className={`${importStep === 1 ? "text-indigo-600 font-extrabold" : importStep > 1 ? "text-indigo-400" : ""}`}>1. Defaults</span>
              <span className={`${importStep === 2 ? "text-indigo-600 font-extrabold" : importStep > 2 ? "text-indigo-400" : ""}`}>2. File Upload</span>
              <span className={`${importStep === 3 ? "text-indigo-600 font-extrabold" : importStep > 3 ? "text-indigo-400" : ""}`}>3. Preview</span>
              <span className={`${importStep === 4 ? "text-indigo-600 font-extrabold" : ""}`}>4. Finish</span>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* STEP 1: Default Override Params */}
              {importStep === 1 && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                    Configure fallback defaults. If the uploaded CSV file doesn't specify these columns or leaves them blank, they will automatically default to these configured values.
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Default Agent ID</label>
                      <Input placeholder="e.g. AGENT-1049" value={defaultAgentId} onChange={e => setDefaultAgentId(e.target.value)} className="rounded-xl border-slate-200" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Default Agent Name</label>
                      <Input placeholder="e.g. Ally Mwamba" value={defaultAgentName} onChange={e => setDefaultAgentName(e.target.value)} className="rounded-xl border-slate-200" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Default Source</label>
                      <Input placeholder="e.g. Kariakoo Field Study" value={defaultSource} onChange={e => setDefaultSource(e.target.value)} className="rounded-xl border-slate-200" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Default Collection Method</label>
                      <select value={defaultCollectionMethod} onChange={e => setDefaultCollectionMethod(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                        <option value="Physical Interview">Physical Interview</option>
                        <option value="Phone Interview">Phone Interview</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Website">Website</option>
                        <option value="Mobile App">Mobile App</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Drag and drop select file */}
              {importStep === 2 && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition"
                    onClick={() => document.getElementById("csvFileInput")?.click()}>
                    <input id="csvFileInput" type="file" accept=".csv" className="hidden" onChange={handleCsvFileChange} />
                    <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
                      <FileSpreadsheet className="h-7 w-7 text-indigo-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900">Click to upload or drag CSV file here</h4>
                    <p className="text-xs text-slate-400 mt-1">Accepts standard comma-separated UTF-8 `.csv` files.</p>
                  </div>

                  {importError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 leading-relaxed font-semibold whitespace-pre-line">
                      {importError}
                    </div>
                  )}

                  <div className="text-xs text-slate-500">
                    <span className="font-bold text-slate-600 block mb-1">CSV Template Columns Required:</span>
                    <div className="font-mono text-[9px] bg-slate-100 p-2.5 rounded-lg leading-normal select-all break-all text-slate-600">
                      full_name, phone, email, region, district, location_ward, respondent_type, survey_date, collection_method, source, agent_id, agent_name, q1_challenges, q2_biggest_challenge, q3_impact_rating, q4_time_searching, q5_lost_money, q6_channels, q7_satisfaction_rating, q8_platform_value_rating, q9_escrow_importance, q10_buyer_protection_importance, q11_otp_reduces_disputes, q12_nearby_suppliers_frequency, q13_willing_to_pay, q14_payment_amount, q15_choice_and_reason
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Preview Data Grid */}
              {importStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex justify-between items-center">
                    <span>Parsed <strong className="font-extrabold">{parsedRows.length}</strong> survey responses from file successfully!</span>
                    <Button variant="ghost" size="sm" onClick={() => setImportStep(2)} className="h-7 text-[10px] text-emerald-800 hover:bg-emerald-100 rounded-lg">Change File</Button>
                  </div>

                  {importError && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-700 leading-relaxed font-semibold whitespace-pre-line">
                      {importError}
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-bold text-slate-500 block mb-1.5">Data Mapping Preview (First 3 Records)</span>
                    <div className="overflow-x-auto border rounded-xl bg-white max-h-[30vh]">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b">
                            <th className="px-3 py-2 font-semibold text-slate-600">Respondent Name</th>
                            <th className="px-3 py-2 font-semibold text-slate-600">Region</th>
                            <th className="px-3 py-2 font-semibold text-slate-600">Respondent Type</th>
                            <th className="px-3 py-2 font-semibold text-slate-600">Survey Date</th>
                            <th className="px-3 py-2 font-semibold text-slate-600">Collection Method</th>
                            <th className="px-3 py-2 font-semibold text-slate-600">Agent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedRows.slice(0, 3).map((r, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="px-3 py-2 font-medium">{r.full_name}</td>
                              <td className="px-3 py-2 text-slate-500">{r.region}</td>
                              <td className="px-3 py-2"><Badge variant="outline">{r.respondent_type}</Badge></td>
                              <td className="px-3 py-2 text-slate-500">{r.survey_date || "Current"}</td>
                              <td className="px-3 py-2 text-slate-500">{r.collection_method}</td>
                              <td className="px-3 py-2 text-slate-500">{r.agent_name || "Self-Submitted"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Success state */}
              {importStep === 4 && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center animate-ping">
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center absolute">
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Import Successful!</h4>
                  <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
                    Successfully saved <strong className="font-extrabold text-slate-900">{parsedRows.length}</strong> validation survey responses to the database in a secure transaction.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                {importStep > 1 && importStep < 4 && (
                  <Button variant="outline" size="sm" onClick={() => { setImportStep(prev => prev - 1); setImportError(null); }} className="rounded-xl">
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={closeImportWizard} className="rounded-xl text-slate-500 hover:text-slate-900">
                  {importStep === 4 ? "Done" : "Cancel"}
                </Button>
                {importStep === 1 && (
                  <Button variant="default" size="sm" onClick={() => setImportStep(2)} className="rounded-xl bg-primary text-white hover:bg-primary/95 transition">
                    Choose File
                  </Button>
                )}
                {importStep === 3 && (
                  <Button variant="default" size="sm" onClick={executeBulkImport} disabled={loading} className="rounded-xl bg-primary text-white hover:bg-primary/95 transition">
                    {loading ? "Importing..." : "Confirm & Import"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
