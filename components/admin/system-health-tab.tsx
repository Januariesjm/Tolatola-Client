"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  Loader2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  Globe,
  Zap,
  Activity,
} from "lucide-react"
import { clientApiGet } from "@/lib/api-client"

interface HealthData {
  status: string
  timestamp: string
  uptime: number
  version: string
  platform: string
  arch: string
  pid: number
  memory: {
    rss: number
    heapTotal: number
    heapUsed: number
    external: number
    rssMB: number
    heapUsedMB: number
    heapTotalMB: number
  }
  cpu: {
    user: number
    system: number
  }
  database: {
    status: string
    latencyMs: number
    tables: {
      users: number
      orders: number
      products: number
    }
  }
  environment: string
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts = []
  if (d > 0) parts.push(`${d}d`)
  if (h > 0) parts.push(`${h}h`)
  if (m > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(" ")
}

function MemoryGauge({ label, usedMB, totalMB, color }: { label: string; usedMB: number; totalMB: number; color: string }) {
  const pct = totalMB > 0 ? Math.min(100, (usedMB / totalMB) * 100) : 0
  const gaugeColor = pct > 85 ? "bg-red-500" : pct > 65 ? "bg-amber-500" : color

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        <span className="text-xs text-slate-300 font-mono">{usedMB.toFixed(1)} / {totalMB.toFixed(1)} MB</span>
      </div>
      <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${gaugeColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-right text-[10px] text-slate-500 font-mono">{pct.toFixed(1)}%</p>
    </div>
  )
}

function StatusIndicator({ status }: { status: string }) {
  if (status === "healthy" || status === "connected") {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
        </span>
        <span className="text-emerald-400 font-bold text-sm uppercase tracking-wider">Operational</span>
      </div>
    )
  }
  if (status === "degraded") {
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
        </span>
        <span className="text-amber-400 font-bold text-sm uppercase tracking-wider">Degraded</span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
      </span>
      <span className="text-red-400 font-bold text-sm uppercase tracking-wider">Disconnected</span>
    </div>
  )
}

export function SystemHealthTab() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchHealth = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const res = await clientApiGet<HealthData>("admin/system-health")
      setHealth(res)
      setLastRefresh(new Date())
    } catch (err) {
      console.error("Error fetching system health:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchHealth(true), 10000)
    return () => clearInterval(interval)
  }, [fetchHealth])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-3 text-sm text-slate-500">Connecting to server...</p>
      </div>
    )
  }

  if (!health) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <XCircle className="h-12 w-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to reach server</h2>
        <p className="text-slate-500 mb-4">The health endpoint did not respond.</p>
        <Button onClick={() => fetchHealth()} variant="outline">Retry</Button>
      </div>
    )
  }

  const heapUsedPct = health.memory.heapTotalMB > 0
    ? (health.memory.heapUsedMB / health.memory.heapTotalMB) * 100
    : 0

  return (
    <div className="space-y-4">
      {/* Top Status Bar */}
      <Card className="bg-[#0d0d1a] border-[#2a2a4a] shadow-none">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <StatusIndicator status={health.status} />
              <div className="h-8 w-px bg-[#2a2a4a]" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Uptime</p>
                <p className="text-lg font-bold text-white font-mono">{formatUptime(health.uptime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => fetchHealth(true)}
                disabled={refreshing}
                className="h-8 text-xs text-slate-400 hover:text-white border border-[#2a2a4a]"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Server Info */}
        <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Server Info</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Node.js</span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-mono">{health.version}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Platform</span>
                <span className="text-xs text-slate-300 font-mono">{health.platform} ({health.arch})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">PID</span>
                <span className="text-xs text-slate-300 font-mono">{health.pid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Environment</span>
                <Badge variant="outline" className={`text-[10px] font-mono ${
                  health.environment === "production"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {health.environment}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database */}
        <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Database</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Status</span>
                <StatusIndicator status={health.database.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Latency</span>
                <span className={`text-xs font-mono font-bold ${
                  health.database.latencyMs > 500 ? "text-red-400" :
                  health.database.latencyMs > 200 ? "text-amber-400" : "text-emerald-400"
                }`}>
                  {health.database.latencyMs}ms
                </span>
              </div>
              <div className="border-t border-[#2a2a4a] pt-3 mt-2">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Table Counts</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-white">{health.database.tables.users}</p>
                    <p className="text-[10px] text-slate-500">Users</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{health.database.tables.orders}</p>
                    <p className="text-[10px] text-slate-500">Orders</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{health.database.tables.products}</p>
                    <p className="text-[10px] text-slate-500">Products</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CPU */}
        <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">CPU Usage</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">User Time</span>
                <span className="text-xs text-slate-300 font-mono">{(health.cpu.user / 1_000_000).toFixed(2)}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">System Time</span>
                <span className="text-xs text-slate-300 font-mono">{(health.cpu.system / 1_000_000).toFixed(2)}s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Total CPU</span>
                <span className="text-xs text-slate-300 font-mono font-bold">
                  {((health.cpu.user + health.cpu.system) / 1_000_000).toFixed(2)}s
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memory Section */}
      <Card className="bg-[#1a1a2e] border-[#2a2a4a] shadow-none">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-cyan-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Memory Usage</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MemoryGauge
              label="Heap Used"
              usedMB={health.memory.heapUsedMB}
              totalMB={health.memory.heapTotalMB}
              color="bg-blue-500"
            />
            <MemoryGauge
              label="RSS (Resident Set)"
              usedMB={health.memory.rssMB}
              totalMB={health.memory.rssMB * 1.3}
              color="bg-purple-500"
            />
            <MemoryGauge
              label="Heap Allocated"
              usedMB={health.memory.heapTotalMB}
              totalMB={health.memory.rssMB}
              color="bg-cyan-500"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-[#2a2a4a]">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">RSS</p>
              <p className="text-sm text-white font-mono font-bold">{health.memory.rssMB} MB</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Heap Used</p>
              <p className="text-sm text-white font-mono font-bold">{health.memory.heapUsedMB} MB</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Heap Total</p>
              <p className="text-sm text-white font-mono font-bold">{health.memory.heapTotalMB} MB</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">External</p>
              <p className="text-sm text-white font-mono font-bold">{(health.memory.external / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
