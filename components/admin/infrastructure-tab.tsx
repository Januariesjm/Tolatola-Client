"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  Loader2,
  RefreshCw,
  Server,
  Database,
  Cpu,
  HardDrive,
  Globe,
  Mail,
  MessageSquare,
  CreditCard,
  MapPin,
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Wifi,
  Terminal,
} from "lucide-react"
import { clientApiGet } from "@/lib/api-client"

interface ServiceInfo {
  name: string
  type: string
  status: string
  latencyMs: number | null
  details: Record<string, string>
}

interface InfraData {
  server: {
    hostname: string
    platform: string
    arch: string
    cpus: number
    cpuModel: string
    totalMemoryGB: string
    freeMemoryGB: string
    loadAverage: number[]
    networkInterfaces: { name: string; address: string }[]
  }
  runtime: {
    nodeVersion: string
    pid: number
    uptime: number
    cwd: string
    execPath: string
    environment: string
    port: string
    appUrl: string
  }
  services: ServiceInfo[]
  dependencies: { name: string; version: string }[]
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  parts.push(`${Math.floor(seconds % 60)}s`)
  return parts.join(" ")
}

function ServiceStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "operational":
      return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 gap-1 text-[10px] font-bold">
          <CheckCircle2 className="h-3 w-3" /> Operational
        </Badge>
      )
    case "configured":
      return (
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/25 gap-1 text-[10px] font-bold">
          <CheckCircle2 className="h-3 w-3" /> Configured
        </Badge>
      )
    case "degraded":
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 gap-1 text-[10px] font-bold">
          <AlertTriangle className="h-3 w-3" /> Degraded
        </Badge>
      )
    case "down":
      return (
        <Badge className="bg-red-500/15 text-red-400 border-red-500/25 gap-1 text-[10px] font-bold">
          <XCircle className="h-3 w-3" /> Down
        </Badge>
      )
    default:
      return (
        <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/25 gap-1 text-[10px] font-bold">
          <AlertTriangle className="h-3 w-3" /> Not Configured
        </Badge>
      )
  }
}

function ServiceIcon({ type }: { type: string }) {
  const cls = "h-5 w-5"
  switch (type) {
    case "database": return <Database className={`${cls} text-emerald-400`} />
    case "storage": return <HardDrive className={`${cls} text-purple-400`} />
    case "email": return <Mail className={`${cls} text-blue-400`} />
    case "sms": return <MessageSquare className={`${cls} text-cyan-400`} />
    case "payment": return <CreditCard className={`${cls} text-amber-400`} />
    case "maps": return <MapPin className={`${cls} text-rose-400`} />
    default: return <Globe className={`${cls} text-slate-400`} />
  }
}

function LoadBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  const color = pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-emerald-500"
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-500 uppercase tracking-widest font-bold">{label}</span>
        <span className="text-slate-300 font-mono">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function InfrastructureTab() {
  const [data, setData] = useState<InfraData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      const res = await clientApiGet<InfraData>("admin/infrastructure")
      setData(res)
    } catch (err) {
      console.error("Error fetching infrastructure data:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-3 text-sm text-slate-500">Connecting to infrastructure...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <XCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load infrastructure data</h2>
        <Button onClick={() => fetchData()} variant="outline">Retry</Button>
      </div>
    )
  }

  const usedMemGB = parseFloat(data.server.totalMemoryGB) - parseFloat(data.server.freeMemoryGB)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Infrastructure Overview</h2>
          <p className="text-sm text-slate-500">Server, hosting, and connected service status</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="h-8 text-xs gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Server & Runtime Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Host Machine */}
        <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Server className="h-4 w-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Host Machine</h3>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Hostname</span>
                <span className="text-xs text-white font-mono font-bold">{data.server.hostname}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">OS</span>
                <span className="text-xs text-slate-300 font-mono">{data.server.platform}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Architecture</span>
                <span className="text-xs text-slate-300 font-mono">{data.server.arch}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">CPU</span>
                <span className="text-xs text-slate-300 font-mono">{data.server.cpus} cores</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">CPU Model</span>
                <span className="text-xs text-slate-300 font-mono truncate max-w-[200px]" title={data.server.cpuModel}>{data.server.cpuModel}</span>
              </div>
              {data.server.networkInterfaces.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">IP Address</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">{data.server.networkInterfaces[0].address}</span>
                </div>
              )}
            </div>

            {/* Memory & Load */}
            <div className="pt-3 border-t border-[#2a2a4a] space-y-3">
              <LoadBar
                value={usedMemGB}
                max={parseFloat(data.server.totalMemoryGB)}
                label={`Memory (${usedMemGB.toFixed(2)} / ${data.server.totalMemoryGB} GB)`}
              />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Load Average (1m / 5m / 15m)</p>
                <div className="flex gap-3">
                  {data.server.loadAverage.map((load, i) => (
                    <span key={i} className={`text-sm font-mono font-bold ${load > data.server.cpus ? "text-red-400" : load > data.server.cpus * 0.7 ? "text-amber-400" : "text-emerald-400"}`}>
                      {load.toFixed(2)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Runtime */}
        <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Application Runtime</h3>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Node.js</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">{data.runtime.nodeVersion}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Environment</span>
                <Badge variant="outline" className={`text-[10px] font-mono ${data.runtime.environment === "production" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                  {data.runtime.environment}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">PID</span>
                <span className="text-xs text-slate-300 font-mono">{data.runtime.pid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Port</span>
                <span className="text-xs text-slate-300 font-mono">{data.runtime.port}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">App URL</span>
                <span className="text-xs text-blue-400 font-mono">{data.runtime.appUrl}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Uptime</span>
                <span className="text-xs text-white font-mono font-bold">{formatUptime(data.runtime.uptime)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#2a2a4a]">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1.5">Working Directory</p>
              <p className="text-[11px] text-slate-400 font-mono break-all bg-[#0d0d1a] rounded px-2 py-1.5">{data.runtime.cwd}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connected Services */}
      <Card className="bg-[#0d0d1a] border-[#2a2a4a] shadow-none">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Wifi className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Connected Services</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.services.map((svc, i) => (
              <div key={i} className="bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ServiceIcon type={svc.type} />
                    <span className="text-sm font-semibold text-white">{svc.name}</span>
                  </div>
                  <ServiceStatusBadge status={svc.status} />
                </div>

                {svc.latencyMs !== null && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>Latency: </span>
                    <span className={`font-mono font-bold ${svc.latencyMs > 500 ? "text-red-400" : svc.latencyMs > 200 ? "text-amber-400" : "text-emerald-400"}`}>
                      {svc.latencyMs}ms
                    </span>
                  </div>
                )}

                <div className="space-y-1 pt-1 border-t border-[#2a2a4a]">
                  {Object.entries(svc.details).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-[11px]">
                      <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                      <span className="text-slate-400 font-mono truncate max-w-[160px]" title={val}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dependencies */}
      {data.dependencies.length > 0 && (
        <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Dependencies ({data.dependencies.length})
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {data.dependencies.map((dep, i) => (
                <div key={i} className="bg-[#0d0d1a] rounded-lg px-3 py-2 flex justify-between items-center">
                  <span className="text-[11px] text-slate-300 font-mono truncate mr-2">{dep.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{dep.version}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
