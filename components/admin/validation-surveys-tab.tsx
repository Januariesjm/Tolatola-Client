"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  TrendingUp,
  ShieldCheck,
  Truck,
  Store,
  Search,
  Download,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronUp,
  BarChart3,
  AlertTriangle,
  Wifi,
  CreditCard,
  Upload,
  Calendar,
  MapPin,
} from "lucide-react"
import { logger } from "@/lib/logger"
import { defaultStats, type SurveyStats, type ValidationSurvey } from "@/lib/admin/validation-surveys-types"
import { exportSurveysToCsv, exportSurveysToExcel, exportSurveysToPdf } from "@/lib/admin/validation-surveys-export"
import { ValidationSurveysImportWizard } from "./validation-surveys-import-wizard"
import { ValidationSurveysTrendChart } from "./validation-surveys-trend-chart"
import { RESPONDENT_TYPE_FILTERS, TANZANIA_REGIONS } from "@/lib/validation-survey-options"

const log = logger.child("admin.validation-surveys-tab")

interface Props {
  initialSurveys?: ValidationSurvey[]
  initialStats?: SurveyStats
}

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
      log.error("failed to fetch surveys", e)
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

  const filtered = surveys // API already applies all criteria server-side!

  // --- CSV parsing & Importing wizard handlers ---
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
    {
      label: "Buyer Protection",
      value: `${stats.buyerProtectionAcceptancePct}%`,
      icon: TrendingUp,
      color: "text-violet-600",
      bg: "bg-violet-100",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Market Validation Survey</h2>
          <p className="text-xs text-slate-500 mt-0.5">Explore user survey feedback and digital trade statistics.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsImportOpen(true)}
            className="gap-1.5 rounded-xl bg-primary text-white hover:bg-primary/95 transition"
          >
            <Upload className="h-3.5 w-3.5" />
            Bulk Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportSurveysToCsv(filtered)} className="gap-1.5 rounded-xl">
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportSurveysToExcel(filtered)} className="gap-1.5 rounded-xl">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportSurveysToPdf(filtered)} className="gap-1.5 rounded-xl">
            <FileText className="h-3.5 w-3.5" />
            PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {statCards.map((sc) => (
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
      <ValidationSurveysTrendChart surveys={surveys} />

      {/* Premium Search and Filters Grid */}
      <Card className="shadow-sm border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Text search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search respondent name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl bg-white border-slate-200"
            />
          </div>

          {/* Respondent Type */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
          >
            {RESPONDENT_TYPE_FILTERS.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All Respondent Types" : t}
              </option>
            ))}
          </select>

          {/* Region */}
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition cursor-pointer"
          >
            <option value="all">All Regions (31 Tanzania)</option>
            {TANZANIA_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Agent ID or Name */}
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Agent ID or Agent Name"
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="pl-9 rounded-xl bg-white border-slate-200"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-slate-500 hover:text-slate-900 rounded-xl text-xs px-3 border border-slate-200 bg-white"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Date Ranges Panel */}
        <div className="mt-3 pt-3 border-t border-slate-200/50 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-500 block mb-1">Conducted Date Range (Survey Date)</span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={surveyFrom}
                onChange={(e) => setSurveyFrom(e.target.value)}
                className="bg-white border-slate-200 h-8 text-xs rounded-lg cursor-pointer"
              />
              <span className="text-slate-400">to</span>
              <Input
                type="date"
                value={surveyTo}
                onChange={(e) => setSurveyTo(e.target.value)}
                className="bg-white border-slate-200 h-8 text-xs rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block mb-1">System Upload Date Range (Upload Date)</span>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={uploadFrom}
                onChange={(e) => setUploadFrom(e.target.value)}
                className="bg-white border-slate-200 h-8 text-xs rounded-lg cursor-pointer"
              />
              <span className="text-slate-400">to</span>
              <Input
                type="date"
                value={uploadTo}
                onChange={(e) => setUploadTo(e.target.value)}
                className="bg-white border-slate-200 h-8 text-xs rounded-lg cursor-pointer"
              />
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
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
              No survey responses found matching active filters.
            </div>
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
                      <tr
                        key={s.id}
                        className="border-b hover:bg-slate-50/50 transition cursor-pointer"
                        onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      >
                        <td className="px-4 py-3 text-slate-400 font-bold">#{i + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{s.full_name}</div>
                          <Badge variant="secondary" className="text-[10px] scale-90 -ml-1 mt-0.5">
                            {s.respondent_type}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700 text-xs">{s.email || "—"}</div>
                          <div className="text-[10px] text-slate-400">{s.phone}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-600 text-xs font-medium">{s.region}</div>
                          <div className="text-[10px] text-slate-400">
                            {s.district} • {s.location_ward}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs font-semibold">
                          {s.survey_date ? new Date(s.survey_date).toLocaleDateString() : new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {s.upload_date ? new Date(s.upload_date).toLocaleDateString() : new Date(s.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              s.collection_method === "Mobile App"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : s.collection_method === "Website"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : s.collection_method === "Physical Interview"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : s.collection_method === "Phone Interview"
                                      ? "bg-amber-50 text-amber-700 border-amber-200"
                                      : "bg-purple-50 text-purple-700 border-purple-200"
                            }`}
                          >
                            {s.collection_method || "Website"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-slate-700 text-xs">{s.q2_biggest_challenge}</div>
                          <span
                            className={`text-[10px] font-bold ${s.q3_impact_rating >= 7 ? "text-rose-600" : s.q3_impact_rating >= 4 ? "text-amber-600" : "text-emerald-600"}`}
                          >
                            Impact: {s.q3_impact_rating}/10
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {expandedId === s.id ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
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
                                <p>
                                  <span className="text-slate-500 font-medium">District & Ward:</span> {s.district} • {s.location_ward}
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Channels:</span> {(s.q6_channels || []).join(", ")}
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Time Searching:</span> {s.q4_time_searching}
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Lost Money:</span> {s.q5_lost_money}
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Challenges:</span> {s.q1_challenges}
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Assisted by Agent:</span>{" "}
                                  {s.assisted_by_agent ? "Yes" : "No"}
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Collection Agent:</span> {s.agent_name || "Self-Submitted"}{" "}
                                  {s.agent_id ? `(ID: ${s.agent_id})` : ""}
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Data Source:</span> {s.source || "Public Submission"}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <h4 className="font-bold text-indigo-900 border-b pb-1 flex items-center gap-1.5">
                                  <TrendingUp className="h-4 w-4 text-indigo-600" /> Ratings & Digital Preferences
                                </h4>
                                <p>
                                  <span className="text-slate-500 font-medium">Satisfaction:</span> {s.q7_satisfaction_rating}/10
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Platform Value:</span> {s.q8_platform_value_rating}/10
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Escrow Importance:</span> {s.q9_escrow_importance}/10
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Buyer Protection:</span> {s.q10_buyer_protection_importance}
                                  /10
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">OTP Reduces Disputes:</span> {s.q11_otp_reduces_disputes}
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Nearby Suppliers:</span> {s.q12_nearby_suppliers_frequency}
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Willing to Pay:</span> {s.q13_willing_to_pay}
                                </p>
                                <p>
                                  <span className="text-slate-500 font-medium">Payment Amount:</span> {s.q14_payment_amount}
                                </p>
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
                                  <span className="font-semibold text-slate-500">Created At:</span>{" "}
                                  {s.created_at ? new Date(s.created_at).toLocaleString() : "N/A"}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-500">Updated By:</span> {s.updated_by || "System/Anonymous"}
                                </div>
                                <div>
                                  <span className="font-semibold text-slate-500">Updated At:</span>{" "}
                                  {s.updated_at ? new Date(s.updated_at).toLocaleString() : "N/A"}
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
      <ValidationSurveysImportWizard open={isImportOpen} onClose={() => setIsImportOpen(false)} onImported={fetchSurveys} />
    </div>
  )
}
