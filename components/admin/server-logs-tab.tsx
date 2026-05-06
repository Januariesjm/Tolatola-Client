"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  Loader2,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  XCircle,
  Info,
  ArrowUpDown,
  Clock,
  Filter,
  Terminal,
} from "lucide-react"
import { clientApiGet } from "@/lib/api-client"
import { format } from "date-fns"

interface ApiLog {
  id: string
  method: string
  path: string
  status_code: number
  response_time_ms: number
  ip: string | null
  user_agent: string | null
  user_id: string | null
  error_message: string | null
  severity: "INFO" | "WARN" | "ERROR" | "DEBUG"
  created_at: string
}

interface LogStats {
  totalRequests24h: number
  errors24h: number
  warnings24h: number
  avgResponseTimeMs: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export function ServerLogsTab() {
  const [logs, setLogs] = useState<ApiLog[]>([])
  const [stats, setStats] = useState<LogStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>("")
  const [methodFilter, setMethodFilter] = useState<string>("")
  const [pathSearch, setPathSearch] = useState<string>("")

  const fetchLogs = useCallback(async (page = 1, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const params = new URLSearchParams({ page: String(page), limit: "50" })
      if (severityFilter) params.set("severity", severityFilter)
      if (methodFilter) params.set("method", methodFilter)
      if (pathSearch) params.set("path", pathSearch)

      const res = await clientApiGet<{ logs: ApiLog[]; pagination: Pagination }>(
        `admin/api-logs?${params.toString()}`
      )
      setLogs(res.logs || [])
      setPagination(res.pagination || { page: 1, limit: 50, total: 0, totalPages: 0 })
    } catch (err) {
      console.error("Error fetching API logs:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [severityFilter, methodFilter, pathSearch])

  const fetchStats = useCallback(async () => {
    try {
      const res = await clientApiGet<LogStats>("admin/api-logs/stats")
      setStats(res)
    } catch (err) {
      console.error("Error fetching log stats:", err)
    }
  }, [])

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [fetchLogs, fetchStats])

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLogs(pagination.page, true)
      fetchStats()
    }, 15000)
    return () => clearInterval(interval)
  }, [fetchLogs, fetchStats, pagination.page])

  const handleFilterApply = () => {
    fetchLogs(1)
  }

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "ERROR": return <XCircle className="h-3.5 w-3.5" />
      case "WARN": return <AlertTriangle className="h-3.5 w-3.5" />
      case "INFO": return <Info className="h-3.5 w-3.5" />
      default: return <Terminal className="h-3.5 w-3.5" />
    }
  }

  const severityColor = (severity: string) => {
    switch (severity) {
      case "ERROR": return "bg-red-500/10 text-red-400 border-red-500/20"
      case "WARN": return "bg-amber-500/10 text-amber-400 border-amber-500/20"
      case "INFO": return "bg-blue-500/10 text-blue-400 border-blue-500/20"
      default: return "bg-slate-500/10 text-slate-400 border-slate-500/20"
    }
  }

  const methodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-emerald-500/15 text-emerald-400"
      case "POST": return "bg-blue-500/15 text-blue-400"
      case "PUT": return "bg-amber-500/15 text-amber-400"
      case "PATCH": return "bg-purple-500/15 text-purple-400"
      case "DELETE": return "bg-red-500/15 text-red-400"
      default: return "bg-slate-500/15 text-slate-400"
    }
  }

  const statusColor = (code: number) => {
    if (code >= 500) return "text-red-400"
    if (code >= 400) return "text-amber-400"
    if (code >= 300) return "text-blue-400"
    return "text-emerald-400"
  }

  return (
    <div className="space-y-4">
      {/* Stats Header Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Requests (24h)</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalRequests24h.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-red-400 font-bold">Errors (24h)</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.errors24h.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Warnings (24h)</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.warnings24h.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Avg Response</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.avgResponseTimeMs}ms</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Toolbar */}
      <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Filter className="h-3.5 w-3.5" />
              <span className="font-semibold uppercase tracking-wider">Filters</span>
            </div>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-8 text-xs bg-[#0d0d1a] border border-[#2a2a4a] rounded-md px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Severity</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="h-8 text-xs bg-[#0d0d1a] border border-[#2a2a4a] rounded-md px-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-500" />
              <Input
                type="search"
                placeholder="Filter by path..."
                className="h-8 pl-7 text-xs bg-[#0d0d1a] border-[#2a2a4a] text-slate-300 placeholder:text-slate-600"
                value={pathSearch}
                onChange={(e) => setPathSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleFilterApply()}
              />
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleFilterApply}
              className="h-8 text-xs bg-blue-600/20 border-blue-500/30 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300"
            >
              Apply
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => { fetchLogs(pagination.page, true); fetchStats() }}
              disabled={refreshing}
              className="h-8 text-xs text-slate-400 hover:text-white ml-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Log Entries Table */}
      <Card className="bg-[#0d0d1a] border-[#2a2a4a] shadow-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#2a2a4a] text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3 text-left font-bold">Severity</th>
                <th className="px-4 py-3 text-left font-bold">Timestamp</th>
                <th className="px-4 py-3 text-left font-bold">Method</th>
                <th className="px-4 py-3 text-left font-bold">Path</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-left font-bold">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Latency
                  </span>
                </th>
                <th className="px-4 py-3 text-left font-bold">IP</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-500" />
                    <p className="mt-2 text-sm text-slate-500">Loading server logs...</p>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                    <Terminal className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>No log entries found. Logs will appear as API requests are made.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className={`border-b border-[#1a1a2e] cursor-pointer transition-colors hover:bg-[#1a1a2e] ${
                        log.severity === "ERROR" ? "bg-red-950/20" :
                        log.severity === "WARN" ? "bg-amber-950/10" : ""
                      }`}
                    >
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityColor(log.severity)}`}>
                          {severityIcon(log.severity)}
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">
                        {format(new Date(log.created_at), "MMM dd HH:mm:ss.SSS")}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${methodColor(log.method)}`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 max-w-[300px] truncate" title={log.path}>
                        {log.path}
                      </td>
                      <td className={`px-4 py-2.5 font-bold ${statusColor(log.status_code)}`}>
                        {log.status_code}
                      </td>
                      <td className={`px-4 py-2.5 ${log.response_time_ms > 1000 ? "text-red-400" : log.response_time_ms > 300 ? "text-amber-400" : "text-slate-400"}`}>
                        {log.response_time_ms}ms
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        {log.ip || "-"}
                      </td>
                    </tr>
                    {expandedLog === log.id && (
                      <tr key={`${log.id}-detail`} className="bg-[#12121f]">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                            <div>
                              <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider mb-1">User Agent</p>
                              <p className="text-slate-400 break-all">{log.user_agent || "-"}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider mb-1">User ID</p>
                              <p className="text-slate-400 font-mono">{log.user_id || "Anonymous"}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider mb-1">Error</p>
                              <p className={`${log.error_message ? "text-red-400" : "text-slate-500"}`}>
                                {log.error_message || "None"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider mb-1">Full Timestamp</p>
                              <p className="text-slate-400">{format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss.SSS")}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#2a2a4a]">
            <p className="text-xs text-slate-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total.toLocaleString()} entries
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={pagination.page <= 1}
                onClick={() => fetchLogs(pagination.page - 1)}
                className="h-7 w-7 p-0 text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-slate-400 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                size="sm"
                variant="ghost"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchLogs(pagination.page + 1)}
                className="h-7 w-7 p-0 text-slate-400 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
