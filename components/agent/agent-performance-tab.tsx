"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import {
  Loader2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface AgentPerformanceTabProps {
  agent: any
  trend: any[]
}

export function AgentPerformanceTab({
  agent,
  trend,
}: AgentPerformanceTabProps) {
  const { toast } = useToast()
  const [period, setPeriod] = useState<"week" | "month" | "year">("month")
  const [isLoading, setIsLoading] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)

  // Fetch detailed performance metrics
  const fetchPerformance = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

      const response = await fetch(`${apiBase}/agents/performance?period=${period}`, {
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      })

      if (!response.ok) throw new Error("Failed to fetch performance")
      const res = await response.json()
      setAnalytics(res)
    } catch (err) {
      console.error("[PERFORMANCE TAB] Fetch failed:", err)
      toast({
        title: "Hitilafu",
        description: "Imeshindwa kupakia ripoti ya utendaji.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformance()
  }, [period])

  // Chart data formatting
  const chartData = analytics?.dailyTrend || trend || []

  // Metrics details
  const totalRegistrations = analytics?.totalRegistrations || 0
  const conversionRate = analytics?.conversionRate || 0
  const categoryBreakdown = analytics?.categoryBreakdown || { vendor: 0, customer: 0, transporter: 0 }
  const statusBreakdown = analytics?.statusBreakdown || { active: 0, pending: 0, inactive: 0, rejected: 0 }

  const barChartData = [
    {
      name: "Wauzaji (Vendor)",
      Registered: categoryBreakdown.vendor,
    },
    {
      name: "Wateja (Customer)",
      Registered: categoryBreakdown.customer,
    },
    {
      name: "Wasafirishaji (Transporter)",
      Registered: categoryBreakdown.transporter,
    },
  ]

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Filters & Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Uchambuzi wa Utendaji</h3>
          <p className="text-xs text-slate-400">Ripoti ya usajili kulingana na muda uliochaguliwa</p>
        </div>
        
        {/* Period Selector Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setPeriod("week")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Wiki (Week)
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "month" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Mwezi (Month)
          </button>
          <button
            onClick={() => setPeriod("year")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "year" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Mwaka (Year)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-28 gap-3">
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
          <span className="text-xs text-slate-400 font-bold">Inachakata data ya takwimu...</span>
        </div>
      ) : (
        <>
          {/* Detailed Performance Metrics widgets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Registrations In Period
                </span>
                <span className="text-2xl font-black text-slate-900 block mb-1">
                  {totalRegistrations}
                </span>
                <p className="text-xs text-slate-400">
                  Jumla ya watumiaji uliowasajili katika kipindi hiki
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Conversion Rate
                </span>
                <span className="text-2xl font-black text-emerald-600 block mb-1">
                  {conversionRate}%
                </span>
                <p className="text-xs text-slate-400">
                  Asilimia ya usajili uliothibitishwa kuwa hai (active)
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
              <CardContent className="p-6">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Verification Status
                </span>
                <div className="flex gap-4 mt-1">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 block">{statusBreakdown.active}</span>
                    <span className="text-[10px] text-slate-400">Verified</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-amber-500 block">{statusBreakdown.pending}</span>
                    <span className="text-[10px] text-slate-400">Pending</span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-500 block">{statusBreakdown.rejected}</span>
                    <span className="text-[10px] text-slate-400">Rejected</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Interactive registration charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-sm rounded-xl border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-800">Trend ya Usajili wa Kila Siku</CardTitle>
                <CardDescription className="text-xs">Idadi ya usajili mpya kwa kila siku</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(str) => {
                        const date = new Date(str)
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }}
                      tickLine={false}
                      axisLine={false}
                      stroke="#94a3b8"
                      style={{ fontSize: "10px" }}
                    />
                    <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" style={{ fontSize: "10px" }} />
                    <Tooltip
                      labelFormatter={(str) => new Date(str).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                      contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="New Users" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-sm font-bold text-slate-800">Usajili kwa Aina</CardTitle>
                <CardDescription className="text-xs">Mgawanyiko kulingana na wateja, wauzaji na wasafirishaji</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" style={{ fontSize: "9px" }} />
                    <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" style={{ fontSize: "10px" }} />
                    <Tooltip contentStyle={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px" }} />
                    <Bar dataKey="Registered" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
